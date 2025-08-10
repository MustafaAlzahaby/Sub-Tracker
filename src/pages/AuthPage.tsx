import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Mail, Lock, User, Eye, EyeOff, ArrowRight, Sparkles, Shield, Zap, CheckCircle, AlertCircle, Loader2, UserCheck, UserX } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface LoginFormData {
  email: string;
  password: string;
}

interface RegisterFormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface ResetFormData {
  email: string;
}

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signUp, signInWithGoogle, resetPassword } = useAuth();
  
  const isLogin = location.pathname === '/login';
  const isRegister = location.pathname === '/register';
  const isReset = location.pathname === '/reset-password';
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  
  // Enhanced email validation states
  const [emailValidation, setEmailValidation] = useState({
    isValidating: false,
    isValid: false,
    userExists: false,
    hasChecked: false,
    error: ''
  });

  const loginForm = useForm<LoginFormData>();
  const registerForm = useForm<RegisterFormData>();
  const resetForm = useForm<ResetFormData>();

  // Enhanced email validation function
  const validateEmailAndUser = async (email: string) => {
    if (!email || !email.includes('@')) {
      setEmailValidation({
        isValidating: false,
        isValid: false,
        userExists: false,
        hasChecked: true,
        error: 'Please enter a valid email address'
      });
      return;
    }

    // Advanced email regex for professional validation
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    
    if (!emailRegex.test(email)) {
      setEmailValidation({
        isValidating: false,
        isValid: false,
        userExists: false,
        hasChecked: true,
        error: 'Please enter a valid email address'
      });
      return;
    }

    setEmailValidation(prev => ({ ...prev, isValidating: true, error: '' }));

    try {
      // Check if user exists in our database
      const { data, error } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', email.toLowerCase().trim())
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 is "not found" error, which is expected for non-existent users
        console.error('Error checking user existence:', error);
        setEmailValidation({
          isValidating: false,
          isValid: true,
          userExists: false,
          hasChecked: true,
          error: 'Unable to verify email. Please try again.'
        });
        return;
      }

      const userExists = !!data;

      setEmailValidation({
        isValidating: false,
        isValid: true,
        userExists,
        hasChecked: true,
        error: ''
      });

    } catch (error) {
      console.error('Email validation error:', error);
      setEmailValidation({
        isValidating: false,
        isValid: true,
        userExists: false,
        hasChecked: true,
        error: 'Unable to verify email. Please try again.'
      });
    }
  };

  // Debounced email validation for reset form
  useEffect(() => {
    if (!isReset) return;

    const email = resetForm.watch('email');
    if (!email) {
      setEmailValidation({
        isValidating: false,
        isValid: false,
        userExists: false,
        hasChecked: false,
        error: ''
      });
      return;
    }

    const timeoutId = setTimeout(() => {
      validateEmailAndUser(email);
    }, 800); // Debounce for 800ms

    return () => clearTimeout(timeoutId);
  }, [resetForm.watch('email'), isReset]);

  const handleLogin = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      const { error } = await signIn(data.email, data.password);
      
      if (!error) {
        const from = (location.state as any)?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (data: RegisterFormData) => {
    if (data.password !== data.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (data.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    try {
      setIsLoading(true);
      const { error } = await signUp(data.email, data.password, data.fullName);
      
      if (!error) {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Registration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 🎯 NEW: Google Sign-In Handler
  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      console.log('🔍 Starting Google sign-in...');
      
      const { error } = await signInWithGoogle();
      
      if (!error) {
        console.log('✅ Google sign-in initiated successfully');
        // The redirect will happen automatically
        // The auth state change listener will handle the success toast
      }
    } catch (error) {
      console.error('❌ Google sign-in error:', error);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleReset = async (data: ResetFormData) => {
    // Validate email and user existence first
    if (!emailValidation.hasChecked) {
      await validateEmailAndUser(data.email);
      return;
    }

    if (!emailValidation.isValid) {
      toast.error(emailValidation.error || 'Please enter a valid email address');
      return;
    }

    if (!emailValidation.userExists) {
      toast.error('No account found with this email address. Please check your email or create a new account.');
      return;
    }

    try {
      setIsLoading(true);
      const { error } = await resetPassword(data.email);
      
      if (!error) {
        setResetEmailSent(true);
      }
    } catch (error) {
      console.error('Reset error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset Email Sent Success Page
  if (resetEmailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full space-y-8"
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Check Your Email
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              We've sent a password reset link to your email address
            </p>
          </div>

          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 space-y-6">
            <div className="text-center space-y-4">
              <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl">
                <p className="text-emerald-700 dark:text-emerald-300 text-sm">
                  📧 Password reset email sent successfully!
                </p>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <p>Please check your email and click the reset link to continue.</p>
                <p>The link will expire in 1 hour for security reasons.</p>
                <p className="font-medium text-blue-600 dark:text-blue-400">
                  💡 The link will take you directly to the password reset page
                </p>
              </div>

              <div className="pt-4 space-y-3">
                <Link
                  to="/login"
                  className="inline-flex items-center text-blue-600 hover:text-blue-500 transition-colors font-medium"
                >
                  <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
                  Back to Sign In
                </Link>
                
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Didn't receive the email? Check your spam folder or try again.
                </div>
              </div>
            </div>
          </div>
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
        {/* Header */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center space-x-3 mb-6 group">
            <div className="w-14 h-14 bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <CreditCard className="w-7 h-7 text-white" />
            </div>
            <span className="font-bold text-2xl bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
              SubTracker
            </span>
          </Link>
          
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            {isLogin && 'Welcome back!'}
            {isRegister && 'Join SubTracker'}
            {isReset && 'Reset Password'}
          </h2>
          
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {isLogin && (
              <>
                New to SubTracker?{' '}
                <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                  Create your free account
                </Link>
              </>
            )}
            {isRegister && (
              <>
                Already have an account?{' '}
                <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                  Sign in here
                </Link>
              </>
            )}
            {isReset && (
              <>
                Remember your password?{' '}
                <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                  Back to sign in
                </Link>
              </>
            )}
          </p>
        </div>

        {/* Features Preview for Register */}
        {isRegister && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-r from-emerald-50/50 via-blue-50/50 to-purple-50/50 dark:from-emerald-900/10 dark:via-blue-900/10 dark:to-purple-900/10 p-4 rounded-xl border border-emerald-200/50 dark:border-emerald-700/50"
          >
            <div className="flex items-center space-x-2 mb-3">
              <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span className="font-semibold text-emerald-700 dark:text-emerald-300 text-sm">
                What you'll get:
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2 text-xs text-gray-600 dark:text-gray-400">
              <div className="flex items-center space-x-2">
                <Zap className="w-3 h-3 text-blue-500" />
                <span>Track unlimited subscriptions</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="w-3 h-3 text-purple-500" />
                <span>Smart renewal reminders</span>
              </div>
              <div className="flex items-center space-x-2">
                <CreditCard className="w-3 h-3 text-emerald-500" />
                <span>Beautiful analytics dashboard</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Form */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
          {/* 🎯 NEW: Google Sign-In Button (for Login and Register only) */}
          {(isLogin || isRegister) && (
            <div className="mb-6">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading}
                className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isGoogleLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600 mr-3"></div>
                    Connecting to Google...
                  </div>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    {isLogin ? 'Sign in with Google' : 'Sign up with Google'}
                  </>
                )}
              </motion.button>
              
              <div className="mt-6 relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                    Or continue with email
                  </span>
                </div>
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">
            {isLogin && (
              <motion.form
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={loginForm.handleSubmit(handleLogin)}
                className="space-y-6"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="email"
                      {...loginForm.register('email', { 
                        required: 'Email is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address'
                        }
                      })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                      placeholder="Enter your email"
                    />
                  </div>
                  {loginForm.formState.errors.email && (
                    <p className="mt-1 text-sm text-red-600">
                      {loginForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      {...loginForm.register('password', { required: 'Password is required' })}
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {loginForm.formState.errors.password && (
                    <p className="mt-1 text-sm text-red-600">
                      {loginForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <Link to="/reset-password" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                      Forgot your password?
                    </Link>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-600 text-white py-3 px-4 rounded-xl font-medium hover:from-emerald-600 hover:via-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Signing in...
                    </div>
                  ) : (
                    <>
                      Sign in
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </button>
              </motion.form>
            )}

            {isRegister && (
              <motion.form
                key="register"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={registerForm.handleSubmit(handleRegister)}
                className="space-y-6"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      {...registerForm.register('fullName', { 
                        required: 'Full name is required',
                        minLength: { value: 2, message: 'Name must be at least 2 characters' }
                      })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                      placeholder="Enter your full name"
                    />
                  </div>
                  {registerForm.formState.errors.fullName && (
                    <p className="mt-1 text-sm text-red-600">
                      {registerForm.formState.errors.fullName.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="email"
                      {...registerForm.register('email', { 
                        required: 'Email is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address'
                        }
                      })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                      placeholder="Enter your email"
                    />
                  </div>
                  {registerForm.formState.errors.email && (
                    <p className="mt-1 text-sm text-red-600">
                      {registerForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      {...registerForm.register('password', { 
                        required: 'Password is required',
                        minLength: { value: 6, message: 'Password must be at least 6 characters' }
                      })}
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                      placeholder="Create a password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {registerForm.formState.errors.password && (
                    <p className="mt-1 text-sm text-red-600">
                      {registerForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Confirm password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      {...registerForm.register('confirmPassword', { required: 'Please confirm your password' })}
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {registerForm.formState.errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">
                      {registerForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-600 text-white py-3 px-4 rounded-xl font-medium hover:from-emerald-600 hover:via-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Creating account...
                    </div>
                  ) : (
                    <>
                      Create account
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </button>
              </motion.form>
            )}

            {isReset && (
              <motion.form
                key="reset"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={resetForm.handleSubmit(handleReset)}
                className="space-y-6"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="email"
                      {...resetForm.register('email', { 
                        required: 'Email is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address'
                        }
                      })}
                      className={`w-full pl-10 pr-12 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all ${
                        emailValidation.hasChecked
                          ? emailValidation.isValid && emailValidation.userExists
                            ? 'border-green-300 dark:border-green-600 bg-green-50 dark:bg-green-900/10'
                            : 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/10'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                      placeholder="Enter your email"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {emailValidation.isValidating ? (
                        <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                      ) : emailValidation.hasChecked ? (
                        emailValidation.isValid && emailValidation.userExists ? (
                          <UserCheck className="w-5 h-5 text-green-500" />
                        ) : (
                          <UserX className="w-5 h-5 text-red-500" />
                        )
                      ) : null}
                    </div>
                  </div>
                  
                  {/* Enhanced validation feedback */}
                  <AnimatePresence>
                    {emailValidation.hasChecked && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-2"
                      >
                        {emailValidation.error ? (
                          <p className="text-sm text-red-600 flex items-center">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            {emailValidation.error}
                          </p>
                        ) : emailValidation.isValid && emailValidation.userExists ? (
                          <p className="text-sm text-green-600 flex items-center">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Account found! You can reset your password.
                          </p>
                        ) : emailValidation.isValid && !emailValidation.userExists ? (
                          <div className="space-y-2">
                            <p className="text-sm text-red-600 flex items-center">
                              <UserX className="w-4 h-4 mr-1" />
                              No account found with this email address.
                            </p>
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                              <p className="text-blue-700 dark:text-blue-300 text-sm">
                                💡 Don't have an account yet?{' '}
                                <Link to="/register" className="font-medium underline hover:no-underline">
                                  Create one here
                                </Link>
                              </p>
                            </div>
                          </div>
                        ) : null}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {resetForm.formState.errors.email && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {resetForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl">
                  <p className="text-blue-700 dark:text-blue-300 text-sm">
                    💡 We'll send you a secure link to reset your password. The link will take you directly to the password reset page and will expire in 1 hour.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || emailValidation.isValidating || (emailValidation.hasChecked && (!emailValidation.isValid || !emailValidation.userExists))}
                  className="w-full bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-600 text-white py-3 px-4 rounded-xl font-medium hover:from-emerald-600 hover:via-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Sending reset email...
                    </div>
                  ) : emailValidation.isValidating ? (
                    <div className="flex items-center">
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Verifying email...
                    </div>
                  ) : (
                    <>
                      Send reset email
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {/* Call to Action for Login Page */}
        {isLogin && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center"
          >
            <div className="bg-gradient-to-r from-emerald-500/10 via-blue-500/10 to-purple-500/10 p-6 rounded-2xl border border-emerald-200/50 dark:border-emerald-700/50">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                New to SubTracker?
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Join thousands of users saving money on subscriptions
              </p>
              <Link
                to="/register"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-600 text-white font-medium rounded-xl hover:from-emerald-600 hover:via-blue-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl group"
              >
                <Sparkles className="w-4 h-4 mr-2 group-hover:animate-pulse" />
                Start Free Today
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};