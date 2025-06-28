import React, { useState, useMemo } from 'react';
import { Plus, Filter, Edit, Trash2, Calendar, DollarSign, Sparkles, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { Subscription } from '../../hooks/useSubscriptions';
import { format } from 'date-fns';

interface SubscriptionListProps {
  subscriptions: Subscription[];
  onEdit: (subscription: Subscription) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}

export const SubscriptionList: React.FC<SubscriptionListProps> = ({
  subscriptions,
  onEdit,
  onDelete,
  onAdd
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'cancelled'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'software' | 'marketing' | 'finance' | 'other'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'cost' | 'renewal'>('name');

  const filteredAndSortedSubscriptions = useMemo(() => {
    let filtered = subscriptions.filter(sub => {
      const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
      const matchesCategory = categoryFilter === 'all' || sub.category === categoryFilter;
      
      return matchesStatus && matchesCategory;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.service_name.localeCompare(b.service_name);
        case 'cost':
          return b.cost - a.cost;
        case 'renewal':
          return new Date(a.next_renewal).getTime() - new Date(b.next_renewal).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [subscriptions, statusFilter, categoryFilter, sortBy]);

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 text-xs font-semibold rounded-full";
    return status === 'active' 
      ? `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400`
      : `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400`;
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      software: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      marketing: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
      finance: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      other: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    };
    return colors[category as keyof typeof colors] || colors.other;
  };

  // Calculate stats for the modern header
  const totalMonthlySpending = filteredAndSortedSubscriptions
    .filter(sub => sub.status === 'active')
    .reduce((total, sub) => total + (sub.billing_cycle === 'monthly' ? sub.cost : sub.cost / 12), 0);

  const activeCount = filteredAndSortedSubscriptions.filter(sub => sub.status === 'active').length;

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
      {/* Modern Header with Stats */}
      <div className="px-6 py-6 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-gray-50/50 to-white/50 dark:from-gray-800/50 dark:to-gray-900/50 rounded-t-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Title and Stats */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6">
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                Subscriptions
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                Manage your recurring payments
              </p>
            </div>
            
            {/* Live Stats */}
            <div className="flex items-center space-x-4 mt-3 sm:mt-0">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-xl border border-emerald-200/50 dark:border-emerald-700/50"
              >
                <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                  ${totalMonthlySpending.toFixed(2)}/mo
                </span>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200/50 dark:border-blue-700/50"
              >
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                  {activeCount} Active
                </span>
              </motion.div>
            </div>
          </div>
          
          {/* Add Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onAdd}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-600 text-white text-sm font-semibold rounded-xl hover:from-emerald-600 hover:via-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-lg hover:shadow-xl"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Subscription
          </motion.button>
        </div>

        {/* Modern Filters */}
        <div className="mt-6 flex flex-col sm:flex-row gap-4">
          {/* Status Filter */}
          <div className="flex-1">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-4 py-2.5 bg-white/60 dark:bg-gray-700/60 border border-gray-200/50 dark:border-gray-600/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white backdrop-blur-sm transition-all"
            >
              <option value="all">All Status</option>
              <option value="active">✅ Active</option>
              <option value="cancelled">❌ Cancelled</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex-1">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as any)}
              className="w-full px-4 py-2.5 bg-white/60 dark:bg-gray-700/60 border border-gray-200/50 dark:border-gray-600/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white backdrop-blur-sm transition-all"
            >
              <option value="all">All Categories</option>
              <option value="software">💻 Software</option>
              <option value="marketing">📈 Marketing</option>
              <option value="finance">💰 Finance</option>
              <option value="other">📦 Other</option>
            </select>
          </div>

          {/* Sort */}
          <div className="flex-1">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-4 py-2.5 bg-white/60 dark:bg-gray-700/60 border border-gray-200/50 dark:border-gray-600/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white backdrop-blur-sm transition-all"
            >
              <option value="name">🔤 Sort by Name</option>
              <option value="cost">💰 Sort by Cost</option>
              <option value="renewal">📅 Sort by Renewal</option>
            </select>
          </div>
        </div>
      </div>

      {/* Subscription List */}
      <div className="divide-y divide-gray-200/50 dark:divide-gray-700/50">
        {filteredAndSortedSubscriptions.length === 0 ? (
          <div className="p-12 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="w-20 h-20 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto">
                <Calendar className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                No subscriptions found
              </h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                {statusFilter !== 'all' || categoryFilter !== 'all' 
                  ? 'Try adjusting your filters to see more results'
                  : 'Start tracking your subscriptions to take control of your spending'
                }
              </p>
              {statusFilter === 'all' && categoryFilter === 'all' && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onAdd}
                  className="mt-6 inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-500 to-blue-600 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Subscription
                </motion.button>
              )}
            </motion.div>
          </div>
        ) : (
          filteredAndSortedSubscriptions.map((subscription, index) => (
            <motion.div
              key={subscription.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-6 hover:bg-gradient-to-r hover:from-gray-50/50 hover:to-white/50 dark:hover:from-gray-700/50 dark:hover:to-gray-800/50 transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 via-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <span className="text-white font-bold text-lg">
                        {subscription.service_name.charAt(0)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                        {subscription.service_name}
                      </h3>
                      <span className={getStatusBadge(subscription.status)}>
                        {subscription.status}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(subscription.category)}`}>
                        {subscription.category.charAt(0).toUpperCase() + subscription.category.slice(1)}
                      </span>
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {format(new Date(subscription.next_renewal), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <div className="flex items-center text-xl font-bold text-gray-900 dark:text-white">
                      <DollarSign className="w-5 h-5" />
                      {subscription.cost.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                      {subscription.billing_cycle}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => onEdit(subscription)}
                      className="p-2.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all"
                    >
                      <Edit className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => onDelete(subscription.id)}
                      className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              </div>

              {subscription.notes && (
                <div className="mt-4 ml-18">
                  <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50/50 dark:bg-gray-700/50 p-3 rounded-xl">
                    💭 {subscription.notes}
                  </p>
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};