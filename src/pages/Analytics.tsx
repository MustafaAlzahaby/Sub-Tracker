import React, { useMemo } from 'react';
import { Layout } from '../components/Layout/Layout';
import { useSubscriptions } from '../hooks/useSubscriptions';
import { useUserPlan } from '../hooks/useUserPlan';
import { FeatureGate } from '../components/PlanGating/FeatureGate';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, Area, AreaChart } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Target, Activity, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { format, subMonths, startOfMonth, endOfMonth, parseISO } from 'date-fns';

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#84cc16', '#f97316'];

export const Analytics: React.FC = () => {
  const { subscriptions, loading } = useSubscriptions();
  const { userPlan, loading: planLoading, checkFeatureAccess } = useUserPlan();

  // Wait for both subscriptions and user plan to load
  const isLoading = loading || planLoading;

  // Check access only after plan is loaded
  const hasAnalyticsAccess = userPlan ? checkFeatureAccess('analytics') : false;

  const analyticsData = useMemo(() => {
    const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active');
    
    // Limit data for free users
    const dataLimit = userPlan?.plan_type === 'free' ? 3 : 12;
    
    // Monthly spending trend
    const monthlyTrend = [];
    for (let i = dataLimit - 1; i >= 0; i--) {
      const monthDate = subMonths(new Date(), i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      
      const monthlySpending = activeSubscriptions.reduce((total, sub) => {
        const createdDate = new Date(sub.created_at);
        if (createdDate <= monthEnd) {
          return total + (sub.billing_cycle === 'monthly' ? sub.cost : sub.cost / 12);
        }
        return total;
      }, 0);

      monthlyTrend.push({
        month: format(monthDate, 'MMM yyyy'),
        spending: parseFloat(monthlySpending.toFixed(2)),
        subscriptions: activeSubscriptions.filter(sub => new Date(sub.created_at) <= monthEnd).length
      });
    }

    // Category breakdown
    const categoryData = activeSubscriptions.reduce((acc, sub) => {
      const monthlyCost = sub.billing_cycle === 'monthly' ? sub.cost : sub.cost / 12;
      acc[sub.category] = (acc[sub.category] || 0) + monthlyCost;
      return acc;
    }, {} as Record<string, number>);

    const categoryChart = Object.entries(categoryData).map(([category, value]) => ({
      name: category.charAt(0).toUpperCase() + category.slice(1),
      value: parseFloat(value.toFixed(2)),
      count: activeSubscriptions.filter(sub => sub.category === category).length
    }));

    // Billing cycle distribution
    const billingCycleData = activeSubscriptions.reduce((acc, sub) => {
      acc[sub.billing_cycle] = (acc[sub.billing_cycle] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const billingChart = Object.entries(billingCycleData).map(([cycle, count]) => ({
      name: cycle.charAt(0).toUpperCase() + cycle.slice(1),
      value: count
    }));

    // Top expensive subscriptions (limited for free users)
    const topLimit = userPlan?.plan_type === 'free' ? 3 : 5;
    const topSubscriptions = [...activeSubscriptions]
      .sort((a, b) => {
        const aMonthlyCost = a.billing_cycle === 'monthly' ? a.cost : a.cost / 12;
        const bMonthlyCost = b.billing_cycle === 'monthly' ? b.cost : b.cost / 12;
        return bMonthlyCost - aMonthlyCost;
      })
      .slice(0, topLimit)
      .map(sub => ({
        name: sub.service_name,
        monthlyCost: sub.billing_cycle === 'monthly' ? sub.cost : sub.cost / 12,
        totalCost: sub.cost,
        cycle: sub.billing_cycle
      }));

    return {
      monthlyTrend,
      categoryChart,
      billingChart,
      topSubscriptions
    };
  }, [subscriptions, userPlan]);

  const totalMonthlySpending = useMemo(() => {
    return subscriptions
      .filter(sub => sub.status === 'active')
      .reduce((total, sub) => {
        return total + (sub.billing_cycle === 'monthly' ? sub.cost : sub.cost / 12);
      }, 0);
  }, [subscriptions]);

  const totalYearlySpending = useMemo(() => {
    return subscriptions
      .filter(sub => sub.status === 'active')
      .reduce((total, sub) => {
        return total + (sub.billing_cycle === 'yearly' ? sub.cost : sub.cost * 12);
      }, 0);
  }, [subscriptions]);

  const averagePerService = useMemo(() => {
    const activeCount = subscriptions.filter(s => s.status === 'active').length;
    return activeCount > 0 ? totalMonthlySpending / activeCount : 0;
  }, [subscriptions, totalMonthlySpending]);

  // Show loading state while data is being fetched
  if (isLoading) {
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-80 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const LimitedAnalyticsView = () => (
    <div className="space-y-8">
      {/* Basic Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            title: 'Monthly Spending',
            value: `$${totalMonthlySpending.toFixed(2)}`,
            icon: DollarSign,
            color: 'from-emerald-500 to-green-600'
          },
          {
            title: 'Active Services',
            value: subscriptions.filter(s => s.status === 'active').length.toString(),
            icon: Target,
            color: 'from-blue-500 to-indigo-600'
          },
          {
            title: 'Avg per Service',
            value: `$${averagePerService.toFixed(2)}`,
            icon: Activity,
            color: 'from-purple-500 to-pink-600'
          }
        ].map((metric, index) => (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {metric.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {metric.value}
                </p>
              </div>
              <div className={`w-12 h-12 bg-gradient-to-r ${metric.color} rounded-xl flex items-center justify-center shadow-lg`}>
                <metric.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Limited Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Spending Trend (Last 3 Months)
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={analyticsData.monthlyTrend}>
            <defs>
              <linearGradient id="spendingGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="month" 
              className="text-gray-600 dark:text-gray-400"
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              className="text-gray-600 dark:text-gray-400"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: 'none',
                borderRadius: '12px',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Area 
              type="monotone" 
              dataKey="spending" 
              stroke="#10b981" 
              strokeWidth={3}
              fill="url(#spendingGradient)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );

  return (
    <Layout onAddSubscription={() => window.location.href = '/subscriptions'}>
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
                Analytics Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                {hasAnalyticsAccess 
                  ? 'Deep insights into your subscription spending patterns and trends'
                  : 'Basic analytics - upgrade for advanced insights'
                }
              </p>
            </div>
          </motion.div>

          {/* Content based on plan - NO FLASHING */}
          {hasAnalyticsAccess ? (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  {
                    title: 'Monthly Spending',
                    value: `$${totalMonthlySpending.toFixed(2)}`,
                    icon: DollarSign,
                    color: 'from-emerald-500 to-green-600',
                    change: '+12%',
                    trend: 'up'
                  },
                  {
                    title: 'Yearly Projection',
                    value: `$${totalYearlySpending.toFixed(2)}`,
                    icon: TrendingUp,
                    color: 'from-blue-500 to-indigo-600',
                    change: '+8%',
                    trend: 'up'
                  },
                  {
                    title: 'Active Services',
                    value: subscriptions.filter(s => s.status === 'active').length.toString(),
                    icon: Target,
                    color: 'from-purple-500 to-pink-600',
                    change: '+3',
                    trend: 'up'
                  },
                  {
                    title: 'Avg per Service',
                    value: `$${averagePerService.toFixed(2)}`,
                    icon: Activity,
                    color: 'from-orange-500 to-red-600',
                    change: '+5%',
                    trend: 'up'
                  }
                ].map((metric, index) => (
                  <motion.div
                    key={metric.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 hover:shadow-2xl transition-all duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {metric.title}
                        </p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                          {metric.value}
                        </p>
                        <div className="flex items-center mt-2">
                          {metric.trend === 'up' ? (
                            <TrendingUp className="w-4 h-4 text-emerald-500 mr-1" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                          )}
                          <p className="text-sm text-emerald-600 dark:text-emerald-400">
                            {metric.change} from last month
                          </p>
                        </div>
                      </div>
                      <div className={`w-12 h-12 bg-gradient-to-r ${metric.color} rounded-xl flex items-center justify-center shadow-lg`}>
                        <metric.icon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Monthly Spending Trend */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50"
                >
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Spending Trend (12 Months)
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={analyticsData.monthlyTrend}>
                      <defs>
                        <linearGradient id="spendingGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis 
                        dataKey="month" 
                        className="text-gray-600 dark:text-gray-400"
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        className="text-gray-600 dark:text-gray-400"
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `$${value}`}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: 'none',
                          borderRadius: '12px',
                          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="spending" 
                        stroke="#10b981" 
                        strokeWidth={3}
                        fill="url(#spendingGradient)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </motion.div>

                {/* Category Breakdown */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50"
                >
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Spending by Category
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analyticsData.categoryChart}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {analyticsData.categoryChart.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: 'none',
                          borderRadius: '12px',
                          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </motion.div>

                {/* Billing Cycle Distribution */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50"
                >
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Billing Cycle Distribution
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analyticsData.billingChart}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis 
                        dataKey="name" 
                        className="text-gray-600 dark:text-gray-400"
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        className="text-gray-600 dark:text-gray-400"
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: 'none',
                          borderRadius: '12px',
                          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Bar 
                        dataKey="value" 
                        fill="url(#barGradient)" 
                        radius={[8, 8, 0, 0]}
                      />
                      <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#8b5cf6" />
                          <stop offset="100%" stopColor="#ec4899" />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                </motion.div>

                {/* Top Subscriptions */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50"
                >
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Most Expensive Subscriptions
                  </h3>
                  <div className="space-y-4">
                    {analyticsData.topSubscriptions.map((sub, index) => (
                      <div key={sub.name} className="flex items-center justify-between p-3 bg-gray-50/50 dark:bg-gray-700/50 rounded-xl">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              {sub.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {sub.name}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {sub.cycle}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900 dark:text-white">
                            ${sub.monthlyCost.toFixed(2)}/mo
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            ${sub.totalCost.toFixed(2)} total
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </>
          ) : (
            <FeatureGate feature="Advanced Analytics">
              <LimitedAnalyticsView />
            </FeatureGate>
          )}
        </div>
      </div>
    </Layout>
  );
};