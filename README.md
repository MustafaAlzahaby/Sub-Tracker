# SubTracker - Smart Subscription Management

A beautiful, production-ready subscription management platform built with React, TypeScript, Tailwind CSS, and Supabase.

## 🚀 Features

- **Smart Subscription Tracking** - Track unlimited subscriptions with intelligent categorization
- **Plan-Based Reminders** - Advanced reminder system based on user plan (Free vs Pro)
- **Beautiful Analytics** - Detailed spending insights and trends
- **Secure Payments** - Integrated with Verifona/2Checkout for Pro upgrades
- **Real-time Notifications** - Smart notifications for upcoming renewals
- **Export & Reports** - Generate detailed reports and export data
- **Responsive Design** - Works perfectly on all devices

## 🏗️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Payments**: Verifona/2Checkout
- **Deployment**: Vercel
- **UI Components**: Lucide React, Framer Motion
- **Charts**: Recharts

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Verifona/2Checkout merchant account

## 🛠️ Installation & Setup

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd subtracker
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Verifona/2Checkout Payment Configuration
VITE_VERIFONA_MERCHANT_CODE=your_merchant_code
VITE_VERIFONA_SECRET_KEY=your_secret_key
VITE_VERIFONA_ENVIRONMENT=sandbox

# App Configuration (for production)
VITE_APP_URL=https://your-domain.vercel.app
```

### 3. Supabase Setup

1. Create a new Supabase project
2. Run the migrations in the `supabase/migrations` folder
3. Set up Row Level Security (RLS) policies
4. Configure authentication settings

### 4. Verifona/2Checkout Setup

1. Create a merchant account with Verifona or 2Checkout
2. Get your merchant code and secret key
3. Configure webhook URLs for payment callbacks
4. Set up return URLs for successful/cancelled payments

## 🚀 Deployment to Vercel

### 1. Install Vercel CLI

```bash
npm install -g vercel
```

### 2. Deploy

```bash
vercel
```

### 3. Set Environment Variables

In your Vercel dashboard, add the following environment variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_VERIFONA_MERCHANT_CODE`
- `VITE_VERIFONA_SECRET_KEY`
- `VITE_VERIFONA_ENVIRONMENT` (set to "production")
- `VITE_APP_URL` (your Vercel domain)

### 4. Configure Custom Domain (Optional)

1. Add your custom domain in Vercel dashboard
2. Update DNS settings
3. Update `VITE_APP_URL` environment variable

## 💳 Payment Integration

### Verifona/2Checkout Integration

The app uses Verifona/2Checkout for secure payment processing:

1. **Payment Flow**: User clicks upgrade → Redirects to Verifona → Returns to app
2. **Security**: All payments are processed securely by Verifona
3. **Verification**: Payment callbacks are verified using HMAC signatures
4. **Plan Upgrade**: Successful payments automatically upgrade user to Pro plan

### Webhook Configuration

Set up webhooks in your Verifona/2Checkout dashboard:

- **Success URL**: `https://your-domain.vercel.app/account?payment=success`
- **Cancel URL**: `https://your-domain.vercel.app/account?payment=cancelled`
- **Webhook URL**: `https://your-domain.vercel.app/api/webhooks/payment`

## 📊 Plan Features

### Free Plan
- Up to 5 subscriptions
- 7-day renewal reminders only
- Basic analytics
- Email support

### Pro Plan ($7.99/month)
- Unlimited subscriptions
- All reminder types (30, 7, 1 day)
- Advanced analytics
- CSV export
- Priority support

## 🔧 Development

### Run Development Server

```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Dashboard/       # Dashboard-specific components
│   ├── Layout/          # Layout components (Header, Sidebar)
│   ├── PlanGating/      # Plan-based feature gating
│   └── Subscriptions/   # Subscription management components
├── hooks/               # Custom React hooks
├── lib/                 # Utility libraries and services
├── pages/               # Page components
└── types/               # TypeScript type definitions

supabase/
├── functions/           # Edge functions
└── migrations/          # Database migrations
```

## 🔒 Security Features

- **Row Level Security (RLS)** - Database-level security
- **Authentication** - Supabase Auth with email/password and Google OAuth
- **Payment Security** - PCI-compliant payment processing
- **Data Encryption** - All data encrypted in transit and at rest
- **HTTPS Only** - Secure connections enforced

## 📈 Analytics & Monitoring

- **User Analytics** - Track user engagement and feature usage
- **Payment Analytics** - Monitor conversion rates and revenue
- **Performance Monitoring** - Track app performance and errors
- **Database Monitoring** - Monitor query performance and usage

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For support, email iamstark009@gmail.com or create an issue in the repository.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

Built with ❤️ for subscription freedom