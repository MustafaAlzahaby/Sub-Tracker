import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '../components/Layout/Layout';
import { useSubscriptions } from '../hooks/useSubscriptions';
import { Bell, Calendar, Clock, AlertCircle, Settings, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, differenceInDays } from 'date-fns';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { sendTestReminderEmail } from '../lib/email';


type ReminderSettings = {
  // email_enabled removed
  reminder_30_days: boolean;
  reminder_7_days: boolean;
  reminder_1_day: boolean;
  // email_time removed
};

const DEFAULT_SETTINGS: ReminderSettings = {
  reminder_30_days: true,
  reminder_7_days: true,
  reminder_1_day: true,
};

export const Reminders: React.FC = () => {
  const { subscriptions, loading } = useSubscriptions();
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get('highlight');

  const [highlightedSubscription, setHighlightedSubscription] = useState<string | null>(highlightId);
  const [isHighlightFading, setIsHighlightFading] = useState(false);
  const [isInfoFading, setIsInfoFading] = useState(false);
  const [showHeaderInfo, setShowHeaderInfo] = useState(!!highlightId);

  // NEW: only the three day-window toggles
  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>(DEFAULT_SETTINGS);
  const [settingsLoading, setSettingsLoading] = useState<boolean>(true);
  const [settingsSaving, setSettingsSaving] = useState<boolean>(false);

  // Load settings (reads whatever exists, ignores removed columns)
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
          .select('reminder_30_days, reminder_7_days, reminder_1_day') // removed email_enabled, email_time
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (error) throw error;

        if (!data) {
          // write defaults once
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
      } catch (e) {
        console.error(e);
        toast.error('Failed to load reminder settings.');
      } finally {
        setSettingsLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Save settings (only three toggles)
const handleSaveSettings = async () => {
  setSettingsSaving(true);
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      toast.error('You must be signed in.');
      setSettingsSaving(false);
      return;
    }

    // 1) Save settings (this updates updated_at which resets the month)
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

    toast.success('Reminder settings saved successfully!');
    setShowSettingsModal(false);

    // 2) Try to send (enforces monthly rate-limit)
    const toastId = 'send-test-email';
    toast.loading('Sending test email...', { id: toastId });

    const res = await sendTestReminderEmail(reminderSettings);

    if (res.sent) {
      toast.success(`Email sent for ${res.count} subscription(s).`, { id: toastId });
    } else if (res.reason === 'no_toggles_selected') {
      toast.dismiss(toastId);
      toast('No reminder window selected, so no email was sent.', { icon: 'ℹ️' });
    } else if (res.reason === 'no_matches') {
      toast.dismiss(toastId);
      toast('No subscriptions match your selected window today. No email sent.', { icon: 'ℹ️' });
    } else if (res.reason === 'rate_limited') {
      toast.dismiss(toastId);
      // @ts-ignore
      const when = res.nextAllowedAt ? new Date(res.nextAllowedAt).toLocaleString() : 'later';
      toast(`Monthly limit reached. You can receive the next reminder after ${when}.`, { icon: '⏳' });
    } else {
      toast.error('Saved, but no email sent.', { id: toastId });
    }
  } catch (e: any) {
    console.error(e);
    toast.error(e?.message || 'Saved, but failed to send the test email.');
  } finally {
    setSettingsSaving(false);
  }
};



  // highlight effects (unchanged)
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

  const [showSettingsModal, setShowSettingsModal] = useState(false);

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

          {/* Upcoming Renewals List (unchanged) */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
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

                {/* Content: only the three toggles */}
                <div className="p-6 space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">30 Days Before (Pro only)</label>
                      <input
                        type="checkbox"
                        checked={reminderSettings.reminder_30_days}
                        onChange={(e) => setReminderSettings((prev) => ({ ...prev, reminder_30_days: e.target.checked }))}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">7 Days Before</label>
                      <input
                        type="checkbox"
                        checked={reminderSettings.reminder_7_days}
                        onChange={(e) => setReminderSettings((prev) => ({ ...prev, reminder_7_days: e.target.checked }))}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">1 Day Before (Pro only)</label>
                      <input
                        type="checkbox"
                        checked={reminderSettings.reminder_1_day}
                        onChange={(e) => setReminderSettings((prev) => ({ ...prev, reminder_1_day: e.target.checked }))}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                    </div>
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
