import { createClient } from '@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, paddle-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface PaddleWebhookEvent {
  event_type: string;
  data: {
    id: string;
    status: string;
    customer: {
      id: string;
      email: string;
    };
    items: Array<{
      price: {
        id: string;
        product: {
          id: string;
        };
      };
    }>;
    custom_data?: {
      userId?: string;
      planType?: string;
    };
  };
}

// Add Paddle API proxy for GET requests
(globalThis as any).serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Use environment variables from .env.local (not committed to GitHub)
  const paddleApiToken = process.env.VITE_PADDLE_API_TOKEN;
  const paddleWebhookSecret = process.env.VITE_PADDLE_WEBHOOK_SECRET;
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.VITE_SUPABASE_ANON_KEY;

  // Paddle API proxy for GET requests
  if (req.method === 'GET') {
    const url = new URL(req.url);
    if (!paddleApiToken) {
      return new Response('Missing Paddle API token', { status: 500, headers: corsHeaders });
    }

    // /products/{product_id}?include=prices
    const productId = url.searchParams.get('product_id');
    const include = url.searchParams.get('include');
    if (productId) {
      let apiUrl = `https://api.paddle.com/products/${productId}`;
      if (include) {
        apiUrl += `?include=${include}`;
      }
      const paddleRes = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${paddleApiToken}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await paddleRes.text();
      return new Response(data, { status: paddleRes.status, headers: corsHeaders });
    }

    // /prices/{price_id}?include=product
    const priceId = url.searchParams.get('price_id');
    if (priceId) {
      let apiUrl = `https://api.paddle.com/prices/${priceId}`;
      if (include) {
        apiUrl += `?include=${include}`;
      }
      const paddleRes = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${paddleApiToken}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await paddleRes.text();
      return new Response(data, { status: paddleRes.status, headers: corsHeaders });
    }

    // /prices?product_id={product_id}
    if (url.pathname.endsWith('/prices') && productId) {
      const apiUrl = `https://api.paddle.com/prices?product_id=${productId}`;
      const paddleRes = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${paddleApiToken}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await paddleRes.text();
  try {
  try {
    // Use environment variables from .env.local (not committed to GitHub)
    const paddleApiToken = process.env.VITE_PADDLE_API_TOKEN;
    const paddleWebhookSecret = process.env.VITE_PADDLE_WEBHOOK_SECRET;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.VITE_SUPABASE_ANON_KEY;

    // Replace previous Deno.env.get usage with these variables in your code
    // Example for Paddle API proxy:
    if (!paddleApiToken) {
      return new Response('Missing Paddle API token', { status: 500, headers: corsHeaders });
    }

    // Example for webhook secret:
    if (!paddleWebhookSecret) {
      console.error('❌ Webhook secret not configured');
      return new Response('Webhook secret not configured', { 
        status: 500, 
        headers: corsHeaders 
      });
    }

    // Example for Supabase client:
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response('Missing Supabase configuration', { status: 500, headers: corsHeaders });
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get webhook signature for verification
    const signature = req.headers.get('paddle-signature');
    const body = await req.text();

    if (!signature) {
      console.error('❌ Missing Paddle signature');
      return new Response('Missing signature', { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    // Verify webhook signature (implement proper verification)
    const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('❌ Webhook secret not configured');
      return new Response('Webhook secret not configured', { 
        status: 500, 
        headers: corsHeaders 
      });
    }

    // Parse the webhook event
    let event: PaddleWebhookEvent;
    try {
      event = JSON.parse(body);
    } catch (error) {
      console.error('❌ Invalid JSON in webhook body:', error);
      return new Response('Invalid JSON', { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    console.log('🔔 Received Paddle webhook:', event.event_type);

    // Handle different event types
    switch (event.event_type) {
      case 'transaction.completed':
        await handleTransactionCompleted(supabase, event);
        break;
      case 'subscription.created':
        await handleSubscriptionCreated(supabase, event);
        break;
      case 'subscription.updated':
        await handleSubscriptionUpdated(supabase, event);
        break;
      case 'subscription.canceled':
        await handleSubscriptionCanceled(supabase, event);
        break;
      default:
        console.log(`ℹ️ Unhandled event type: ${event.event_type}`);
    }

    return new Response('OK', { 
      status: 200, 
      headers: corsHeaders 
    });

  } catch (error: any) {
    console.error('❌ Webhook processing error:', error);
    return new Response(`Error: ${error.message}`, { 
      status: 500, 
      headers: corsHeaders 
    });
  }
});

async function handleTransactionCompleted(supabase: any, event: PaddleWebhookEvent) {
  try {
    console.log('💳 Processing completed transaction:', event.data.id);

    const { data, custom_data } = event.data;
    const userId = custom_data?.userId;
    const planType = custom_data?.planType || 'pro';

    if (!userId) {
      console.error('❌ No user ID in transaction custom data');
      return;
    }

    // Update user plan
    const { error: planError } = await supabase
      .from('user_plans')
      .update({
        plan_type: planType,
        subscription_limit: planType === 'pro' ? 999999 : 5,
        features: {
          analytics: planType === 'pro',
          reports: planType === 'pro',
          team_features: false,
          api_access: false
        }
      })
      .eq('user_id', userId);

    if (planError) {
      console.error('❌ Failed to update user plan:', planError);
      throw planError;
    }

    // Create success notification
    await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: 'system',
        title: '🎉 Welcome to SubTracker Pro!',
        message: 'Your payment was successful and your plan has been upgraded. Enjoy unlimited subscriptions and advanced features!',
        is_read: false
      });

    console.log('✅ Transaction processed successfully for user:', userId);
  } catch (error) {
    console.error('❌ Error processing transaction:', error);
    throw error;
  }
}

async function handleSubscriptionCreated(supabase: any, event: PaddleWebhookEvent) {
  try {
    console.log('📝 Processing subscription creation:', event.data.id);
    
    const { data, custom_data } = event.data;
    const userId = custom_data?.userId;

    if (!userId) {
      console.error('❌ No user ID in subscription custom data');
      return;
    }

    // Store subscription details if needed
    // You can add a paddle_subscriptions table to track Paddle subscription IDs
    
    console.log('✅ Subscription created successfully for user:', userId);
  } catch (error) {
    console.error('❌ Error processing subscription creation:', error);
    throw error;
  }
}

async function handleSubscriptionUpdated(supabase: any, event: PaddleWebhookEvent) {
  try {
    console.log('🔄 Processing subscription update:', event.data.id);
    // Handle subscription updates (plan changes, etc.)
    console.log('✅ Subscription updated successfully');
  } catch (error) {
    console.error('❌ Error processing subscription update:', error);
    throw error;
  }
}

async function handleSubscriptionCanceled(supabase: any, event: PaddleWebhookEvent) {
  try {
    console.log('❌ Processing subscription cancellation:', event.data.id);
    
    const { data, custom_data } = event.data;
    const userId = custom_data?.userId;

    if (!userId) {
      console.error('❌ No user ID in subscription custom data');
      return;
    }

    // Downgrade user to free plan
    const { error: planError } = await supabase
      .from('user_plans')
      .update({
        plan_type: 'free',
        subscription_limit: 5,
        features: {
          analytics: false,
          reports: false,
          team_features: false,
          api_access: false
        }
      })
      .eq('user_id', userId);

    if (planError) {
      console.error('❌ Failed to downgrade user plan:', planError);
      throw planError;
    }

    // Create cancellation notification
    await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: 'system',
        title: 'Subscription Cancelled',
        message: 'Your Pro subscription has been cancelled. You can resubscribe anytime to regain access to Pro features.',
        is_read: false
      });

    console.log('✅ Subscription cancelled successfully for user:', userId);
  } catch (error) {
    console.error('❌ Error processing subscription cancellation:', error);
    throw error;
  }
}