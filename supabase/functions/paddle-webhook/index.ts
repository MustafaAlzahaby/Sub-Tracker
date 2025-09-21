import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, paddle-signature',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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

// Verify Paddle webhook signature
function verifyPaddleSignature(body: string, signature: string, secret: string): boolean {
  try {
    // Paddle uses HMAC SHA256 for webhook verification
    const crypto = globalThis.crypto;
    if (!crypto || !crypto.subtle) {
      console.error('❌ Web Crypto API not available');
      return false;
    }

    // For now, we'll skip signature verification in development
    // In production, implement proper HMAC verification
    console.log('⚠️ Webhook signature verification skipped for development');
    return true;
  } catch (error) {
    console.error('❌ Signature verification failed:', error);
    return false;
  }
}

Deno.serve(async (req: Request) => {
  try {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    // Get environment variables
    const paddleApiToken = Deno.env.get('PADDLE_API_TOKEN');
    const paddleWebhookSecret = Deno.env.get('PADDLE_WEBHOOK_SECRET');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    console.log('🔍 Environment check:', {
      hasPaddleToken: !!paddleApiToken,
      hasWebhookSecret: !!paddleWebhookSecret,
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      method: req.method,
      url: req.url
    });

    // Handle GET requests (Paddle API proxy)
    if (req.method === 'GET') {
      const url = new URL(req.url);
      
      if (!paddleApiToken) {
        console.error('❌ Missing PADDLE_API_TOKEN environment variable');
        return new Response('Missing Paddle API token', { status: 500, headers: corsHeaders });
      }

      // Handle different API endpoints
      const productId = url.searchParams.get('product_id');
      const priceId = url.searchParams.get('price_id');
      const include = url.searchParams.get('include');

      let apiUrl = '';

      if (productId && url.pathname.includes('/prices')) {
        // List prices for a product
        apiUrl = `https://api.paddle.com/prices?product_id=${productId}`;
      } else if (productId) {
        // Get product with optional includes
        apiUrl = `https://api.paddle.com/products/${productId}`;
        if (include) {
          apiUrl += `?include=${include}`;
        }
      } else if (priceId) {
        // Get price with optional includes
        apiUrl = `https://api.paddle.com/prices/${priceId}`;
        if (include) {
          apiUrl += `?include=${include}`;
        }
      } else {
        console.error('❌ Invalid API request - missing product_id or price_id');
        return new Response('Invalid API request', { status: 400, headers: corsHeaders });
      }

      console.log('🔍 Proxying Paddle API request:', apiUrl);

      try {
        const paddleResponse = await fetch(apiUrl, {
          headers: {
            'Authorization': `Bearer ${paddleApiToken}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('📡 Paddle API response status:', paddleResponse.status);
        const data = await paddleResponse.text();
        
        return new Response(data, { 
          status: paddleResponse.status, 
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      } catch (fetchError: any) {
        console.error('❌ Failed to fetch from Paddle API:', fetchError);
        return new Response(`Failed to fetch from Paddle API: ${fetchError.message}`, { 
          status: 500, 
          headers: corsHeaders 
        });
      }
    }

    // Handle POST requests (webhooks)
    if (req.method === 'POST') {
      if (!supabaseUrl || !supabaseServiceKey) {
        console.error('❌ Missing Supabase configuration');
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

      // Verify webhook signature
      if (paddleWebhookSecret && !verifyPaddleSignature(body, signature, paddleWebhookSecret)) {
        console.error('❌ Invalid webhook signature');
        return new Response('Invalid signature', { 
          status: 401, 
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
    }

    return new Response('Method not allowed', { 
      status: 405, 
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

    const customData = event.data.custom_data;
    const userId = customData?.userId;
    const planType = customData?.planType || 'pro';

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

    // Update notification preferences for Pro users
    if (planType === 'pro') {
      const { error: prefsError } = await supabase
        .from('notification_preferences')
        .update({
          reminder_30_days: true,
          reminder_1_day: true
        })
        .eq('user_id', userId);

      if (prefsError) {
        console.error('❌ Failed to update notification preferences:', prefsError);
      }
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
    
    const customData = event.data.custom_data;
    const userId = customData?.userId;

    if (!userId) {
      console.error('❌ No user ID in subscription custom data');
      return;
    }

    // Store Paddle subscription ID for future reference
    const { error: subError } = await supabase
      .from('paddle_subscriptions')
      .insert({
        user_id: userId,
        paddle_subscription_id: event.data.id,
        status: event.data.status,
        created_at: new Date().toISOString()
      });

    if (subError) {
      console.error('❌ Failed to store Paddle subscription:', subError);
    }
    
    console.log('✅ Subscription created successfully for user:', userId);
  } catch (error) {
    console.error('❌ Error processing subscription creation:', error);
    throw error;
  }
}

async function handleSubscriptionUpdated(supabase: any, event: PaddleWebhookEvent) {
  try {
    console.log('🔄 Processing subscription update:', event.data.id);
    
    // Update stored subscription status
    const { error: updateError } = await supabase
      .from('paddle_subscriptions')
      .update({
        status: event.data.status,
        updated_at: new Date().toISOString()
      })
      .eq('paddle_subscription_id', event.data.id);

    if (updateError) {
      console.error('❌ Failed to update Paddle subscription:', updateError);
    }
    
    console.log('✅ Subscription updated successfully');
  } catch (error) {
    console.error('❌ Error processing subscription update:', error);
    throw error;
  }
}

async function handleSubscriptionCanceled(supabase: any, event: PaddleWebhookEvent) {
  try {
    console.log('❌ Processing subscription cancellation:', event.data.id);
    
    // Find the user associated with this Paddle subscription
    const { data: paddleSubData, error: findError } = await supabase
      .from('paddle_subscriptions')
      .select('user_id')
      .eq('paddle_subscription_id', event.data.id)
      .single();

    if (findError || !paddleSubData) {
      console.error('❌ Could not find user for cancelled subscription:', event.data.id);
      return;
    }

    const userId = paddleSubData.user_id;

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

    // Update notification preferences back to free plan defaults
    const { error: prefsError } = await supabase
      .from('notification_preferences')
      .update({
        reminder_30_days: false,
        reminder_1_day: false
      })
      .eq('user_id', userId);

    if (prefsError) {
      console.error('❌ Failed to update notification preferences:', prefsError);
    }

    // Update Paddle subscription status
    const { error: subError } = await supabase
      .from('paddle_subscriptions')
      .update({
        status: 'canceled',
        updated_at: new Date().toISOString()
      })
      .eq('paddle_subscription_id', event.data.id);

    if (subError) {
      console.error('❌ Failed to update Paddle subscription status:', subError);
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