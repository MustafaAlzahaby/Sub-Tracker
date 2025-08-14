import { useState, useEffect } from 'react';
import { supabase, handleSupabaseError } from '../lib/supabase';
import { useAuth } from './useAuth';
import { useUserPlan } from './useUserPlan';
import { useNotifications } from './useNotifications';
import toast from 'react-hot-toast';

export interface Subscription {
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
}

export interface CreateSubscriptionData {
  service_name: string;
  cost: number;
  billing_cycle: 'monthly' | 'yearly';
  next_renewal: string;
  category: 'software' | 'marketing' | 'finance' | 'other';
  status?: 'active' | 'cancelled';
  notes?: string;
}

export const useSubscriptions = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { checkSubscriptionLimit } = useUserPlan();
  const { createNotification, checkForNewNotifications } = useNotifications();

  const fetchSubscriptions = async () => {
    if (!user) {
      setSubscriptions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setSubscriptions(data || []);
    } catch (error: any) {
      const errorMessage = handleSupabaseError(error);
      setError(errorMessage);
      toast.error('Failed to load subscriptions: ' + errorMessage);
      console.error('Error fetching subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const addSubscription = async (subscriptionData: CreateSubscriptionData) => {
    if (!user) {
      toast.error('You must be logged in to add subscriptions');
      throw new Error('User not authenticated');
    }

    // Check subscription limit
    const activeCount = subscriptions.filter(sub => sub.status === 'active').length;
    if (!checkSubscriptionLimit(activeCount)) {
      createNotification(
        'plan_limit',
        'Subscription Limit Reached',
        'You have reached your subscription limit. Upgrade to Pro for unlimited subscriptions.'
      );
      toast.error('Subscription limit reached. Please upgrade your plan.');
      throw new Error('Subscription limit reached');
    }

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .insert({
          ...subscriptionData,
          user_id: user.id,
          status: subscriptionData.status || 'active',
          notes: subscriptionData.notes || ''
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      setSubscriptions(prev => [data, ...prev]);
      toast.success(`${subscriptionData.service_name} subscription added successfully!`);
      
      // 🎯 IMMEDIATELY check for new notifications after adding subscription
      setTimeout(() => {
        checkForNewNotifications(true);
      }, 1000);
      
      return data;
    } catch (error: any) {
      const errorMessage = handleSupabaseError(error);
      toast.error('Failed to add subscription: ' + errorMessage);
      console.error('Error adding subscription:', error);
      throw error;
    }
  };

  const updateSubscription = async (id: string, updates: Partial<CreateSubscriptionData>) => {
    if (!user) {
      toast.error('You must be logged in to update subscriptions');
      throw new Error('User not authenticated');
    }

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id) // Ensure user can only update their own subscriptions
        .select()
        .single();

      if (error) {
        throw error;
      }

      setSubscriptions(prev => 
        prev.map(sub => sub.id === id ? data : sub)
      );
      
      toast.success('Subscription updated successfully!');
      
      // 🎯 IMMEDIATELY check for new notifications after updating subscription
      setTimeout(() => {
        checkForNewNotifications(true);
      }, 1000);
      
      return data;
    } catch (error: any) {
      const errorMessage = handleSupabaseError(error);
      toast.error('Failed to update subscription: ' + errorMessage);
      console.error('Error updating subscription:', error);
      throw error;
    }
  };

  const deleteSubscription = async (id: string) => {
    if (!user) {
      toast.error('You must be logged in to delete subscriptions');
      throw new Error('User not authenticated');
    }

    try {
      const { error } = await supabase
        .from('subscriptions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id); // Ensure user can only delete their own subscriptions

      if (error) {
        throw error;
      }

      setSubscriptions(prev => prev.filter(sub => sub.id !== id));
      toast.success('Subscription deleted successfully!');
    } catch (error: any) {
      const errorMessage = handleSupabaseError(error);
      toast.error('Failed to delete subscription: ' + errorMessage);
      console.error('Error deleting subscription:', error);
      throw error;
    }
  };

  const toggleSubscriptionStatus = async (id: string) => {
    const subscription = subscriptions.find(sub => sub.id === id);
    if (!subscription) return;

    const newStatus = subscription.status === 'active' ? 'cancelled' : 'active';
    
    try {
      await updateSubscription(id, { status: newStatus });
      toast.success(`Subscription ${newStatus === 'active' ? 'activated' : 'cancelled'} successfully!`);
    } catch (error) {
      // Error already handled in updateSubscription
    }
  };

  // Real-time subscription updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('subscriptions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscriptions',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🔄 Real-time subscription change:', payload.eventType);
          
          switch (payload.eventType) {
            case 'INSERT':
              setSubscriptions(prev => {
                const exists = prev.find(sub => sub.id === payload.new.id);
                if (exists) return prev;
                return [payload.new as Subscription, ...prev];
              });
              // Check for notifications when new subscription is added via real-time
              setTimeout(() => {
                checkForNewNotifications(true);
              }, 2000);
              break;
            case 'UPDATE':
              setSubscriptions(prev =>
                prev.map(sub => sub.id === payload.new.id ? payload.new as Subscription : sub)
              );
              // Check for notifications when subscription is updated via real-time
              setTimeout(() => {
                checkForNewNotifications(true);
              }, 2000);
              break;
            case 'DELETE':
              setSubscriptions(prev => prev.filter(sub => sub.id !== payload.old.id));
              break;
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, checkForNewNotifications]);

  // Fetch subscriptions when user changes
  useEffect(() => {
    fetchSubscriptions();
  }, [user]);

  return {
    subscriptions,
    loading,
    error,
    addSubscription,
    updateSubscription,
    deleteSubscription,
    toggleSubscriptionStatus,
    refetch: fetchSubscriptions
  };
};