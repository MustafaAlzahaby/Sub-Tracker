import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Subscription } from '../../hooks/useSubscriptions';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

interface SpendingChartProps {
  subscriptions: Subscription[];
  loading?: boolean;
}

const COLORS = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#43e97b'];

export const SpendingChart: React.FC<SpendingChartProps> = ({ subscriptions, loading = false }) => {
  const chartData = useMemo(() => {
    const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active');

    // Category breakdown data (monthly equivalent)
    const categoryData = activeSubscriptions.reduce((acc, sub) => {
      const monthlyCost = sub.billing_cycle === 'monthly' ? sub.cost : sub.cost / 12;
      acc[sub.category] = (acc[sub.category] || 0) + monthlyCost;
      return acc;
    }, {} as Record<string, number>);

    const pieData = Object.entries(categoryData).map(([category, value]) => ({
      name: category.charAt(0).toUpperCase() + category.slice(1),
      value: parseFloat(value.toFixed(2)),
      count: activeSubscriptions.filter(sub => sub.category === category).length
    }));

    // Monthly spending trend (last 6 months)
    const monthlyTrendData = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(new Date(), i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      
      // Calculate spending for subscriptions that were active during this month
      const monthlySpending = activeSubscriptions.reduce((total, sub) => {
        const createdDate = new Date(sub.created_at);
        const renewalDate = new Date(sub.next_renewal);
        
        // Check if subscription was active during this month
        const wasActiveInMonth = createdDate <= monthEnd && 
          (sub.status === 'active' || renewalDate >= monthStart);
        
        if (wasActiveInMonth) {
          return total + (sub.billing_cycle === 'monthly' ? sub.cost : sub.cost / 12);
        }
        return total;
      }, 0);

      monthlyTrendData.push({
        month: format(monthDate, 'MMM'),
        spending: parseFloat(monthlySpending.toFixed(2)),
        fullMonth: format(monthDate, 'MMMM yyyy')
      });
    }

    return { pieData, monthlyTrendData };
  }, [subscriptions]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(2)].map((_, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 animate-pulse">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
            <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (subscriptions.length === 0) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Monthly Spending Trend
          </h3>
          <div className="flex items-center justify-center h-80 text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <BarChart className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No data available</p>
              <p className="text-sm">Add subscriptions to see trends</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Spending by Category
          </h3>
          <div className="flex items-center justify-center h-80 text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <PieChart className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No data available</p>
              <p className="text-sm">Add subscriptions to see breakdown</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 dark:text-white">{`${label}`}</p>
          <p className="text-blue-600 dark:text-blue-400">
            {`Spending: $${payload[0].value}`}
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 dark:text-white">{data.name}</p>
          <p className="text-blue-600 dark:text-blue-400">
            Monthly: ${data.value}
          </p>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {data.count} subscription{data.count !== 1 ? 's' : ''}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Monthly Spending Trend */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Monthly Spending Trend
          </h3>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Last 6 months
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData.monthlyTrendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="spending" 
              fill="url(#barGradient)" 
              radius={[4, 4, 0, 0]}
              name="Monthly Spending"
            />
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#667eea" />
                <stop offset="100%" stopColor="#764ba2" />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Category Breakdown */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Spending by Category
          </h3>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Monthly equivalent
          </div>
        </div>
        
        {chartData.pieData.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={chartData.pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Legend */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              {chartData.pieData.map((entry, index) => (
                <div key={entry.name} className="flex items-center text-sm">
                  <div 
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  ></div>
                  <span className="text-gray-600 dark:text-gray-400">
                    {entry.name}: ${entry.value}
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <PieChart className="w-8 h-8 opacity-50" />
              </div>
              <p>No active subscriptions</p>
              <p className="text-sm">Add subscriptions to see category breakdown</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};