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
      const initialized = await paddleService.initialize();
      setIsInitialized(initialized);
    };

    initPaddle();
  }, []);

  const openCheckout = async (planType: 'pro') => {
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
      // Get the price ID from environment variables
      const priceId = import.meta.env.VITE_PADDLE_PRO_PRICE_ID;
      
      if (!priceId) {
        throw new Error('Price ID not configured for Pro plan');
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
          name: user.user_metadata?.full_name || 'SubTracker User'
        },
        customData: {
          userId: user.id,
          planType: planType
        },
        successUrl: `${window.location.origin}/account?payment=success&plan=${planType}`
      };

      console.log('🚀 Opening Paddle checkout for Pro plan');
      const response = await paddleService.openCheckout(checkoutOptions);

      if (!response.success) {
        throw new Error(response.error || 'Checkout failed');
      }

      // Paddle will handle the checkout flow
      // Success/failure will be handled by the success URL callback
      toast.info('Opening secure checkout...');

      return response;
    } catch (error: any) {
      console.error('❌ Paddle checkout failed:', error);
      setError(error.message || 'Checkout failed');
      toast.error(error.message || 'Checkout failed. Please try again.');
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

  return {
    loading,
    error,
    isInitialized,
    openCheckout,
    handlePaymentSuccess,
    getProducts,
    getPrices
  };
};