import { useState, useEffect } from 'react';
<<<<<<< HEAD
import { paddleService, PaddleCheckoutOptions, fetchPaddleProductWithPrices, fetchPaddlePriceWithProduct, listPaddlePrices } from '../lib/paddle';
=======
import { paddleService, PaddleCheckoutOptions } from '../lib/paddle';
>>>>>>> 7074a79d302a33b5a1db8773ddaa93f91f5d4d8a
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
<<<<<<< HEAD
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
=======
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

>>>>>>> 7074a79d302a33b5a1db8773ddaa93f91f5d4d8a

  const openCheckout = async (planType: 'pro', billingCycle: 'monthly' | 'yearly' = 'monthly') => {
    if (!user) {
      toast.error('Please sign in to upgrade your plan');
      return null;
    }
<<<<<<< HEAD
=======

>>>>>>> 7074a79d302a33b5a1db8773ddaa93f91f5d4d8a
    if (!isInitialized) {
      toast.error('Payment system is not ready. Please try again.');
      return null;
    }
<<<<<<< HEAD
=======

>>>>>>> 7074a79d302a33b5a1db8773ddaa93f91f5d4d8a
    setLoading(true);
    setError(null);

    try {
<<<<<<< HEAD
      // Fetch priceId from backend (using your new logic)
      let priceId: string | undefined;
      const proPrices = await listPaddlePrices(import.meta.env.VITE_PADDLE_PRO_PRODUCT_ID);
      if (proPrices && Array.isArray(proPrices.data)) {
        const found = proPrices.data.find((p: any) => p.billing_cycle === billingCycle);
        priceId = found?.id;
      }
      if (!priceId) {
=======
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
>>>>>>> 7074a79d302a33b5a1db8773ddaa93f91f5d4d8a
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

<<<<<<< HEAD
=======
      console.log('🔍 Debug - Final checkoutOptions:', JSON.stringify(checkoutOptions, null, 2));

>>>>>>> 7074a79d302a33b5a1db8773ddaa93f91f5d4d8a
      const response = await paddleService.openCheckout(checkoutOptions);

      if (!response.success) {
        throw new Error(response.error || 'Checkout failed');
      }

      toast.success('Opening secure checkout...');
      return response;

    } catch (error: any) {
<<<<<<< HEAD
      setError(error.message || 'Checkout failed. Please try again.');
      toast.error(error.message || 'Checkout failed. Please try again.');
=======
      console.error('❌ Paddle checkout failed:', error);
      const errorMessage = error.message || 'Checkout failed. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
>>>>>>> 7074a79d302a33b5a1db8773ddaa93f91f5d4d8a
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (planType: 'pro') => {
    try {
<<<<<<< HEAD
=======
      console.log('🎉 Payment successful, upgrading user plan...');
>>>>>>> 7074a79d302a33b5a1db8773ddaa93f91f5d4d8a
      await upgradePlan(planType);
      toast.success('🎉 Welcome to SubTracker Pro! Your plan has been upgraded.');
      return true;
    } catch (error: any) {
<<<<<<< HEAD
=======
      console.error('❌ Failed to upgrade plan after payment:', error);
>>>>>>> 7074a79d302a33b5a1db8773ddaa93f91f5d4d8a
      toast.error('Payment successful but failed to upgrade plan. Please contact support.');
      return false;
    }
  };

<<<<<<< HEAD
  // Adapted to use backend proxy functions
  const getProducts = async (productId: string) => {
    try {
      return await fetchPaddleProductWithPrices(productId);
=======
  const getProducts = async () => {
    try {
      return await paddleService.getProducts();
>>>>>>> 7074a79d302a33b5a1db8773ddaa93f91f5d4d8a
    } catch (error: any) {
      console.error('❌ Failed to fetch products:', error);
      return [];
    }
  };

  const getPrices = async (productId: string) => {
    try {
<<<<<<< HEAD
      return await listPaddlePrices(productId);
=======
      return await paddleService.getPrices(productId);
>>>>>>> 7074a79d302a33b5a1db8773ddaa93f91f5d4d8a
    } catch (error: any) {
      console.error('❌ Failed to fetch prices:', error);
      return [];
    }
  };

  // Helper method to get available billing options for Pro plan
<<<<<<< HEAD
  const getProPlanOptions = async () => {
    try {
      const prices = await listPaddlePrices(import.meta.env.VITE_PADDLE_PRO_PRODUCT_ID);
      if (!prices || !Array.isArray(prices.data)) {
        return [];
      }
      return prices.data.map((price: any) => ({
        type: price.billing_cycle as 'monthly' | 'yearly',
        priceId: price.id
=======
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
>>>>>>> 7074a79d302a33b5a1db8773ddaa93f91f5d4d8a
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
