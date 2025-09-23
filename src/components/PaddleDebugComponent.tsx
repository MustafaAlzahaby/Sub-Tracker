import React, { useState } from 'react';
import { paddleService } from '../lib/paddle';

export const PaddleDebugComponent: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isTestingCheckout, setIsTestingCheckout] = useState(false);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, `[${timestamp}] ${message}`]);
    console.log(message);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const testConnection = async () => {
    setIsTestingConnection(true);
    addLog('🧪 Starting connection test...');

    try {
      // Test environment variables
      addLog('📋 Checking environment variables...');
      const envVars = {
        PADDLE_ENV: import.meta.env.VITE_PADDLE_ENVIRONMENT,
        HAS_CLIENT_TOKEN: !!import.meta.env.VITE_PADDLE_CLIENT_TOKEN,
        CLIENT_TOKEN_PREFIX:
          import.meta.env.VITE_PADDLE_CLIENT_TOKEN?.substring(0, 10) + '...',
        VENDOR_ID: import.meta.env.VITE_PADDLE_VENDOR_ID,
        MONTHLY_PRICE_ID: import.meta.env.VITE_PADDLE_PRO_MONTHLY_PRICE_ID,
        YEARLY_PRICE_ID: import.meta.env.VITE_PADDLE_PRO_YEARLY_PRICE_ID,
        HAS_API_TOKEN: !!import.meta.env.VITE_PADDLE_API_TOKEN,
        ORIGIN: window.location.origin,
      };

      addLog(`Environment: ${JSON.stringify(envVars, null, 2)}`);

      // Test Paddle SDK availability
      addLog('🔍 Checking Paddle SDK...');
      if (typeof window !== 'undefined' && (window as any).Paddle) {
        addLog('✅ Paddle SDK is available in window object');
        addLog(`Available methods: ${Object.keys((window as any).Paddle).join(', ')}`);
      } else {
        addLog('❌ Paddle SDK not found in window object');
        return;
      }

      // Test Paddle initialization
      addLog('🚀 Testing Paddle initialization...');
      const initialized = await paddleService.initialize();

      if (initialized) {
        addLog('✅ Paddle initialized successfully');

        // Test price ID validation (env presence only)
        try {
          const monthlyPriceId = paddleService.getPriceId('pro', 'monthly');
          const yearlyPriceId = paddleService.getPriceId('pro', 'yearly');
          addLog(`✅ Price IDs present - Monthly: ${monthlyPriceId}, Yearly: ${yearlyPriceId}`);
        } catch (priceError: any) {
          addLog(`❌ Price ID validation failed: ${priceError.message}`);
        }
      } else {
        addLog('❌ Paddle initialization failed');
      }
    } catch (error: any) {
      addLog(`❌ Connection test failed: ${error.message}`);
      console.error('Full error:', error);
    } finally {
      setIsTestingConnection(false);
    }
  };

  const testSimpleCheckout = async () => {
  setIsTestingCheckout(true);
  addLog('🛒 Testing simple checkout...');

  try {
    const priceId = import.meta.env.VITE_PADDLE_PRO_MONTHLY_PRICE_ID;
    if (!priceId) {
      addLog('❌ Cannot test checkout - No price ID configured');
      return;
    }

    // If we are on localhost, use hosted checkout via backend
    const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    if (isLocal) {
      addLog('🪄 Localhost detected -> using hosted checkout redirect via backend');

      const base = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paddle-webhook`;
      const body = {
        items: [{ priceId, quantity: 1 }],
        customer: { email: 'test@example.com' },
        successUrl: `${location.origin}/account?payment=success`
      };

      addLog(`🌐 POST ${base}/create-transaction`);
      const res = await fetch(`${base}/create-transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }, // no auth header => no preflight since simple POST+json is ok
        body: JSON.stringify(body),
      });

      addLog(`📡 Backend status: ${res.status}`);
      const data = await res.json();

      if (!res.ok) {
        addLog(`❌ Create transaction failed: ${res.status} - ${JSON.stringify(data)}`);
        return;
      }

      const url = data?.data?.checkout_url;
      if (!url) {
        addLog(`❌ No checkout_url in response: ${JSON.stringify(data)}`);
        return;
      }

      addLog(`🔗 Opening hosted checkout: ${url}`);
      window.open(url, '_blank', 'noopener,noreferrer');
      addLog('✅ Hosted checkout opened in a new tab');
      return;
    }

    // Non-localhost? use overlay as normal
    addLog('🧪 Non-localhost -> trying overlay checkout (Paddle SDK)…');
    const checkoutOptions = {
      items: [{ priceId, quantity: 1 }],
      customer: { email: 'test@example.com', name: 'Test User' },
      successUrl: `${location.origin}/account?payment=success`,
      settings: { displayMode: 'overlay', theme: 'light', locale: 'en', variant: 'one-page' },
    };
    addLog(`Checkout options: ${JSON.stringify(checkoutOptions, null, 2)}`);

    // Ensure SDK is ready
    if (!(window as any).Paddle || typeof (window as any).Paddle.Initialize !== 'function') {
      addLog('❌ Paddle SDK not available');
      return;
    }

    (window as any).Paddle.Checkout.open(checkoutOptions);
    addLog('✅ Overlay checkout invoked');

  } catch (error: any) {
    addLog(`❌ Checkout test failed: ${error.message}`);
    console.error('Full checkout error:', error);
  } finally {
    setIsTestingCheckout(false);
  }
};



  const testPriceValidation = async () => {
    addLog('🔍 Testing price validation via backend...');

    const priceId = import.meta.env.VITE_PADDLE_PRO_MONTHLY_PRICE_ID;
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

    if (!priceId || !supabaseUrl) {
      addLog('❌ Missing required environment variables');
      addLog(
        `Missing: ${
          !priceId ? 'VITE_PADDLE_PRO_MONTHLY_PRICE_ID ' : ''
        }${!supabaseUrl ? 'VITE_SUPABASE_URL ' : ''}`
      );
      return;
    }

    try {
      // ✅ Use the query-style endpoint first (this is the one that works in your setup)
      const base = `${supabaseUrl}/functions/v1/paddle-webhook`;
      const url = `${base}?endpoint=prices&price_id=${encodeURIComponent(
        priceId
      )}&include=product`;

      // No headers => no preflight
      addLog(`🌐 GET ${url}`);
      const response = await fetch(url);

      addLog(`📡 Backend API Response Status: ${response.status}`);

      if (response.ok) {
        const priceData = await response.json();
        addLog('✅ Price is valid and active:');
        addLog(JSON.stringify(priceData, null, 2));
        return;
      }

      // Fallback: try the path-style form (in case you later fix the router)
      const errText = await response.text();
      addLog(`⚠️ Query-style failed: ${response.status} - ${errText}`);

      addLog('🔁 Trying path-style endpoint...');
      const pathUrl = `${base}/prices/${encodeURIComponent(priceId)}?include=product`;
      const altRes = await fetch(pathUrl); // still no headers
      addLog(`📡 Path-style status: ${altRes.status}`);

      if (altRes.ok) {
        const altData = await altRes.json();
        addLog(`✅ Path-style worked: ${JSON.stringify(altData, null, 2)}`);
      } else {
        const altErr = await altRes.text();
        addLog(`❌ Path-style failed: ${altRes.status} - ${altErr}`);
      }
    } catch (error: any) {
      addLog(`❌ Price validation error: ${error.message}`);
      console.error('Full validation error:', error);
    }
  };

  const testEnvironmentConfiguration = async () => {
    addLog('🔧 Testing environment configuration...');

    const config = {
      nodeEnv: import.meta.env.NODE_ENV,
      mode: import.meta.env.MODE,
      dev: import.meta.env.DEV,
      prod: import.meta.env.PROD,
      paddleEnv: import.meta.env.VITE_PADDLE_ENVIRONMENT,
      hasClientToken: !!import.meta.env.VITE_PADDLE_CLIENT_TOKEN,
      hasApiToken: !!import.meta.env.VITE_PADDLE_API_TOKEN,
      clientTokenFormat: import.meta.env.VITE_PADDLE_CLIENT_TOKEN?.startsWith('test_')
        ? 'sandbox'
        : import.meta.env.VITE_PADDLE_CLIENT_TOKEN?.startsWith('live_')
        ? 'production'
        : 'unknown',
      apiTokenFormat: import.meta.env.VITE_PADDLE_API_TOKEN?.includes('sdbx')
        ? 'sandbox'
        : import.meta.env.VITE_PADDLE_API_TOKEN?.includes('live')
        ? 'production'
        : 'unknown',
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
      hasSupabaseKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
      origin: window.location.origin,
    };

    addLog('Configuration check:');
    addLog(JSON.stringify(config, null, 2));

    // Check token/environment consistency
    if (config.paddleEnv === 'sandbox' && config.clientTokenFormat !== 'sandbox') {
      addLog('⚠️ Warning: Environment is sandbox but token appears to be for production');
    }
    if (config.paddleEnv === 'production' && config.clientTokenFormat !== 'production') {
      addLog('⚠️ Warning: Environment is production but token appears to be for sandbox');
    }

    if (config.clientTokenFormat === config.apiTokenFormat || config.apiTokenFormat === 'unknown') {
      addLog('✅ Token consistency check passed');
    } else {
      addLog(
        '❌ Token consistency check failed - API and Client tokens are for different environments'
      );
    }
  };

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 p-6 rounded-lg">
      <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-4">
        🛠️ Paddle Integration Debug Tools
      </h3>

      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={testConnection}
            disabled={isTestingConnection}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isTestingConnection ? 'Testing...' : 'Test Connection'}
          </button>

          <button
            onClick={testSimpleCheckout}
            disabled={isTestingCheckout}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            {isTestingCheckout ? 'Testing...' : 'Test Checkout'}
          </button>

          <button
            onClick={testPriceValidation}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Validate Price ID
          </button>

          <button
            onClick={testEnvironmentConfiguration}
            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
          >
            Check Config
          </button>

          <button
            onClick={clearLogs}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Clear Logs
          </button>
        </div>

        <div className="bg-black text-green-400 p-4 rounded font-mono text-sm max-h-96 overflow-y-auto">
          {logs.length === 0 ? (
            <div className="text-gray-500">Click a test button to see debug output...</div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="mb-1 whitespace-pre-wrap">
                {log}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
