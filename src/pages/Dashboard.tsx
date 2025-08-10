import React from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout/Layout';
import { StatsCards } from '../components/Dashboard/StatsCards';
import { SpendingChart } from '../components/Dashboard/SpendingChart';
import { UpcomingRenewals } from '../components/Dashboard/UpcomingRenewals';
import { useSubscriptions } from '../hooks/useSubscriptions';
import { Plus, TrendingUp, Calendar, DollarSign, Download, Bell } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { SubscriptionModal } from '../components/Subscriptions/SubscriptionModal';
import toast from 'react-hot-toast';

export const Dashboard: React.FC = () => {
  const { subscriptions, loading, addSubscription } = useSubscriptions();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddSubscription = () => {
    setIsModalOpen(true);
  };

  const handleExportData = () => {
    const csvContent = [
      ['Service Name', 'Cost', 'Billing Cycle', 'Category', 'Status', 'Next Renewal'],
      ...subscriptions.map(sub => [
        sub.service_name,
        sub.cost,
        sub.billing_cycle,
        sub.category,
        sub.status,
        sub.next_renewal
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subscriptions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Data exported successfully!');
  };

  const handleSubmitSubscription = async (data: any) => {
    await addSubscription(data);
    setIsModalOpen(false);
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout onAddSubscription={handleAddSubscription}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-between items-center"
          >
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                Dashboard Overview
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Welcome back! Here's your subscription overview and key metrics.
              </p>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <StatsCards subscriptions={subscriptions} />

          {/* Charts */}
          <SpendingChart subscriptions={subscriptions} />

          {/* Recent Activity & Upcoming Renewals */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <UpcomingRenewals subscriptions={subscriptions} />
            
            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50"
            >
              <div className="px-6 py-4 border-b border-gray-200/50 dark:border-gray-700/50">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Quick Actions
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Common tasks to manage your subscriptions
                </p>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleAddSubscription}
                    className="flex items-center p-4 bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-900/20 dark:to-blue-900/20 rounded-xl hover:from-emerald-100 hover:to-blue-100 dark:hover:from-emerald-900/30 dark:hover:to-blue-900/30 transition-all border border-emerald-200/50 dark:border-emerald-700/50"
                  >
                    <Plus className="w-6 h-6 text-emerald-600 dark:text-emerald-400 mr-3" />
                    <div className="text-left">
                      <div className="font-medium text-gray-900 dark:text-white">
                        Add Subscription
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Track a new service
                      </div>
                    </div>
                  </motion.button>

                  <Link to="/analytics">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl hover:from-blue-100 hover:to-purple-100 dark:hover:from-blue-900/30 dark:hover:to-purple-900/30 transition-all border border-blue-200/50 dark:border-blue-700/50 w-full"
                    >
                      <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-3" />
                      <div className="text-left">
                        <div className="font-medium text-gray-900 dark:text-white">
                          View Analytics
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Spending insights
                        </div>
                      </div>
                    </motion.button>
                  </Link>

                  <Link to="/reminders">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center p-4 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-xl hover:from-orange-100 hover:to-amber-100 dark:hover:from-orange-900/30 dark:hover:to-amber-900/30 transition-all border border-orange-200/50 dark:border-orange-700/50 w-full"
                    >
                      <Bell className="w-6 h-6 text-orange-600 dark:text-orange-400 mr-3" />
                      <div className="text-left">
                        <div className="font-medium text-gray-900 dark:text-white">
                          Set Reminders
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Never miss renewals
                        </div>
                      </div>
                    </motion.button>
                  </Link>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleExportData}
                    className="flex items-center p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-900/30 dark:hover:to-pink-900/30 transition-all border border-purple-200/50 dark:border-purple-700/50"
                  >
                    <Download className="w-6 h-6 text-purple-600 dark:text-purple-400 mr-3" />
                    <div className="text-left">
                      <div className="font-medium text-gray-900 dark:text-white">
                        Export Data
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Download reports
                      </div>
                    </div>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <SubscriptionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmitSubscription}
        subscription={null}
        mode="create"
      />
    </Layout>
  );
};