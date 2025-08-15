/*
  # Update notification logic to respect user preferences

  1. Enhanced Logic
    - Properly respect user preference settings
    - Don't create notifications for disabled reminder types
    - Better filtering based on plan and preferences

  2. Improved Functions
    - Updated notification creation logic
    - Better preference checking
    - More accurate filtering
*/

-- Enhanced function to create renewal notifications that RESPECTS user preferences
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
            
        ELSIF days_until_renewal = 1 AND sub_record.plan_type IN ('pro', 'business') AND sub_record.reminder_1_day THEN
            -- ONLY notify for 1 day if the user has enabled 1-day reminders
            should_notify := true;
            notification_title := 'Final Notice: ' || sub_record.service_name;
            notification_message := sub_record.service_name || ' renews TOMORROW for $' || sub_record.cost || '. Last chance to cancel!';
            
        ELSIF days_until_renewal BETWEEN 2 AND 7 AND sub_record.reminder_7_days THEN
            -- For 2-7 days, only notify if 7-day reminders are enabled
            should_notify := true;
            IF days_until_renewal = 7 THEN
                notification_title := 'Renewal Reminder: ' || sub_record.service_name;
                notification_message := sub_record.service_name || ' will renew in 7 days for $' || sub_record.cost || '. Review if needed.';
            ELSE
                notification_title := 'Renewal Reminder: ' || sub_record.service_name;
                notification_message := sub_record.service_name || ' will renew in ' || days_until_renewal || ' days for $' || sub_record.cost || '. Review if needed.';
            END IF;
            
        ELSIF days_until_renewal = 0 THEN
            -- Always notify for same-day renewals (critical)
            should_notify := true;
            notification_title := 'Renewal Today: ' || sub_record.service_name;
            notification_message := sub_record.service_name || ' renews TODAY for $' || sub_record.cost || '. Check your payment method.';
            
        ELSIF days_until_renewal < 0 AND sub_record.overdue_alerts THEN
            -- Only notify for overdue if overdue alerts are enabled
            should_notify := true;
            notification_type := 'overdue_payment';
            notification_title := 'OVERDUE: ' || sub_record.service_name;
            notification_message := sub_record.service_name || ' payment is ' || ABS(days_until_renewal) || ' day' || 
                CASE WHEN ABS(days_until_renewal) != 1 THEN 's' ELSE '' END || ' overdue! ($' || sub_record.cost || ')';
        END IF;
        
        -- Create notification if needed and doesn't already exist
        IF should_notify THEN
            -- Check if notification already exists for this subscription and specific day
            IF NOT EXISTS (
                SELECT 1 FROM notifications 
                WHERE subscription_id = sub_record.id 
                AND type = notification_type
                AND DATE(created_at) = CURRENT_DATE
                AND (
                    -- For renewal reminders, check if we already notified for this specific day count
                    (notification_type = 'renewal_reminder' AND (
                        message LIKE '%' || days_until_renewal || ' day%' OR
                        (days_until_renewal = 0 AND message LIKE '%TODAY%') OR
                        (days_until_renewal = 1 AND message LIKE '%TOMORROW%')
                    )) OR
                    -- For overdue, just check if we already have an overdue notification today
                    (notification_type = 'overdue_payment')
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
            END IF;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run the updated notification creation
SELECT create_subscription_renewal_notifications();