import React, { useState, useEffect } from 'react';
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
  Users,
  Sparkles,
  Zap,
  ChevronDown,
  Globe,
  Lock,
  Rocket,
  Heart,
  Award,
  MousePointer,
  Eye,
  Lightbulb,
  Mail,
  FileText,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const LandingPage: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [isAnnual, setIsAnnual] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-rotate features only when not hovering
  useEffect(() => {
    if (isHovering) return; // Don't auto-rotate when user is hovering
    
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isHovering]);

  const features = [
    {
      icon: Target,
      title: 'AI-Powered Tracking',
      description: 'Automatically categorize and track all your subscriptions with intelligent detection and smart insights.',
      gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
      demo: 'Track 50+ services automatically',
      demoTitle: 'Analytics Dashboard',
      progress: 94
    },
    {
      icon: Bell,
      title: 'Smart Notifications',
      description: 'Get personalized reminders that adapt to your spending patterns and prevent unwanted renewals.',
      gradient: 'from-orange-500 via-red-500 to-pink-500',
      demo: 'Save $200+ monthly on average',
      demoTitle: 'Renewal Reminders',
      progress: 78
    },
    {
      icon: BarChart3,
      title: 'Advanced Analytics',
      description: 'Beautiful dashboards with predictive insights to optimize your subscription portfolio.',
      gradient: 'from-blue-500 via-purple-500 to-indigo-500',
      demo: 'Real-time spending insights',
      demoTitle: 'Spending Reports',
      progress: 91
    },
    {
      icon: Shield,
      title: 'Bank-Level Security',
      description: 'Enterprise-grade encryption with zero-knowledge architecture. Your data stays private.',
      gradient: 'from-green-500 via-emerald-500 to-teal-500',
      demo: 'SOC 2 Type II Certified',
      demoTitle: 'Security Center',
      progress: 100
    }
  ];

  const pricingPlans = [
    {
      name: 'Starter',
      price: '$0',
      originalPrice: null,
      period: 'forever',
      description: 'Perfect for personal use',
      features: [
        'Up to 5 subscriptions',
        'Basic reminders (7 days)',
        'Simple analytics',
        'Mobile app access',
        'Email support'
      ],
      cta: 'Start Free',
      popular: false,
      gradient: 'from-gray-500 to-slate-600',
      planType: 'free' as const
    },
    {
      name: 'Pro',
      price: isAnnual ? '$79' : '$7.99',
      originalPrice: isAnnual ? '$95.88' : null,
      period: isAnnual ? 'per year' : 'per month',
      description: 'For power users who want everything',
      features: [
        'Unlimited subscriptions',
        'Advanced AI reminders (30, 7, 1 days)',
        'Detailed analytics & forecasting',
        'CSV export & integrations',
        'Priority support',
        'Custom categories & tags',
        'Spending insights & trends',
        'Renewal optimization tips'
      ],
      cta: 'Start Free',
      popular: true,
      gradient: 'from-blue-500 to-indigo-600',
      savings: isAnnual ? 'Save 17%' : null,
      planType: 'pro' as const
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'Product Manager at Stripe',
      content: 'SubTracker helped me discover I was paying for 12 services I forgot about. Saved me $180/month instantly!',
      rating: 5,
      avatar: 'SC',
      company: 'Stripe'
    },
    {
      name: 'Marcus Rodriguez',
      role: 'Founder at TechFlow',
      content: 'The analytics are incredible. We optimized our team\'s software stack and reduced costs by 40% while improving productivity.',
      rating: 5,
      avatar: 'MR',
      company: 'TechFlow'
    },
    {
      name: 'Emily Watson',
      role: 'CFO at GrowthLabs',
      content: 'Finally, a tool that gives us complete visibility into our subscription spend. The ROI tracking is a game-changer.',
      rating: 5,
      avatar: 'EW',
      company: 'GrowthLabs'
    }
  ];

  const stats = [
    { icon: Users, label: '50,000+', description: 'Active Users', color: 'text-emerald-500' },
    { icon: DollarSign, label: '$5M+', description: 'Money Saved', color: 'text-blue-500' },
    { icon: Calendar, label: '200K+', description: 'Subscriptions Tracked', color: 'text-purple-500' },
    { icon: Award, label: '4.9/5', description: 'User Rating', color: 'text-orange-500' }
  ];

  // Custom SubTracker Logo Component
  const SubTrackerLogo = ({ size = 'default' }: { size?: 'small' | 'default' | 'large' }) => {
    const sizeClasses = {
      small: 'w-8 h-8',
      default: 'w-12 h-12',
      large: 'w-16 h-16'
    };

    return (
      <div className="relative">
        <div className={`${sizeClasses[size]} bg-gradient-to-br from-emerald-500 via-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl`}>
          <div className="relative">
            <Target className={`${size === 'small' ? 'w-4 h-4' : size === 'large' ? 'w-8 h-8' : 'w-6 h-6'} text-white`} />
            <div className={`absolute -top-1 -right-1 ${size === 'small' ? 'w-2 h-2' : 'w-3 h-3'} bg-gradient-to-r from-orange-400 to-red-500 rounded-full border-2 border-white flex items-center justify-center`}>
              <Layers className={`${size === 'small' ? 'w-1 h-1' : 'w-1.5 h-1.5'} text-white`} />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800 overflow-hidden">
      {/* Enhanced Header */}
      <motion.header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-2xl border-b border-gray-200/50 dark:border-gray-700/50' 
            : 'bg-transparent'
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link to="/" className="flex items-center space-x-3 group">
              <SubTrackerLogo />
              <span className="font-bold text-xl bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform">
                SubTracker
              </span>
            </Link>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#about" className="text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium transition-colors">
                About
              </a>
              <a href="#features" className="text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium transition-colors">
                Features
              </a>
              <a href="#pricing" className="text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium transition-colors">
                Pricing
              </a>
              <a href="#testimonials" className="text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium transition-colors">
                Reviews
              </a>
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
                className="bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:from-emerald-600 hover:via-blue-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl hover:scale-105 flex items-center group"
              >
                Get Started
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Hero Section - Enhanced */}
      <section id="about" className="relative pt-32 pb-20 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-emerald-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-40 right-10 w-96 h-96 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-20 left-1/2 w-80 h-80 bg-gradient-to-r from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-900/20 dark:to-blue-900/20 px-6 py-3 rounded-full border border-emerald-200/50 dark:border-emerald-700/50 mb-8"
            >
              <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-emerald-700 dark:text-emerald-300 font-semibold text-sm">
                #1 Subscription Management Platform
              </span>
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-5xl md:text-7xl lg:text-8xl font-bold text-gray-900 dark:text-white mb-8 leading-tight"
            >
              Never Lose
              <br />
              <span className="bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                Money Again
              </span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed"
            >
              AI-powered subscription management that automatically tracks, optimizes, and saves you money. 
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold"> Join 50,000+ users saving $200+ monthly.</span>
            </motion.p>
            
            {/* Enhanced CTA Buttons - Fixed alignment */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col items-center justify-center mb-16"
            >
              <Link
                to="/register"
                className="group bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-600 text-white px-12 py-6 rounded-2xl font-bold text-xl hover:from-emerald-600 hover:via-blue-600 hover:to-purple-700 transition-all shadow-2xl hover:shadow-emerald-500/25 hover:scale-105 flex items-center justify-center mb-6"
              >
                <Rocket className="w-7 h-7 mr-4 group-hover:animate-bounce" />
                Start Free Today
                <ArrowRight className="w-7 h-7 ml-4 group-hover:translate-x-2 transition-transform" />
              </Link>
              
              {/* Fixed alignment - centered under button */}
              <div className="flex flex-col items-center space-y-2">
                <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                  <Shield className="w-5 h-5 text-emerald-500" />
                  <span className="text-sm font-medium">No credit card required</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                  <Star className="w-5 h-5 text-yellow-500" />
                  <span className="text-sm font-medium">Free tier available</span>
                </div>
              </div>
            </motion.div>

            {/* Live Stats */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto"
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 1 + index * 0.1 }}
                  className="text-center group"
                >
                  <div className={`w-16 h-16 bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl group-hover:scale-110 transition-transform border border-gray-200/50 dark:border-gray-600/50`}>
                    <stat.icon className={`w-8 h-8 ${stat.color}`} />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">{stat.label}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{stat.description}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <div className="flex flex-col items-center space-y-2 text-gray-400 dark:text-gray-500">
            <span className="text-sm font-medium">Scroll to explore</span>
            <ChevronDown className="w-6 h-6 animate-bounce" />
          </div>
        </motion.div>
      </section>

      {/* Interactive Features Section */}
      <section id="features" className="py-32 bg-gradient-to-r from-white/80 to-gray-50/80 dark:from-gray-900/80 dark:to-gray-800/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 px-6 py-3 rounded-full border border-blue-200/50 dark:border-blue-700/50 mb-8"
            >
              <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span className="text-blue-700 dark:text-blue-300 font-semibold text-sm">
                Powered by Advanced AI
              </span>
            </motion.div>
            
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6"
            >
              Features that
              <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent"> Actually Work</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto"
            >
              Stop manually tracking subscriptions. Our AI does the heavy lifting while you focus on what matters.
            </motion.p>
          </div>

          {/* Interactive Feature Showcase - Improved Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Feature List - Takes 7 columns */}
            <div 
              className="lg:col-span-7 space-y-4"
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
            >
              {features.map((feature, index) => {
                const FeatureIcon = feature.icon;
                const isActive = activeFeature === index;
                
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-6 rounded-2xl cursor-pointer transition-all duration-300 ease-out ${
                      isActive
                        ? 'bg-white dark:bg-gray-800 shadow-2xl border-2 border-emerald-200 dark:border-emerald-700 transform scale-[1.02]'
                        : 'bg-white/60 dark:bg-gray-800/60 hover:bg-white dark:hover:bg-gray-800 shadow-lg hover:shadow-xl'
                    }`}
                    onClick={() => setActiveFeature(index)}
                    onMouseEnter={() => setActiveFeature(index)}
                    whileHover={{ scale: isActive ? 1.02 : 1.01 }}
                  >
                    <div className="flex items-start space-x-4">
                      <div className={`w-12 h-12 bg-gradient-to-r ${feature.gradient} rounded-xl flex items-center justify-center shadow-lg transition-transform duration-300 ${
                        isActive ? 'scale-110' : ''
                      }`}>
                        <FeatureIcon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                          {feature.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 text-base leading-relaxed mb-3">
                          {feature.description}
                        </p>
                        <div className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                          isActive
                            ? 'bg-gradient-to-r from-emerald-100 to-blue-100 dark:from-emerald-900/30 dark:to-blue-900/30 text-emerald-700 dark:text-emerald-300'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}>
                          <Zap className="w-3 h-3" />
                          <span>{feature.demo}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Feature Demo - Takes 5 columns and is centered vertically */}
            <div className="lg:col-span-5 flex items-center justify-center">
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="w-full max-w-md"
              >
                <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 p-8 rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-gray-500 dark:text-gray-400 text-sm ml-4">
                      {features[activeFeature].demoTitle}
                    </span>
                  </div>
                  
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeFeature}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.4, ease: "easeInOut" }}
                      className="space-y-4"
                    >
                      {/* Mock Dashboard Content */}
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white dark:from-gray-700 dark:to-gray-800 rounded-xl">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 bg-gradient-to-r ${features[activeFeature].gradient} rounded-lg flex items-center justify-center`}>
                            {React.createElement(features[activeFeature].icon, { className: "w-5 h-5 text-white" })}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white">{features[activeFeature].title}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">Active</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-gray-900 dark:text-white">$29.99</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">monthly</div>
                        </div>
                      </div>
                      
                      {/* Progress bars with dynamic percentages */}
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Optimization</span>
                          <span className="text-gray-900 dark:text-white font-semibold">{features[activeFeature].progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <motion.div
                            className={`h-2 bg-gradient-to-r ${features[activeFeature].gradient} rounded-full`}
                            initial={{ width: 0 }}
                            animate={{ width: `${features[activeFeature].progress}%` }}
                            transition={{ duration: 1, delay: 0.5 }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section id="testimonials" className="py-32 bg-gradient-to-r from-emerald-50/50 to-blue-50/50 dark:from-emerald-900/10 dark:to-blue-900/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6"
            >
              Loved by
              <span className="bg-gradient-to-r from-emerald-500 to-blue-600 bg-clip-text text-transparent"> Thousands</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-xl text-gray-600 dark:text-gray-300"
            >
              See what our customers have to say about their experience
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 hover:scale-105 transition-all duration-300"
              >
                <div className="flex items-center mb-6">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-8 text-lg leading-relaxed">
                  "{testimonial.content}"
                </p>
                <div className="flex items-center">
                  <div className="w-14 h-14 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                    <span className="text-white font-bold text-lg">{testimonial.avatar}</span>
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 dark:text-white text-lg">
                      {testimonial.name}
                    </div>
                    <div className="text-gray-500 dark:text-gray-400">
                      {testimonial.role}
                    </div>
                    <div className="text-emerald-600 dark:text-emerald-400 text-sm font-semibold">
                      {testimonial.company}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Pricing Section with Annual Toggle */}
      <section id="pricing" className="py-32 bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6"
            >
              Simple,
              <span className="bg-gradient-to-r from-emerald-500 to-blue-600 bg-clip-text text-transparent"> Transparent Pricing</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-xl text-gray-600 dark:text-gray-300 mb-8"
            >
              Choose the plan that fits your needs. Upgrade or downgrade anytime.
            </motion.p>
            
            {/* Annual/Monthly Toggle */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="inline-flex items-center bg-gray-100 dark:bg-gray-800 p-2 rounded-2xl mb-12"
            >
              <button
                onClick={() => setIsAnnual(false)}
                className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                  !isAnnual 
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-lg' 
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setIsAnnual(true)}
                className={`px-6 py-3 rounded-xl font-semibold transition-all relative ${
                  isAnnual 
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-lg' 
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                Annual
                <span className="absolute -top-2 -right-2 bg-gradient-to-r from-emerald-500 to-blue-600 text-white text-xs px-2 py-1 rounded-full">
                  Save 17%
                </span>
              </button>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className={`relative p-8 lg:p-10 rounded-3xl transition-all duration-300 ${
                  plan.popular
                    ? 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-500 ring-4 ring-blue-500 ring-opacity-20 scale-105 shadow-2xl'
                    : 'bg-white/80 dark:bg-gray-800/80 border border-gray-200/50 dark:border-gray-700/50 shadow-xl hover:shadow-2xl hover:scale-105'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                      Most Popular
                    </span>
                  </div>
                )}

                {plan.savings && (
                  <div className="absolute -top-4 right-4">
                    <span className="bg-gradient-to-r from-emerald-500 to-green-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                      {plan.savings}
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {plan.description}
                  </p>
                  <div className="mb-6">
                    <div className="flex items-center justify-center space-x-2">
                      <span className="text-5xl font-bold text-gray-900 dark:text-white">
                        {plan.price}
                      </span>
                      <div className="flex flex-col">
                        <span className="text-gray-600 dark:text-gray-300 text-sm">
                          {plan.period}
                        </span>
                        {plan.originalPrice && (
                          <span className="text-gray-400 line-through text-sm">
                            {plan.originalPrice}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <Check className="w-5 h-5 text-emerald-500 mr-4 flex-shrink-0" />
                      <span className="text-gray-600 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to="/register"
                  className={`w-full py-4 px-8 rounded-2xl font-bold text-lg transition-all shadow-lg hover:shadow-xl flex items-center justify-center group ${
                    plan.popular
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700'
                      : 'bg-gradient-to-r from-emerald-500 to-blue-600 text-white hover:from-emerald-600 hover:to-blue-700'
                  }`}
                >
                  {plan.cta}
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced CTA Section */}
      <section className="py-32 bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Ready to Save Money?
            </h2>
            <p className="text-xl md:text-2xl text-blue-100 mb-12 leading-relaxed">
              Join 50,000+ users who've already saved millions. Start your free account today and see the difference.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link
                to="/register"
                className="group bg-white text-blue-600 px-10 py-5 rounded-2xl font-bold text-lg hover:bg-gray-100 transition-all shadow-2xl hover:shadow-white/25 hover:scale-105 flex items-center justify-center"
              >
                <Heart className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform" />
                Start Free Today
                <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-2 transition-transform" />
              </Link>
            </div>
            
            <div className="flex items-center justify-center space-x-8 text-white/80 text-sm">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center space-x-2">
                <Globe className="w-5 h-5" />
                <span>Free tier available</span>
              </div>
              <div className="flex items-center space-x-2">
                <Lock className="w-5 h-5" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Enhanced Footer - Cleaned up and functional */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <SubTrackerLogo />
                <span className="font-bold text-xl">SubTracker</span>
              </div>
              <p className="text-gray-400 leading-relaxed">
                The smartest way to manage your subscriptions and save money automatically.
              </p>
              <div className="flex space-x-4">
                <a 
                  href="mailto:iamstark009@gmail.com" 
                  className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors cursor-pointer"
                  title="Email us"
                >
                  <Mail className="w-5 h-5" />
                </a>
                <a 
                  href="#features" 
                  className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors cursor-pointer"
                  title="Features"
                >
                  <Globe className="w-5 h-5" />
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><Link to="/analytics" className="hover:text-white transition-colors">Analytics</Link></li>
                <li><Link to="/reports" className="hover:text-white transition-colors">Reports</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#about" className="hover:text-white transition-colors">About</a></li>
                <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                <li><a href="#testimonials" className="hover:text-white transition-colors">Reviews</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link 
                    to="/contact" 
                    className="hover:text-white transition-colors flex items-center"
                  >
                    <HelpCircle className="w-4 h-4 mr-2" />
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/privacy-policy" 
                    className="hover:text-white transition-colors flex items-center"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/terms-of-service" 
                    className="hover:text-white transition-colors flex items-center"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400">&copy; 2024 SubTracker. All rights reserved.</p>
            <div className="flex items-center space-x-6 mt-4 md:mt-0">
              <span className="text-gray-400 text-sm">Made with</span>
              <Heart className="w-4 h-4 text-red-500" />
              <span className="text-gray-400 text-sm">for subscription freedom</span>
              <span className="text-gray-400 text-sm">• Powered by Paddle</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};