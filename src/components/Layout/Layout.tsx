import React, { useState, useEffect, memo, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
  onAddSubscription?: () => void;
}

export const Layout: React.FC<LayoutProps> = memo(({ children, onAddSubscription }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('darkMode') === 'true';
    }
    return false;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  // Stable callback references that won't change on every render
  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => !prev);
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  // Memoize the sidebar props to prevent unnecessary re-renders
  const sidebarProps = useMemo(() => ({
    isOpen: sidebarOpen,
    setIsOpen: setSidebarOpen
  }), [sidebarOpen]);

  // Memoize the header props to prevent unnecessary re-renders
  const headerProps = useMemo(() => ({
    toggleSidebar,
    darkMode,
    toggleDarkMode,
    onAddSubscription: location.pathname !== '/subscriptions' ? onAddSubscription : undefined
  }), [toggleSidebar, darkMode, toggleDarkMode, onAddSubscription, location.pathname]);

  return (
    <div className="h-screen flex bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800">
      {/* Desktop Sidebar - Always visible on large screens */}
      <div className="hidden lg:flex lg:w-80 lg:flex-shrink-0">
        <Sidebar isOpen={true} setIsOpen={setSidebarOpen} />
      </div>
      
      {/* Mobile Sidebar - Only shows when open */}
      <div className="lg:hidden">
        <Sidebar {...sidebarProps} />
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header {...headerProps} />
        
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-50/80 via-blue-50/80 to-indigo-100/80 dark:from-gray-900/80 dark:via-slate-900/80 dark:to-gray-800/80">
          <div className="py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Only re-render if children actually change
  return prevProps.children === nextProps.children && prevProps.onAddSubscription === nextProps.onAddSubscription;
});

Layout.displayName = 'Layout';