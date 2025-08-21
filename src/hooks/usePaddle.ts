import { useState, useEffect } from 'react';
import { paddleService, PaddleCheckoutOptions } from '../lib/paddle';
import { useAuth } from './useAuth';
import { useUserPlan } from './useUserPlan';
import toast from 'react-hot-toast';

export const usePaddle = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const { user } = useAuth();
  const { upgradePlan } = useUserPlan();

  // Initialize Paddle on mount
 useEffect(() => {
  const initPaddle = async () => {
    try {
      const initialized = await paddleService.initialize();
      console.log('🔍 Paddle Initialized:', initialized);  // Log Paddle initialization status
      setIsInitialized(initialized);
      if (!initialized) {
        console.error('❌ Failed to initialize Paddle');
      }
   } catch (error) {
     console.error('❌ Error initializing Paddle:', error);
     setIsInitialized(false);  // Ensure the state reflects initialization failure
   }
 };

 initPaddle();
}, []);  // Only run on mount


  const openCheckout = async (planType: 'pro', billingCycle: 'monthly' | 'yearly' = 'monthly') => {
    if (!user) {
      toast.error('Please sign in to upgrade your plan');
      return null;
    }

    if (!isInitialized) {
      toast.error('Payment system is not ready. Please try again.');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      // Debug: Log the inputs
      console.log('🔍 Debug - planType:', planType);
      console.log('🔍 Debug - billingCycle:', billingCycle);
      
      // Get the price ID using the paddleService method
      let priceId: string;
      try {
        priceId = paddleService.getPriceId('Pro', billingCycle);
        console.log('🔍 Debug - priceId from service:', priceId);
      } catch (priceError) {
        console.error('❌ Failed to get price ID:', priceError);
        throw new Error(`Failed to get price for ${billingCycle} plan. Please check your pricing configuration.`);
      }

      // Validate price ID
      if (!priceId || priceId === 'undefined') {
        throw new Error(`Invalid price ID for ${billingCycle} plan`);
      }

      const checkoutOptions: PaddleCheckoutOptions = {
        items: [
          {
            priceId: priceId,
            quantity: 1
          }
        ],
        customer: {
          email: user.email || '',
          name: user.user_metadata?.full_name || user.email || 'SubTracker User'
        },
        customData: {
          userId: user.id,
          planType: planType
        },
        successUrl: `${window.location.origin}/account?payment=success&plan=${planType}`,
        settings: {
          displayMode: 'overlay',
          theme: 'light',
          locale: 'en',
          allowLogout: false,
          showAddTaxId: false,
          showAddDiscounts: true
        }
      };

      console.log('🔍 Debug - Final checkoutOptions:', JSON.stringify(checkoutOptions, null, 2));

      const response = await paddleService.openCheckout(checkoutOptions);

      if (!response.success) {
        throw new Error(response.error || 'Checkout failed');
      }

      toast.success('Opening secure checkout...');
      return response;

    } catch (error: any) {
      console.error('❌ Paddle checkout failed:', error);
      const errorMessage = error.message || 'Checkout failed. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (planType: 'pro') => {
    try {
      console.log('🎉 Payment successful, upgrading user plan...');
      await upgradePlan(planType);
      toast.success('🎉 Welcome to SubTracker Pro! Your plan has been upgraded.');
      return true;
    } catch (error: any) {
      console.error('❌ Failed to upgrade plan after payment:', error);
      toast.error('Payment successful but failed to upgrade plan. Please contact support.');
      return false;
    }
  };

  const getProducts = async () => {
    try {
      return await paddleService.getProducts();
    } catch (error: any) {
      console.error('❌ Failed to fetch products:', error);
      return [];
    }
  };

  const getPrices = async (productId: string) => {
    try {
      return await paddleService.getPrices(productId);
    } catch (error: any) {
      console.error('❌ Failed to fetch prices:', error);
      return [];
    }
  };

  // Helper method to get available billing options for Pro plan
  const getProPlanOptions = () => {
    try {
      const pricesJson = import.meta.env.VITE_PADDLE_PRICES_JSON;
      if (!pricesJson) {
        console.warn('⚠️ VITE_PADDLE_PRICES_JSON not found');
        return [];
      }

      const prices = JSON.parse(pricesJson);
      const proPrices = prices.Pro;

      if (!proPrices) {
        console.warn('⚠️ Pro prices not found in configuration');
        return [];
      }

      return Object.keys(proPrices).map(billingCycle => ({
        type: billingCycle as 'monthly' | 'yearly',
        priceId: proPrices[billingCycle]
      }));
    } catch (error) {
      console.error('❌ Failed to get Pro plan options:', error);
      return [];
    }
  };

  return {
    loading,
    error,
    isInitialized,
    openCheckout,
    handlePaymentSuccess,
    getProducts,
    getPrices,
    getProPlanOptions
  };
};
