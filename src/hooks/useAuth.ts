import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, handleSupabaseError } from '../lib/supabase';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ data: any; error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ data: any; error: AuthError | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ data: any; error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signUp: async () => ({ data: null, error: null }),
  signIn: async () => ({ data: null, error: null }),
  signOut: async () => {},
  resetPassword: async () => ({ data: null, error: null })
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

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
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
        // and not during initial load or token refresh
        if (!isInitialLoad) {
          if (event === 'SIGNED_IN' && !hasShownLoginToast) {
            toast.success('Successfully signed in!');
            setHasShownLoginToast(true);
          } else if (event === 'SIGNED_OUT') {
            toast.success('Successfully signed out!');
            setHasShownLoginToast(false);
          } else if (event === 'TOKEN_REFRESHED') {
            console.log('Token refreshed successfully');
            // Don't show toast for token refresh
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
      
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: fullName.trim()
          }
        }
      });

      if (error) {
        const errorMessage = handleSupabaseError(error);
        toast.error(errorMessage);
        return { data: null, error };
      }

      if (data.user && !data.session) {
        toast.success('Please check your email to confirm your account!');
      } else if (data.session) {
        setHasShownLoginToast(false); // Allow login toast to show
      }

      return { data, error: null };
    } catch (error: any) {
      const errorMessage = handleSupabaseError(error);
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
      const errorMessage = handleSupabaseError(error);
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

  const resetPassword = useCallback(async (email: string) => {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        {
          redirectTo: `${window.location.origin}/reset-password`
        }
      );

      if (error) {
        const errorMessage = handleSupabaseError(error);
        toast.error(errorMessage);
        return { data: null, error };
      }

      toast.success('Password reset email sent! Check your inbox.');
      return { data, error: null };
    } catch (error: any) {
      const errorMessage = handleSupabaseError(error);
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
    signOut,
    resetPassword
  };
};

export { AuthContext };