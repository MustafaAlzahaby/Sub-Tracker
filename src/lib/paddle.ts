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
  token: string; // Changed from clientSideToken to token
  vendorId: string;
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
      token: import.meta.env.VITE_PADDLE_CLIENT_TOKEN || '',
      vendorId: import.meta.env.VITE_PADDLE_VENDOR_ID || ''
    };
  }

  private async waitForPaddleScript(): Promise<boolean> {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && window.Paddle) return resolve(true);
      let tries = 0;
      const tick = () => {
        tries++;
        if (typeof window !== 'undefined' && window.Paddle) return resolve(true);
        if (tries >= 200) return resolve(false);
        setTimeout(tick, 100);
      };
      tick();
    });
  }

 private async doInitialize(): Promise<boolean> {
  try {
    console.log('🚀 Starting Paddle v2 SDK initialization...');

    const scriptLoaded = await this.waitForPaddleScript();
    if (!scriptLoaded) return false;

    if (!this.config.token) {
      console.error('❌ Missing Paddle client token');
      return false;
    }

    const gp: any = (typeof window !== 'undefined') ? (window as any).Paddle : undefined;
    if (!gp) {
      console.error('❌ window.Paddle is not available after script load');
      return false;
    }

    const env = (this.config.environment || 'sandbox') === 'production' ? 'production' : 'sandbox';
    try {
      gp.Environment?.set?.(env);
      console.log(`✅ Paddle environment set: ${env}`);
    } catch (e) {
      console.warn('⚠️ Paddle.Environment.set failed (SDK may auto-detect). Continuing…', e);
    }

    console.log('🔧 Calling Paddle.Initialize({ token }) ...');
    await gp.Initialize({
      token: this.config.token,
      eventCallback: (evt: any) => console.log('[Paddle event]', evt),
    });

    this.paddle = (window as any).Paddle;
    this.isInitialized = true;

    const version = this.paddle?.version ?? '(unknown)';
    console.log('✅ Paddle v2 initialized. version:', version, 'Methods:', Object.keys(this.paddle || {}));
    return true;
  } catch (error: any) {
    console.error('❌ Failed to initialize Paddle v2 SDK:', error);
    this.initPromise = null;
    return false;
  }
}




  async initialize(): Promise<boolean> {
    if (this.initPromise) return this.initPromise;
    if (this.isInitialized && this.paddle) return true;
    this.initPromise = this.doInitialize();
    return this.initPromise;
  }

  async openCheckout(options: PaddleCheckoutOptions): Promise<PaddleCheckoutResponse> {
  try {
    console.log('🛒 Attempting to open checkout with options:', options);

    const initialized = await this.initialize();
    if (!initialized) {
      throw new Error('Failed to initialize Paddle SDK');
    }

    // 👇 Rebind from global in case internal ref was lost
    if (!this.paddle) {
      this.paddle = (typeof window !== 'undefined') ? (window as any).Paddle : null;
    }

    if (!this.paddle) {
      throw new Error('Paddle SDK not available on window');
    }

    if (!this.paddle.Checkout || typeof this.paddle.Checkout.open !== 'function') {
      console.error('❌ Paddle Checkout not available');
      console.error('Available Paddle methods:', Object.keys(this.paddle || {}));
      throw new Error('Paddle Checkout not available');
    }

    const checkout = await this.paddle.Checkout.open(options);

    if (checkout) {
      console.log('✅ Checkout opened successfully:', checkout);
      return { success: true, checkoutId: checkout.id || 'checkout_opened' };
    } else {
      throw new Error('Failed to open checkout');
    }
  } catch (error: any) {
    console.error('❌ Paddle checkout failed:', error);
    return { success: false, error: error.message || 'Checkout failed' };
  }
}


  async openCheckoutWindow(options: PaddleCheckoutOptions): Promise<PaddleCheckoutResponse> {
  try {
    console.log('🪟 Attempting to open checkout in new window...');

    const initialized = await this.initialize();
    if (!initialized) {
      throw new Error('Failed to initialize Paddle SDK');
    }

    if (!this.paddle) {
      this.paddle = (typeof window !== 'undefined') ? (window as any).Paddle : null;
    }
    if (!this.paddle || !this.paddle.Checkout || typeof this.paddle.Checkout.open !== 'function') {
      throw new Error('Paddle Checkout not available');
    }

    const windowOptions = {
      ...options,
      settings: {
        ...options.settings,
        displayMode: 'inline' as const, // new-window fallback
      },
    };

    const checkout = await this.paddle.Checkout.open(windowOptions);

    if (checkout) {
      console.log('✅ Window checkout opened successfully:', checkout);
      return { success: true, checkoutId: checkout.id || 'window_checkout_opened' };
    } else {
      throw new Error('Window checkout failed to open');
    }
  } catch (error: any) {
    console.error('❌ Window checkout failed:', error);
    return { success: false, error: error.message || 'Window checkout failed' };
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
  if (!supabaseUrl) throw new Error('Missing Supabase configuration');

  const apiUrl = `${supabaseUrl}/functions/v1/paddle-webhook`;
  const url = `${apiUrl}?endpoint=products&product_id=${encodeURIComponent(productId)}&include=prices`;

  const response = await fetch(url); // no headers
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch Paddle product/prices: ${response.status} - ${errorText}`);
  }
  return await response.json();
}


// Fetch Paddle price and related product securely via your backend function
export async function fetchPaddlePriceWithProduct(priceId: string) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) throw new Error('Missing Supabase configuration');

  const apiUrl = `${supabaseUrl}/functions/v1/paddle-webhook`;
  const url = `${apiUrl}?endpoint=prices&price_id=${encodeURIComponent(priceId)}&include=product`;

  const response = await fetch(url); // no headers
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch Paddle price/product: ${response.status} - ${errorText}`);
  }
  return await response.json();
}


// List prices for a Paddle product securely via your backend function
export async function listPaddlePrices(productId: string) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) throw new Error('Missing Supabase configuration');

  const apiUrl = `${supabaseUrl}/functions/v1/paddle-webhook`;
  const url = `${apiUrl}?endpoint=prices&product_id=${encodeURIComponent(productId)}`;

  const response = await fetch(url); // no headers
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to list Paddle prices: ${response.status} - ${errorText}`);
  }
  return await response.json();
}


export const paddleService = new PaddleService();