import { useState, useEffect } from 'react';
import { paddleService, PaddleCheckoutOptions, fetchPaddleProductWithPrices, fetchPaddlePriceWithProduct, listPaddlePrices } from '../lib/paddle';
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
        setIsInitialized(initialized);
        if (!initialized) {
          console.error('❌ Failed to initialize Paddle');
        }
      } catch (error) {
        setIsInitialized(false);
        console.error('❌ Error initializing Paddle:', error);
      }
    };
    initPaddle();
  }, []);

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
      // Fetch priceId from backend (using your new logic)
      let priceId: string | undefined;
      const proPrices = await listPaddlePrices(import.meta.env.VITE_PADDLE_PRO_PRODUCT_ID);
      if (proPrices && Array.isArray(proPrices.data)) {
        const found = proPrices.data.find((p: any) => p.billing_cycle === billingCycle);
        priceId = found?.id;
      }
      if (!priceId) {
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

      const response = await paddleService.openCheckout(checkoutOptions);

      if (!response.success) {
        throw new Error(response.error || 'Checkout failed');
      }

      toast.success('Opening secure checkout...');
      return response;

    } catch (error: any) {
      setError(error.message || 'Checkout failed. Please try again.');
      toast.error(error.message || 'Checkout failed. Please try again.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (planType: 'pro') => {
    try {
      await upgradePlan(planType);
      toast.success('🎉 Welcome to SubTracker Pro! Your plan has been upgraded.');
      return true;
    } catch (error: any) {
      toast.error('Payment successful but failed to upgrade plan. Please contact support.');
      return false;
    }
  };

  // Adapted to use backend proxy functions
  const getProducts = async (productId: string) => {
    try {
      return await fetchPaddleProductWithPrices(productId);
    } catch (error: any) {
      console.error('❌ Failed to fetch products:', error);
      return [];
    }
  };

  const getPrices = async (productId: string) => {
    try {
      return await listPaddlePrices(productId);
    } catch (error: any) {
      console.error('❌ Failed to fetch prices:', error);
      return [];
    }
  };

  // Helper method to get available billing options for Pro plan
  const getProPlanOptions = async () => {
    try {
      const prices = await listPaddlePrices(import.meta.env.VITE_PADDLE_PRO_PRODUCT_ID);
      if (!prices || !Array.isArray(prices.data)) {
        return [];
      }
      return prices.data.map((price: any) => ({
        type: price.billing_cycle as 'monthly' | 'yearly',
        priceId: price.id
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
