import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, Scale, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export const TermsOfServicePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            to="/"
            className="inline-flex items-center text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Terms of Service
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 p-8 space-y-8"
        >
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <Scale className="w-6 h-6 mr-3 text-emerald-600" />
              Acceptance of Terms
            </h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-600 dark:text-gray-400">
                By accessing and using SubTracker, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Service Description
            </h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                SubTracker is a subscription management platform that helps users:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
                <li>Track and manage recurring subscriptions</li>
                <li>Receive renewal reminders</li>
                <li>Analyze spending patterns</li>
                <li>Generate reports and export data</li>
                <li>Optimize subscription costs</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <CheckCircle className="w-6 h-6 mr-3 text-green-600" />
              User Responsibilities
            </h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                As a user of SubTracker, you agree to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
                <li>Provide accurate and complete information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Use the service only for lawful purposes</li>
                <li>Not attempt to reverse engineer or hack the service</li>
                <li>Respect intellectual property rights</li>
                <li>Not share your account with others</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Subscription Plans
            </h2>
            <div className="prose dark:prose-invert max-w-none">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-xl">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Free Plan</h3>
                  <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                    <li>• Up to 5 subscriptions</li>
                    <li>• Basic reminders (7 days)</li>
                    <li>• Simple analytics</li>
                    <li>• Email support</li>
                  </ul>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border-2 border-blue-200 dark:border-blue-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Pro Plan - $7.99/month</h3>
                  <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                    <li>• Unlimited subscriptions</li>
                    <li>• Advanced reminders (30, 7, 1 days)</li>
                    <li>• Detailed analytics</li>
                    <li>• CSV export</li>
                    <li>• Priority support</li>
                  </ul>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Pro plan subscriptions are billed monthly and can be cancelled at any time. Refunds are not provided for partial months.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <XCircle className="w-6 h-6 mr-3 text-red-600" />
              Prohibited Uses
            </h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                You may not use SubTracker for:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
                <li>Any unlawful purpose or to solicit others to unlawful acts</li>
                <li>Violating any international, federal, provincial, or state regulations or laws</li>
                <li>Infringing upon or violating our intellectual property rights or the intellectual property rights of others</li>
                <li>Harassing, abusing, insulting, harming, defaming, slandering, disparaging, intimidating, or discriminating</li>
                <li>Submitting false or misleading information</li>
                <li>Uploading or transmitting viruses or any other type of malicious code</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <AlertTriangle className="w-6 h-6 mr-3 text-yellow-600" />
              Limitation of Liability
            </h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-600 dark:text-gray-400">
                SubTracker is provided "as is" without any representations or warranties. We shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Data and Privacy
            </h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-600 dark:text-gray-400">
                Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the service, to understand our practices.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Termination
            </h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-600 dark:text-gray-400">
                We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. Upon termination, your right to use the service will cease immediately.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Changes to Terms
            </h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-600 dark:text-gray-400">
                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days notice prior to any new terms taking effect.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Contact Information
            </h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-600 dark:text-gray-400">
                If you have any questions about these Terms of Service, please contact us:
              </p>
              <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                <p className="text-emerald-700 dark:text-emerald-300">
                  📧 Email: <a href="mailto:iamstark009@gmail.com" className="underline">iamstark009@gmail.com</a>
                </p>
              </div>
            </div>
          </section>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              By using SubTracker, you acknowledge that you have read and understood these Terms of Service and agree to be bound by them.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};