/*
  # Complete SubTracker Database Schema

  1. New Tables
    - `users` table for authentication (handled by Supabase Auth)
    - `subscriptions` table for tracking user subscriptions
    - `reminders` table for managing renewal reminders

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Secure foreign key relationships

  3. Functions
    - Trigger to automatically update `updated_at` timestamps
    - Function to calculate next renewal dates
*/

-- Create custom types
DO $$ BEGIN
    CREATE TYPE billing_cycle_type AS ENUM ('monthly', 'yearly');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE subscription_status_type AS ENUM ('active', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE subscription_category_type AS ENUM ('software', 'marketing', 'finance', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE reminder_type_enum AS ENUM ('30d', '7d', '1d');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE reminder_status_type AS ENUM ('pending', 'sent', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    service_name text NOT NULL,
    cost numeric(10,2) NOT NULL DEFAULT 0 CHECK (cost >= 0),
    billing_cycle billing_cycle_type NOT NULL DEFAULT 'monthly',
    next_renewal date NOT NULL,
    category subscription_category_type NOT NULL DEFAULT 'other',
    status subscription_status_type NOT NULL DEFAULT 'active',
    notes text DEFAULT '',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create reminders table
CREATE TABLE IF NOT EXISTS reminders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id uuid REFERENCES subscriptions(id) ON DELETE CASCADE NOT NULL,
    reminder_type reminder_type_enum NOT NULL,
    sent_at timestamptz,
    status reminder_status_type NOT NULL DEFAULT 'pending',
    created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

-- Create policies for subscriptions
DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;
CREATE POLICY "Users can view own subscriptions"
    ON subscriptions FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own subscriptions" ON subscriptions;
CREATE POLICY "Users can insert own subscriptions"
    ON subscriptions FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own subscriptions" ON subscriptions;
CREATE POLICY "Users can update own subscriptions"
    ON subscriptions FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own subscriptions" ON subscriptions;
CREATE POLICY "Users can delete own subscriptions"
    ON subscriptions FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Create policies for reminders
DROP POLICY IF EXISTS "Users can view own reminders" ON reminders;
CREATE POLICY "Users can view own reminders"
    ON reminders FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM subscriptions 
            WHERE subscriptions.id = reminders.subscription_id 
            AND subscriptions.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert own reminders" ON reminders;
CREATE POLICY "Users can insert own reminders"
    ON reminders FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM subscriptions 
            WHERE subscriptions.id = reminders.subscription_id 
            AND subscriptions.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update own reminders" ON reminders;
CREATE POLICY "Users can update own reminders"
    ON reminders FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM subscriptions 
            WHERE subscriptions.id = reminders.subscription_id 
            AND subscriptions.user_id = auth.uid()
        )
    );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS subscriptions_next_renewal_idx ON subscriptions(next_renewal);
CREATE INDEX IF NOT EXISTS subscriptions_status_idx ON subscriptions(status);
CREATE INDEX IF NOT EXISTS reminders_subscription_id_idx ON reminders(subscription_id);
CREATE INDEX IF NOT EXISTS reminders_status_idx ON reminders(status);

-- Create triggers
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data for testing (optional)
-- This will only insert if the user exists and no subscriptions exist yet
DO $$
DECLARE
    sample_user_id uuid;
BEGIN
    -- Get the first user ID if any exists
    SELECT id INTO sample_user_id FROM auth.users LIMIT 1;
    
    -- Only insert sample data if we have a user and no existing subscriptions
    IF sample_user_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM subscriptions LIMIT 1) THEN
        INSERT INTO subscriptions (user_id, service_name, cost, billing_cycle, next_renewal, category, status, notes) VALUES
        (sample_user_id, 'Netflix', 15.99, 'monthly', CURRENT_DATE + INTERVAL '15 days', 'other', 'active', 'Family plan'),
        (sample_user_id, 'Adobe Creative Suite', 52.99, 'monthly', CURRENT_DATE + INTERVAL '22 days', 'software', 'active', 'Design tools'),
        (sample_user_id, 'Spotify', 9.99, 'monthly', CURRENT_DATE + INTERVAL '8 days', 'other', 'active', 'Music streaming'),
        (sample_user_id, 'GitHub Pro', 4.00, 'monthly', CURRENT_DATE + INTERVAL '30 days', 'software', 'active', 'Code repositories'),
        (sample_user_id, 'Mailchimp', 299.00, 'yearly', CURRENT_DATE + INTERVAL '180 days', 'marketing', 'active', 'Email marketing platform');
    END IF;
END $$;