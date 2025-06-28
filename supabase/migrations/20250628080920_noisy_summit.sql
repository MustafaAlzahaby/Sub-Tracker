-- Enhanced function to create renewal notifications based on subscription plan
-- Free users: Get notifications for services renewing within 7 days
-- Pro/Business users: Get notifications for 30 days, 7 days, and 1 day before renewal + email notifications

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
    -- Loop through active subscriptions with user plan info
    FOR sub_record IN 
        SELECT 
            s.*,
            up.plan_type
        FROM subscriptions s
        JOIN user_plans up ON s.user_id = up.user_id
        WHERE s.status = 'active'
    LOOP
        -- Calculate days until renewal
        days_until_renewal := (sub_record.next_renewal::date - CURRENT_DATE);
        should_notify := false;
        notification_type := 'renewal_reminder';
        
        -- Plan-based notification logic
        IF sub_record.plan_type = 'free' THEN
            -- FREE USERS: Only get notifications for services renewing within 7 days
            IF days_until_renewal BETWEEN 0 AND 7 THEN
                should_notify := true;
                
                IF days_until_renewal = 0 THEN
                    notification_title := 'Renewal Today: ' || sub_record.service_name;
                    notification_message := sub_record.service_name || ' renews TODAY for $' || sub_record.cost || '. Check your payment method.';
                ELSIF days_until_renewal = 1 THEN
                    notification_title := 'Renewal Tomorrow: ' || sub_record.service_name;
                    notification_message := sub_record.service_name || ' renews TOMORROW for $' || sub_record.cost || '. Last chance to cancel!';
                ELSE
                    notification_title := 'Renewal Reminder: ' || sub_record.service_name;
                    notification_message := sub_record.service_name || ' will renew in ' || days_until_renewal || ' days for $' || sub_record.cost || '.';
                END IF;
            END IF;
            
        ELSIF sub_record.plan_type IN ('pro', 'business') THEN
            -- PRO/BUSINESS USERS: Get notifications for 30 days, 7 days, and 1 day before renewal
            IF days_until_renewal = 30 THEN
                should_notify := true;
                notification_title := '30-Day Renewal Notice: ' || sub_record.service_name;
                notification_message := sub_record.service_name || ' will renew in 30 days for $' || sub_record.cost || '. Plan ahead!';
                
            ELSIF days_until_renewal = 7 THEN
                should_notify := true;
                notification_title := 'Renewal Reminder: ' || sub_record.service_name;
                notification_message := sub_record.service_name || ' will renew in 7 days for $' || sub_record.cost || '. Review if needed.';
                
            ELSIF days_until_renewal = 1 THEN
                should_notify := true;
                notification_title := 'Final Notice: ' || sub_record.service_name;
                notification_message := sub_record.service_name || ' renews TOMORROW for $' || sub_record.cost || '. Last chance to cancel!';
                
            ELSIF days_until_renewal = 0 THEN
                should_notify := true;
                notification_title := 'Renewal Today: ' || sub_record.service_name;
                notification_message := sub_record.service_name || ' renews TODAY for $' || sub_record.cost || '. Check your payment method.';
            END IF;
        END IF;
        
        -- Handle overdue payments (all plans)
        IF days_until_renewal < 0 THEN
            should_notify := true;
            notification_type := 'overdue_payment';
            notification_title := 'OVERDUE: ' || sub_record.service_name;
            notification_message := sub_record.service_name || ' payment is ' || ABS(days_until_renewal) || ' day' || 
                CASE WHEN ABS(days_until_renewal) != 1 THEN 's' ELSE '' END || ' overdue! ($' || sub_record.cost || ')';
        END IF;
        
        -- Create notification if needed and doesn't already exist (ONLY ONCE)
        IF should_notify THEN
            -- Check if notification already exists for this subscription and specific day
            IF NOT EXISTS (
                SELECT 1 FROM notifications 
                WHERE subscription_id = sub_record.id 
                AND type = notification_type
                AND (
                    -- For renewal reminders, check if we already notified for this specific day count
                    (notification_type = 'renewal_reminder' AND (
                        message LIKE '%' || days_until_renewal || ' day%' OR
                        (days_until_renewal = 0 AND message LIKE '%TODAY%') OR
                        (days_until_renewal = 1 AND message LIKE '%TOMORROW%')
                    )) OR
                    -- For overdue, check if we already have an overdue notification for this day count
                    (notification_type = 'overdue_payment' AND message LIKE '%' || ABS(days_until_renewal) || ' day%')
                )
            ) THEN
                -- Create the notification (ONLY ONCE)
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

-- Run the notification creation
SELECT create_subscription_renewal_notifications();