// TypeScript declarations for Paddle v2
declare global {
  interface Window {
    Paddle: any;
    paddleReady: boolean;
    paddleReadyPromise: Promise<boolean>;
  }
}

interface PaddleConfig {
  environment: 'sandbox' | 'production';
  clientSideToken: string;
  sellerId: string;
}

export interface PaddleCheckoutOptions {
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
  settings?: {
    displayMode?: 'overlay' | 'inline';
    theme?: 'light' | 'dark';
    locale?: string;
    allowLogout?: boolean;
    showAddTaxId?: boolean;
    showAddDiscounts?: boolean;
  };
}

export interface PaddleCheckoutResponse {
  success: boolean;
  checkoutId?: string;
  error?: string;
}

class PaddleService {
  private config: PaddleConfig;
  private paddle: any = null;
  private isInitialized = false;
  private initPromise: Promise<boolean> | null = null;

  constructor() {
    this.config = {
      environment: (import.meta.env.VITE_PADDLE_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
      clientSideToken: import.meta.env.VITE_PADDLE_CLIENT_TOKEN || '',
      sellerId: import.meta.env.VITE_PADDLE_VENDOR_ID || ''
    };

    console.log('🔍 Paddle Config:', {
      environment: this.config.environment,
      hasToken: !!this.config.clientSideToken,
      tokenPrefix: this.config.clientSideToken ? this.config.clientSideToken.substring(0, 15) + '...' : 'none',
      sellerId: this.config.sellerId
    });

    if (!this.config.clientSideToken) {
      console.error('❌ Paddle client token not found. Please add VITE_PADDLE_CLIENT_TOKEN to your .env file');
    }
  }

  private async waitForPaddleScript(): Promise<boolean> {
    return new Promise((resolve) => {
      console.log('🔍 Waiting for Paddle script...');

      if (typeof window !== 'undefined' && window.Paddle) {
        console.log('✅ Paddle already available');
        resolve(true);
        return;
      }

      let attempts = 0;
      const maxAttempts = 200;
      const checkPaddle = () => {
        attempts++;
        console.log(`🔍 Checking for Paddle SDK... attempt ${attempts}/${maxAttempts}`);

        if (typeof window !== 'undefined' && window.Paddle) {
          console.log('✅ Paddle SDK loaded successfully!');
          resolve(true);
          return;
        }

        if (attempts >= maxAttempts) {
          console.error('❌ Paddle SDK failed to load!');
          resolve(false);
          return;
        }

        setTimeout(checkPaddle, 100);
      };

      checkPaddle();
    });
  }

  async initialize(): Promise<boolean> {
    if (this.initPromise) {
      return this.initPromise;
    }

    if (this.isInitialized && this.paddle) {
      console.log('✅ Paddle already initialized');
      return true;
    }

    this.initPromise = this.doInitialize();
    return this.initPromise;
  }

  private async doInitialize(): Promise<boolean> {
    try {
      console.log('🚀 Starting Paddle v2 SDK initialization...');
      
      const scriptLoaded = await this.waitForPaddleScript();
      if (!scriptLoaded) {
        console.error('❌ Paddle script failed to load');
        return false;
      }

      if (!this.config.clientSideToken) {
        console.error('❌ Missing Paddle client token');
        return false;
      }

      console.log('🔧 Setting up Paddle with environment:', this.config.environment);

      const setupResult = await window.Paddle.Setup({
        token: this.config.clientSideToken,
        environment: this.config.environment,
      });

      console.log('✅ Paddle Setup result:', setupResult);
      this.paddle = window.Paddle;
      this.isInitialized = true;
      console.log('✅ Paddle v2 SDK initialized successfully');
      
      return true;

    } catch (error) {
      console.error('❌ Failed to initialize Paddle v2 SDK:', error);
      this.initPromise = null;
      return false;
    }
  }

  async openCheckout(options: PaddleCheckoutOptions): Promise<PaddleCheckoutResponse> {
    try {
      console.log('🛒 Attempting to open checkout with options:', options);
      
      const initialized = await this.initialize();
      if (!initialized) {
        throw new Error('Failed to initialize Paddle SDK');
      }

      if (!this.paddle || !this.paddle.Checkout || typeof this.paddle.Checkout.open !== 'function') {
        console.error('❌ Paddle Checkout not available');
        throw new Error('Paddle Checkout not available');
      }

      const checkout = await this.paddle.Checkout.open(options);
      
      if (checkout) {
        console.log('✅ Checkout opened successfully:', checkout);
        return {
          success: true,
          checkoutId: checkout.id || 'checkout_opened'
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

  // Add window checkout as fallback method
  async openCheckoutWindow(options: PaddleCheckoutOptions): Promise<PaddleCheckoutResponse> {
    try {
      console.log('🪟 Attempting to open checkout in new window...');
      
      const initialized = await this.initialize();
      if (!initialized) {
        throw new Error('Failed to initialize Paddle SDK');
      }

      // Modify options for window mode
      const windowOptions = {
        ...options,
        settings: {
          ...options.settings,
          displayMode: 'inline' as const
        }
      };

      const checkout = await this.paddle.Checkout.open(windowOptions);
      
      if (checkout) {
        console.log('✅ Window checkout opened successfully:', checkout);
        return {
          success: true,
          checkoutId: checkout.id || 'window_checkout_opened'
        };
      } else {
        throw new Error('Window checkout failed to open');
      }

    } catch (error: any) {
      console.error('❌ Window checkout failed:', error);
      return {
        success: false,
        error: error.message || 'Window checkout failed'
      };
    }
  }

  // Get price ID based on plan and billing cycle
  getPriceId(planType: 'pro', billingCycle: 'monthly' | 'yearly'): string {
    if (planType === 'pro') {
      return billingCycle === 'monthly' 
        ? import.meta.env.VITE_PADDLE_PRO_MONTHLY_PRICE_ID
        : import.meta.env.VITE_PADDLE_PRO_YEARLY_PRICE_ID;
    }
    throw new Error(`Unknown plan type: ${planType}`);
  }

  // Get product ID based on plan and billing cycle
  getProductId(planType: 'pro', billingCycle: 'monthly' | 'yearly'): string {
    if (planType === 'pro') {
      return billingCycle === 'monthly' 
        ? import.meta.env.VITE_PADDLE_PRO_MONTHLY_PRODUCT_ID
        : import.meta.env.VITE_PADDLE_PRO_YEARLY_PRODUCT_ID;
    }
    throw new Error(`Unknown plan type: ${planType}`);
  }
}

// Fetch Paddle product and prices securely via your backend function
export async function fetchPaddleProductWithPrices(productId: string) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase configuration');
  }

  const apiUrl = `${supabaseUrl}/functions/v1/paddle-webhook`;
  const headers = {
    'Authorization': `Bearer ${supabaseAnonKey}`,
    'Content-Type': 'application/json',
  };

  const response = await fetch(`${apiUrl}?product_id=${productId}&include=prices`, {
    method: 'GET',
    headers
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch Paddle product/prices: ${response.status} - ${errorText}`);
  }
  
  return await response.json();
}

// Fetch Paddle price and related product securely via your backend function
export async function fetchPaddlePriceWithProduct(priceId: string) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase configuration');
  }

  const apiUrl = `${supabaseUrl}/functions/v1/paddle-webhook`;
  const headers = {
    'Authorization': `Bearer ${supabaseAnonKey}`,
    'Content-Type': 'application/json',
  };

  const response = await fetch(`${apiUrl}?price_id=${priceId}&include=product`, {
    method: 'GET',
    headers
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch Paddle price/product: ${response.status} - ${errorText}`);
  }
  
  return await response.json();
}

// List prices for a Paddle product securely via your backend function
export async function listPaddlePrices(productId: string) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase configuration');
  }

  const apiUrl = `${supabaseUrl}/functions/v1/paddle-webhook`;
  const headers = {
    'Authorization': `Bearer ${supabaseAnonKey}`,
    'Content-Type': 'application/json',
  };

  const response = await fetch(`${apiUrl}/prices?product_id=${productId}`, {
    method: 'GET',
    headers
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to list Paddle prices: ${response.status} - ${errorText}`);
  }
  
  return await response.json();
}

export const paddleService = new PaddleService();