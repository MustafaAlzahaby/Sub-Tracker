import React from 'react';
import { X, Check, Star, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlanType, useUserPlan } from '../../hooks/useUserPlan';

interface PlanUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: string;
  currentPlan: PlanType;
}

export const PlanUpgradeModal: React.FC<PlanUpgradeModalProps> = ({
  isOpen,
  onClose,
  feature,
  currentPlan
}) => {
  const { upgradePlan } = useUserPlan();

  const plan = {
    name: 'Pro',
    price: '$7.99',
    period: 'per month',
    icon: Zap,
    color: 'from-blue-500 to-indigo-600',
    features: [
      'Unlimited subscriptions',
      'Advanced analytics',
      'Detailed reports',
      'CSV export',
      'Priority support',
      'Custom categories'
    ],
    popular: true
  };

  const handleUpgrade = async () => {
    await upgradePlan('pro');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={onClose}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-md mx-auto border border-gray-200/50 dark:border-gray-700/50"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200/50 dark:border-gray-700/50">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Upgrade Required
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {feature} requires a Pro plan
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Plan */}
              <div className="p-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative bg-white/80 dark:bg-gray-700/80 backdrop-blur-xl p-6 rounded-2xl shadow-xl border-2 border-blue-500 ring-4 ring-blue-500 ring-opacity-20"
                >
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center">
                      <Star className="w-4 h-4 mr-1" />
                      Recommended
                    </span>
                  </div>
                  
                  <div className="text-center mb-6">
                    <div className={`w-16 h-16 bg-gradient-to-r ${plan.color} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                      <plan.icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
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
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                        <span className="text-gray-600 dark:text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={handleUpgrade}
                    className="w-full py-3 px-6 rounded-xl font-semibold transition-all bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 shadow-lg hover:shadow-xl"
                  >
                    Upgrade to {plan.name}
                  </button>
                </motion.div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-gray-50/50 dark:bg-gray-700/50 rounded-b-2xl border-t border-gray-200/50 dark:border-gray-700/50">
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  All plans include a free tier. Cancel anytime.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};