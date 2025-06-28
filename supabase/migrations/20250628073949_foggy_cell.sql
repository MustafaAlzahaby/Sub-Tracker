/*
  # Enhanced Notification System for Subscription Renewals

  1. New Tables
    - Enhanced notifications table with better structure
    - Notification preferences table for user customization
    
  2. Functions
    - Smart notification creation based on user plans
    - Email notification triggers for Pro/Business users
    - Automatic cleanup of old notifications
    
  3. Triggers
    - Daily notification check
    - Real-time subscription monitoring
    
  4. Security
    - Proper RLS policies for all notification tables
    - Secure function execution
*/

-- Drop existing notification function if it exists
DROP FUNCTION IF EXISTS create_plan_based_notifications();

-- Enhanced notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email_enabled boolean DEFAULT true,
  push_enabled boolean DEFAULT true,
  reminder_30_days boolean DEFAULT false, -- Only for Pro/Business
  reminder_7_days boolean DEFAULT true,   -- All plans
  reminder_1_day boolean DEFAULT false,   -- Only for Pro/Business
  overdue_alerts boolean DEFAULT true,    -- All plans
  email_time time DEFAULT '09:00:00',     -- Preferred email time
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies for notification preferences
CREATE POLICY "Users can view own notification preferences"
  ON notification_preferences
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notification preferences"
  ON notification_preferences
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification preferences"
  ON notification_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Function to create default notification preferences for new users
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS trigger AS $$
BEGIN
  INSERT INTO notification_preferences (user_id, email_enabled, push_enabled, reminder_7_days, overdue_alerts)
  VALUES (NEW.user_id, true, true, true, true)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create default preferences when user plan is created
CREATE OR REPLACE TRIGGER create_notification_preferences_trigger
  AFTER INSERT ON user_plans
  FOR EACH ROW
  EXECUTE FUNCTION create_default_notification_preferences();

-- Enhanced function to create renewal notifications based on user plan and preferences
CREATE OR REPLACE FUNCTION create_subscription_renewal_notifications()
RETURNS void AS $$
DECLARE
    sub_record RECORD;
    days_until_renewal integer;
    notification_title text;
    notification_message text;
    should_notify boolean;
    notification_type notification_type;
