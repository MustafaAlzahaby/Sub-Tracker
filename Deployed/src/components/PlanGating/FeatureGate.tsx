import React, { useState } from 'react';
import { Lock, Crown } from 'lucide-react';
import { motion } from 'framer-motion';
import { useUserPlan } from '../../hooks/useUserPlan';
import { PaddleUpgradeModal } from './PaddleUpgradeModal';

interface FeatureGateProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgradeButton?: boolean;
}

export const FeatureGate: React.FC<FeatureGateProps> = ({
  feature,
  children,
  fallback,
  showUpgradeButton = true
}) => {
  const { userPlan, checkFeatureAccess } = useUserPlan();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const hasAccess = checkFeatureAccess(feature as any);

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <>
      <div className="relative">
        <div className="absolute inset-0 bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl z-10 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center p-6"
          >
            <div className="w-16 h-16 bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Premium Feature
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {feature} is available with Pro and Business plans
            </p>
            {showUpgradeButton && (
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-2 rounded-xl font-medium hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
              >
                Upgrade Now
              </button>
            )}
          </motion.div>
        </div>
        <div className="opacity-30 pointer-events-none">
          {children}
        </div>
      </div>

      <PaddleUpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        feature={feature}
        currentPlan={userPlan?.plan_type || 'free'}
      />
    </>
  );
};