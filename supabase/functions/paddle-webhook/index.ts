// @ts-nocheck
/// <reference lib="deno.ns" />
/// <reference lib="dom" />

import { createClient } from 'npm:@supabase/supabase-js@2';

/* ---- CORS: dynamic, always 200 for OPTIONS ---- */
function buildCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') ?? '*';
  const reqAllowHeaders =
    req.headers.get('Access-Control-Request-Headers') ??
    'authorization, x-client-info, apikey, content-type, paddle-signature';

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': reqAllowHeaders,
    Vary: 'Origin, Access-Control-Request-Headers',
  };
}

interface PaddleWebhookEvent {
  event_type: string;
  data: {
    id: string;
    status: string;
    customer: { id: string; email: string };
    items: Array<{ price: { id: string; product: { id: string } } }>;
    custom_data?: { userId?: string; planType?: string };
  };
}

// Verify Paddle webhook signature (stub for dev)
function verifyPaddleSignature(body: string, signature: string, secret: string): boolean {
  try {
    const crypto = globalThis.crypto;
    if (!crypto || !crypto.subtle) {
      console.error('❌ Web Crypto API not available');
      return false;
    }
    console.log('⚠️ Webhook signature verification skipped for development');
    return true;
  } catch (error) {
    console.error('❌ Signature verification failed:', error);
    return false;
  }
}

