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

    // Add a small delay to ensure DOM is ready
    const timer = setTimeout(initPaddle, 1000);
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

  const openCheckout = async (planType: 'pro', billingCycle: 'monthly' | 'yearly' = 'monthly') => {
    if (!user) {
      toast.error('Please sign in to upgrade your plan');
      return null;
    }
    
    if (!isInitialized) {
      toast.error('Payment system is not ready. Please try again in a moment.');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      // Validate price ID exists
      const priceId = validatePriceId(planType, billingCycle);
      
      console.log('🛒 Opening checkout for:', { 
        planType, 
        billingCycle, 
        priceId,
        userEmail: user.email,
        environment: import.meta.env.VITE_PADDLE_ENV
      });

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
        successUrl: `${window.location.origin}/account?payment=success&plan=${planType}&cycle=${billingCycle}`,
        settings: {
          displayMode: 'overlay',
          theme: 'light',
          locale: 'en',
          allowLogout: false,
          showAddTaxId: false,
          showAddDiscounts: true
        }
      };

      // Try normal checkout first
      let response = await paddleService.openCheckout(checkoutOptions);

      // If normal checkout fails in development, try window mode
      if (!response.success && window.location.hostname === 'localhost') {
        console.log('🔄 Checkout overlay failed, trying window mode for development...');
        console.log('Opening secure checkout in new window...');
        response = await paddleService.openCheckoutWindow(checkoutOptions);
      }

      if (!response.success) {
        throw new Error(response.error || 'Checkout failed');
      }

      if (response.checkoutId === 'hosted_checkout' || response.checkoutId === 'hosted_checkout_fallback') {
        console.log('Secure checkout opened in new window. Complete your payment there.');
      } else {
        console.log('Opening secure checkout...');
      }

      return response;

    } catch (error: any) {
      console.error('❌ Checkout error:', error);
      
      let errorMessage = 'Checkout failed. Please try again.';
      
      if (error.message.includes('Missing VITE_PADDLE')) {
        errorMessage = 'Payment configuration error. Please contact support.';
      } else if (error.message.includes('403')) {
        errorMessage = 'Authentication failed. Please check your payment configuration.';
      } else if (error.message.includes('frame')) {
        errorMessage = 'Checkout blocked by browser. Trying alternative method...';
        
        // Try window mode as fallback
        try {
          const priceId = validatePriceId(planType, billingCycle);
          const fallbackOptions: PaddleCheckoutOptions = {
            items: [{ priceId, quantity: 1 }],
            customer: {
              email: user.email || '',
              name: user.user_metadata?.full_name || user.email || 'SubTracker User'
            },
            customData: { userId: user.id, planType },
            successUrl: `${window.location.origin}/account?payment=success&plan=${planType}&cycle=${billingCycle}`,
          };
          
          const fallbackResponse = await paddleService.openCheckoutWindow(fallbackOptions);
          if (fallbackResponse.success) {
            toast.success('Secure checkout opened in new window.');
            return fallbackResponse;
          }
        } catch (fallbackError) {
          console.error('❌ Fallback also failed:', fallbackError);
        }
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

  // Helper method to get available billing options for Pro plan
  const getProPlanOptions = () => {
    return [
      {
        type: 'monthly' as const,
        priceId: import.meta.env.VITE_PADDLE_PRO_MONTHLY_PRICE_ID,
        productId: import.meta.env.VITE_PADDLE_PRO_MONTHLY_PRODUCT_ID,
        price: '$7.99',
        period: 'per month',
        available: !!import.meta.env.VITE_PADDLE_PRO_MONTHLY_PRICE_ID
      },
      {
        type: 'yearly' as const,
        priceId: import.meta.env.VITE_PADDLE_PRO_YEARLY_PRICE_ID,
        productId: import.meta.env.VITE_PADDLE_PRO_YEARLY_PRODUCT_ID,
        price: '$79.99',
        period: 'per year',
        savings: 'Save 17%',
        available: !!import.meta.env.VITE_PADDLE_PRO_YEARLY_PRICE_ID
      }
    ];
  };

  // Debug helper
  const debugPaddleConfig = () => {
    const config = {
      environment: import.meta.env.VITE_PADDLE_ENV,
      hasClientToken: !!import.meta.env.VITE_PADDLE_CLIENT_TOKEN,
      clientTokenPrefix: import.meta.env.VITE_PADDLE_CLIENT_TOKEN?.substring(0, 15) + '...',
      vendorId: import.meta.env.VITE_PADDLE_VENDOR_ID,
      monthlyPriceId: import.meta.env.VITE_PADDLE_PRO_MONTHLY_PRICE_ID,
      yearlyPriceId: import.meta.env.VITE_PADDLE_PRO_YEARLY_PRICE_ID,
      isInitialized,
      currentUrl: window.location.href
    };
    
    console.table(config);
    return config;
  };

  // Test function for development
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
    testPaddleConnection
  }};