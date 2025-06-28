import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Database types
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