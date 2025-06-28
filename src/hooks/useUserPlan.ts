import { useState, useEffect, useCallback } from 'react';
import { supabase, handleSupabaseError } from '../lib/supabase';
import { useAuth } from './useAuth';
import toast from 'react-hot-toast';

export type PlanType = 'free' | 'pro' | 'business';

export interface UserPlan {
  id: string;
  user_id: string;
  plan_type: PlanType;
  subscription_limit: number;
  features: {
    analytics: boolean;
    reports: boolean;
    team_features: boolean;
    api_access: boolean;
  };
  created_at: string;
  updated_at: string;
}

export interface PlanLimits {
  subscriptions: number;
  analytics: boolean;
  reports: boolean;
  teamFeatures: boolean;
  apiAccess: boolean;
  reminders: number;
  exportData: boolean;
}

const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  free: {
    subscriptions: 5,
    analytics: false,
    reports: false,
    teamFeatures: false,
    apiAccess: false,
    reminders: 3,
    exportData: false
  },
  pro: {
    subscriptions: -1, // unlimited
    analytics: true,
    reports: true,
    teamFeatures: false,
    apiAccess: false,
    reminders: -1, // unlimited
    exportData: true
  },
  business: {
    subscriptions: -1, // unlimited
    analytics: true,
    reports: true,
    teamFeatures: true,
    apiAccess: true,
    reminders: -1, // unlimited
    exportData: true
  }
};

export const useUserPlan = () => {
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchUserPlan = useCallback(async () => {
    if (!user) {
      setUserPlan(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('user_plans')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (fetchError) {
        // If no plan exists, create a default free plan
        if (fetchError.code === 'PGRST116') {
          const { data: newPlan, error: createError } = await supabase
            .from('user_plans')
            .insert({
              user_id: user.id,
              plan_type: 'free',
              subscription_limit: 5,
              features: {
                analytics: false,
                reports: false,
                team_features: false,
                api_access: false
              }
            })
            .select()
            .single();

          if (createError) {
            throw createError;
          }
          setUserPlan(newPlan);
        } else {
          throw fetchError;
        }
      } else {
        setUserPlan(data);
      }
    } catch (error: any) {
      const errorMessage = handleSupabaseError(error);
      setError(errorMessage);
      console.error('Error fetching user plan:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const upgradePlan = useCallback(async (newPlan: PlanType) => {
    if (!user || !userPlan) {
      toast.error('User not authenticated');
      return;
    }

    try {
      const limits = PLAN_LIMITS[newPlan];
      const { data, error } = await supabase
        .from('user_plans')
        .update({
          plan_type: newPlan,
          subscription_limit: limits.subscriptions === -1 ? 999999 : limits.subscriptions,
          features: {
            analytics: limits.analytics,
            reports: limits.reports,
            team_features: limits.teamFeatures,
            api_access: limits.apiAccess
          }
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setUserPlan(data);
      toast.success(`Successfully upgraded to ${newPlan.charAt(0).toUpperCase() + newPlan.slice(1)} plan!`);
    } catch (error: any) {
      const errorMessage = handleSupabaseError(error);
      toast.error('Failed to upgrade plan: ' + errorMessage);
      console.error('Error upgrading plan:', error);
    }
  }, [user, userPlan]);

  // Stable reference for checkFeatureAccess
  const checkFeatureAccess = useCallback((feature: keyof PlanLimits): boolean => {
    if (!userPlan) return false;
    
    const limits = PLAN_LIMITS[userPlan.plan_type];
    const featureValue = limits[feature];
    
    if (typeof featureValue === 'boolean') {
      return featureValue;
    }
    
    return featureValue === -1 || featureValue > 0;
  }, [userPlan]);

  const checkSubscriptionLimit = useCallback((currentCount: number): boolean => {
    if (!userPlan) return false;
    
    const limits = PLAN_LIMITS[userPlan.plan_type];
    return limits.subscriptions === -1 || currentCount < limits.subscriptions;
  }, [userPlan]);

  const getPlanLimits = useCallback((): PlanLimits => {
    if (!userPlan) return PLAN_LIMITS.free;
    return PLAN_LIMITS[userPlan.plan_type];
  }, [userPlan]);

  useEffect(() => {
    fetchUserPlan();
  }, [fetchUserPlan]);

  return {
    userPlan,
    loading,
    error,
    upgradePlan,
    checkFeatureAccess,
    checkSubscriptionLimit,
    getPlanLimits,
    refetch: fetchUserPlan
  };
};