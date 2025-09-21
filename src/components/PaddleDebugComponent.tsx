import React, { useState } from 'react';
import { paddleService } from '../lib/paddle';

export const PaddleDebugComponent: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isTestingCheckout, setIsTestingCheckout] = useState(false);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
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
        PADDLE_ENV: import.meta.env.VITE_PADDLE_ENV,
        HAS_CLIENT_TOKEN: !!import.meta.env.VITE_PADDLE_CLIENT_TOKEN,
        CLIENT_TOKEN_PREFIX: import.meta.env.VITE_PADDLE_CLIENT_TOKEN?.substring(0, 10) + '...',
        VENDOR_ID: import.meta.env.VITE_PADDLE_VENDOR_ID,
        MONTHLY_PRICE_ID: import.meta.env.VITE_PADDLE_PRO_MONTHLY_PRICE_ID,
        YEARLY_PRICE_ID: import.meta.env.VITE_PADDLE_PRO_YEARLY_PRICE_ID,
      };
      
      addLog(`Environment: ${JSON.stringify(envVars, null, 2)}`);
      
      // Test Paddle SDK availability
      addLog('🔍 Checking Paddle SDK...');
      if (typeof window !== 'undefined' && window.Paddle) {
        addLog('✅ Paddle SDK is available in window object');
      } else {
        addLog('❌ Paddle SDK not found in window object');
        return;
      }
      
      // Test Paddle initialization
      addLog('🚀 Testing Paddle initialization...');
      const initialized = await paddleService.initialize();
      
      if (initialized) {
        addLog('✅ Paddle initialized successfully');
        
        // Test price ID validation
        try {
          const monthlyPriceId = paddleService.getPriceId('pro', 'monthly');
          const yearlyPriceId = paddleService.getPriceId('pro', 'yearly');
          addLog(`✅ Price IDs valid - Monthly: ${monthlyPriceId}, Yearly: ${yearlyPriceId}`);
        } catch (priceError) {
          addLog(`❌ Price ID validation failed: ${priceError}`);
        }
        
      } else {
        addLog('❌ Paddle initialization failed');
      }
      
    } catch (error: any) {
      addLog(`❌ Connection test failed: ${error.message}`);
    } finally {
      setIsTestingConnection(false);
    }
  };

  const testSimpleCheckout = async () => {
    setIsTestingCheckout(true);
    addLog('🛒 Testing simple checkout...');
    
    try {
      const initialized = await paddleService.initialize();
      if (!initialized) {
        addLog('❌ Cannot test checkout - Paddle not initialized');
        return;
      }
      
      const priceId = import.meta.env.VITE_PADDLE_PRO_MONTHLY_PRICE_ID;
      if (!priceId) {
        addLog('❌ Cannot test checkout - No price ID configured');
        return;
      }
      
      addLog(`🔍 Using price ID: ${priceId}`);
      
      const checkoutOptions = {
        items: [
          {
            priceId: priceId,
            quantity: 1
          }
        ],
        customer: {
          email: 'test@example.com',
          name: 'Test User'
        },
        settings: {
          displayMode: 'overlay' as const,
          theme: 'light' as const,
          locale: 'en'
        }
      };
      
      addLog('🛒 Opening checkout with test data...');
      const result = await paddleService.openCheckout(checkoutOptions);
      
      if (result.success) {
        addLog(`✅ Checkout opened successfully: ${result.checkoutId}`);
      } else {
        addLog(`❌ Checkout failed: ${result.error}`);
        
        // Try window mode as fallback
        addLog('🔄 Trying window mode...');
        const windowResult = await paddleService.openCheckoutWindow(checkoutOptions);
        
        if (windowResult.success) {
          addLog(`✅ Window checkout worked: ${windowResult.checkoutId}`);
        } else {
          addLog(`❌ Window checkout also failed: ${windowResult.error}`);
        }
      }
      
    } catch (error: any) {
      addLog(`❌ Checkout test failed: ${error.message}`);
    } finally {
      setIsTestingCheckout(false);
    }
  };

  const testPriceValidation = async () => {
    addLog('🔍 Testing price validation via backend...');
    
    const priceId = import.meta.env.VITE_PADDLE_PRO_MONTHLY_PRICE_ID;
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!priceId || !supabaseUrl || !supabaseAnonKey) {
      addLog('❌ Missing required environment variables');
      return;
    }

    try {
      // Use your Supabase Edge Function as a proxy to Paddle's API
      const apiUrl = `${supabaseUrl}/functions/v1/paddle-webhook`;
      const response = await fetch(`${apiUrl}?price_id=${priceId}&include=product`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      addLog(`📡 Backend API Response Status: ${response.status}`);
      
      if (response.ok) {
        const priceData = await response.json();
        addLog(`✅ Price is valid and active: ${JSON.stringify(priceData.data || priceData, null, 2)}`);
      } else {
        const errorData = await response.text();
        addLog(`❌ Price validation failed: ${response.status} - ${errorData}`);
      }
    } catch (error: any) {
      addLog(`❌ Price validation error: ${error.message}`);
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
              <div key={index} className="mb-1">
                {log}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};