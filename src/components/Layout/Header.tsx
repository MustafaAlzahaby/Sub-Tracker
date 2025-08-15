import React, { memo, useCallback } from 'react';
import { Menu, Sun, Moon, Sparkles, Zap, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { NotificationBell } from './NotificationBell';

interface HeaderProps {
  toggleSidebar: () => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  onAddSubscription?: () => void;
}

export const Header: React.FC<HeaderProps> = memo(({ toggleSidebar, darkMode, toggleDarkMode, onAddSubscription }) => {
  const handleToggleSidebar = useCallback(() => {
    toggleSidebar();
  }, [toggleSidebar]);

  const handleToggleDarkMode = useCallback(() => {
    toggleDarkMode();
  }, [toggleDarkMode]);

  const handleAddSubscription = useCallback(() => {
    if (onAddSubscription) {
      onAddSubscription();
    }
  }, [onAddSubscription]);

  return (
    <header className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl shadow-lg border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-30">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <button
              onClick={handleToggleSidebar}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-500 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 lg:hidden transition-all duration-200"
            >
              <Menu className="h-6 w-6" />
            </button>
            
            {/* Modern Status Indicator */}
            <div className="hidden md:flex items-center ml-4 space-x-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-900/20 dark:to-blue-900/20 rounded-xl border border-emerald-200/50 dark:border-emerald-700/50"
              >
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 180, 360]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </motion.div>
                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                  All Systems Operational
                </span>
              </motion.div>

              {/* Live Activity Indicator */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200/50 dark:border-blue-700/50"
              >
                <motion.div
                  animate={{ 
                    scale: [1, 1.3, 1],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{ 
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
                />
                <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                  Live
                </span>
              </motion.div>

            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Add Subscription Button */}
            {onAddSubscription && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAddSubscription}
                className="hidden sm:flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-600 text-white rounded-xl font-medium hover:from-emerald-600 hover:via-blue-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm">Add Subscription</span>
              </motion.button>
            )}

            {/* Performance Badge */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg border border-amber-200/50 dark:border-amber-700/50"
            >
              <Zap className="w-3 h-3 text-amber-600 dark:text-amber-400" />
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                Fast & Secure
              </span>
            </motion.div>

            {/* Notifications */}
            <NotificationBell />

            {/* Dark Mode Toggle */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleToggleDarkMode}
              className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-all duration-200"
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </motion.button>
          </div>
        </div>
      </div>
    </header>
  );
});

Header.displayName = 'Header';