import React, { useState } from 'react';
import { Layout } from '../components/Layout/Layout';
import { SubscriptionList } from '../components/Subscriptions/SubscriptionList';
import { SubscriptionModal } from '../components/Subscriptions/SubscriptionModal';
import { useSubscriptions, Subscription } from '../hooks/useSubscriptions';
import toast from 'react-hot-toast';

export const SubscriptionsPage: React.FC = () => {
  const { subscriptions, loading, addSubscription, updateSubscription, deleteSubscription } = useSubscriptions();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

  const handleAddSubscription = () => {
    setEditingSubscription(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleEditSubscription = (subscription: Subscription) => {
    setEditingSubscription(subscription);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleDeleteSubscription = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this subscription?')) {
      await deleteSubscription(id);
    }
  };

  const handleSubmitSubscription = async (data: any) => {
    if (modalMode === 'create') {
      await addSubscription(data);
    } else {
      await updateSubscription(editingSubscription!.id, data);
    }
    setIsModalOpen(false);
    setEditingSubscription(null);
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/6"></div>
                      </div>
                      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Subscriptions
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage all your recurring subscriptions in one place.
            </p>
          </div>

          <SubscriptionList
            subscriptions={subscriptions}
            onAdd={handleAddSubscription}
            onEdit={handleEditSubscription}
            onDelete={handleDeleteSubscription}
          />
        </div>
      </div>

      <SubscriptionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingSubscription(null);
        }}
        onSubmit={handleSubmitSubscription}
        subscription={editingSubscription}
        mode={modalMode}
      />
    </Layout>
  );
};