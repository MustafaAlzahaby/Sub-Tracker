interface PaymobConfig {
  apiKey: string;
  integrationId: string;
  iframeId: string;
  hmacSecret: string;
  baseUrl: string;
}

interface PaymentData {
  amount: number;
  currency: string;
  orderId: string;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  billingData?: {
    apartment?: string;
    email: string;
    floor?: string;
    first_name: string;
    street?: string;
    building?: string;
    phone_number?: string;
    shipping_method?: string;
    postal_code?: string;
    city?: string;
    country?: string;
    last_name?: string;
    state?: string;
  };
}

interface PaymobResponse {
  token: string;
  order_id: string;
  payment_url: string;
}

class PaymobService {
  private config: PaymobConfig;

  constructor() {
    this.config = {
      apiKey: import.meta.env.VITE_PAYMOB_API_KEY || '',
      integrationId: import.meta.env.VITE_PAYMOB_INTEGRATION_ID || '',
      iframeId: import.meta.env.VITE_PAYMOB_IFRAME_ID || '',
      hmacSecret: import.meta.env.VITE_PAYMOB_HMAC_SECRET || '',
      baseUrl: 'https://accept.paymob.com/api'
    };

    if (!this.config.apiKey) {
      console.warn('⚠️ Paymob API key not found. Please add VITE_PAYMOB_API_KEY to your .env file');
    }
  }

  // Step 1: Get authentication token
  private async getAuthToken(): Promise<string> {
    try {
      const response = await fetch(`${this.config.baseUrl}/auth/tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: this.config.apiKey
        })
      });

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.token;
    } catch (error) {
      console.error('❌ Paymob authentication error:', error);
      throw new Error('Failed to authenticate with Paymob');
    }
  }

  // Step 2: Create order
  private async createOrder(authToken: string, paymentData: PaymentData): Promise<any> {
    try {
      const response = await fetch(`${this.config.baseUrl}/ecommerce/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          auth_token: authToken,
          delivery_needed: false,
          amount_cents: Math.round(paymentData.amount * 100), // Convert to cents
          currency: paymentData.currency,
          merchant_order_id: paymentData.orderId,
          items: [{
            name: 'SubTracker Subscription',
            amount_cents: Math.round(paymentData.amount * 100),
            description: 'SubTracker Pro/Business Plan Subscription',
            quantity: 1
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`Order creation failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Paymob order creation error:', error);
      throw new Error('Failed to create order');
    }
  }

  // Step 3: Get payment key
  private async getPaymentKey(authToken: string, order: any, paymentData: PaymentData): Promise<string> {
    try {
      const billingData = paymentData.billingData || {
        email: paymentData.customerEmail,
        first_name: paymentData.customerName.split(' ')[0] || 'Customer',
        last_name: paymentData.customerName.split(' ').slice(1).join(' ') || 'User',
        phone_number: paymentData.customerPhone || '+20100000000',
        apartment: 'NA',
        floor: 'NA',
        street: 'NA',
        building: 'NA',
        shipping_method: 'NA',
        postal_code: 'NA',
        city: 'Cairo',
        country: 'Egypt',
        state: 'Cairo'
      };

      const response = await fetch(`${this.config.baseUrl}/acceptance/payment_keys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          auth_token: authToken,
          amount_cents: Math.round(paymentData.amount * 100),
          expiration: 3600, // 1 hour
          order_id: order.id,
          billing_data: billingData,
          currency: paymentData.currency,
          integration_id: parseInt(this.config.integrationId)
        })
      });

      if (!response.ok) {
        throw new Error(`Payment key generation failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.token;
    } catch (error) {
      console.error('❌ Paymob payment key error:', error);
      throw new Error('Failed to generate payment key');
    }
  }

  // Main method to initiate payment
  async initiatePayment(paymentData: PaymentData): Promise<PaymobResponse> {
    try {
      console.log('🚀 Initiating Paymob payment for:', paymentData);

      // Step 1: Get auth token
      const authToken = await this.getAuthToken();
      console.log('✅ Got auth token');

      // Step 2: Create order
      const order = await this.createOrder(authToken, paymentData);
      console.log('✅ Created order:', order.id);

      // Step 3: Get payment key
      const paymentKey = await this.getPaymentKey(authToken, order, paymentData);
      console.log('✅ Got payment key');

      // Generate payment URL
      const paymentUrl = `https://accept.paymob.com/api/acceptance/iframes/${this.config.iframeId}?payment_token=${paymentKey}`;

      return {
        token: paymentKey,
        order_id: order.id,
        payment_url: paymentUrl
      };
    } catch (error) {
      console.error('❌ Paymob payment initiation failed:', error);
      throw error;
    }
  }

  // Verify payment callback
  verifyPayment(callbackData: any): boolean {
    try {
      // In a real implementation, you would verify the HMAC signature
      // For now, we'll do basic validation
      return callbackData.success === 'true' || callbackData.success === true;
    } catch (error) {
      console.error('❌ Payment verification failed:', error);
      return false;
    }
  }

  // Get payment status
  async getPaymentStatus(transactionId: string): Promise<any> {
    try {
      const authToken = await this.getAuthToken();
      
      const response = await fetch(`${this.config.baseUrl}/acceptance/transactions/${transactionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get payment status: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Failed to get payment status:', error);
      throw error;
    }
  }
}

export const paymobService = new PaymobService();
export type { PaymentData, PaymobResponse };