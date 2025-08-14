# 🚀 SubTracker Deployment Guide

This guide will walk you through deploying SubTracker to production using Vercel and setting up payment processing with Paddle.

## 📋 Pre-Deployment Checklist

### 1. Supabase Setup ✅
- [x] Supabase project created
- [x] Database migrations applied
- [x] RLS policies configured
- [x] Authentication settings configured

### 2. Payment Provider Setup
- [ ] Paddle merchant account created
- [ ] API token and client-side token obtained
- [ ] Products and prices created in Paddle dashboard
- [ ] Webhook URLs configured
- [ ] Success URLs configured

### 3. Environment Variables
- [ ] All environment variables documented
- [ ] Production values ready
- [ ] Secrets secured

## 🔧 Step 1: Paddle Setup

### Create Merchant Account

1. **Sign up for Paddle**:
   - Go to [Paddle.com](https://www.paddle.com)
   - Create a merchant account
   - Complete verification process

2. **Get API Credentials**:
   - Navigate to Developer Tools → Authentication
   - Generate and copy API Token
   - Copy your Client-side Token
   - Note the environment (sandbox/production)

3. **Create Products and Prices**:
   - Go to Catalog → Products
   - Create "SubTracker Pro" product
   - Add monthly price ($7.99 USD)
   - Copy the Price ID for your .env file

4. **Configure Webhooks**:
   ```
   Success URL: https://your-domain.vercel.app/account?payment=success
   Webhook URL: https://your-domain.vercel.app/functions/v1/paddle-webhook
   ```

## 🌐 Step 2: Vercel Deployment

### Install Vercel CLI

```bash
npm install -g vercel
```

### Deploy to Vercel

1. **Login to Vercel**:
   ```bash
   vercel login
   ```

2. **Deploy**:
   ```bash
   vercel
   ```

3. **Follow the prompts**:
   - Link to existing project or create new
   - Set project name: `subtracker`
   - Choose framework: `Vite`
   - Set build command: `npm run build`
   - Set output directory: `dist`

### Configure Environment Variables

In your Vercel dashboard, add these environment variables:

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# Paddle
VITE_PADDLE_API_TOKEN=your_paddle_api_token
VITE_PADDLE_CLIENT_TOKEN=your_paddle_client_token
VITE_PADDLE_PRO_PRICE_ID=your_pro_price_id
VITE_PADDLE_WEBHOOK_SECRET=your_webhook_secret
VITE_PADDLE_ENVIRONMENT=production

# App
VITE_APP_URL=https://your-domain.vercel.app
```

## 🔒 Step 3: Security Configuration

### Update Supabase Auth Settings

1. **Add Production URL**:
   - Go to Supabase Dashboard → Authentication → URL Configuration
   - Add your Vercel domain to Site URL
   - Add redirect URLs:
     ```
     https://your-domain.vercel.app/dashboard
     https://your-domain.vercel.app/account
     https://your-domain.vercel.app/update-password
     ```

2. **Configure Email Templates**:
   - Update email templates with your domain
   - Test password reset flow
   - Test email confirmation flow

### Update CORS Settings

1. **API Settings**:
   - Go to Supabase Dashboard → Settings → API
   - Add your Vercel domain to CORS origins
   - Update any API restrictions

## 💳 Step 4: Paddle Payment Testing

### Test Paddle Integration

1. **Sandbox Testing**:
   ```bash
   # Set Paddle environment to sandbox
   VITE_PADDLE_ENVIRONMENT=sandbox
   ```

2. **Test Scenarios**:
   - [ ] Successful payment
   - [ ] Cancelled payment
   - [ ] Failed payment
   - [ ] Plan upgrade after payment
   - [ ] Webhook processing

3. **Production Testing**:
   - Use small amounts for testing
   - Test with real payment methods
   - Verify plan upgrades work correctly
   - Test webhook delivery

## 📊 Step 5: Monitoring Setup

### Vercel Analytics

1. **Enable Analytics**:
   - Go to Vercel Dashboard → Analytics
   - Enable Web Analytics
   - Configure custom events

2. **Performance Monitoring**:
   - Monitor Core Web Vitals
   - Track page load times
   - Monitor error rates

### Supabase Monitoring

1. **Database Monitoring**:
   - Monitor query performance
   - Set up alerts for high usage
   - Monitor storage usage

2. **Auth Monitoring**:
   - Monitor sign-up rates
   - Track authentication errors
   - Monitor session duration

## 🔄 Step 6: Post-Deployment Tasks

### Verify All Features

- [ ] User registration works
- [ ] Email authentication works
- [ ] Password reset works
- [ ] Google OAuth works (if enabled)
- [ ] Subscription CRUD operations
- [ ] Payment processing
- [ ] Plan upgrades
- [ ] Notifications system
- [ ] Analytics and reports
- [ ] Data export
- [ ] Paddle webhook processing

### Performance Optimization

1. **Enable Compression**:
   ```json
   // vercel.json
   {
     "headers": [
       {
         "source": "/(.*)",
         "headers": [
           {
             "key": "X-Content-Type-Options",
             "value": "nosniff"
           },
           {
             "key": "X-Frame-Options",
             "value": "DENY"
           },
           {
             "key": "X-XSS-Protection",
             "value": "1; mode=block"
           }
         ]
       }
     ]
   }
   ```

2. **CDN Configuration**:
   - Vercel automatically handles CDN
   - Optimize images and assets
   - Enable caching headers

## 🚨 Step 7: Production Checklist

### Security
- [ ] All environment variables secured
- [ ] HTTPS enforced
- [ ] CORS properly configured
- [ ] RLS policies tested
- [ ] Payment webhooks secured

### Performance
- [ ] Bundle size optimized
- [ ] Images optimized
- [ ] Database queries optimized
- [ ] Caching configured

### Monitoring
- [ ] Error tracking enabled
- [ ] Performance monitoring active
- [ ] Database monitoring configured
- [ ] Payment monitoring setup

### Business
- [ ] Terms of Service updated
- [ ] Privacy Policy updated
- [ ] Contact information updated
- [ ] Support system ready

## 🔧 Troubleshooting

### Common Issues

1. **Environment Variables Not Loading**:
   - Check variable names match exactly
   - Redeploy after adding variables
   - Check Vercel dashboard for typos

2. **Paddle Integration Issues**:
   - Verify API tokens and client-side token
   - Check product and price IDs
   - Check webhook URLs
   - Test in sandbox first

3. **Database Connection Issues**:
   - Verify Supabase URL and keys
   - Check RLS policies
   - Monitor connection limits

4. **Authentication Issues**:
   - Check redirect URLs
   - Verify email settings
   - Test OAuth providers

### Support

If you encounter issues:

1. Check Vercel deployment logs
2. Check Supabase logs
3. Check Paddle webhook logs
3. Check browser console for errors
4. Contact support: iamstark009@gmail.com

## 📈 Scaling Considerations

### Database Scaling
- Monitor connection usage
- Consider connection pooling
- Plan for data growth

### Payment Scaling
- Monitor transaction volume
- Consider rate limiting
- Plan for international expansion

### Infrastructure Scaling
- Monitor Vercel usage
- Consider Pro plan for higher limits
- Plan for traffic spikes

---

🎉 **Congratulations!** Your SubTracker app with Paddle integration is now live in production!