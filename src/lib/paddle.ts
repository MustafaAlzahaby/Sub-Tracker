import Paddle from '@paddle/paddle-js';

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
  product: string; // Specify the product (e.g., "productA")
  planType: 'monthly' | 'yearly'; // Specify the plan type (monthly or yearly)
  quantity: number;
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
      // Manually add the script tag for Paddle SDK
      const script = document.createElement('script');
      script.src = 'https://cdn.paddle.com/paddle/paddle.js';  // The correct CDN link
      script.async = true;
      script.onload = () => {
        // Initialize the SDK after the script is loaded
        window.Paddle.Setup({
          vendor: this.config.clientSideToken,  // Use the client-side token (your Paddle account's token)
        });

        this.paddle = window.Paddle;
        this.isInitialized = true;
        console.log('✅ Paddle SDK initialized successfully');
      };

      script.onerror = () => {
        console.error('❌ Failed to load Paddle SDK');
      };

      document.body.appendChild(script);
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Paddle SDK:', error);
      return false;
    }
  }

  // Fetch Price ID based on the selected product and plan type (monthly/yearly)
  getPriceIdForProductAndPlan(product: string, planType: 'monthly' | 'yearly'): string {
    const prices = JSON.parse(import.meta.env.VITE_PADDLE_PRICES_JSON);
    const productPrices = prices[product];

    if (!productPrices) {
      throw new Error(`Product ${product} not found`);
    }

    const priceId = productPrices[planType];

    if (!priceId) {
      throw new Error(`Price ID for ${planType} plan not found for product ${product}`);
    }

    return priceId;
  }

  async openCheckout(options: PaddleCheckoutOptions): Promise<PaddleCheckoutResponse> {
    try {
      if (!this.isInitialized) {
        const initialized = await this.initialize();
        if (!initialized) {
          throw new Error('Failed to initialize Paddle SDK');
        }
      }

      // Get the Price ID based on the selected product and plan
      const priceId = this.getPriceIdForProductAndPlan(options.product, options.planType);

      console.log('🛒 Opening Paddle checkout with price ID:', priceId);

      // Open Paddle checkout
      const checkout = await this.paddle.Checkout.open({
        items: [
          {
            priceId: priceId,  // Use the correct Price ID
            quantity: options.quantity
          }
        ],
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

  // Rest of your methods (getProducts, getPrices, etc.) remain the same.
}

export const paddleService = new PaddleService();
export type { PaddleCheckoutOptions, PaddleCheckoutResponse, PaddleProduct };
