import React, { useState } from 'react';
import { Layout } from '../components/Layout/Layout';
import { useAuth } from '../hooks/useAuth';
import { useUserPlan } from '../hooks/useUserPlan';
import { User, CreditCard, Settings, Crown, Zap, Star, Check, X, TestTube, Shuffle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export const Account: React.FC = () => {
  const { user } = useAuth();
  const { userPlan, loading, switchPlanManually } = useUserPlan();
  const [showBilling, setShowBilling] = useState(false);
  const [showTestingPanel, setShowTestingPanel] = useState(false);

  const plans = [
    {
      id: 'free',
      name: 'Starter',
      price: '$0',
      period: 'forever',
      icon: Star,
      color: 'from-gray-500 to-gray-600',
      features: [
        'Up to 5 subscriptions',
        'Basic reminders (7 days)',
        'Simple analytics',
        'Mobile app access',
        'Email support'
      ],
      limits: {
        subscriptions: 5,
        analytics: false,
        reports: false,
        teamFeatures: false
      }
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '$7.99',
      period: 'per month',
      icon: Zap,
      color: 'from-blue-500 to-indigo-600',
      features: [
        'Unlimited subscriptions',
        'Advanced reminders (30, 7, 1 days)',
        'Detailed analytics',
        'CSV export',
        'Priority support',
        'Custom categories'
      ],
      limits: {
        subscriptions: -1,
        analytics: true,
        reports: true,
        teamFeatures: false
      },
      popular: true
    }
  ];

  const handlePlanSwitch = async (planId: string) => {
    if (planId === userPlan?.plan_type) {
      toast.info('Already on this plan');
      return;
    }
    
    await switchPlanManually(planId as any);
  };

  const handleCancelSubscription = () => {
    toast.error('Subscription cancellation is not implemented yet. Please contact support.');
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const currentPlan = plans.find(plan => plan.id === userPlan?.plan_type) || plans[0];

  return (
    <Layout onAddSubscription={() => window.location.href = '/subscriptions'}>
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
                Account Settings
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Manage your account, subscription plan, and billing information
              </p>
            </div>
            
            {/* Testing Panel Toggle */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowTestingPanel(!showTestingPanel)}
              className="flex items-center px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl font-medium hover:from-orange-600 hover:to-red-700 transition-all shadow-lg mt-4 sm:mt-0"
            >
              <TestTube className="w-4 h-4 mr-2" />
              Testing Panel
            </motion.button>
          </motion.div>

          {/* Testing Panel */}
          <AnimatePresence>
            {showTestingPanel && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-gradient-to-r from-orange-50/50 to-red-50/50 dark:from-orange-900/20 dark:to-red-900/20 p-6 rounded-2xl border-2 border-orange-200/50 dark:border-orange-700/50"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <TestTube className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-200">
                    Testing Mode - Manual Plan Switching
                  </h3>
                </div>
                <p className="text-orange-700 dark:text-orange-300 text-sm mb-4">
                  Switch between plans instantly to test features. This is for development/testing only.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {plans.map((plan) => (
                    <button
                      key={plan.id}
                      onClick={() => handlePlanSwitch(plan.id)}
                      disabled={plan.id === userPlan?.plan_type}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        plan.id === userPlan?.plan_type
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                          : 'border-orange-200 dark:border-orange-700 hover:border-orange-400 dark:hover:border-orange-500 bg-white/50 dark:bg-gray-800/50'
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        <plan.icon className="w-5 h-5" />
                        <span className="font-medium">{plan.name}</span>
                        {plan.id === userPlan?.plan_type && (
                          <Check className="w-4 h-4 text-green-500" />
                        )}
                      </div>
                      <p className="text-sm opacity-75">{plan.price} {plan.period}</p>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Account Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-6 lg:p-8 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50"
          >
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 via-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {user?.user_metadata?.full_name || 'User'}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">{user?.email}</p>
                <div className="flex items-center mt-2">
                  <div className={`w-3 h-3 bg-gradient-to-r ${currentPlan.color} rounded-full mr-2`}></div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {currentPlan.name} Plan
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50/50 dark:bg-gray-700/50 p-4 rounded-xl">
                <div className="text-sm text-gray-500 dark:text-gray-400">Subscriptions</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {userPlan?.subscription_limit === 999999 ? 'Unlimited' : `${userPlan?.subscription_limit || 5} max`}
                </div>
              </div>
              <div className="bg-gray-50/50 dark:bg-gray-700/50 p-4 rounded-xl">
                <div className="text-sm text-gray-500 dark:text-gray-400">Analytics</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {currentPlan.limits.analytics ? 'Enabled' : 'Basic'}
                </div>
              </div>
              <div className="bg-gray-50/50 dark:bg-gray-700/50 p-4 rounded-xl">
                <div className="text-sm text-gray-500 dark:text-gray-400">Reports</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {currentPlan.limits.reports ? 'Enabled' : 'Disabled'}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Current Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-6 lg:p-8 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Current Plan
              </h2>
              {userPlan?.plan_type !== 'free' && (
                <button
                  onClick={() => setShowBilling(!showBilling)}
                  className="flex items-center px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Billing
                </button>
              )}
            </div>

            <div className="flex items-center justify-between p-6 bg-gradient-to-r from-gray-50/50 to-white/50 dark:from-gray-700/50 dark:to-gray-800/50 rounded-xl border border-gray-200/50 dark:border-gray-600/50">
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 bg-gradient-to-r ${currentPlan.color} rounded-xl flex items-center justify-center`}>
                  <currentPlan.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {currentPlan.name} Plan
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {currentPlan.price} {currentPlan.period}
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-sm text-gray-500 dark:text-gray-400">Status</div>
                <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                  Active
                </div>
              </div>
            </div>

            {/* Billing Information */}
            <AnimatePresence>
              {showBilling && userPlan?.plan_type !== 'free' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-6 p-4 bg-gray-50/50 dark:bg-gray-700/50 rounded-xl"
                >
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Billing Information</h4>
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <p>Next billing date: {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
                    <p>Payment method: Verifona Gateway (Coming Soon)</p>
                    <div className="flex space-x-4 mt-4">
                      <button className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                        Update payment method
                      </button>
                      <button 
                        onClick={handleCancelSubscription}
                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                      >
                        Cancel subscription
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Available Plans - Full Width Layout */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-6 lg:p-8 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50"
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Available Plans
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
              {plans.map((plan, index) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className={`relative p-6 lg:p-8 rounded-2xl border-2 transition-all ${
                    plan.id === userPlan?.plan_type
                      ? 'border-blue-500 ring-4 ring-blue-500 ring-opacity-20 bg-blue-50/50 dark:bg-blue-900/20'
                      : plan.popular
                      ? 'border-purple-500 ring-4 ring-purple-500 ring-opacity-20 bg-white/80 dark:bg-gray-700/80'
                      : 'border-gray-200/50 dark:border-gray-600/50 bg-white/60 dark:bg-gray-700/60'
                  }`}
                >
                  {plan.popular && plan.id !== userPlan?.plan_type && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                        Most Popular
                      </span>
                    </div>
                  )}

                  {plan.id === userPlan?.plan_type && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                        Current Plan
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <div className={`w-12 h-12 bg-gradient-to-r ${plan.color} rounded-xl flex items-center justify-center mx-auto mb-4`}>
                      <plan.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      {plan.name}
                    </h3>
                    <div className="mb-4">
                      <span className="text-3xl font-bold text-gray-900 dark:text-white">
                        {plan.price}
                      </span>
                      <span className="text-gray-600 dark:text-gray-300 ml-2">
                        {plan.period}
                      </span>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <Check className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                        <span className="text-sm text-gray-600 dark:text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handlePlanSwitch(plan.id)}
                    disabled={plan.id === userPlan?.plan_type}
                    className={`w-full py-3 px-6 rounded-xl font-semibold transition-all ${
                      plan.id === userPlan?.plan_type
                        ? 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                        : plan.popular
                        ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:from-purple-600 hover:to-pink-700 shadow-lg hover:shadow-xl'
                        : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 shadow-lg hover:shadow-xl'
                    } disabled:opacity-50`}
                  >
                    {plan.id === userPlan?.plan_type 
                      ? 'Current Plan' 
                      : `Switch to ${plan.name}`
                    }
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Verifona Integration Notice */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 lg:p-8 rounded-2xl border border-blue-200/50 dark:border-blue-700/50"
          >
            <div className="flex items-center space-x-3">
              <CreditCard className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Secure Payments with Verifona</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Payment processing will be handled through Verifona Gateway. Supports credit cards, debit cards, and digital wallets across Europe and USA. Integration coming soon!
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};