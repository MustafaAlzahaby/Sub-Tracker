// Verifona/2Checkout Payment Integration
interface VerifonaConfig {
  merchantCode: string;
  secretKey: string;
  environment: 'sandbox' | 'production';
  currency: string;
}

interface PaymentRequest {
  amount: number;
  currency: string;
  orderId: string;
  customerEmail: string;
  customerName: string;
  productName: string;
  returnUrl: string;
  cancelUrl: string;
}

interface PaymentResponse {
  success: boolean;
  paymentUrl?: string;
  orderId?: string;
  error?: string;
}

class VerifonaService {
  private config: VerifonaConfig;

  constructor() {
    this.config = {
      merchantCode: import.meta.env.VITE_VERIFONA_MERCHANT_CODE || '',
      secretKey: import.meta.env.VITE_VERIFONA_SECRET_KEY || '',
      environment: (import.meta.env.VITE_VERIFONA_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
      currency: 'USD'
    };

    if (!this.config.merchantCode || !this.config.secretKey) {
      console.warn('⚠️ Verifona credentials not found. Please add VITE_VERIFONA_MERCHANT_CODE and VITE_VERIFONA_SECRET_KEY to your .env file');
    }
  }

  private getBaseUrl(): string {
    return this.config.environment === 'production' 
      ? 'https://secure.2checkout.com'
      : 'https://sandbox.2checkout.com';
  }

  private generateSignature(params: Record<string, any>): string {
    // Sort parameters alphabetically
    const sortedKeys = Object.keys(params).sort();
    const paramString = sortedKeys
      .map(key => `${key}=${params[key]}`)
      .join('&');
    
    // In a real implementation, you would use HMAC-SHA256 with your secret key
    // For now, we'll use a simple hash (replace with proper HMAC in production)
    return btoa(paramString + this.config.secretKey).substring(0, 32);
  }

  async initiatePayment(paymentRequest: PaymentRequest): Promise<PaymentResponse> {
    try {
      console.log('🚀 Initiating Verifona payment:', paymentRequest);

      // Prepare payment parameters
      const params = {
        merchant: this.config.merchantCode,
        order_ref: paymentRequest.orderId,
        amount: paymentRequest.amount.toFixed(2),
        currency: paymentRequest.currency,
        product_name: paymentRequest.productName,
        customer_email: paymentRequest.customerEmail,
        customer_name: paymentRequest.customerName,
        return_url: paymentRequest.returnUrl,
        cancel_url: paymentRequest.cancelUrl,
        timestamp: Math.floor(Date.now() / 1000).toString()
      };

      // Generate signature
      const signature = this.generateSignature(params);
      params['signature'] = signature;

      // Create form data for redirect
      const formData = new FormData();
      Object.entries(params).forEach(([key, value]) => {
        formData.append(key, value.toString());
      });

      // For 2Checkout, we need to redirect to their hosted payment page
      const paymentUrl = `${this.getBaseUrl()}/checkout/purchase`;
      
      // Create a form and submit it to redirect to payment page
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = paymentUrl;
      form.style.display = 'none';

      Object.entries(params).forEach(([key, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = value.toString();
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);

      return {
        success: true,
        paymentUrl,
        orderId: paymentRequest.orderId
      };

    } catch (error: any) {
      console.error('❌ Verifona payment initiation failed:', error);
      return {
        success: false,
        error: error.message || 'Payment initiation failed'
      };
    }
  }

  async verifyPayment(callbackData: any): Promise<boolean> {
    try {
      // Verify the payment callback from Verifona/2Checkout
      // In a real implementation, you would verify the signature and payment status
      
      const { order_ref, payment_status, signature } = callbackData;
      
      // Verify signature (implement proper HMAC verification)
      const expectedSignature = this.generateSignature({
        order_ref,
        payment_status,
        merchant: this.config.merchantCode
      });

      if (signature !== expectedSignature) {
        console.error('❌ Payment signature verification failed');
        return false;
      }

      // Check payment status
      return payment_status === 'COMPLETE' || payment_status === 'SUCCESS';
    } catch (error: any) {
      console.error('❌ Payment verification failed:', error);
      return false;
    }
  }

  async getPaymentStatus(orderId: string): Promise<any> {
    try {
      // In a real implementation, you would call the Verifona/2Checkout API
      // to get the payment status
      const response = await fetch(`${this.getBaseUrl()}/api/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${this.config.secretKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get payment status: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('❌ Failed to get payment status:', error);
      throw error;
    }
  }
}

export const verifonaService = new VerifonaService();
export type { PaymentRequest, PaymentResponse };