Deno.serve(async (req: Request) => {
  const corsHeaders = buildCorsHeaders(req);

  try {
    // Always OK the preflight
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    // Env
    const paddleApiToken = Deno.env.get('PADDLE_API_TOKEN');
    const paddleWebhookSecret = Deno.env.get('PADDLE_WEBHOOK_SECRET');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const paddleEnv = (Deno.env.get('PADDLE_ENVIRONMENT') || 'sandbox').toLowerCase();
    const PADDLE_BASE =
      paddleEnv === 'production' ? 'https://api.paddle.com' : 'https://sandbox-api.paddle.com';
// --- Sanity checks and helpful logs ---
const tokenPrefix = (paddleApiToken || '').slice(0, 12);
console.log('[paddle-webhook] env:', {
  paddleEnv,
  hasToken: !!paddleApiToken,
  tokenPrefix,                 // safe: only first chars
  looksLikeServerKey:
    !!paddleApiToken && (paddleApiToken.startsWith('pdl_live_') || paddleApiToken.startsWith('pdl_sandbox_'))
});

if (!paddleApiToken) {
  return new Response(JSON.stringify({ error: 'Missing Paddle API token' }), {
    status: 500,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

if (paddleEnv === 'production' && !paddleApiToken.startsWith('pdl_live_')) {
  return new Response(
    JSON.stringify({
      error: 'Server misconfigured: expected a LIVE server API key (pdl_live_...) for production.',
    }),
    { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

if (paddleEnv !== 'production' && !paddleApiToken.startsWith('pdl_sandbox_')) {
  return new Response(
    JSON.stringify({
      error: 'Server misconfigured: expected a SANDBOX server API key (pdl_sandbox_...) for non-production.',
    }),
    { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

    /* =======================
       GET (Paddle API proxy)
       ======================= */
    if (req.method === 'GET') {
      const url = new URL(req.url);

      if (!paddleApiToken) {
        return new Response(JSON.stringify({ error: 'Missing Paddle API token' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Path after /functions/v1/<slug>
      const fullPath = url.pathname;
      const after = fullPath.replace(/^\/functions\/v1\/[^/]+/, '');
      const include = url.searchParams.get('include') ?? undefined;

      // Legacy query support
      const endpoint = url.searchParams.get('endpoint');
      const priceId = url.searchParams.get('price_id');
      const productId = url.searchParams.get('product_id');

      let apiUrl = '';

      // 1) /prices/:id
      const mPrice = after.match(/^\/prices\/([^/]+)$/);
      if (mPrice) {
        const id = mPrice[1];
        apiUrl = `${PADDLE_BASE}/prices/${id}${include ? `?include=${include}` : ''}`;
      }

      // 2) /products/:id
      const mProduct = after.match(/^\/products\/([^/]+)$/);
      if (!apiUrl && mProduct) {
        const id = mProduct[1];
        apiUrl = `${PADDLE_BASE}/products/${id}${include ? `?include=${include}` : ''}`;
      }

      // 3) /prices?product_id=...
      if (!apiUrl && after === '/prices') {
        const qs = new URLSearchParams();
        for (const [k, v] of url.searchParams.entries()) qs.append(k, v);
        apiUrl = `${PADDLE_BASE}/prices${qs.toString() ? `?${qs.toString()}` : ''}`;
      }

      // 4) Legacy query: price_id/product_id
      if (!apiUrl && priceId) {
        apiUrl = `${PADDLE_BASE}/prices/${priceId}${include ? `?include=${include}` : ''}`;
      }
      if (!apiUrl && productId) {
        apiUrl = `${PADDLE_BASE}/products/${productId}${include ? `?include=${include}` : ''}`;
      }

      // 5) Explicit endpoint fallback
      if (!apiUrl && endpoint === 'prices' && priceId) {
        apiUrl = `${PADDLE_BASE}/prices/${priceId}${include ? `?include=${include}` : ''}`;
      }

      if (!apiUrl) {
        return new Response(JSON.stringify({ error: 'Invalid API request' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      try {
        const paddleResponse = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${paddleApiToken}`,
            'Content-Type': 'application/json',
          },
        });

        const text = await paddleResponse.text();
        return new Response(text, {
          status: paddleResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (fetchError: any) {
        console.error('❌ Failed to fetch from Paddle API:', fetchError);
        return new Response(
          JSON.stringify({ error: `Failed to fetch from Paddle API: ${fetchError.message}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    /* ==========================================
       POST /create-transaction  (hosted checkout)
       ========================================== */
    if (req.method === 'POST' && new URL(req.url).pathname.endsWith('/create-transaction')) {
      if (!paddleApiToken) {
        return new Response(JSON.stringify({ error: 'Missing PADDLE_API_TOKEN' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      let payload: any;
      try {
        payload = await req.json();
      } catch {
        return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (!payload?.items || !Array.isArray(payload.items) || payload.items.length === 0) {
        return new Response(JSON.stringify({ error: 'items[] is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const txBody = {
        items: payload.items,
        customer: payload.customer,
        success_url: payload.successUrl,
        custom_data: payload.customData,
      };

      const paddleRes = await fetch(`${PADDLE_BASE}/transactions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${paddleApiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(txBody),
      });

      const text = await paddleRes.text();
      return new Response(text, {
        status: paddleRes.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    /* =======================
       POST (webhooks)
       ======================= */
    if (req.method === 'POST') {
      if (!supabaseUrl || !supabaseServiceKey) {
        return new Response(JSON.stringify({ error: 'Missing Supabase configuration' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      const signature = req.headers.get('paddle-signature');
      const body = await req.text();

      if (!signature) {
        return new Response(JSON.stringify({ error: 'Missing signature' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (paddleWebhookSecret && !verifyPaddleSignature(body, signature, paddleWebhookSecret)) {
        return new Response(JSON.stringify({ error: 'Invalid signature' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      let event: PaddleWebhookEvent;
      try {
        event = JSON.parse(body);
      } catch {
        return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('🔔 Received Paddle webhook:', event.event_type);

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

      return new Response('OK', { status: 200, headers: corsHeaders });
    }

    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  } catch (error: any) {
    console.error('❌ Webhook processing error:', error);
    return new Response(`Error: ${error.message}`, {
      status: 500,
      headers: corsHeaders,
    });
  }
});

/* ---------- webhook helpers (unchanged) ---------- */
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

    const { error: planError } = await supabase
      .from('user_plans')
      .update({
        plan_type: planType,
        subscription_limit: planType === 'pro' ? 999999 : 5,
        features: {
          analytics: planType === 'pro',
          reports: planType === 'pro',
          team_features: false,
          api_access: false,
        },
      })
      .eq('user_id', userId);

    if (planError) {
      console.error('❌ Failed to update user plan:', planError);
      throw planError;
    }

    if (planType === 'pro') {
      const { error: prefsError } = await supabase
        .from('notification_preferences')
        .update({
          reminder_30_days: true,
          reminder_1_day: true,
        })
        .eq('user_id', userId);

      if (prefsError) {
        console.error('❌ Failed to update notification preferences:', prefsError);
      }
    }

    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'system',
      title: '🎉 Welcome to SubTracker Pro!',
      message:
        'Your payment was successful and your plan has been upgraded. Enjoy unlimited subscriptions and advanced features!',
      is_read: false,
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

    const { error: subError } = await supabase.from('paddle_subscriptions').insert({
      user_id: userId,
      paddle_subscription_id: event.data.id,
      status: event.data.status,
      created_at: new Date().toISOString(),
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
    const { error: updateError } = await supabase
      .from('paddle_subscriptions')
      .update({
        status: event.data.status,
        updated_at: new Date().toISOString(),
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

    const { error: planError } = await supabase
      .from('user_plans')
      .update({
        plan_type: 'free',
        subscription_limit: 5,
        features: {
          analytics: false,
          reports: false,
          team_features: false,
          api_access: false,
        },
      })
      .eq('user_id', userId);

    if (planError) {
      console.error('❌ Failed to downgrade user plan:', planError);
      throw planError;
    }

    const { error: prefsError } = await supabase
      .from('notification_preferences')
      .update({
        reminder_30_days: false,
        reminder_1_day: false,
      })
      .eq('user_id', userId);

    if (prefsError) {
      console.error('❌ Failed to update notification preferences:', prefsError);
    }

    const { error: subError } = await supabase
      .from('paddle_subscriptions')
      .update({
        status: 'canceled',
        updated_at: new Date().toISOString(),
      })
      .eq('paddle_subscription_id', event.data.id);

    if (subError) {
      console.error('❌ Failed to update Paddle subscription status:', subError);
    }

    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'system',
      title: 'Subscription Cancelled',
      message:
        'Your Pro subscription has been cancelled. You can resubscribe anytime to regain access to Pro features.',
      is_read: false,
    });

    console.log('✅ Subscription cancelled successfully for user:', userId);
  } catch (error) {
    console.error('❌ Error processing subscription cancellation:', error);
    throw error;
  }
}
