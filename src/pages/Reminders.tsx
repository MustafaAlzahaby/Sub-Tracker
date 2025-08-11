import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '../components/Layout/Layout';
import { useSubscriptions } from '../hooks/useSubscriptions';
import { Bell, Calendar, Clock, AlertCircle, Settings, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, differenceInDays } from 'date-fns';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

type ReminderSettings = {
  reminder_30_days: boolean;
  reminder_7_days: boolean;
  reminder_1_day: boolean;
};

const DEFAULT_SETTINGS: ReminderSettings = {
  reminder_30_days: true,
  reminder_7_days: true,
  reminder_1_day: true,
};

// Email scheduling logic
const scheduleSubscriptionReminders = async (userId: string, settings: ReminderSettings, subscriptions: any[]) => {
  try {
    const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active');
    const today = new Date();
    
    const reminderTasks = [];

    for (const subscription of activeSubscriptions) {
      const renewalDate = new Date(subscription.next_renewal);
      const daysUntilRenewal = differenceInDays(renewalDate, today);

      // 30-day reminders: Send every 5 days starting from 30 days before
      if (settings.reminder_30_days && daysUntilRenewal <= 30 && daysUntilRenewal > 7) {
        const shouldSend = daysUntilRenewal === 30 || daysUntilRenewal === 25 || 
                          daysUntilRenewal === 20 || daysUntilRenewal === 15 || 
                          daysUntilRenewal === 10;
        
        if (shouldSend) {
          reminderTasks.push({
            userId,
            subscriptionId: subscription.id,
            reminderType: '30_days',
            scheduledFor: new Date(),
            daysUntilRenewal,
            subscriptionData: subscription
          });
        }
      }

      // 7-day reminders: Send every 2-3 days
      if (settings.reminder_7_days && daysUntilRenewal <= 7 && daysUntilRenewal > 1) {
        const shouldSend = daysUntilRenewal === 7 || daysUntilRenewal === 5 || 
                          daysUntilRenewal === 3 || daysUntilRenewal === 2;
        
        if (shouldSend) {
          reminderTasks.push({
            userId,
            subscriptionId: subscription.id,
            reminderType: '7_days',
            scheduledFor: new Date(),
            daysUntilRenewal,
            subscriptionData: subscription
          });
        }
      }

      // 1-day reminders: Send at beginning of day and 6 hours before end of day
      if (settings.reminder_1_day && daysUntilRenewal === 1) {
        const morningReminder = new Date();
        morningReminder.setHours(9, 0, 0, 0); // 9 AM

        const eveningReminder = new Date();
        eveningReminder.setHours(18, 0, 0, 0); // 6 PM

        reminderTasks.push({
          userId,
          subscriptionId: subscription.id,
          reminderType: '1_day_morning',
          scheduledFor: morningReminder,
          daysUntilRenewal,
          subscriptionData: subscription
        });

        reminderTasks.push({
          userId,
          subscriptionId: subscription.id,
          reminderType: '1_day_evening',
          scheduledFor: eveningReminder,
          daysUntilRenewal,
          subscriptionData: subscription
        });
      }

      // Same day reminders: Morning reminder for renewals due today
      if (daysUntilRenewal === 0) {
        const todayReminder = new Date();
        todayReminder.setHours(10, 0, 0, 0); // 10 AM

        reminderTasks.push({
          userId,
          subscriptionId: subscription.id,
          reminderType: 'due_today',
          scheduledFor: todayReminder,
          daysUntilRenewal,
          subscriptionData: subscription
        });
      }
    }

    // Process and send email reminders
    if (reminderTasks.length > 0) {
      await sendEmailReminders(reminderTasks);
      await logReminderActivity(userId, reminderTasks);
    }

  } catch (error) {
    console.error('Error scheduling reminders:', error);
  }
};

