import React, { useState, useEffect } from 'react';
import { X, Calendar, DollarSign, Package, FileText, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Subscription, CreateSubscriptionData } from '../../hooks/useSubscriptions';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateSubscriptionData) => Promise<void>;
  subscription?: Subscription | null;
  mode: 'create' | 'edit';
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  subscription,
  mode
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<CreateSubscriptionData>();

  const watchedCost = watch('cost');
  const watchedBillingCycle = watch('billing_cycle');

  useEffect(() => {
    if (subscription && mode === 'edit') {
      setValue('service_name', subscription.service_name);
      setValue('cost', subscription.cost);
      setValue('billing_cycle', subscription.billing_cycle);
      setValue('next_renewal', subscription.next_renewal);
      setValue('category', subscription.category);
      setValue('status', subscription.status);
      setValue('notes', subscription.notes || '');
    } else if (mode === 'create') {
      reset({
        service_name: '',
        cost: 0,
        billing_cycle: 'monthly',
        next_renewal: '',
        category: 'other',
        status: 'active',
        notes: ''
      });
    }
  }, [subscription, mode, setValue, reset]);

  const handleFormSubmit = async (data: CreateSubscriptionData) => {
    try {
      setIsSubmitting(true);
      
      // Validate the data
      if (!data.service_name.trim()) {
        throw new Error('Service name is required');
      }
      
      if (data.cost <= 0) {
        throw new Error('Cost must be greater than 0');
      }
      
      if (!data.next_renewal) {
        throw new Error('Next renewal date is required');
      }

      // Check if renewal date is in the past
      const renewalDate = new Date(data.next_renewal);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (renewalDate < today) {
        throw new Error('Next renewal date cannot be in the past');
      }

      await onSubmit({
        ...data,
        service_name: data.service_name.trim(),
        cost: Number(data.cost),
        notes: data.notes?.trim() || ''
      });
      
      onClose();
      reset();
    } catch (error: any) {
      console.error('Form submission error:', error);
      // Error handling is done in the parent component via toast
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      reset();
    }
  };

  const categories = [
    { value: 'software', label: 'Software', icon: '💻' },
    { value: 'marketing', label: 'Marketing', icon: '📈' },
    { value: 'finance', label: 'Finance', icon: '💰' },
    { value: 'other', label: 'Other', icon: '📦' }
  ];

  // Calculate monthly equivalent for display
  const getMonthlyEquivalent = () => {
    if (!watchedCost || !watchedBillingCycle) return 0;
    return watchedBillingCycle === 'yearly' ? (watchedCost / 12) : watchedCost;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
              onClick={handleClose}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md mx-auto border border-gray-200 dark:border-gray-700"
            >
              <form onSubmit={handleSubmit(handleFormSubmit)}>
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {mode === 'create' ? 'Add New Subscription' : 'Edit Subscription'}
                  </h3>
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Form */}
                <div className="p-6 space-y-6 max-h-96 overflow-y-auto">
                  {/* Service Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Package className="w-4 h-4 inline mr-2" />
                      Service Name *
                    </label>
                    <input
                      type="text"
                      {...register('service_name', { 
                        required: 'Service name is required',
                        minLength: { value: 1, message: 'Service name cannot be empty' },
                        maxLength: { value: 100, message: 'Service name is too long' }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
                      placeholder="e.g., Netflix, Spotify, Adobe Creative Suite"
                      disabled={isSubmitting}
                    />
                    {errors.service_name && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.service_name.message}
                      </p>
                    )}
                  </div>

                  {/* Cost and Billing Cycle */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <DollarSign className="w-4 h-4 inline mr-2" />
                        Cost *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        {...register('cost', { 
                          required: 'Cost is required',
                          min: { value: 0.01, message: 'Cost must be greater than 0' },
                          max: { value: 999999.99, message: 'Cost is too high' }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
                        placeholder="0.00"
                        disabled={isSubmitting}
                      />
                      {errors.cost && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors.cost.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Billing Cycle *
                      </label>
                      <select
                        {...register('billing_cycle', { required: 'Billing cycle is required' })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
                        disabled={isSubmitting}
                      >
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                      {errors.billing_cycle && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors.billing_cycle.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Monthly equivalent display */}
                  {watchedCost && watchedBillingCycle === 'yearly' && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        💡 Monthly equivalent: ${getMonthlyEquivalent().toFixed(2)}
                      </p>
                    </div>
                  )}

                  {/* Next Renewal */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Calendar className="w-4 h-4 inline mr-2" />
                      Next Renewal Date *
                    </label>
                    <input
                      type="date"
                      {...register('next_renewal', { 
                        required: 'Next renewal date is required',
                        validate: (value) => {
                          const selectedDate = new Date(value);
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          return selectedDate >= today || 'Next renewal date cannot be in the past';
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
                      disabled={isSubmitting}
                      min={new Date().toISOString().split('T')[0]}
                    />
                    {errors.next_renewal && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.next_renewal.message}
                      </p>
                    )}
                  </div>

                  {/* Category and Status */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Category *
                      </label>
                      <select
                        {...register('category', { required: 'Category is required' })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
                        disabled={isSubmitting}
                      >
                        {categories.map(cat => (
                          <option key={cat.value} value={cat.value}>
                            {cat.icon} {cat.label}
                          </option>
                        ))}
                      </select>
                      {errors.category && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors.category.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Status *
                      </label>
                      <select
                        {...register('status', { required: 'Status is required' })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
                        disabled={isSubmitting}
                      >
                        <option value="active">✅ Active</option>
                        <option value="cancelled">❌ Cancelled</option>
                      </select>
                      {errors.status && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors.status.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <FileText className="w-4 h-4 inline mr-2" />
                      Notes (Optional)
                    </label>
                    <textarea
                      {...register('notes', {
                        maxLength: { value: 500, message: 'Notes are too long (max 500 characters)' }
                      })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors resize-none"
                      placeholder="Additional notes about this subscription..."
                      disabled={isSubmitting}
                    />
                    {errors.notes && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.notes.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end space-x-3 px-6 py-4 bg-gray-50 dark:bg-gray-700/50 rounded-b-xl border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-500 dark:hover:text-gray-400 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </div>
                    ) : (
                      mode === 'create' ? 'Add Subscription' : 'Update Subscription'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};