import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Target, 
  TrendingUp, 
  Bell, 
  Shield, 
  Smartphone, 
  BarChart3,
  Check,
  ArrowRight,
  Star,
  Layers,
  DollarSign,
  Calendar,
  Users
} from 'lucide-react';
import { motion } from 'framer-motion';

export const LandingPage: React.FC = () => {
  const features = [
    {
      icon: Target,
      title: 'Smart Subscription Tracking',
      description: 'Keep all your recurring payments organized in one beautiful, intuitive dashboard with real-time updates.'
    },
    {
      icon: Bell,
      title: 'Intelligent Reminders',
      description: 'Never miss a renewal with smart notifications that adapt to your preferences and payment schedules.'
    },
    {
      icon: BarChart3,
      title: 'Advanced Analytics',
      description: 'Understand your spending patterns with detailed charts, trends, and insights to optimize your budget.'
    },
    {
      icon: TrendingUp,
      title: 'Cost Optimization',
      description: 'Identify opportunities to save money on unused subscriptions and optimize your recurring expenses.'
    },
    {
      icon: Shield,
      title: 'Bank-Level Security',
      description: 'Your financial data is encrypted with industry-standard security and never shared with third parties.'
    },
    {
      icon: Smartphone,
      title: 'Mobile-First Design',
      description: 'Access your subscriptions anywhere with our responsive design that works perfectly on all devices.'
    }
  ];

  const pricingPlans = [
    {
      name: 'Starter',
      price: '$0',
      period: 'forever',
      features: [
        'Up to 5 subscriptions',
        'Basic reminders',
        'Simple analytics',
        'Mobile app access',
        'Email support'
      ],
      cta: 'Get Started Free',
      popular: false
    },
    {
      name: 'Pro',
      price: '$4.99',
      period: 'per month',
      features: [
        'Unlimited subscriptions',
        'Advanced reminders',
        'Detailed analytics',
        'CSV export',
        'Team sharing',
        'Priority support',
        'Custom categories'
      ],
      cta: 'Start Free Trial',
      popular: true
    },
    {
      name: 'Business',
      price: '$19.99',
      period: 'per month',
      features: [
        'Everything in Pro',
        'Team management',
        'Admin dashboard',
        'API access',
        'Custom integrations',
        'Dedicated support',
        'Advanced reporting'
      ],
      cta: 'Contact Sales',
      popular: false
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Small Business Owner',
      content: 'SubTracker helped me save over $200/month by identifying unused subscriptions. The analytics are incredibly detailed and actionable!',
      rating: 5,
      avatar: 'SJ'
    },
    {
      name: 'Mike Chen',
      role: 'Freelance Designer',
      content: 'The reminder system is perfect. I never miss renewals anymore and can budget more effectively. The UI is beautiful too!',
      rating: 5,
      avatar: 'MC'
    },
    {
      name: 'Emily Rodriguez',
      role: 'Marketing Manager',
      content: 'Love the analytics dashboard. It gives me clear insights into our team\'s software spending and helps optimize our budget.',
      rating: 5,
      avatar: 'ER'
    }
  ];

  // Custom SubTracker Logo Component
  const SubTrackerLogo = () => (
    <div className="relative">
      <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 via-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
        <div className="relative">
          <Target className="w-6 h-6 text-white" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-orange-400 to-red-500 rounded-full border-2 border-white flex items-center justify-center">
            <Layers className="w-1.5 h-1.5 text-white" />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <SubTrackerLogo />
              <span className="font-bold text-xl bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                SubTracker
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="bg-gradient-to-r from-emerald-500 to-blue-600 text-white px-6 py-2 rounded-xl font-medium hover:from-emerald-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 via-blue-50/50 to-purple-50/50 dark:from-emerald-900/10 dark:via-blue-900/10 dark:to-purple-900/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6"
            >
              Take Control of Your
              <span className="bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                {' '}Subscriptions
              </span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto"
            >
              Stop losing money on forgotten subscriptions. Track, manage, and optimize all your recurring payments with intelligent insights and beautiful analytics.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
            >
              <Link
                to="/register"
                className="bg-gradient-to-r from-emerald-500 to-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-emerald-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl inline-flex items-center justify-center"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <button className="border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-8 py-4 rounded-xl font-semibold text-lg hover:border-emerald-500 dark:hover:border-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition-all">
                View Demo
              </button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto"
            >
              {[
                { icon: Users, label: '10,000+', description: 'Happy Users' },
                { icon: DollarSign, label: '$2M+', description: 'Money Saved' },
                { icon: Calendar, label: '50,000+', description: 'Subscriptions Tracked' }
              ].map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.label}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{stat.description}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Everything you need to manage subscriptions
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Powerful features designed to help individuals and businesses take complete control of their recurring expenses.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-8 rounded-2xl hover:shadow-xl transition-all duration-300 border border-gray-200/50 dark:border-gray-700/50"
              >
                <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gradient-to-r from-emerald-50/50 to-blue-50/50 dark:from-emerald-900/10 dark:to-blue-900/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Loved by thousands of users
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              See what our customers have to say about SubTracker
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-8 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50"
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  "{testimonial.content}"
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white font-semibold text-sm">{testimonial.avatar}</span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {testimonial.role}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Choose the plan that's right for your needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-8 rounded-2xl shadow-xl border-2 ${
                  plan.popular 
                    ? 'border-emerald-500 ring-4 ring-emerald-500 ring-opacity-20' 
                    : 'border-gray-200/50 dark:border-gray-700/50'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-emerald-500 to-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {plan.name}
                  </h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">
                      {plan.price}
                    </span>
                    <span className="text-gray-600 dark:text-gray-300 ml-2">
                      {plan.period}
                    </span>
                  </div>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <Check className="w-5 h-5 text-emerald-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-600 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  className={`w-full py-3 px-6 rounded-xl font-semibold transition-all ${
                    plan.popular
                      ? 'bg-gradient-to-r from-emerald-500 to-blue-600 text-white hover:from-emerald-600 hover:to-blue-700 shadow-lg hover:shadow-xl'
                      : 'border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-emerald-500 dark:hover:border-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-400'
                  }`}
                >
                  {plan.cta}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-white mb-4"
          >
            Ready to take control of your subscriptions?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            viewport={{ once: true }}
            className="text-xl text-blue-100 mb-8"
          >
            Join thousands of users already saving money and time with SubTracker.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            viewport={{ once: true }}
          >
            <Link
              to="/register"
              className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl inline-flex items-center"
            >
              Start Your Free Trial
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <SubTrackerLogo />
              <span className="font-bold text-xl">SubTracker</span>
            </div>
            
            <div className="flex space-x-6 text-sm">
              <a href="#" className="hover:text-emerald-400 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-emerald-400 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-emerald-400 transition-colors">Support</a>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 SubTracker. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};