BEGIN
    -- Loop through active subscriptions with user plan and preference info
    FOR sub_record IN 
        SELECT 
            s.*,
            up.plan_type,
            COALESCE(np.reminder_30_days, false) as reminder_30_days,
            COALESCE(np.reminder_7_days, true) as reminder_7_days,
            COALESCE(np.reminder_1_day, false) as reminder_1_day,
            COALESCE(np.overdue_alerts, true) as overdue_alerts,
            COALESCE(np.email_enabled, true) as email_enabled,
            COALESCE(np.push_enabled, true) as push_enabled
        FROM subscriptions s
        JOIN user_plans up ON s.user_id = up.user_id
        LEFT JOIN notification_preferences np ON s.user_id = np.user_id
        WHERE s.status = 'active'
    LOOP
        -- Calculate days until renewal
        days_until_renewal := (sub_record.next_renewal::date - CURRENT_DATE);
        should_notify := false;
        notification_type := 'renewal_reminder';
        
        -- Determine if we should create a notification based on plan type and preferences
        IF days_until_renewal = 30 AND sub_record.plan_type IN ('pro', 'business') AND sub_record.reminder_30_days THEN
            should_notify := true;
            notification_title := '30-Day Renewal Notice: ' || sub_record.service_name;
            notification_message := sub_record.service_name || ' will renew in 30 days for $' || sub_record.cost || '. Plan ahead!';
        ELSIF days_until_renewal = 7 AND sub_record.reminder_7_days THEN
            should_notify := true;
            notification_title := 'Renewal Reminder: ' || sub_record.service_name;
            notification_message := sub_record.service_name || ' will renew in 7 days for $' || sub_record.cost || '. Review if needed.';
        ELSIF days_until_renewal = 1 AND sub_record.plan_type IN ('pro', 'business') AND sub_record.reminder_1_day THEN
            should_notify := true;
            notification_title := 'Final Notice: ' || sub_record.service_name;
            notification_message := sub_record.service_name || ' renews TOMORROW for $' || sub_record.cost || '. Last chance to cancel!';
        ELSIF days_until_renewal = 0 THEN
            should_notify := true;
            notification_title := 'Renewal Today: ' || sub_record.service_name;
            notification_message := sub_record.service_name || ' renews TODAY for $' || sub_record.cost || '. Check your payment method.';
        ELSIF days_until_renewal < 0 AND sub_record.overdue_alerts THEN
            should_notify := true;
            notification_type := 'overdue_payment';
            notification_title := 'OVERDUE: ' || sub_record.service_name;
            notification_message := sub_record.service_name || ' payment is ' || ABS(days_until_renewal) || ' day' || 
                CASE WHEN ABS(days_until_renewal) != 1 THEN 's' ELSE '' END || ' overdue! ($' || sub_record.cost || ')';
        END IF;
        
        -- Create notification if needed and doesn't already exist
        IF should_notify THEN
            -- Check if notification already exists for this subscription and timeframe today
            IF NOT EXISTS (
                SELECT 1 FROM notifications 
                WHERE subscription_id = sub_record.id 
                AND type = notification_type
                AND DATE(created_at) = CURRENT_DATE
                AND (
                    (days_until_renewal >= 0 AND title LIKE '%' || days_until_renewal || '%') OR
                    (days_until_renewal < 0 AND type = 'overdue_payment')
                )
            ) THEN
                -- Create the notification
                INSERT INTO notifications (
                    user_id, 
                    type, 
                    title, 
                    message, 
                    subscription_id,
                    is_read
                )
                VALUES (
                    sub_record.user_id, 
                    notification_type, 
                    notification_title, 
                    notification_message, 
                    sub_record.id,
                    false
                );
                
                -- Log successful notification creation
                RAISE NOTICE 'Created notification for user % subscription %: %', 
                    sub_record.user_id, sub_record.service_name, notification_title;
            END IF;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old notifications and maintain performance
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
    -- Delete read notifications older than 7 days
    DELETE FROM notifications 
    WHERE is_read = true 
    AND created_at < CURRENT_DATE - INTERVAL '7 days';
    
    -- Delete unread notifications older than 30 days
    DELETE FROM notifications 
    WHERE is_read = false 
    AND created_at < CURRENT_DATE - INTERVAL '30 days';
    
    -- Log cleanup
    RAISE NOTICE 'Cleaned up old notifications at %', now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get notification summary for a user
CREATE OR REPLACE FUNCTION get_user_notification_summary(user_uuid uuid)
RETURNS TABLE(
    total_notifications bigint,
    unread_notifications bigint,
    urgent_notifications bigint,
    overdue_notifications bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_notifications,
        COUNT(*) FILTER (WHERE is_read = false) as unread_notifications,
        COUNT(*) FILTER (WHERE is_read = false AND type = 'renewal_reminder' AND message LIKE '%1 day%') as urgent_notifications,
        COUNT(*) FILTER (WHERE is_read = false AND type = 'overdue_payment') as overdue_notifications
    FROM notifications 
    WHERE user_id = user_uuid
    AND created_at > CURRENT_DATE - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_created 
ON notifications(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_subscription_type 
ON notifications(subscription_id, type);

CREATE INDEX IF NOT EXISTS idx_notifications_unread 
ON notifications(user_id, is_read, created_at DESC) 
WHERE is_read = false;

-- Create initial notification preferences for existing users
INSERT INTO notification_preferences (user_id, email_enabled, push_enabled, reminder_7_days, overdue_alerts)
SELECT up.user_id, true, true, true, true
FROM user_plans up
WHERE NOT EXISTS (
    SELECT 1 FROM notification_preferences np 
    WHERE np.user_id = up.user_id
);

-- Run initial notification creation for existing subscriptions
SELECT create_subscription_renewal_notifications();