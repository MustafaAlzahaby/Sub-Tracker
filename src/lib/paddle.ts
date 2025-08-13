import { loadScript } from '@paddle/paddle-js';

interface PaddleConfig {
  environment: 'sandbox' | 'production';
  token: string;
  clientSideToken: string;
}

interface PaddleProduct {
  id: string;
  name: string;
  description: string;
  price: {
    amount: string;
    currency: string;
  };
}

interface PaddleCheckoutOptions {
  items: Array<{
    priceId: string;
    quantity: number;
  }>;
  customer?: {
    email?: string;
    name?: string;
  };
  customData?: {
    userId: string;
    planType: string;
  };
  successUrl?: string;
  discountCode?: string;
}

interface PaddleCheckoutResponse {
  success: boolean;
  checkoutId?: string;
  error?: string;
}

class PaddleService {
  private config: PaddleConfig;
  private paddle: any = null;
  private isInitialized = false;

  constructor() {
    this.config = {
      environment: (import.meta.env.VITE_PADDLE_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
      token: import.meta.env.VITE_PADDLE_API_TOKEN || '',
      clientSideToken: import.meta.env.VITE_PADDLE_CLIENT_TOKEN || ''
    };

    if (!this.config.token || !this.config.clientSideToken) {
      console.warn('⚠️ Paddle credentials not found. Please add VITE_PADDLE_API_TOKEN and VITE_PADDLE_CLIENT_TOKEN to your .env file');
    }
  }

  async initialize(): Promise<boolean> {
    if (this.isInitialized && this.paddle) {
      return true;
    }

    try {
      console.log('🚀 Initializing Paddle SDK...');
      
      // Load Paddle SDK
      this.paddle = await loadScript({
        environment: this.config.environment,
        token: this.config.clientSideToken,
        debug: this.config.environment === 'sandbox'
      });

      if (!this.paddle) {
        throw new Error('Failed to load Paddle SDK');
      }

      this.isInitialized = true;
      console.log('✅ Paddle SDK initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Paddle SDK:', error);
      return false;
    }
  }

  async openCheckout(options: PaddleCheckoutOptions): Promise<PaddleCheckoutResponse> {
    try {
      if (!this.isInitialized) {
        const initialized = await this.initialize();
        if (!initialized) {
          throw new Error('Failed to initialize Paddle SDK');
        }
      }

      console.log('🛒 Opening Paddle checkout with options:', options);

      // Open Paddle checkout
      const checkout = await this.paddle.Checkout.open({
        items: options.items,
        customer: options.customer,
        customData: options.customData,
        successUrl: options.successUrl || `${window.location.origin}/account?payment=success`,
        settings: {
          displayMode: 'overlay',
          theme: 'light',
          locale: 'en',
          allowLogout: false,
          showAddTaxId: false,
          showAddDiscounts: true
        }
      });

      if (checkout) {
        console.log('✅ Paddle checkout opened successfully');
        return {
          success: true,
          checkoutId: checkout.id
        };
      } else {
        throw new Error('Checkout failed to open');
      }
    } catch (error: any) {
      console.error('❌ Paddle checkout failed:', error);
      return {
        success: false,
        error: error.message || 'Checkout failed'
      };
    }
  }

  async getProducts(): Promise<PaddleProduct[]> {
    try {
      const response = await fetch('https://api.paddle.com/products', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('❌ Failed to fetch Paddle products:', error);
      return [];
    }
  }

  async getPrices(productId: string): Promise<any[]> {
    try {
      const response = await fetch(`https://api.paddle.com/prices?product_id=${productId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch prices: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('❌ Failed to fetch Paddle prices:', error);
      return [];
    }
  }

  async verifyWebhook(signature: string, body: string): Promise<boolean> {
    try {
      // Implement webhook signature verification
      // This would typically use your webhook secret key
      const webhookSecret = import.meta.env.VITE_PADDLE_WEBHOOK_SECRET || '';
      
      if (!webhookSecret) {
        console.warn('⚠️ Paddle webhook secret not configured');
        return false;
      }

      // In a real implementation, you would verify the signature
      // For now, we'll do basic validation
      return signature && body ? true : false;
    } catch (error) {
      console.error('❌ Webhook verification failed:', error);
      return false;
    }
  }

  async getSubscriptionDetails(subscriptionId: string): Promise<any> {
    try {
      const response = await fetch(`https://api.paddle.com/subscriptions/${subscriptionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch subscription: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Failed to fetch subscription details:', error);
      throw error;
    }
  }

  async cancelSubscription(subscriptionId: string): Promise<boolean> {
    try {
      const response = await fetch(`https://api.paddle.com/subscriptions/${subscriptionId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          effective_from: 'next_billing_period'
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to cancel subscription: ${response.statusText}`);
      }

      console.log('✅ Subscription cancelled successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to cancel subscription:', error);
      return false;
    }
  }
}

export const paddleService = new PaddleService();
export type { PaddleCheckoutOptions, PaddleCheckoutResponse, PaddleProduct };