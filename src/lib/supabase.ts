import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// 🎯 ENHANCED: Better redirect URL detection with fallbacks
const getRedirectUrl = () => {
  // For development, use the current window location
  if (typeof window !== 'undefined') {
    const { protocol, hostname, port } = window.location;
    const baseUrl = `${protocol}//${hostname}${port ? `:${port}` : ''}`;
    console.log('🔧 Supabase redirect URL detected:', baseUrl);
    return baseUrl;
  }
  
  // Server-side fallback - check environment variables in order of preference
  if (import.meta.env.VITE_APP_URL) {
    console.log('🔧 Using VITE_APP_URL:', import.meta.env.VITE_APP_URL);
    return import.meta.env.VITE_APP_URL;
  }
  
  // Check if we're in development mode
  if (import.meta.env.DEV) {
    const vitePort = import.meta.env.VITE_PORT || '5173';
    const devUrl = `http://localhost:${vitePort}`;
    console.log('🔧 Supabase redirect URL (Vite dev):', devUrl);
    return devUrl;
  }
  
  // Production fallback
  const prodUrl = 'https://your-production-domain.com'; // Replace with your actual domain
  console.log('🔧 Supabase redirect URL (production fallback):', prodUrl);
  return prodUrl;
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    debug: import.meta.env.DEV, // Only enable debug in development
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-web'
    }
  }
});

// Database types (unchanged)
export type Database = {
  public: {
    Tables: {
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          service_name: string;
          cost: number;
          billing_cycle: 'monthly' | 'yearly';
          next_renewal: string;
          category: 'software' | 'marketing' | 'finance' | 'other';
          status: 'active' | 'cancelled';
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          service_name: string;
          cost: number;
          billing_cycle: 'monthly' | 'yearly';
          next_renewal: string;
          category: 'software' | 'marketing' | 'finance' | 'other';
          status?: 'active' | 'cancelled';
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          service_name?: string;
          cost?: number;
          billing_cycle?: 'monthly' | 'yearly';
          next_renewal?: string;
          category?: 'software' | 'marketing' | 'finance' | 'other';
          status?: 'active' | 'cancelled';
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      reminders: {
        Row: {
          id: string;
          subscription_id: string;
          reminder_type: '30d' | '7d' | '1d';
          sent_at: string | null;
          status: 'pending' | 'sent' | 'failed';
          created_at: string;
        };
        Insert: {
          id?: string;
          subscription_id: string;
          reminder_type: '30d' | '7d' | '1d';
          sent_at?: string | null;
          status?: 'pending' | 'sent' | 'failed';
          created_at?: string;
        };
        Update: {
          id?: string;
          subscription_id?: string;
          reminder_type?: '30d' | '7d' | '1d';
          sent_at?: string | null;
          status?: 'pending' | 'sent' | 'failed';
          created_at?: string;
        };
      };
    };
  };
};

// Helper function to handle Supabase errors
export const handleSupabaseError = (error: any) => {
  console.error('Supabase error:', error);
  
  if (error?.message) {
    return error.message;
  }
  
  if (error?.error_description) {
    return error.error_description;
  }
  
  return 'An unexpected error occurred. Please try again.';
};

// Test connection function
export const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('subscriptions').select('count').limit(1);
    if (error) throw error;
    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection failed:', error);
    return false;
  }
};

// 🎯 FIXED: Function to get current redirect URL
export const getCurrentRedirectUrl = () => {
  return getRedirectUrl();
};

// 🎯 NEW: Function to check if current URL has auth tokens
export const hasAuthTokensInUrl = () => {
  if (typeof window === 'undefined') return false;
  
  const urlParams = new URLSearchParams(window.location.search);
  const hash = window.location.hash;
  
  // Check for password reset tokens
  return urlParams.has('code') || urlParams.has('access_token') || hash.includes('access_token') || hash.includes('refresh_token');
};

// 🎯 NEW: Function to handle auth callback
export const handleAuthCallback = async () => {
  if (typeof window === 'undefined') return { data: null, error: null };
  
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Auth callback error:', error);
      return { data: null, error };
    }
    
    // Clear URL parameters after successful auth
    if (hasAuthTokensInUrl()) {
      const url = new URL(window.location.href);
      url.search = '';
      url.hash = '';
      window.history.replaceState({}, document.title, url.toString());
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('Auth callback handling failed:', error);
    return { data: null, error };
  }
};