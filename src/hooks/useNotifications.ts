import { useState, useEffect, useCallback } from 'react';
import { supabase, handleSupabaseError } from '../lib/supabase';
import { useAuth } from './useAuth';
import { useUserPlan } from './useUserPlan';
import toast from 'react-hot-toast';

export type NotificationType = 'renewal_reminder' | 'overdue_payment' | 'plan_limit' | 'system';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  subscription_id?: string;
  is_read: boolean;
  created_at: string;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  email_enabled: boolean;
  push_enabled: boolean;
  reminder_30_days: boolean;
  reminder_7_days: boolean;
  reminder_1_day: boolean;
  overdue_alerts: boolean;
  email_time: string;
  created_at: string;
  updated_at: string;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { userPlan } = useUserPlan();

  const fetchNotifications = async (silent: boolean = false) => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    try {
      if (!silent) setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchError) {
        throw fetchError;
      }

      setNotifications(data || []);
    } catch (error: any) {
      const errorMessage = handleSupabaseError(error);
      setError(errorMessage);
      console.error('Error fetching notifications:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_id', user?.id);

      if (error) {
        throw error;
      }

      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, is_read: true }
            : notification
        )
      );
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) {
        throw error;
      }

      setNotifications(prev =>
        prev.map(notification => ({ ...notification, is_read: true }))
      );

    } catch (error: any) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', user?.id);

      if (error) {
        throw error;
      }

      setNotifications(prev =>
        prev.filter(notification => notification.id !== notificationId)
      );
    } catch (error: any) {
      console.error('Error deleting notification:', error);
    }
  };

  const createNotification = async (
    type: NotificationType,
    title: string,
    message: string,
    subscriptionId?: string
  ) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          type,
          title,
          message,
          subscription_id: subscriptionId
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      setNotifications(prev => [data, ...prev]);
      return data;
    } catch (error: any) {
      console.error('Error creating notification:', error);
    }
  };

  // 🎯 ENHANCED: Fixed notification checking with proper plan-based logic
  const checkForNewNotifications = useCallback(async (silent: boolean = false) => {
    if (!user || !userPlan) {
      console.log('❌ No user or plan found');
      return;
    }

    try {
      if (!silent) {
        console.log('🔍 Checking for new notifications...');
      }
      
      // Get active subscriptions
      const { data: subscriptions, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (subError) {
        console.error('❌ Error fetching subscriptions:', subError);
        return;
      }

      if (!subscriptions || subscriptions.length === 0) {
        console.log('📋 No active subscriptions found');
        return;
      }

      console.log(`📋 Found ${subscriptions.length} active subscriptions`);
      
      // Process each subscription locally for immediate detection
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day
      let notificationsCreated = 0;

      for (const sub of subscriptions) {
        const renewalDate = new Date(sub.next_renewal);
        renewalDate.setHours(0, 0, 0, 0); // Reset time to start of day
        
        const timeDiff = renewalDate.getTime() - today.getTime();
        const daysUntil = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
        
        console.log(`📅 ${sub.service_name}: ${daysUntil} days until renewal (${sub.next_renewal})`);
        
        let shouldNotify = false;
        let title = '';
        let message = '';
        let type: NotificationType = 'renewal_reminder';

        // 🎯 FIXED: Plan-based notification logic
        if (userPlan.plan_type === 'free') {
          // FREE: Notify for 0-7 days (inclusive)
          if (daysUntil >= 0 && daysUntil <= 7) {
            shouldNotify = true;
            console.log(`✅ FREE user - notifying for ${daysUntil} days`);
          }
        } else {
          // PRO/BUSINESS: Notify for 30, 7, 1 days and 0
          if (daysUntil === 30 || daysUntil === 7 || daysUntil === 1 || daysUntil === 0) {
            shouldNotify = true;
            console.log(`✅ PRO/BUSINESS user - notifying for ${daysUntil} days`);
          }
          // ALSO notify for any day between 1-7 for Pro/Business users
          else if (daysUntil >= 1 && daysUntil <= 7) {
            shouldNotify = true;
            console.log(`✅ PRO/BUSINESS user - notifying for ${daysUntil} days (within 7-day range)`);
          }
        }

        // Overdue (all plans)
        if (daysUntil < 0) {
          shouldNotify = true;
          type = 'overdue_payment';
          console.log(`🚨 OVERDUE - notifying for ${Math.abs(daysUntil)} days overdue`);
        }

        if (shouldNotify) {
          // Create appropriate message
          if (daysUntil < 0) {
            title = `OVERDUE: ${sub.service_name}`;
            message = `${sub.service_name} payment is ${Math.abs(daysUntil)} day${Math.abs(daysUntil) !== 1 ? 's' : ''} overdue! ($${sub.cost})`;
          } else if (daysUntil === 0) {
            title = `Renewal Today: ${sub.service_name}`;
            message = `${sub.service_name} renews TODAY for $${sub.cost}. Check your payment method.`;
          } else if (daysUntil === 1) {
            title = `Final Notice: ${sub.service_name}`;
            message = `${sub.service_name} renews TOMORROW for $${sub.cost}. Last chance to cancel!`;
          } else if (daysUntil === 7) {
            title = `Renewal Reminder: ${sub.service_name}`;
            message = `${sub.service_name} will renew in 7 days for $${sub.cost}. Review if needed.`;
          } else if (daysUntil === 30) {
            title = `30-Day Renewal Notice: ${sub.service_name}`;
            message = `${sub.service_name} will renew in 30 days for $${sub.cost}. Plan ahead!`;
          } else {
            title = `Renewal Reminder: ${sub.service_name}`;
            message = `${sub.service_name} will renew in ${daysUntil} days for $${sub.cost}.`;
          }

          // 🎯 FIXED: Check if notification already exists for this subscription and day
          const { data: existingNotifications } = await supabase
            .from('notifications')
            .select('id, message, created_at')
            .eq('user_id', user.id)
            .eq('subscription_id', sub.id)
            .eq('type', type);

          // Check if we already have a notification for this specific day count
          const hasExistingNotification = existingNotifications?.some(notif => {
            if (type === 'overdue_payment') {
              return notif.message.includes(`${Math.abs(daysUntil)} day`);
            } else {
              return notif.message.includes(`${daysUntil} day`) || 
                     (daysUntil === 0 && notif.message.includes('TODAY')) ||
                     (daysUntil === 1 && notif.message.includes('TOMORROW'));
            }
          });

          if (!hasExistingNotification) {
            // Create notification
            const newNotification = await createNotification(type, title, message, sub.id);
            if (newNotification) {
              notificationsCreated++;
              console.log(`✅ Created notification: ${title}`);
            }
          } else {
            console.log(`⏭️ Notification already exists for ${sub.service_name} (${daysUntil} days)`);
          }
        } else {
          console.log(`⏭️ No notification needed for ${sub.service_name} (${daysUntil} days, plan: ${userPlan.plan_type})`);
        }
      }

      console.log(`🎯 Total notifications created: ${notificationsCreated}`);
      
      // Refresh notifications if we created any
      if (notificationsCreated > 0) {
        setTimeout(() => {
          fetchNotifications(true);
        }, 500);
      }

    } catch (error: any) {
      console.error('❌ Error in checkForNewNotifications:', error);
    }
  }, [user, userPlan, createNotification]);

  const getUnreadCount = () => {
    return notifications.filter(n => !n.is_read).length;
  };

  const getUrgentNotifications = () => {
    return notifications.filter(n => 
      !n.is_read && (
        n.type === 'overdue_payment' || 
        (n.type === 'renewal_reminder' && (
          n.message.includes('1 day') || 
          n.message.includes('TOMORROW') || 
          n.message.includes('TODAY')
        ))
      )
    );
  };

  const getNotificationsByType = (type: NotificationType) => {
    return notifications.filter(n => n.type === type && !n.is_read);
  };

  // Real-time notification updates - SILENT
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('notifications_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🔔 Real-time notification update:', payload.eventType);
          
          switch (payload.eventType) {
            case 'INSERT':
              const newNotification = payload.new as Notification;
              setNotifications(prev => [newNotification, ...prev]);
              
              // Only show toast for critical notifications
              if (newNotification.type === 'overdue_payment') {
                toast.error(newNotification.title, { 
                  duration: 6000,
                  icon: '🚨'
                });
              }
              break;
            case 'UPDATE':
              setNotifications(prev =>
                prev.map(notification =>
                  notification.id === payload.new.id ? payload.new as Notification : notification
                )
              );
              break;
            case 'DELETE':
              setNotifications(prev =>
                prev.filter(notification => notification.id !== payload.old.id)
              );
              break;
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Fetch data when user changes
  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  // 🎯 ENHANCED: Check for notifications when user plan is loaded AND when called manually
  useEffect(() => {
    if (user && userPlan) {
      // Initial check after 2 seconds
      const timeout = setTimeout(() => {
        checkForNewNotifications(true);
      }, 2000);

      return () => clearTimeout(timeout);
    }
  }, [user, userPlan, checkForNewNotifications]);

  return {
    notifications,
    preferences,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification,
    checkForNewNotifications,
    getUnreadCount,
    getUrgentNotifications,
    getNotificationsByType,
    refetch: fetchNotifications
  };
};