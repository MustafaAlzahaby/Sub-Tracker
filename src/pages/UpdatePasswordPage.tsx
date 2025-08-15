import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Shield, Eye, EyeOff, ArrowRight, CheckCircle, AlertCircle, Lock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface UpdatePasswordFormData {
  newPassword: string;
  confirmPassword: string;
}

export const UpdatePasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { updatePassword } = useAuth();
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<UpdatePasswordFormData>();

  const newPassword = watch('newPassword');

  // Enhanced session checking with Supabase recovery handling
  useEffect(() => {
    const checkRecoverySession = async () => {
      try {
        setIsCheckingSession(true);
        
        // Get all possible token sources
        const accessToken = searchParams.get('access_token');
        const refreshToken = searchParams.get('refresh_token');
        const type = searchParams.get('type');
        const code = searchParams.get('code');
        
        // Also check hash parameters
        const hash = window.location.hash;
        const hashParams = new URLSearchParams(hash.substring(1));
        const hashAccessToken = hashParams.get('access_token');
        const hashRefreshToken = hashParams.get('refresh_token');
        const hashType = hashParams.get('type');
        
        console.log('🔍 Checking recovery session:');
        console.log('  - URL access_token:', !!accessToken);
        console.log('  - URL refresh_token:', !!refreshToken);
        console.log('  - URL type:', type);
        console.log('  - URL code:', !!code);
        console.log('  - Hash access_token:', !!hashAccessToken);
        console.log('  - Hash refresh_token:', !!hashRefreshToken);
        console.log('  - Hash type:', hashType);
        
        // Method 1: Try to exchange code for session (PKCE flow)
        if (code) {
          console.log('🔄 Attempting to exchange code for session...');
          try {
            const { data, error } = await supabase.auth.exchangeCodeForSession(code);
            if (data.session && !error) {
              console.log('✅ Successfully exchanged code for session');
              setIsValidSession(true);
              setIsCheckingSession(false);
              return;
            } else {
              console.log('❌ Code exchange failed:', error);
            }
          } catch (codeError) {
            console.log('❌ Code exchange error:', codeError);
          }
        }
        
        // Method 2: Try to set session with tokens
        const finalAccessToken = accessToken || hashAccessToken;
        const finalRefreshToken = refreshToken || hashRefreshToken;
        const finalType = type || hashType;
        
        if (finalAccessToken && finalRefreshToken && finalType === 'recovery') {
          console.log('🔄 Attempting to set session with tokens...');
          try {
            const { data, error } = await supabase.auth.setSession({
              access_token: finalAccessToken,
              refresh_token: finalRefreshToken
            });
            
            if (data.session && !error) {
              console.log('✅ Successfully set session with tokens');
              setIsValidSession(true);
              setIsCheckingSession(false);
              
              // Clean up URL
              const cleanUrl = window.location.pathname;
              window.history.replaceState({}, document.title, cleanUrl);
              return;
            } else {
              console.log('❌ Set session failed:', error);
            }
          } catch (sessionError) {
            console.log('❌ Set session error:', sessionError);
          }
        }
        
        // Method 3: Check current session (might already be set)
        console.log('🔄 Checking current session...');
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionData.session && !sessionError) {
          console.log('✅ Found existing valid session');
          setIsValidSession(true);
          setIsCheckingSession(false);
          return;
        }
        
        // If we get here, no valid session was found
        console.log('❌ No valid recovery session found');
        setIsCheckingSession(false);
        toast.error('Invalid or expired password reset link. Please request a new one.');
        
        setTimeout(() => {
          navigate('/reset-password');
        }, 3000);
        
      } catch (error) {
        console.error('❌ Session check error:', error);
        setIsCheckingSession(false);
        toast.error('Error verifying reset link. Please try again.');
        
        setTimeout(() => {
          navigate('/reset-password');
        }, 3000);
      }
    };

    checkRecoverySession();
  }, [searchParams, navigate]);

  const handlePasswordUpdate = async (data: UpdatePasswordFormData) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (data.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    try {
      setIsLoading(true);
      console.log('🔐 Attempting to update password...');
      
      const { error } = await updatePassword(data.newPassword);
      
      if (!error) {
        console.log('✅ Password updated successfully');
        toast.success('Password updated successfully! You are now logged in.');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('❌ Password update error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while checking session
  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full space-y-8 text-center"
        >
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Verifying Reset Link...
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Please wait while we verify your password reset link.
          </p>
        </motion.div>
      </div>
    );
  }

  // Show error state if session is invalid
  if (!isValidSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full space-y-8 text-center"
        >
          <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
            <AlertCircle className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Invalid Reset Link
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            This password reset link is invalid or has expired. You'll be redirected to request a new one.
          </p>
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl">
            <p className="text-red-700 dark:text-red-300 text-sm">
              Redirecting to password reset page in a few seconds...
            </p>
          </div>
          <Link
            to="/reset-password"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
          >
            Request New Reset Link
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8"
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Set New Password
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Enter your new password below to complete the reset process
          </p>
          
          {/* Success indicator */}
          <div className="mt-4 inline-flex items-center space-x-2 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 rounded-xl border border-emerald-200/50 dark:border-emerald-700/50">
            <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-emerald-700 dark:text-emerald-300 text-sm font-medium">
              Reset link verified successfully
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit(handlePasswordUpdate)} className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={showPassword ? 'text' : 'password'}
                {...register('newPassword', {
                  required: 'New password is required',
                  minLength: { value: 6, message: 'Password must be at least 6 characters' }
                })}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.newPassword && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.newPassword.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (value) => value === newPassword || 'Passwords do not match'
                })}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                placeholder="Confirm new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {/* Password strength indicator */}
          {newPassword && (
            <div className="space-y-2">
              <div className="text-sm text-gray-600 dark:text-gray-400">Password strength:</div>
              <div className="flex space-x-1">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className={`h-2 flex-1 rounded-full ${
                      newPassword.length > i * 2 + 2
                        ? i < 2
                          ? 'bg-red-400'
                          : i < 3
                          ? 'bg-yellow-400'
                          : 'bg-green-400'
                        : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  />
                ))}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {newPassword.length < 6 && 'Too short'}
                {newPassword.length >= 6 && newPassword.length < 8 && 'Fair'}
                {newPassword.length >= 8 && newPassword.length < 12 && 'Good'}
                {newPassword.length >= 12 && 'Strong'}
              </div>
            </div>
          )}

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl">
            <p className="text-blue-700 dark:text-blue-300 text-sm">
              🔒 Your new password will be encrypted and stored securely. You'll be automatically signed in after updating.
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-600 text-white py-3 px-4 rounded-xl font-medium hover:from-emerald-600 hover:via-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Updating Password...
              </div>
            ) : (
              <>
                Update Password & Sign In
                <ArrowRight className="w-4 h-4 ml-2 inline" />
              </>
            )}
          </button>
        </form>

        <div className="text-center">
          <Link
            to="/reset-password"
            className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
          >
            ← Back to password reset
          </Link>
        </div>
      </motion.div>
    </div>
  );
};