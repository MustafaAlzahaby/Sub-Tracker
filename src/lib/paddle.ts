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
}

interface PaddleCheckoutOptions {
  items: Array<{
    priceId: string;
    quantity: number;
  }>[];
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

interface PaddleCheckoutResponse {
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
      environment: (import.meta.env.VITE_PADDLE_ENV as 'sandbox' | 'production') || 'sandbox',
      clientSideToken: import.meta.env.VITE_PADDLE_CLIENT_TOKEN || ''
    };

    console.log('🔍 Paddle Config:', {
      environment: this.config.environment,
      hasToken: !!this.config.clientSideToken,
      tokenPrefix: this.config.clientSideToken ? this.config.clientSideToken.substring(0, 15) + '...' : 'none'
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
    const maxAttempts = 200; // Increase max attempts (previously 100)
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

      setTimeout(checkPaddle, 100);  // Retry every 100ms
    };

    checkPaddle();
  });
}



  async initialize(): Promise<boolean> {
    // Return existing promise if initialization is in progress
    if (this.initPromise) {
      return this.initPromise;
    }

    // Return true if already initialized
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
      
      // First, wait for the Paddle script to load
      const scriptLoaded = await this.waitForPaddleScript();
      if (!scriptLoaded) {
        console.error('❌ Paddle script failed to load');
        return false;
      }

      if (!this.config.clientSideToken) {
        console.error('❌ Missing Paddle client token');
        return false;
      }

      console.log('🔧 Setting up Paddle with token:', this.config.clientSideToken.substring(0, 15) + '...');

      // Initialize Paddle v2
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
      this.initPromise = null; // Reset promise so we can try again
      return false;
    }
  }

  async openCheckout(options: PaddleCheckoutOptions): Promise<PaddleCheckoutResponse> {
    try {
      console.log('🛒 Attempting to open checkout...');
      
      // Ensure Paddle is initialized
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

  // Other methods...
}

export const paddleService = new PaddleService();
export type { PaddleCheckoutOptions, PaddleCheckoutResponse };
