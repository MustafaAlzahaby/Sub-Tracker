import React, { useState } from 'react';
import { Bell, X, Check, Clock, AlertTriangle, Trash2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';

export const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const navigate = useNavigate();
  const { 
    notifications, 
    loading, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    checkForNewNotifications,
    getUnreadCount,
    getUrgentNotifications
  } = useNotifications();

  const unreadCount = getUnreadCount();
  const urgentNotifications = getUrgentNotifications();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'overdue_payment':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'renewal_reminder':
        return <Clock className="w-4 h-4 text-orange-500" />;
      case 'plan_limit':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Bell className="w-4 h-4 text-blue-500" />;
    }
  };

  const getNotificationColor = (type: string, isUrgent: boolean = false) => {
    if (isUrgent) {
      return 'border-l-red-500 bg-red-50/50 dark:bg-red-900/10';
    }
    
    switch (type) {
      case 'overdue_payment':
        return 'border-l-red-500 bg-red-50/50 dark:bg-red-900/10';
      case 'renewal_reminder':
        return 'border-l-orange-500 bg-orange-50/50 dark:bg-orange-900/10';
      case 'plan_limit':
        return 'border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-900/10';
      default:
        return 'border-l-blue-500 bg-blue-50/50 dark:bg-blue-900/10';
    }
  };

  const isUrgentNotification = (notification: any) => {
    return notification.type === 'overdue_payment' || 
           (notification.type === 'renewal_reminder' && (
             notification.message.includes('1 day') || 
             notification.message.includes('2 day') || 
             notification.message.includes('TOMORROW') || 
             notification.message.includes('TODAY')
           ));
  };

  const handleNotificationClick = (notification: any) => {
    // Mark as read if not already read
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    
    // Close the notification dropdown
    setIsOpen(false);
    
    // Navigate to reminders page with the subscription ID to highlight
    if (notification.subscription_id) {
      navigate(`/reminders?highlight=${notification.subscription_id}`);
    } else {
      navigate('/reminders');
    }
  };

  const handleCheckForNotifications = async () => {
    setIsChecking(true);
    try {
      await checkForNewNotifications(false);
    } finally {
      setIsChecking(false);
    }
  };

  const getBellColor = () => {
    if (urgentNotifications.length > 0) {
      return 'text-red-500 animate-pulse';
    }
    if (unreadCount > 0) {
      return 'text-orange-500';
    }
    return 'text-gray-500 dark:text-gray-400';
  };

  const getBadgeColor = () => {
    if (urgentNotifications.length > 0) {
      return 'from-red-500 to-red-600';
    }
    return 'from-blue-500 to-indigo-600';
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-xl hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-all duration-200 ${getBellColor()}`}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r ${getBadgeColor()} rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center`}
          >
            <span className="text-xs font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </motion.span>
        )}
      </motion.button>

      {/* Notification Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-96 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 z-50"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200/50 dark:border-gray-700/50">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Notifications
                </h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleCheckForNotifications}
                    disabled={isChecking}
                    className="flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 mr-1 ${isChecking ? 'animate-spin' : ''}`} />
                    {isChecking ? 'Checking...' : 'Check now'}
                  </button>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Notifications List */}
              <div className="max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="p-4 space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="flex space-x-3">
                          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">No notifications yet</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">
                      We'll notify you about upcoming renewals based on your plan
                    </p>
                    <button
                      onClick={handleCheckForNotifications}
                      disabled={isChecking}
                      className="flex items-center justify-center mx-auto px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
                      {isChecking ? 'Checking...' : 'Check for notifications'}
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200/50 dark:divide-gray-700/50">
                    {notifications.slice(0, 10).map((notification) => {
                      const isUrgent = isUrgentNotification(notification);
                      
                      return (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`p-4 hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer border-l-4 ${getNotificationColor(notification.type, isUrgent)} ${
                            !notification.is_read ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''
                          }`}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 mt-1">
                              {getNotificationIcon(notification.type)}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className={`text-sm font-medium ${
                                    !notification.is_read 
                                      ? 'text-gray-900 dark:text-white' 
                                      : 'text-gray-700 dark:text-gray-300'
                                  }`}>
                                    {notification.title}
                                  </p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    {notification.message}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                  </p>
                                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                    Click to view details →
                                  </p>
                                </div>
                                
                                <div className="flex items-center space-x-1 ml-2">
                                  {!notification.is_read && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        markAsRead(notification.id);
                                      }}
                                      className="p-1 text-gray-400 hover:text-green-500 transition-colors"
                                      title="Mark as read"
                                    >
                                      <Check className="w-4 h-4" />
                                    </button>
                                  )}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteNotification(notification.id);
                                    }}
                                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                    title="Delete notification"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              {notifications.length > 10 && (
                <div className="p-3 border-t border-gray-200/50 dark:border-gray-700/50 text-center">
                  <button 
                    onClick={() => {
                      setIsOpen(false);
                      navigate('/reminders');
                    }}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                  >
                    View all notifications
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};