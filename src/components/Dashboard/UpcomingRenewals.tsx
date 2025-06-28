import React from 'react';
import { Calendar, AlertCircle, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';
import { Subscription } from '../../hooks/useSubscriptions';
import { format, isAfter, isBefore, addDays, differenceInDays } from 'date-fns';

interface UpcomingRenewalsProps {
  subscriptions: Subscription[];
}

export const UpcomingRenewals: React.FC<UpcomingRenewalsProps> = ({ subscriptions }) => {
  const upcomingRenewals = subscriptions
    .filter(sub => {
      if (sub.status !== 'active') return false;
      const renewalDate = new Date(sub.next_renewal);
      const nextMonth = addDays(new Date(), 30);
      return isAfter(renewalDate, new Date()) && isBefore(renewalDate, nextMonth);
    })
    .sort((a, b) => new Date(a.next_renewal).getTime() - new Date(b.next_renewal).getTime())
    .slice(0, 5);

  const getUrgencyColor = (renewalDate: string) => {
    const days = differenceInDays(new Date(renewalDate), new Date());
    if (days <= 3) return 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400';
    if (days <= 7) return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400';
    return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400';
  };

  if (upcomingRenewals.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Upcoming Renewals
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Next 30 days
          </p>
        </div>
        <div className="p-6 text-center">
          <Calendar className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            No upcoming renewals
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            You're all set for the next 30 days!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Upcoming Renewals
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Next 30 days
            </p>
          </div>
          <AlertCircle className="h-5 w-5 text-orange-500" />
        </div>
      </div>
      
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {upcomingRenewals.map((subscription, index) => {
          const daysUntilRenewal = differenceInDays(new Date(subscription.next_renewal), new Date());
          
          return (
            <motion.div
              key={subscription.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {subscription.service_name.charAt(0)}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {subscription.service_name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {subscription.category.charAt(0).toUpperCase() + subscription.category.slice(1)}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      ${subscription.cost.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {subscription.billing_cycle}
                    </p>
                  </div>
                  
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${getUrgencyColor(subscription.next_renewal)}`}>
                    {daysUntilRenewal === 0 
                      ? 'Today'
                      : daysUntilRenewal === 1 
                      ? 'Tomorrow'
                      : `${daysUntilRenewal} days`
                    }
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};