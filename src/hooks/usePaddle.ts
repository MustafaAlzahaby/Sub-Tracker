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
        console.log('🚀 Initializing Paddle...');
        const initialized = await paddleService.initialize();
        setIsInitialized(initialized);
        if (initialized) {
          console.log('✅ Paddle initialized successfully');
        } else {
          console.error('❌ Failed to initialize Paddle');
          setError('Failed to initialize payment system');
        }
      } catch (error: any) {
        setIsInitialized(false);
        console.error('❌ Error initializing Paddle:', error);
        setError('Payment system initialization failed');
      }
    };

    const timer = setTimeout(initPaddle, 600); // small delay so Paddle script attaches
    return () => clearTimeout(timer);
  }, []);

  const validatePriceId = (planType: 'pro', billingCycle: 'monthly' | 'yearly') => {
    const priceId = paddleService.getPriceId(planType, billingCycle);
    if (!priceId || priceId === 'undefined') {
      const envVar = billingCycle === 'monthly'
        ? 'VITE_PADDLE_PRO_MONTHLY_PRICE_ID'
        : 'VITE_PADDLE_PRO_YEARLY_PRICE_ID';
      throw new Error(`Missing ${envVar} in environment variables`);
    }
    return priceId;
  };

  const openCheckout = async (
    planType: 'pro',
    billingCycle: 'monthly' | 'yearly' = 'monthly'
  ) => {
    if (!user) {
      toast.error('Please sign in to upgrade your plan');
      return null;
    }

    // We’ll allow localhost to proceed even if overlay didn’t initialize (we use hosted)
    if (!isInitialized && window.location.hostname !== 'localhost') {
      toast.error('Payment system is not ready. Please try again in a moment.');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      // Validate price ID exists
      const priceId = validatePriceId(planType, billingCycle);

      const successUrl = `${window.location.origin}/account?payment=success&plan=${planType}&cycle=${billingCycle}`;

      console.log('🛒 Opening checkout for:', {
        planType,
        billingCycle,
        priceId,
        userEmail: user.email,
        environment: import.meta.env.VITE_PADDLE_ENVIRONMENT, // use ENVIRONMENT
        successUrl,
      });

      const checkoutOptions: PaddleCheckoutOptions = {
        items: [{ priceId, quantity: 1 }],
        customer: {
          email: user.email || '',
          name: user.user_metadata?.full_name || user.email || 'SubTracker User',
        },
        customData: { userId: user.id, planType },
        successUrl,
        settings: {
          displayMode: 'overlay', // overlay for real domains
          theme: 'light',
          locale: 'en',
          allowLogout: false,
          showAddTaxId: false,
          showAddDiscounts: true,
          variant: 'one-page',
        },
      };

      const isLocal =
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1';

      // 👉 On localhost use HOSTED checkout via our function to avoid CSP/frame-ancestors
      if (isLocal) {
        const base = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paddle-webhook`;
        const res = await fetch(`${base}/create-transaction`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }, // OPTIONS handled by function
          body: JSON.stringify({
            items: [{ priceId, quantity: 1 }],
            customer: { email: user.email || '' },
            customData: { userId: user.id, planType },
            successUrl,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          console.error('❌ Hosted checkout API failed:', data);
          throw new Error(
            data?.error?.detail ||
              data?.error ||
              'Hosted checkout failed (create-transaction)'
          );
        }

        const checkoutUrl = data?.data?.checkout_url;
        if (!checkoutUrl) {
          console.error('❌ No checkout_url in response:', data);
          throw new Error('Hosted checkout failed: missing checkout_url');
        }

        window.open(checkoutUrl, '_blank', 'noopener,noreferrer');
        toast.success('Secure checkout opened in a new tab.');
        return { success: true, checkoutId: 'hosted_checkout' };
      }

      // 👉 Non-localhost (approved domain) → try overlay
      let response = await paddleService.openCheckout(checkoutOptions);

      // Fallback to hosted even on real domain if overlay fails
      if (!response.success) {
        console.warn('⚠️ Overlay failed; trying hosted create-transaction fallback…');
        const base = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paddle-webhook`;
        const res = await fetch(`${base}/create-transaction`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: [{ priceId, quantity: 1 }],
            customer: { email: user.email || '' },
            customData: { userId: user.id, planType },
            successUrl,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Hosted fallback failed');

        const checkoutUrl = data?.data?.checkout_url;
        if (!checkoutUrl) throw new Error('Hosted fallback missing checkout_url');

        window.open(checkoutUrl, '_blank', 'noopener,noreferrer');
        toast.success('Secure checkout opened in a new tab.');
        return { success: true, checkoutId: 'hosted_checkout_fallback' };
      }

      return response;
    } catch (error: any) {
      console.error('❌ Checkout error:', error);
      let errorMessage = 'Checkout failed. Please try again.';

      if (error.message?.includes('Missing VITE_PADDLE')) {
        errorMessage = 'Payment configuration error. Please contact support.';
      } else if (error.message?.includes('403')) {
        errorMessage =
          'Vendor is not allowed to create live transactions yet. Use sandbox or contact Paddle support.';
      }
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (planType: 'pro') => {
    try {
      console.log('🎉 Processing payment success for plan:', planType);
      await upgradePlan(planType);
      toast.success('🎉 Welcome to SubTracker Pro! Your plan has been upgraded.');
      return true;
    } catch (error: any) {
      console.error('❌ Failed to upgrade plan after payment:', error);
      toast.error('Payment successful but failed to upgrade plan. Please contact support.');
      return false;
    }
  };

  const getProPlanOptions = () => {
    return [
      {
        type: 'monthly' as const,
        priceId: import.meta.env.VITE_PADDLE_PRO_MONTHLY_PRICE_ID,
        productId: import.meta.env.VITE_PADDLE_PRO_MONTHLY_PRODUCT_ID,
        price: '$7.99',
        period: 'per month',
        available: !!import.meta.env.VITE_PADDLE_PRO_MONTHLY_PRICE_ID,
      },
      {
        type: 'yearly' as const,
        priceId: import.meta.env.VITE_PADDLE_PRO_YEARLY_PRICE_ID,
        productId: import.meta.env.VITE_PADDLE_PRO_YEARLY_PRODUCT_ID,
        price: '$79.99',
        period: 'per year',
        savings: 'Save 17%',
        available: !!import.meta.env.VITE_PADDLE_PRO_YEARLY_PRICE_ID,
      },
    ];
  };

  const debugPaddleConfig = () => {
    const config = {
      environment: import.meta.env.VITE_PADDLE_ENVIRONMENT, // <- unify on ENVIRONMENT
      hasClientToken: !!import.meta.env.VITE_PADDLE_CLIENT_TOKEN,
      clientTokenPrefix: import.meta.env.VITE_PADDLE_CLIENT_TOKEN?.substring(0, 15) + '...',
      vendorId: import.meta.env.VITE_PADDLE_VENDOR_ID,
      monthlyPriceId: import.meta.env.VITE_PADDLE_PRO_MONTHLY_PRICE_ID,
      yearlyPriceId: import.meta.env.VITE_PADDLE_PRO_YEARLY_PRICE_ID,
      isInitialized,
      currentUrl: window.location.href,
    };

    console.table(config);
    return config;
  };

  const testPaddleConnection = async () => {
    try {
      console.log('🧪 Testing Paddle connection...');
      debugPaddleConfig();

      const initialized = await paddleService.initialize();
      if (initialized) {
        console.log('✅ Paddle connection test successful');
        toast.success('Paddle connection test successful');
      } else {
        console.error('❌ Paddle connection test failed');
        toast.error('Paddle connection test failed');
      }

      return initialized;
    } catch (error: any) {
      console.error('❌ Paddle connection test error:', error);
      toast.error(`Paddle test failed: ${error.message}`);
      return false;
    }
  };

  return {
    loading,
    error,
    isInitialized,
    openCheckout,
    handlePaymentSuccess,
    getProPlanOptions,
    debugPaddleConfig,
    testPaddleConnection,
  };
};
