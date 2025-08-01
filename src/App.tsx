import React, { memo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './components/AuthProvider';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { Dashboard } from './pages/Dashboard';
import { SubscriptionsPage } from './pages/Subscriptions';
import { Analytics } from './pages/Analytics';
import { Reports } from './pages/Reports';
import { Reminders } from './pages/Reminders';
import { Account } from './pages/Account';

// Memoized Toaster component to prevent re-renders
const MemoizedToaster = memo(() => (
  <Toaster
    position="top-right"
    toastOptions={{
      duration: 4000,
      style: {
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        color: '#374151',
        border: '1px solid rgba(229, 231, 235, 0.5)',
        borderRadius: '12px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
      },
      success: {
        duration: 3000,
        iconTheme: {
          primary: '#10b981',
          secondary: '#fff',
        },
      },
      error: {
        duration: 4000,
        iconTheme: {
          primary: '#ef4444',
          secondary: '#fff',
        },
      },
    }}
  />
));

MemoizedToaster.displayName = 'MemoizedToaster';

// Memoized route components to prevent unnecessary re-renders
const MemoizedLandingPage = memo(LandingPage);
const MemoizedAuthPage = memo(AuthPage);
const MemoizedDashboard = memo(Dashboard);
const MemoizedSubscriptionsPage = memo(SubscriptionsPage);
const MemoizedAnalytics = memo(Analytics);
const MemoizedReports = memo(Reports);
const MemoizedReminders = memo(Reminders);
const MemoizedAccount = memo(Account);

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<MemoizedLandingPage />} />
            <Route path="/login" element={<MemoizedAuthPage />} />
            <Route path="/register" element={<MemoizedAuthPage />} />
            <Route path="/reset-password" element={<MemoizedAuthPage />} />
            
            {/* Protected routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <MemoizedDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/subscriptions" 
              element={
                <ProtectedRoute>
                  <MemoizedSubscriptionsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/analytics" 
              element={
                <ProtectedRoute>
                  <MemoizedAnalytics />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/reports" 
              element={
                <ProtectedRoute>
                  <MemoizedReports />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/reminders" 
              element={
                <ProtectedRoute>
                  <MemoizedReminders />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/account" 
              element={
                <ProtectedRoute>
                  <MemoizedAccount />
                </ProtectedRoute>
              } 
            />

            {/* Redirect any unknown routes */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          
          <MemoizedToaster />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default memo(App);