// Email sending function
const sendEmailReminders = async (reminderTasks: any[]) => {
  try {
    // Group reminders by user for batch sending
    const userReminders = reminderTasks.reduce((acc, task) => {
      if (!acc[task.userId]) acc[task.userId] = [];
      acc[task.userId].push(task);
      return acc;
    }, {});

    for (const [userId, reminders] of Object.entries(userReminders)) {
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user?.email) continue;

      // Create email content based on reminder types
      const emailContent = generateEmailContent(reminders as any[]);
      
      // Call your email service (e.g., Supabase Edge Function, SendGrid, etc.)
      await supabase.functions.invoke('send-reminder-email', {
        body: {
          to: user.user.email,
          subject: emailContent.subject,
          html: emailContent.html,
          reminders: reminders
        }
      });
    }
  } catch (error) {
    console.error('Error sending email reminders:', error);
  }
};

// Generate email content based on reminder types
const generateEmailContent = (reminders: any[]) => {
  const urgentReminders = reminders.filter(r => r.reminderType.includes('1_day') || r.reminderType === 'due_today');
  const warningReminders = reminders.filter(r => r.reminderType === '7_days');
  const planningReminders = reminders.filter(r => r.reminderType === '30_days');

  let subject = 'Subscription Renewal Reminder';
  let html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #1f2937; margin-bottom: 30px;">Subscription Renewal Reminders</h1>
  `;

  if (urgentReminders.length > 0) {
    subject = urgentReminders.some(r => r.reminderType === 'due_today') 
      ? '🚨 Subscription Renewals Due Today!' 
      : '⚠️ Subscription Renewals Due Tomorrow!';
    
    html += `
      <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
        <h2 style="color: #dc2626; margin-top: 0;">Urgent Renewals</h2>
    `;
    
    urgentReminders.forEach(reminder => {
      html += `
        <div style="margin-bottom: 12px; padding: 12px; background: white; border-radius: 6px;">
          <h3 style="margin: 0 0 8px 0; color: #1f2937;">${reminder.subscriptionData.service_name}</h3>
          <p style="margin: 0; color: #6b7280;">
            <strong>Amount:</strong> $${reminder.subscriptionData.cost.toFixed(2)} • 
            <strong>Cycle:</strong> ${reminder.subscriptionData.billing_cycle} • 
            <strong>Status:</strong> ${reminder.reminderType === 'due_today' ? 'Due Today!' : 'Due Tomorrow!'}
          </p>
        </div>
      `;
    });
    html += '</div>';
  }

  if (warningReminders.length > 0) {
    html += `
      <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
        <h2 style="color: #d97706; margin-top: 0;">Renewals This Week</h2>
    `;
    
    warningReminders.forEach(reminder => {
      html += `
        <div style="margin-bottom: 12px; padding: 12px; background: white; border-radius: 6px;">
          <h3 style="margin: 0 0 8px 0; color: #1f2937;">${reminder.subscriptionData.service_name}</h3>
          <p style="margin: 0; color: #6b7280;">
            <strong>Amount:</strong> $${reminder.subscriptionData.cost.toFixed(2)} • 
            <strong>Cycle:</strong> ${reminder.subscriptionData.billing_cycle} • 
            <strong>Days remaining:</strong> ${reminder.daysUntilRenewal}
          </p>
        </div>
      `;
    });
    html += '</div>';
  }

  if (planningReminders.length > 0) {
    html += `
      <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
        <h2 style="color: #2563eb; margin-top: 0;">Plan Ahead</h2>
    `;
    
    planningReminders.forEach(reminder => {
      html += `
        <div style="margin-bottom: 12px; padding: 12px; background: white; border-radius: 6px;">
          <h3 style="margin: 0 0 8px 0; color: #1f2937;">${reminder.subscriptionData.service_name}</h3>
          <p style="margin: 0; color: #6b7280;">
            <strong>Amount:</strong> $${reminder.subscriptionData.cost.toFixed(2)} • 
            <strong>Cycle:</strong> ${reminder.subscriptionData.billing_cycle} • 
            <strong>Days remaining:</strong> ${reminder.daysUntilRenewal}
          </p>
        </div>
      `;
    });
    html += '</div>';
  }

  html += `
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px; margin: 0;">
          You can manage your subscriptions and reminder preferences in your account dashboard.
        </p>
      </div>
    </div>
  `;

  return { subject, html };
};

// Log reminder activity to prevent duplicate sends
const logReminderActivity = async (userId: string, reminderTasks: any[]) => {
  try {
    const logs = reminderTasks.map(task => ({
      user_id: userId,
      subscription_id: task.subscriptionId,
      reminder_type: task.reminderType,
      sent_at: new Date().toISOString(),
      days_until_renewal: task.daysUntilRenewal
    }));

    await supabase.from('reminder_logs').insert(logs);
  } catch (error) {
    console.error('Error logging reminder activity:', error);
  }
};

// Check if reminder should be sent (prevent duplicates)
const shouldSendReminder = async (userId: string, subscriptionId: string, reminderType: string, daysUntilRenewal: number) => {
  try {
    const { data, error } = await supabase
      .from('reminder_logs')
      .select('id')
      .eq('user_id', userId)
      .eq('subscription_id', subscriptionId)
      .eq('reminder_type', reminderType)
      .eq('days_until_renewal', daysUntilRenewal)
      .gte('sent_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Within last 24 hours
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;
    
    return !data; // Send if no recent log found
  } catch (error) {
    console.error('Error checking reminder history:', error);
    return false;
  }
};

export const Reminders: React.FC = () => {
  const { subscriptions, loading } = useSubscriptions();
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get('highlight');

  const [highlightedSubscription, setHighlightedSubscription] = useState<string | null>(highlightId);
  const [isHighlightFading, setIsHighlightFading] = useState(false);
  const [isInfoFading, setIsInfoFading] = useState(false);
  const [showHeaderInfo, setShowHeaderInfo] = useState(!!highlightId);

  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>(DEFAULT_SETTINGS);
  const [settingsLoading, setSettingsLoading] = useState<boolean>(true);
  const [settingsSaving, setSettingsSaving] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Load settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          setSettingsLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('notification_preferences')
          .select('reminder_30_days, reminder_7_days, reminder_1_day')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (error) throw error;

        if (!data) {
          const { error: upErr } = await supabase
            .from('notification_preferences')
            .upsert(
              {
                user_id: session.user.id,
                ...DEFAULT_SETTINGS,
              },
              { onConflict: 'user_id' }
            );
          if (upErr) throw upErr;
          setReminderSettings(DEFAULT_SETTINGS);
        } else {
          setReminderSettings({
            reminder_30_days: data.reminder_30_days,
            reminder_7_days: data.reminder_7_days,
            reminder_1_day: data.reminder_1_day,
          });
        }
      } catch (error) {
        console.error('Failed to load reminder settings:', error);
      } finally {
        setSettingsLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Save settings and schedule reminders
  const handleSaveSettings = async () => {
    setSettingsSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        toast.error('Please sign in to save settings.');
        return;
      }

      const payload = {
        user_id: session.user.id,
        reminder_30_days: reminderSettings.reminder_30_days,
        reminder_7_days: reminderSettings.reminder_7_days,
        reminder_1_day: reminderSettings.reminder_1_day,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('notification_preferences')
        .upsert(payload, { onConflict: 'user_id' });

      if (error) throw error;

      // Schedule email reminders based on new settings
      await scheduleSubscriptionReminders(session.user.id, reminderSettings, subscriptions);

      toast.success('Reminder settings saved.');
      setShowSettingsModal(false);
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Could not save settings. Try again.');
    } finally {
      setSettingsSaving(false);
    }
  };

  // Auto-schedule reminders when subscriptions change
  useEffect(() => {
    const scheduleReminders = async () => {
      if (!loading && subscriptions.length > 0) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await scheduleSubscriptionReminders(session.user.id, reminderSettings, subscriptions);
        }
      }
    };

    scheduleReminders();
  }, [subscriptions, reminderSettings, loading]);

  // Highlight UX
  useEffect(() => {
    if (highlightedSubscription) {
      const fadeTimer = setTimeout(() => {
        setIsHighlightFading(true);
        setIsInfoFading(true);

        const removeTimer = setTimeout(() => {
          setHighlightedSubscription(null);
          setIsHighlightFading(false);
          setIsInfoFading(false);
          setShowHeaderInfo(false);
        }, 3000);

        return () => clearTimeout(removeTimer);
      }, 8000);

      return () => clearTimeout(fadeTimer);
    }
  }, [highlightedSubscription]);

  useEffect(() => {
    if (highlightedSubscription) {
      const element = document.getElementById(`subscription-${highlightedSubscription}`);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 500);
      }
    }
  }, [highlightedSubscription]);

  const reminderData = useMemo(() => {
    const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active');
    const today = new Date();

    const upcomingRenewals = activeSubscriptions.map(sub => {
      const renewalDate = new Date(sub.next_renewal);
      const daysUntilRenewal = differenceInDays(renewalDate, today);

      let urgency: 'overdue' | 'urgent' | 'warning' | 'normal' = 'normal';
      if (daysUntilRenewal < 0) urgency = 'overdue';
      else if (daysUntilRenewal <= 1) urgency = 'urgent';
      else if (daysUntilRenewal <= 7) urgency = 'warning';

      return {
        ...sub,
        daysUntilRenewal,
        urgency,
        renewalDate
      };
    }).sort((a, b) => a.daysUntilRenewal - b.daysUntilRenewal);

    const overdueRenewals = upcomingRenewals.filter(sub => sub.urgency === 'overdue');
    const urgentRenewals = upcomingRenewals.filter(sub => sub.urgency === 'urgent');
    const warningRenewals = upcomingRenewals.filter(sub => sub.urgency === 'warning');
    const normalRenewals = upcomingRenewals.filter(sub => sub.urgency === 'normal');

    return { upcomingRenewals, overdueRenewals, urgentRenewals, warningRenewals, normalRenewals };
  }, [subscriptions]);

  const getUrgencyStyle = (urgency: string) => {
    switch (urgency) {
      case 'overdue': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-800';
      case 'urgent': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400 border-orange-200 dark:border-orange-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
      default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800';
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'overdue': return AlertCircle;
      case 'urgent': return Clock;
      case 'warning': return Bell;
      default: return Calendar;
    }
  };

  const formatDaysText = (days: number) => {
    if (days < 0) return `${Math.abs(days)} days overdue`;
    if (days === 0) return 'Due today';
    if (days === 1) return 'Due tomorrow';
    return `${days} days remaining`;
  };

  const getHighlightStyle = (subscriptionId: string) => {
    if (highlightedSubscription === subscriptionId) {
      const baseStyle = 'ring-4 ring-blue-500 ring-opacity-50 bg-blue-50/50 dark:bg-blue-900/20 shadow-2xl transform scale-[1.02]';
      if (isHighlightFading) return `${baseStyle} transition-all duration-3000 ease-out opacity-0 scale-100 ring-opacity-0`;
      return `${baseStyle} transition-all duration-300`;
    }
    return 'transition-all duration-300';
  };

  const getInfoFadeStyle = () => (isInfoFading ? 'transition-all duration-3000 ease-out opacity-0 transform translate-y-2' : 'transition-all duration-300');

  if (loading || settingsLoading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout onAddSubscription={() => window.location.href = '/subscriptions'}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                Renewal Reminders
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Stay on top of your subscription renewals and never miss a payment
                {showHeaderInfo && (
                  <span className={`block text-blue-600 dark:text-blue-400 text-sm mt-1 ${getInfoFadeStyle()}`}>
                    📍 Showing details for your notification
                  </span>
                )}
              </p>
            </div>

            <div className="flex space-x-3 mt-4 sm:mt-0">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowSettingsModal(true)}
                className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg"
              >
                <Settings className="w-4 h-4 mr-2" />
                Reminder Settings
              </motion.button>
            </div>
          </motion.div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { title: 'Overdue', count: reminderData.overdueRenewals.length, color: 'from-red-500 to-red-600', icon: AlertCircle },
              { title: 'Due Soon (1-2 days)', count: reminderData.urgentRenewals.length, color: 'from-orange-500 to-orange-600', icon: Clock },
              { title: 'This Week', count: reminderData.warningRenewals.length, color: 'from-yellow-500 to-yellow-600', icon: Bell },
              { title: 'Future', count: reminderData.normalRenewals.length, color: 'from-blue-500 to-blue-600', icon: Calendar }
            ].map((card, index) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{card.title}</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{card.count}</p>
                  </div>
                  <div className={`w-12 h-12 bg-gradient-to-r ${card.color} rounded-xl flex items-center justify-center shadow-lg`}>
                    <card.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Upcoming Renewals List */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200/50 dark:border-gray-700/50">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">All Upcoming Renewals</h3>
            </div>
            <div className="divide-y divide-gray-200/50 dark:divide-gray-700/50 h-96 sm:h-[28rem] md:h-[32rem] lg:h-[36rem] xl:h-[40rem] overflow-y-auto">
              {reminderData.upcomingRenewals.length === 0 ? (
                <div className="p-12 text-center">
                  <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No upcoming renewals</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">All your subscriptions are up to date!</p>
                </div>
              ) : (
                reminderData.upcomingRenewals.map((subscription, index) => {
                  const UrgencyIcon = getUrgencyIcon(subscription.urgency);
                  const isHighlighted = highlightedSubscription === subscription.id;

                  return (
                    <motion.div
                      key={subscription.id}
                      id={`subscription-${subscription.id}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`p-6 hover:bg-gray-50/50 dark:hover:bg-gray-700/50 ${getHighlightStyle(subscription.id)}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                            <span className="text-white font-semibold text-lg">
                              {subscription.service_name.charAt(0)}
                            </span>
                          </div>

                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {subscription.service_name}
                              {isHighlighted && !isHighlightFading && (
                                <motion.span
                                  initial={{ opacity: 0, scale: 0 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 ${getInfoFadeStyle()}`}
                                >
                                  📍 From notification
                                </motion.span>
                              )}
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              ${subscription.cost.toFixed(2)} • {subscription.billing_cycle}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Renews on {format(subscription.renewalDate, 'MMM dd, yyyy')}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <div className={`flex items-center px-3 py-2 rounded-xl border ${getUrgencyStyle(subscription.urgency)}`}>
                            <UrgencyIcon className="w-4 h-4 mr-2" />
                            <span className="text-sm font-medium">
                              {formatDaysText(subscription.daysUntilRenewal)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {isHighlighted && !isHighlightFading && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className={`mt-4 p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl border border-blue-200/50 dark:border-blue-700/50 ${getInfoFadeStyle()}`}
                        >
                          <div className="flex items-center space-x-2 text-blue-700 dark:text-blue-300">
                            <Bell className="w-4 h-4" />
                            <span className="text-sm font-medium">This subscription was mentioned in your notification</span>
                          </div>
                          <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
                            You can manage this subscription from the Subscriptions page or set up custom reminders here.
                          </p>
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettingsModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setShowSettingsModal(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-md mx-auto border border-gray-200/50 dark:border-gray-700/50"
              >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200/50 dark:border-gray-700/50">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Reminder Settings</h3>
                  <button onClick={() => setShowSettingsModal(false)} className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">30 Days Before</label>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Email every 5 days (30, 25, 20, 15, 10 days before)</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={reminderSettings.reminder_30_days}
                        onChange={(e) => setReminderSettings((prev) => ({ ...prev, reminder_30_days: e.target.checked }))}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">7 Days Before</label>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Email every 2-3 days (7, 5, 3, 2 days before)</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={reminderSettings.reminder_7_days}
                        onChange={(e) => setReminderSettings((prev) => ({ ...prev, reminder_7_days: e.target.checked }))}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">1 Day Before</label>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Morning and evening reminders</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={reminderSettings.reminder_1_day}
                        onChange={(e) => setReminderSettings((prev) => ({ ...prev, reminder_1_day: e.target.checked }))}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                    </div>
                  </div>

                  <div className="bg-gray-50/50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200/50 dark:border-gray-600/50">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Email Schedule:</h4>
                    <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                      <li>• 30-day reminders: Every 5 days for planning ahead</li>
                      <li>• 7-day reminders: Every 2-3 days for preparation</li>
                      <li>• 1-day reminders: Morning (9 AM) and evening (6 PM)</li>
                      <li>• Due today: Morning reminder (10 AM)</li>
                    </ul>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end space-x-3 px-6 py-4 bg-gray-50/50 dark:bg-gray-700/50 rounded-b-2xl border-t border-gray-200/50 dark:border-gray-700/50">
                  <button onClick={() => setShowSettingsModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-500 dark:hover:text-gray-400 transition-colors">
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveSettings}
                    disabled={settingsSaving}
                    className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-lg hover:shadow-xl disabled:opacity-60"
                  >
                    {settingsSaving ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </Layout>
  );
};