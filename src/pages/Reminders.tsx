import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { Layout } from '../components/Layout/Layout';
import { useSubscriptions } from '../hooks/useSubscriptions';
import { Bell, Calendar, Clock, CheckCircle, AlertCircle, Settings, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, differenceInDays, addDays, isBefore, isAfter } from 'date-fns';
import toast from 'react-hot-toast';

export const Reminders: React.FC = () => {
  const { subscriptions, loading } = useSubscriptions();
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get('highlight');
  const [highlightedSubscription, setHighlightedSubscription] = useState<string | null>(highlightId);
  
  const [reminderSettings, setReminderSettings] = useState({
    enabled: true,
    email30Days: true,
    email7Days: true,
    email1Day: true,
    emailTime: '09:00'
  });
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Clear highlight after 3 seconds
  useEffect(() => {
    if (highlightedSubscription) {
      const timer = setTimeout(() => {
        setHighlightedSubscription(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [highlightedSubscription]);

  // Scroll to highlighted subscription
  useEffect(() => {
    if (highlightedSubscription) {
      const element = document.getElementById(`subscription-${highlightedSubscription}`);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
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

    return {
      upcomingRenewals,
      overdueRenewals,
      urgentRenewals,
      warningRenewals,
      normalRenewals
    };
  }, [subscriptions]);

  const getUrgencyStyle = (urgency: string) => {
    switch (urgency) {
      case 'overdue':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-800';
      case 'urgent':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400 border-orange-200 dark:border-orange-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800';
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'overdue':
        return AlertCircle;
      case 'urgent':
        return Clock;
      case 'warning':
        return Bell;
      default:
        return Calendar;
    }
  };

  const formatDaysText = (days: number) => {
    if (days < 0) return `${Math.abs(days)} days overdue`;
    if (days === 0) return 'Due today';
    if (days === 1) return 'Due tomorrow';
    return `${days} days remaining`;
  };

  const handleSaveSettings = () => {
    setShowSettingsModal(false);
    toast.success('Reminder settings saved successfully!');
  };

  const getHighlightStyle = (subscriptionId: string) => {
    if (highlightedSubscription === subscriptionId) {
      return 'ring-4 ring-blue-500 ring-opacity-50 bg-blue-50/50 dark:bg-blue-900/20 shadow-2xl transform scale-[1.02]';
    }
    return '';
  };

  if (loading) {
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
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                Renewal Reminders
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Stay on top of your subscription renewals and never miss a payment
                {highlightedSubscription && (
                  <span className="block text-blue-600 dark:text-blue-400 text-sm mt-1">
                    📍 Showing details for your notification
                  </span>
                )}
              </p>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowSettingsModal(true)}
              className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg mt-4 sm:mt-0"
            >
              <Settings className="w-4 h-4 mr-2" />
              Reminder Settings
            </motion.button>
          </motion.div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                title: 'Overdue',
                count: reminderData.overdueRenewals.length,
                color: 'from-red-500 to-red-600',
                icon: AlertCircle
              },
              {
                title: 'Due Soon (1-2 days)',
                count: reminderData.urgentRenewals.length,
                color: 'from-orange-500 to-orange-600',
                icon: Clock
              },
              {
                title: 'This Week',
                count: reminderData.warningRenewals.length,
                color: 'from-yellow-500 to-yellow-600',
                icon: Bell
              },
              {
                title: 'Future',
                count: reminderData.normalRenewals.length,
                color: 'from-blue-500 to-blue-600',
                icon: Calendar
              }
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
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {card.title}
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                      {card.count}
                    </p>
                  </div>
                  <div className={`w-12 h-12 bg-gradient-to-r ${card.color} rounded-xl flex items-center justify-center shadow-lg`}>
                    <card.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Upcoming Renewals List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-gray-200/50 dark:border-gray-700/50">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                All Upcoming Renewals
              </h3>
            </div>
            
            <div className="divide-y divide-gray-200/50 dark:divide-gray-700/50 max-h-96 overflow-y-auto">
              {reminderData.upcomingRenewals.length === 0 ? (
                <div className="p-12 text-center">
                  <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                    No upcoming renewals
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    All your subscriptions are up to date!
                  </p>
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
                      className={`p-6 hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-all duration-300 ${getHighlightStyle(subscription.id)}`}
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
                              {isHighlighted && (
                                <motion.span
                                  initial={{ opacity: 0, scale: 0 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
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
                      
                      {isHighlighted && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-4 p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl border border-blue-200/50 dark:border-blue-700/50"
                        >
                          <div className="flex items-center space-x-2 text-blue-700 dark:text-blue-300">
                            <Bell className="w-4 h-4" />
                            <span className="text-sm font-medium">
                              This subscription was mentioned in your notification
                            </span>
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
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Reminder Settings
                  </h3>
                  <button
                    onClick={() => setShowSettingsModal(false)}
                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Email Reminders
                      </label>
                      <input
                        type="checkbox"
                        checked={reminderSettings.enabled}
                        onChange={(e) => setReminderSettings(prev => ({ ...prev, enabled: e.target.checked }))}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        30 Days Before
                      </label>
                      <input
                        type="checkbox"
                        checked={reminderSettings.email30Days}
                        onChange={(e) => setReminderSettings(prev => ({ ...prev, email30Days: e.target.checked }))}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        7 Days Before
                      </label>
                      <input
                        type="checkbox"
                        checked={reminderSettings.email7Days}
                        onChange={(e) => setReminderSettings(prev => ({ ...prev, email7Days: e.target.checked }))}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        1 Day Before
                      </label>
                      <input
                        type="checkbox"
                        checked={reminderSettings.email1Day}
                        onChange={(e) => setReminderSettings(prev => ({ ...prev, email1Day: e.target.checked }))}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Preferred Email Time
                    </label>
                    <input
                      type="time"
                      value={reminderSettings.emailTime}
                      onChange={(e) => setReminderSettings(prev => ({ ...prev, emailTime: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-100/60 dark:bg-gray-700/60 border border-gray-200/50 dark:border-gray-600/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white backdrop-blur-sm"
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end space-x-3 px-6 py-4 bg-gray-50/50 dark:bg-gray-700/50 rounded-b-2xl border-t border-gray-200/50 dark:border-gray-700/50">
                  <button
                    onClick={() => setShowSettingsModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-500 dark:hover:text-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveSettings}
                    className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-lg hover:shadow-xl"
                  >
                    Save Settings
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