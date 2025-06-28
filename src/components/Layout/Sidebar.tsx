import React, { memo, useCallback, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CreditCard, 
  FileText, 
  User, 
  TrendingUp,
  Bell,
  LogOut,
  Target,
  Layers
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { motion } from 'framer-motion';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Subscriptions', href: '/subscriptions', icon: CreditCard },
  { name: 'Analytics', href: '/analytics', icon: TrendingUp },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'Reminders', href: '/reminders', icon: Bell },
  { name: 'Account', href: '/account', icon: User },
];

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

// Memoized SubTracker Logo Component with stable reference
const SubTrackerLogo = memo(() => (
  <div className="relative">
    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 via-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
      <div className="relative">
        <Target className="w-7 h-7 text-white" />
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-orange-400 to-red-500 rounded-full border-2 border-white flex items-center justify-center">
          <Layers className="w-2 h-2 text-white" />
        </div>
      </div>
    </div>
  </div>
));

SubTrackerLogo.displayName = 'SubTrackerLogo';

// Memoized Navigation Item Component with stable props
const NavigationItem = memo(({ item, isActive, onClick }: {
  item: typeof navigation[0];
  isActive: boolean;
  onClick: () => void;
}) => (
  <Link
    to={item.href}
    className={`group flex items-center px-4 py-3.5 text-sm font-medium rounded-xl transition-all duration-200 ${
      isActive
        ? 'bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25 transform scale-[1.02]'
        : 'text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-50 dark:hover:from-gray-800 dark:hover:to-gray-700 hover:text-gray-900 dark:hover:text-white hover:shadow-md hover:scale-[1.01]'
    }`}
    onClick={onClick}
  >
    <item.icon className={`w-5 h-5 mr-3 transition-transform duration-200 ${
      isActive ? 'scale-110' : 'group-hover:scale-105'
    }`} />
    {item.name}
    {isActive && (
      <motion.div
        layoutId="activeIndicator"
        className="ml-auto w-2 h-2 bg-white rounded-full"
        initial={false}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    )}
  </Link>
), (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  return (
    prevProps.item.href === nextProps.item.href &&
    prevProps.isActive === nextProps.isActive &&
    prevProps.onClick === nextProps.onClick
  );
});

NavigationItem.displayName = 'NavigationItem';

// Memoized User Section Component with stable props
const UserSection = memo(({ user, onSignOut }: {
  user: any;
  onSignOut: () => void;
}) => (
  <div className="border-t border-gray-200/50 dark:border-gray-700/50 p-4 bg-gradient-to-r from-gray-50/30 to-white/30 dark:from-gray-800/30 dark:to-gray-900/30">
    <div className="flex items-center space-x-3 mb-4 p-3 rounded-xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50">
      <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 via-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
        <span className="text-white font-bold text-lg">
          {user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
          {user?.user_metadata?.full_name || 'User'}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {user?.email}
        </p>
      </div>
    </div>
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSignOut}
      className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 dark:hover:from-red-900/20 dark:hover:to-pink-900/20 hover:text-red-600 dark:hover:text-red-400 rounded-xl transition-all duration-200 group"
    >
      <LogOut className="w-4 h-4 mr-3 group-hover:scale-110 transition-transform duration-200" />
      Sign out
    </motion.button>
  </div>
), (prevProps, nextProps) => {
  // Custom comparison for user section
  return (
    prevProps.user?.id === nextProps.user?.id &&
    prevProps.user?.email === nextProps.user?.email &&
    prevProps.user?.user_metadata?.full_name === nextProps.user?.user_metadata?.full_name &&
    prevProps.onSignOut === nextProps.onSignOut
  );
});

UserSection.displayName = 'UserSection';

export const Sidebar: React.FC<SidebarProps> = memo(({ isOpen, setIsOpen }) => {
  const location = useLocation();
  const { signOut, user } = useAuth();

  // Stable callback references
  const handleSignOut = useCallback(async () => {
    await signOut();
  }, [signOut]);

  const handleNavClick = useCallback(() => {
    // Only close sidebar on mobile
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
  }, [setIsOpen]);

  const handleBackdropClick = useCallback(() => {
    setIsOpen(false);
  }, [setIsOpen]);

  // Memoize navigation items to prevent re-renders
  const navigationItems = useMemo(() => {
    return navigation.map((item, index) => {
      const isActive = location.pathname === item.href;
      return (
        <motion.div
          key={item.href} // Use href as key for stability
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <NavigationItem
            item={item}
            isActive={isActive}
            onClick={handleNavClick}
          />
        </motion.div>
      );
    });
  }, [location.pathname, handleNavClick]);

  return (
    <>
      {/* Mobile backdrop - Only show on mobile when sidebar is open */}
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={handleBackdropClick}
        />
      )}

      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{ 
          x: isOpen ? 0 : -320,
          opacity: isOpen ? 1 : 0.95
        }}
        transition={{ 
          duration: 0.3, 
          ease: [0.4, 0.0, 0.2, 1],
          opacity: { duration: 0.2 }
        }}
        className="fixed left-0 top-0 z-50 h-full w-80 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-2xl border-r border-gray-200/50 dark:border-gray-700/50 lg:translate-x-0 lg:opacity-100 lg:static lg:inset-0 lg:z-auto"
      >
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="flex items-center px-6 py-6 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-gray-50/80 to-white/80 dark:from-gray-800/80 dark:to-gray-900/80">
            <div className="flex items-center space-x-4">
              <SubTrackerLogo />
              <div>
                <span className="font-bold text-2xl bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                  SubTracker
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  Smart Subscription Management
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigationItems}
          </nav>

          {/* User section */}
          <UserSection user={user} onSignOut={handleSignOut} />
        </div>
      </motion.div>
    </>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for Sidebar to prevent unnecessary re-renders
  return (
    prevProps.isOpen === nextProps.isOpen &&
    prevProps.setIsOpen === nextProps.setIsOpen
  );
});

Sidebar.displayName = 'Sidebar';