import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, Scale, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export const RefundPolicyPage: React.FC = () => {
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
            Refund Policy
          </h1>
          
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
              Refund Eligibility
            </h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-600 dark:text-gray-400">
                We want you to be fully satisfied with your SubTracker subscription. Our refund policy is designed to ensure that your experience with us is seamless. Refunds are offered under the following conditions:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
                <li><strong>30-Day Refund Window:</strong> Refunds are available only within 30 days of your subscription purchase for annual plans. Monthly plans are non-refundable but may be cancelled at any time.</li>
                <li><strong>No Refunds for Partial Months:</strong> Refunds are not available for partial months. If you cancel your monthly subscription, you will still have access to the service until the next billing cycle.</li>
                <li><strong>Non-Refundable Services:</strong> Digital products, consumed services, or subscription renewals after the 30-day window are non-refundable.</li>
                <li><strong>Eligibility Check:</strong> Refund eligibility applies only to the original purchaser and is subject to verification of purchase details and reasons for the request.</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <CheckCircle className="w-6 h-6 mr-3 text-green-600" />
              Refund Process
            </h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-600 dark:text-gray-400">
                To initiate a refund, please follow the steps below:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
                <li><strong>Contact Support:</strong> Reach out to our support team at <a href="mailto:support@example.com" className="text-blue-500">support@example.com</a>.</li>
                <li><strong>Provide Your Order Details:</strong> Include your order number, the subscription plan, and the reason for requesting a refund.</li>
                <li><strong>Refund Processing:</strong> If eligible, refunds will be processed back to the original payment method. Processing may take up to 10 business days.</li>
                <li><strong>Paddle's Role:</strong> Since all transactions are processed by Paddle, refunds will be handled according to Paddle's policies. For further details, please refer to <a href="https://www.paddle.com/refund-policy" className="text-blue-500">Paddle’s Refund Policy</a>.</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <XCircle className="w-6 h-6 mr-3 text-red-600" />
              Refund Exceptions
            </h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-600 dark:text-gray-400">
                In some cases, refund requests may not be honored. These exceptions include:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
                <li>Requests made after the 30-day refund window</li>
                <li>Refused or fraudulent payment methods</li>
                <li>Services already consumed, including reports or data export</li>
                <li>Any violations of our Terms of Service</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <AlertTriangle className="w-6 h-6 mr-3 text-yellow-600" />
              Terms of Service
            </h2>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-600 dark:text-gray-400">
                For further details, please refer to our <Link to="/terms-of-service" className="text-blue-500">Terms of Service</Link> and <Link to="/privacy-policy" className="text-blue-500">Privacy Policy</Link> for the full legal agreement.
              </p>
            </div>
          </section>

        </motion.div>
      </div>
    </div>
  );
};
