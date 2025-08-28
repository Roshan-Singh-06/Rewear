import React, { useState } from 'react';
import { Star, CheckCircle2, X } from 'lucide-react';
import transactionService from '../services/transactionService';

const FeedbackModal = ({ isOpen, onClose, transaction, onFeedbackSubmitted }) => {
  const [selectedCondition, setSelectedCondition] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const conditions = [
    {
      value: 'new',
      label: 'New',
      description: 'Perfect condition, never worn',
      points: 60,
      icon: '✨'
    },
    {
      value: 'like_new',
      label: 'Like New',
      description: 'Excellent condition, barely worn',
      points: 50,
      icon: '⭐'
    },
    {
      value: 'good',
      label: 'Good',
      description: 'Good condition, normal wear',
      points: 40,
      icon: '👍'
    },
    {
      value: 'fair',
      label: 'Fair',
      description: 'Fair condition, noticeable wear',
      points: 30,
      icon: '👌'
    },
    {
      value: 'worn',
      label: 'Worn',
      description: 'Well-worn, significant use',
      points: 20,
      icon: '💫'
    }
  ];

  const handleSubmit = async () => {
    if (!selectedCondition) {
      setError('Please select a condition');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Call backend to submit simple feedback using notification ID
      if (transaction && transaction._id) {
        console.log('Submitting feedback for notification:', transaction._id, 'with condition:', selectedCondition);
        
        const result = await transactionService.submitFeedbackSimple(transaction._id, selectedCondition);
        console.log('Feedback submission result:', result);
        
        onFeedbackSubmitted(result.data.pointsAwarded);
        onClose();
        setSelectedCondition('');
      } else {
        throw new Error('Invalid transaction data');
      }
    } catch (error) {
      console.error('Feedback submission error:', error);
      setError(error.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedCondition('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Rate Item Condition</h2>
            <p className="text-sm text-gray-600 mt-1">
              Help the community by rating the condition of the item you received. This will award points to the other user.
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Item Info */}
        <div className="p-6 border-b bg-gray-50">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-xs text-gray-600">📦</span>
            </div>
            <div>
              <p className="font-medium text-gray-900">
                {transaction?.item?.title || 'Item from notification'}
              </p>
              <p className="text-sm text-gray-600">
                Seller: {transaction?.seller?.fullName || transaction?.seller?.username || 'Unknown User'}
              </p>
            </div>
          </div>
        </div>

        {/* Condition Options */}
        <div className="p-6">
          <p className="text-sm text-gray-600 mb-4">
            Your rating will award points to the seller based on item condition:
          </p>

          <div className="space-y-3">
            {conditions.map((condition) => (
              <label
                key={condition.value}
                className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedCondition === condition.value
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="condition"
                  value={condition.value}
                  checked={selectedCondition === condition.value}
                  onChange={(e) => setSelectedCondition(e.target.value)}
                  className="sr-only"
                />
                
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{condition.icon}</span>
                    <div>
                      <div className="font-medium text-gray-900">
                        {condition.label}
                      </div>
                      <div className="text-sm text-gray-600">
                        {condition.description}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className="text-right">
                      <div className="font-bold text-green-600">
                        +{condition.points} pts
                      </div>
                    </div>
                    {selectedCondition === condition.value && (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                </div>
              </label>
            ))}
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 border-t bg-gray-50 flex space-x-3">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedCondition || isSubmitting}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <Star className="w-4 h-4" />
                <span>Submit Rating</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;
