import React, { useState, useMemo } from 'react';
import { Layout } from '../components/Layout/Layout';
import { useSubscriptions } from '../hooks/useSubscriptions';
import { Download, FileText, Calendar, DollarSign, TrendingUp, Filter, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { format, startOfMonth, endOfMonth, subMonths, isWithinInterval } from 'date-fns';
import toast from 'react-hot-toast';

export const Reports: React.FC = () => {
  const { subscriptions, loading } = useSubscriptions();
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const reportData = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    switch (selectedPeriod) {
      case 'month':
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case 'quarter':
        startDate = subMonths(now, 3);
        break;
      case 'year':
        startDate = subMonths(now, 12);
        break;
      default:
        startDate = startOfMonth(now);
    }

    const filteredSubscriptions = subscriptions.filter(sub => {
      const categoryMatch = selectedCategory === 'all' || sub.category === selectedCategory;
      const dateMatch = isWithinInterval(new Date(sub.created_at), { start: startDate, end: endDate });
      return categoryMatch && dateMatch;
    });

    const activeSubscriptions = filteredSubscriptions.filter(sub => sub.status === 'active');
    const cancelledSubscriptions = filteredSubscriptions.filter(sub => sub.status === 'cancelled');

    const totalSpending = activeSubscriptions.reduce((total, sub) => {
      return total + (sub.billing_cycle === 'monthly' ? sub.cost : sub.cost / 12);
    }, 0);

    const categoryBreakdown = activeSubscriptions.reduce((acc, sub) => {
      const monthlyCost = sub.billing_cycle === 'monthly' ? sub.cost : sub.cost / 12;
      acc[sub.category] = (acc[sub.category] || 0) + monthlyCost;
      return acc;
    }, {} as Record<string, number>);

    const savings = cancelledSubscriptions.reduce((total, sub) => {
      return total + (sub.billing_cycle === 'monthly' ? sub.cost : sub.cost / 12);
    }, 0);

    return {
      filteredSubscriptions,
      activeSubscriptions,
      cancelledSubscriptions,
      totalSpending,
      categoryBreakdown,
      savings,
      period: selectedPeriod,
      startDate,
      endDate
    };
  }, [subscriptions, selectedPeriod, selectedCategory]);

  const exportToCSV = () => {
    const headers = ['Service Name', 'Cost', 'Billing Cycle', 'Category', 'Status', 'Next Renewal', 'Notes'];
    const csvContent = [
      headers.join(','),
      ...reportData.filteredSubscriptions.map(sub => [
        `"${sub.service_name}"`,
        sub.cost,
        sub.billing_cycle,
        sub.category,
        sub.status,
        sub.next_renewal,
        `"${sub.notes || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subscriptions-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Report exported successfully!');
  };

  const generatePDFReport = () => {
    // Create a printable version
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>SubTracker Report - ${format(new Date(), 'yyyy-MM-dd')}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
              .card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; }
              table { width: 100%; border-collapse: collapse; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f5f5f5; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>SubTracker Report</h1>
              <p>Generated on ${format(new Date(), 'MMMM dd, yyyy')}</p>
            </div>
            <div class="summary">
              <div class="card">
                <h3>Total Spending</h3>
                <p>$${reportData.totalSpending.toFixed(2)}</p>
              </div>
              <div class="card">
                <h3>Active Subscriptions</h3>
                <p>${reportData.activeSubscriptions.length}</p>
              </div>
              <div class="card">
                <h3>Money Saved</h3>
                <p>$${reportData.savings.toFixed(2)}</p>
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Cost</th>
                  <th>Cycle</th>
                  <th>Category</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${reportData.filteredSubscriptions.map(sub => `
                  <tr>
                    <td>${sub.service_name}</td>
                    <td>$${sub.cost.toFixed(2)}</td>
                    <td>${sub.billing_cycle}</td>
                    <td>${sub.category}</td>
                    <td>${sub.status}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
    toast.success('Print dialog opened!');
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
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
                Reports & Export
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Generate detailed reports and export your subscription data
              </p>
            </div>
            
            <div className="flex space-x-3 mt-4 sm:mt-0">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={exportToCSV}
                className="flex items-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl font-medium hover:from-emerald-600 hover:to-green-700 transition-all shadow-lg"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={generatePDFReport}
                className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg"
              >
                <FileText className="w-4 h-4 mr-2" />
                Print Report
              </motion.button>
            </div>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <span className="font-medium text-gray-900 dark:text-white">Report Filters</span>
              </div>
              
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value as any)}
                  className="px-4 py-2 bg-gray-100/60 dark:bg-gray-700/60 border border-gray-200/50 dark:border-gray-600/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white backdrop-blur-sm"
                >
                  <option value="month">This Month</option>
                  <option value="quarter">Last 3 Months</option>
                  <option value="year">Last 12 Months</option>
                </select>
                
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 bg-gray-100/60 dark:bg-gray-700/60 border border-gray-200/50 dark:border-gray-600/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white backdrop-blur-sm"
                >
                  <option value="all">All Categories</option>
                  <option value="software">Software</option>
                  <option value="marketing">Marketing</option>
                  <option value="finance">Finance</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </motion.div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                title: 'Total Spending',
                value: `$${reportData.totalSpending.toFixed(2)}`,
                subtitle: `${reportData.period} period`,
                icon: DollarSign,
                color: 'from-emerald-500 to-green-600'
              },
              {
                title: 'Active Subscriptions',
                value: reportData.activeSubscriptions.length.toString(),
                subtitle: 'currently active',
                icon: TrendingUp,
                color: 'from-blue-500 to-indigo-600'
              },
              {
                title: 'Money Saved',
                value: `$${reportData.savings.toFixed(2)}`,
                subtitle: 'from cancellations',
                icon: BarChart3,
                color: 'from-purple-500 to-pink-600'
              },
              {
                title: 'Report Period',
                value: format(reportData.startDate, 'MMM dd'),
                subtitle: `to ${format(reportData.endDate, 'MMM dd')}`,
                icon: Calendar,
                color: 'from-orange-500 to-red-600'
              }
            ].map((card, index) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {card.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                      {card.value}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {card.subtitle}
                    </p>
                  </div>
                  <div className={`w-12 h-12 bg-gradient-to-r ${card.color} rounded-xl flex items-center justify-center shadow-lg`}>
                    <card.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Category Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              Spending Breakdown by Category
            </h3>
            <div className="space-y-4">
              {Object.entries(reportData.categoryBreakdown).map(([category, amount]) => {
                const percentage = reportData.totalSpending > 0 ? (amount / reportData.totalSpending) * 100 : 0;
                return (
                  <div key={category} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900 dark:text-white capitalize">
                        {category}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        ${amount.toFixed(2)} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className="bg-gradient-to-r from-emerald-500 to-blue-600 h-2 rounded-full"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Detailed Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-gray-200/50 dark:border-gray-700/50">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Detailed Subscription List
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Service
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Cost
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Cycle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/50 dark:divide-gray-700/50">
                  {reportData.filteredSubscriptions.map((subscription) => (
                    <tr key={subscription.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-lg flex items-center justify-center mr-3">
                            <span className="text-white font-semibold text-sm">
                              {subscription.service_name.charAt(0)}
                            </span>
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {subscription.service_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">
                        ${subscription.cost.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-400 capitalize">
                        {subscription.billing_cycle}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-400 capitalize">
                        {subscription.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          subscription.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                        }`}>
                          {subscription.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};