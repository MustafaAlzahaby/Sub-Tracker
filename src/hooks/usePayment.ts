import { useState } from 'react';
import { paymobService, PaymentData, PaymobResponse } from '../lib/paymob';
import { useAuth } from './useAuth';
import { useUserPlan } from './useUserPlan';
import toast from 'react-hot-toast';

export const usePayment = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { upgradePlan } = useUserPlan();

  const initiatePayment = async (planType: 'pro' | 'business') => {
    if (!user) {
      toast.error('Please sign in to upgrade your plan');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const planPrices = {
        pro: 4.99,
        business: 19.99
      };

      const amount = planPrices[planType];
      const orderId = `subtracker_${planType}_${user.id}_${Date.now()}`;

      const paymentData: PaymentData = {
        amount: amount,
        currency: 'USD',
        orderId: orderId,
        customerEmail: user.email || '',
        customerName: user.user_metadata?.full_name || 'SubTracker User',
        customerPhone: user.user_metadata?.phone || undefined,
        billingData: {
          email: user.email || '',
          first_name: user.user_metadata?.full_name?.split(' ')[0] || 'Customer',
          last_name: user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || 'User',
          phone_number: user.user_metadata?.phone || '+20100000000',
          apartment: 'NA',
          floor: 'NA',
          street: 'NA',
          building: 'NA',
          shipping_method: 'NA',
          postal_code: 'NA',
          city: 'Cairo',
          country: 'Egypt',
          state: 'Cairo'
        }
      };

      console.log('🚀 Initiating payment for plan:', planType);
      const response = await paymobService.initiatePayment(paymentData);

      // Open payment page in new window
      const paymentWindow = window.open(
        response.payment_url,
        'paymob_payment',
        'width=800,height=600,scrollbars=yes,resizable=yes'
      );

      if (!paymentWindow) {
        throw new Error('Failed to open payment window. Please allow popups for this site.');
      }

      // Listen for payment completion
      const checkPaymentStatus = setInterval(async () => {
        if (paymentWindow.closed) {
          clearInterval(checkPaymentStatus);
          
          // Show success message and upgrade plan
          toast.success(`Successfully upgraded to ${planType.charAt(0).toUpperCase() + planType.slice(1)} plan!`);
          
          // Upgrade the user's plan
          await upgradePlan(planType);
          
          setLoading(false);
        }
      }, 1000);

      return response;
    } catch (error: any) {
      console.error('❌ Payment initiation failed:', error);
      setError(error.message || 'Payment failed');
      toast.error(error.message || 'Payment failed. Please try again.');
      setLoading(false);
      return null;
    }
  };

  const verifyPayment = async (callbackData: any) => {
    try {
      const isValid = paymobService.verifyPayment(callbackData);
      
      if (isValid) {
        toast.success('Payment verified successfully!');
        return true;
      } else {
        toast.error('Payment verification failed');
        return false;
      }
    } catch (error: any) {
      console.error('❌ Payment verification failed:', error);
      toast.error('Payment verification failed');
      return false;
    }
  };

  return {
    loading,
    error,
    initiatePayment,
    verifyPayment
  };
};