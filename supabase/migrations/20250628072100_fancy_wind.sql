/*
  # Add User Plans and Notifications System

  1. New Tables
    - `user_plans` table for tracking subscription plans
    - `notifications` table for managing user notifications

  2. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users to manage their own data

  3. Functions
    - Function to check user plan limits
    - Function to create notifications for upcoming renewals
*/

-- Create user plan types
DO $$ BEGIN
    CREATE TYPE user_plan_type AS ENUM ('free', 'pro', 'business');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM ('renewal_reminder', 'overdue_payment', 'plan_limit', 'system');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create user_plans table
CREATE TABLE IF NOT EXISTS user_plans (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    plan_type user_plan_type NOT NULL DEFAULT 'free',
    subscription_limit integer NOT NULL DEFAULT 5,
    features jsonb DEFAULT '{"analytics": false, "reports": false, "team_features": false, "api_access": false}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type notification_type NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    subscription_id uuid REFERENCES subscriptions(id) ON DELETE CASCADE,
    is_read boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE user_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for user_plans
DROP POLICY IF EXISTS "Users can view own plan" ON user_plans;
CREATE POLICY "Users can view own plan"
    ON user_plans FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own plan" ON user_plans;
CREATE POLICY "Users can update own plan"
    ON user_plans FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Create policies for notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications"
    ON notifications FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications"
    ON notifications FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
CREATE POLICY "Users can delete own notifications"
    ON notifications FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS user_plans_user_id_idx ON user_plans(user_id);
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_is_read_idx ON notifications(is_read);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON notifications(created_at);

-- Create triggers
DROP TRIGGER IF EXISTS update_user_plans_updated_at ON user_plans;
CREATE TRIGGER update_user_plans_updated_at
    BEFORE UPDATE ON user_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to create default user plan
CREATE OR REPLACE FUNCTION create_default_user_plan()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_plans (user_id, plan_type, subscription_limit, features)
    VALUES (
        NEW.id,
        'free',
        5,
        '{"analytics": false, "reports": false, "team_features": false, "api_access": false}'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user plan on user signup
DROP TRIGGER IF EXISTS create_user_plan_trigger ON auth.users;
CREATE TRIGGER create_user_plan_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_user_plan();

-- Function to check subscription limits
CREATE OR REPLACE FUNCTION check_subscription_limit(user_uuid uuid)
RETURNS boolean AS $$
DECLARE
    user_plan_limit integer;
    current_count integer;
BEGIN
    -- Get user's subscription limit
    SELECT subscription_limit INTO user_plan_limit
    FROM user_plans
    WHERE user_id = user_uuid;
    
    -- If no plan found, default to free plan limit
    IF user_plan_limit IS NULL THEN
        user_plan_limit := 5;
    END IF;
    
    -- Count current active subscriptions
    SELECT COUNT(*) INTO current_count
    FROM subscriptions
    WHERE user_id = user_uuid AND status = 'active';
    
    -- Return true if under limit
    RETURN current_count < user_plan_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create renewal notifications
CREATE OR REPLACE FUNCTION create_renewal_notifications()
RETURNS void AS $$
DECLARE
    sub_record RECORD;
    days_until_renewal integer;
    notification_title text;
    notification_message text;
BEGIN
    -- Loop through active subscriptions
    FOR sub_record IN 
        SELECT s.*, u.user_id 
        FROM subscriptions s
        JOIN user_plans u ON s.user_id = u.user_id
        WHERE s.status = 'active'
    LOOP
        days_until_renewal := DATE_PART('day', sub_record.next_renewal - CURRENT_DATE);
        
        -- Create notifications for different time periods
        IF days_until_renewal = 30 THEN
            notification_title := 'Renewal Reminder: ' || sub_record.service_name;
            notification_message := sub_record.service_name || ' will renew in 30 days for $' || sub_record.cost;
            
            INSERT INTO notifications (user_id, type, title, message, subscription_id)
            VALUES (sub_record.user_id, 'renewal_reminder', notification_title, notification_message, sub_record.id);
            
        ELSIF days_until_renewal = 7 THEN
            notification_title := 'Renewal Reminder: ' || sub_record.service_name;
            notification_message := sub_record.service_name || ' will renew in 7 days for $' || sub_record.cost;
            
            INSERT INTO notifications (user_id, type, title, message, subscription_id)
            VALUES (sub_record.user_id, 'renewal_reminder', notification_title, notification_message, sub_record.id);
            
        ELSIF days_until_renewal = 1 THEN
            notification_title := 'Renewal Tomorrow: ' || sub_record.service_name;
            notification_message := sub_record.service_name || ' will renew tomorrow for $' || sub_record.cost;
            
            INSERT INTO notifications (user_id, type, title, message, subscription_id)
            VALUES (sub_record.user_id, 'renewal_reminder', notification_title, notification_message, sub_record.id);
            
        ELSIF days_until_renewal < 0 THEN
            notification_title := 'Overdue Payment: ' || sub_record.service_name;
            notification_message := sub_record.service_name || ' payment is ' || ABS(days_until_renewal) || ' days overdue';
            
            INSERT INTO notifications (user_id, type, title, message, subscription_id)
            VALUES (sub_record.user_id, 'overdue_payment', notification_title, notification_message, sub_record.id);
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default plans for existing users
DO $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN SELECT id FROM auth.users LOOP
        INSERT INTO user_plans (user_id, plan_type, subscription_limit, features)
        VALUES (
            user_record.id,
            'free',
            5,
            '{"analytics": false, "reports": false, "team_features": false, "api_access": false}'
        )
        ON CONFLICT (user_id) DO NOTHING;
    END LOOP;
END $$;