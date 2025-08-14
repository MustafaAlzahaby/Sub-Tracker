import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, handleSupabaseError, getCurrentRedirectUrl, hasAuthTokensInUrl, handleAuthCallback } from '../lib/supabase';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ data: any; error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ data: any; error: AuthError | null }>;
  signInWithGoogle: () => Promise<{ data: any; error: AuthError | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ data: any; error: AuthError | null }>;
  updatePassword: (newPassword: string) => Promise<{ data: any; error: AuthError | null }>;
  resendConfirmation: (email: string) => Promise<{ data: any; error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signUp: async () => ({ data: null, error: null }),
  signIn: async () => ({ data: null, error: null }),
  signInWithGoogle: async () => ({ data: null, error: null }),
  signOut: async () => {},
  resetPassword: async () => ({ data: null, error: null }),
  updatePassword: async () => ({ data: null, error: null }),
  resendConfirmation: async () => ({ data: null, error: null })
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useAuthProvider = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasShownLoginToast, setHasShownLoginToast] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    let mounted = true;

    // 🎯 ENHANCED: Handle auth callback and initial session
    const getInitialSession = async () => {
      try {
        // Check if we have auth tokens in URL (password reset, email confirmation, etc.)
        if (hasAuthTokensInUrl()) {
          console.log('🔍 Auth tokens detected in URL, handling callback...');
          await handleAuthCallback();
        }

        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          throw error;
        }
        
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
          setIsInitialLoad(false);
          
          // Don't show toast for initial session load
          if (session?.user) {
            setHasShownLoginToast(true);
          }
        }
      } catch (error) {
        console.error('Session initialization error:', error);
        if (mounted) {
          setLoading(false);
          setIsInitialLoad(false);
          // Clear any invalid session data
          setSession(null);
          setUser(null);
        }
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }

        // Handle specific auth events - only show toast for actual sign in events
        if (!isInitialLoad) {
          if (event === 'SIGNED_IN' && !hasShownLoginToast) {
            // Check if it's a Google sign-in by looking at the provider
            const provider = session?.user?.app_metadata?.provider;
            if (provider === 'google') {
              toast.success('Successfully signed in with Google!');
            } else {
              toast.success('Successfully signed in!');
            }
            setHasShownLoginToast(true);
          } else if (event === 'SIGNED_OUT') {
            toast.success('Successfully signed out!');
            setHasShownLoginToast(false);
          } else if (event === 'TOKEN_REFRESHED') {
            console.log('Token refreshed successfully');
          } else if (event === 'PASSWORD_RECOVERY') {
            console.log('🔐 Password recovery event detected');
            toast.success('You can now update your password!');
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [hasShownLoginToast, isInitialLoad]);

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    try {
      setLoading(true);
      
      // Validate inputs
      if (!email || !password || !fullName) {
        throw new Error('All fields are required');
      }
      
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }
      
      if (!email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }
      
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: fullName.trim()
          },
          emailRedirectTo: `${getCurrentRedirectUrl()}/dashboard`
        }
      });

      if (error) {
        const errorMessage = handleSupabaseError(error);
        toast.error(errorMessage);
        return { data: null, error };
      }

      if (data.user && !data.session) {
        toast.success('Account created! Please check your email to confirm your account.');
      } else if (data.session) {
        setHasShownLoginToast(false); // Allow login toast to show
        toast.success('Account created successfully! Welcome to SubTracker!');
      }

      return { data, error: null };
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to create account';
      toast.error(errorMessage);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      setHasShownLoginToast(false); // Reset to allow login toast
      
      // Validate inputs
      if (!email || !password) {
        throw new Error('Email and password are required');
      }
      
      if (!email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password
      });

      if (error) {
        const errorMessage = handleSupabaseError(error);
        toast.error(errorMessage);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to sign in';
      toast.error(errorMessage);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  }, []);

  // 🎯 NEW: Google Sign-In Implementation
  const signInWithGoogle = useCallback(async () => {
    try {
      setLoading(true);
      setHasShownLoginToast(false); // Reset to allow login toast
      
      console.log('🔍 Initiating Google sign-in...');
      console.log('🔧 Redirect URL:', `${getCurrentRedirectUrl()}/dashboard`);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${getCurrentRedirectUrl()}/dashboard`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) {
        console.error('❌ Google sign-in error:', error);
        const errorMessage = handleSupabaseError(error);
        toast.error(errorMessage);
        return { data: null, error };
      }

      console.log('✅ Google sign-in initiated successfully');
      // Note: The actual sign-in completion will be handled by the auth state change listener
      return { data, error: null };
    } catch (error: any) {
      console.error('❌ Google sign-in failed:', error);
      const errorMessage = error.message || 'Failed to sign in with Google';
      toast.error(errorMessage);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        const errorMessage = handleSupabaseError(error);
        toast.error(errorMessage);
      }
    } catch (error: any) {
      const errorMessage = handleSupabaseError(error);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // 🎯 ENHANCED: Better password reset implementation
  const resetPassword = useCallback(async (email: string) => {
    try {
      if (!email) {
        throw new Error('Email is required');
      }
      
      if (!email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }
      
      // 🔧 FIXED: Use the correct redirect URL for password update page
      const baseUrl = getCurrentRedirectUrl();
      const redirectUrl = `${baseUrl}/update-password`;
      
      console.log('🎯 PASSWORD RESET ATTEMPT:');
      console.log('  - Email:', email.trim().toLowerCase());
      console.log('  - Base URL:', baseUrl);
      console.log('  - Full Redirect URL:', redirectUrl);
      
      const { data, error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: redirectUrl
      });

      if (error) {
        const errorMessage = handleSupabaseError(error);
        console.error('❌ Password reset error:', error);
        toast.error(errorMessage);
        return { data: null, error };
      }

      console.log('✅ Password reset email sent successfully!');
      console.log('📧 Email should redirect to:', redirectUrl);
      console.log('🔍 Make sure your app has a /update-password route to handle the callback');
      
      toast.success('Password reset email sent! Check your inbox and click the link to reset your password.');
      
      return { data, error: null };
      
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to send reset email';
      console.error('❌ Password reset failed:', error);
      toast.error(errorMessage);
      return { data: null, error };
    }
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    try {
      if (!newPassword) {
        throw new Error('New password is required');
      }
      
      if (newPassword.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }
      
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        const errorMessage = handleSupabaseError(error);
        toast.error(errorMessage);
        return { data: null, error };
      }

      toast.success('Password updated successfully! You are now logged in.');
      return { data, error: null };
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to update password';
      toast.error(errorMessage);
      return { data: null, error };
    }
  }, []);

  const resendConfirmation = useCallback(async (email: string) => {
    try {
      if (!email) {
        throw new Error('Email is required');
      }
      
      const { data, error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: `${getCurrentRedirectUrl()}/dashboard`
        }
      });

      if (error) {
        const errorMessage = handleSupabaseError(error);
        toast.error(errorMessage);
        return { data: null, error };
      }

      toast.success('Confirmation email resent! Check your inbox.');
      return { data, error: null };
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to resend confirmation';
      toast.error(errorMessage);
      return { data: null, error };
    }
  }, []);

  return {
    user,
    session,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
    updatePassword,
    resendConfirmation
  };
};

export { AuthContext };