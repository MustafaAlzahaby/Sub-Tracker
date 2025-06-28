import React from 'react';
import { DollarSign, CreditCard, Calendar, TrendingUp, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Subscription } from '../../hooks/useSubscriptions';
import { format, isAfter, isBefore, addDays, differenceInDays } from 'date-fns';

interface StatsCardsProps {
  subscriptions: Subscription[];
  loading?: boolean;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ subscriptions, loading = false }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 animate-pulse">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
              <div className="ml-4 flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active');
  
  // Calculate monthly spending (convert yearly to monthly)
  const monthlySpending = activeSubscriptions.reduce((total, sub) => {
    return total + (sub.billing_cycle === 'monthly' ? sub.cost : sub.cost / 12);
  }, 0);

  const yearlySpending = activeSubscriptions.reduce((total, sub) => {
    return total + (sub.billing_cycle === 'yearly' ? sub.cost : sub.cost * 12);
  }, 0);

  // Find upcoming renewals (next 7 days)
  const upcomingRenewals = activeSubscriptions.filter(sub => {
    const renewalDate = new Date(sub.next_renewal);
    const nextWeek = addDays(new Date(), 7);
    const today = new Date();
    return isAfter(renewalDate, today) && isBefore(renewalDate, nextWeek);
  });

  // Find overdue subscriptions
  const overdueSubscriptions = activeSubscriptions.filter(sub => {
    const renewalDate = new Date(sub.next_renewal);
    const today = new Date();
    return isBefore(renewalDate, today);
  });

  // Calculate savings from cancelled subscriptions
  const cancelledSubscriptions = subscriptions.filter(sub => sub.status === 'cancelled');
  const monthlySavings = cancelledSubscriptions.reduce((total, sub) => {
    return total + (sub.billing_cycle === 'monthly' ? sub.cost : sub.cost / 12);
  }, 0);

  const stats = [
    {
      name: 'Monthly Spending',
      value: `$${monthlySpending.toFixed(2)}`,
      icon: DollarSign,
      color: 'from-emerald-500 to-green-600',
      change: monthlySavings > 0 ? `-$${monthlySavings.toFixed(2)} saved` : 'Track your spending',
      changeType: monthlySavings > 0 ? 'positive' : 'neutral' as const,
      description: `${activeSubscriptions.length} active subscriptions`
    },
    {
      name: 'Active Subscriptions',
      value: activeSubscriptions.length.toString(),
      icon: CreditCard,
      color: 'from-blue-500 to-indigo-600',
      change: cancelledSubscriptions.length > 0 ? `${cancelledSubscriptions.length} cancelled` : 'All subscriptions',
      changeType: 'neutral' as const,
      description: `Total: ${subscriptions.length} subscriptions`
    },
    {
      name: 'Yearly Spending',
      value: `$${yearlySpending.toFixed(2)}`,
      icon: TrendingUp,
      color: 'from-purple-500 to-pink-600',
      change: `$${(yearlySpending / 12).toFixed(2)}/month avg`,
      changeType: 'neutral' as const,
      description: 'Annual subscription cost'
    },
    {
      name: 'Upcoming Renewals',
      value: upcomingRenewals.length.toString(),
      icon: overdueSubscriptions.length > 0 ? AlertTriangle : Calendar,
      color: overdueSubscriptions.length > 0 ? 'from-red-500 to-red-600' : 'from-orange-500 to-amber-600',
      change: overdueSubscriptions.length > 0 
        ? `${overdueSubscriptions.length} overdue!` 
        : upcomingRenewals.length > 0 
        ? 'Next 7 days' 
        : 'None this week',
      changeType: overdueSubscriptions.length > 0 ? 'negative' : 'neutral' as const,
      description: overdueSubscriptions.length > 0 ? 'Check overdue subscriptions' : 'Renewal reminders'
    }
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((item, index) => (
        <motion.div
          key={item.name}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl pt-5 px-4 pb-12 sm:pt-6 sm:px-6 shadow-xl rounded-2xl overflow-hidden border border-gray-200/50 dark:border-gray-700/50 hover:shadow-2xl transition-all duration-300"
        >
          <dt>
            <div className={`absolute bg-gradient-to-r ${item.color} rounded-xl p-3 shadow-lg`}>
              <item.icon className="h-6 w-6 text-white" aria-hidden="true" />
            </div>
            <p className="ml-16 text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
              {item.name}
            </p>
          </dt>
          <dd className="ml-16 pb-6 flex items-baseline sm:pb-7">
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">
              {item.value}
            </p>
            <div className="ml-2 flex flex-col">
              <p className={`text-sm font-semibold ${
                item.changeType === 'positive' 
                  ? 'text-emerald-600 dark:text-emerald-400' 
                  : item.changeType === 'negative'
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`}>
                {item.change}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {item.description}
              </p>
            </div>
          </dd>
        </motion.div>
      ))}
    </div>
  );
};