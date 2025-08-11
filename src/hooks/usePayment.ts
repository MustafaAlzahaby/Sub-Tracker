import { useState } from 'react';
import { verifonaService, PaymentRequest, PaymentResponse } from '../lib/verifona';
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

    // Only support pro plan now
    if (planType !== 'pro') {
      toast.error('Only Pro plan is available for upgrade');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const planPrice = 7.99; // Pro plan price
      const orderId = `subtracker_pro_${user.id}_${Date.now()}`;

      // Get current URL for return/cancel URLs
      const baseUrl = window.location.origin;
      const returnUrl = `${baseUrl}/account?payment=success`;
      const cancelUrl = `${baseUrl}/account?payment=cancelled`;

      const paymentRequest: PaymentRequest = {
        amount: planPrice,
        currency: 'USD',
        orderId: orderId,
        customerEmail: user.email || '',
        customerName: user.user_metadata?.full_name || 'SubTracker User',
        productName: 'SubTracker Pro Plan - Monthly Subscription',
        returnUrl,
        cancelUrl
      };

      console.log('🚀 Initiating Verifona payment for Pro plan');
      const response = await verifonaService.initiatePayment(paymentRequest);

      if (!response.success) {
        throw new Error(response.error || 'Payment initiation failed');
      }

      // The payment form will redirect to Verifona/2Checkout
      // Success/failure will be handled by return URLs
      toast.info('Redirecting to secure payment page...');

      return response;
    } catch (error: any) {
      console.error('❌ Verifona payment initiation failed:', error);
      setError(error.message || 'Payment failed');
      toast.error(error.message || 'Payment failed. Please try again.');
      setLoading(false);
      return null;
    }
  };

  const verifyPayment = async (callbackData: any) => {
    try {
      const isValid = verifonaService.verifyPayment(callbackData);
      
      if (isValid) {
        toast.success('Payment verified successfully!');
        // Upgrade the user's plan
        await upgradePlan('pro');
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