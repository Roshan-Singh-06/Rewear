import React, { useState, useContext } from 'react';
import { Coins, Send, X, AlertCircle } from 'lucide-react';
import transactionService from '../services/transactionService';
import { AuthContext } from '../contexts/AuthContext';

const PointsPurchaseModal = ({ isOpen, onClose, item, onPurchaseRequested }) => {
  const [pointsOffered, setPointsOffered] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { user } = useContext(AuthContext);

  const userPoints = user?.points || 0;
  const minPoints = 10; // Minimum points for a purchase
  const maxPoints = Math.min(userPoints, 200); // Maximum points user can offer

  const handleSubmit = async () => {
    const points = parseInt(pointsOffered);
    
    if (!points || points < minPoints) {
      setError(`Minimum ${minPoints} points required`);
      return;
    }

    if (points > userPoints) {
      setError('Insufficient points');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const result = await transactionService.createPointsPurchase(item._id, points);
      
      // Show success message and close modal
      onPurchaseRequested(result.data);
      onClose();
      setPointsOffered('');
    } catch (error) {
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setPointsOffered('');
    setError('');
    onClose();
  };

  const handlePointsChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^\d+$/.test(value)) {
      setPointsOffered(value);
      setError('');
    }
  };

  const suggestedPoints = [20, 50, 100, 150];

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Purchase with Points</h2>
            <p className="text-sm text-gray-600 mt-1">
              Make an offer to buy this item
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Item Info */}
        <div className="p-6 border-b bg-gray-50">
          <div className="flex items-center space-x-3">
            {item.images?.[0] && (
              <img
                src={item.images[0]}
                alt={item.name}
                className="w-16 h-16 object-cover rounded-lg"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            )}
            <div>
              <p className="font-medium text-gray-900">{item.name}</p>
              <p className="text-sm text-gray-600">
                by {item.user?.name || 'Unknown'}
              </p>
              {item.price && (
                <p className="text-sm text-gray-500">
                  Original price: ${item.price}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Points Info */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Coins className="w-5 h-5 text-yellow-500" />
              <span className="font-medium text-gray-900">Your Points</span>
            </div>
            <span className="font-bold text-green-600">{userPoints} pts</span>
          </div>

          {userPoints < minPoints ? (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-600">
                You need at least {minPoints} points to make a purchase.
              </p>
            </div>
          ) : (
            <>
              {/* Points Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Points to Offer
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={pointsOffered}
                    onChange={handlePointsChange}
                    placeholder={`${minPoints} - ${maxPoints}`}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent pr-12"
                    disabled={isSubmitting}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Coins className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Suggested Points */}
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Quick select:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestedPoints
                    .filter(points => points <= userPoints)
                    .map((points) => (
                    <button
                      key={points}
                      onClick={() => setPointsOffered(points.toString())}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                      disabled={isSubmitting}
                    >
                      {points} pts
                    </button>
                  ))}
                </div>
              </div>

              {/* Info Note */}
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  💡 The seller will be notified of your offer and can accept or reject it.
                  Points will only be deducted if they accept.
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
            </>
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
            disabled={!pointsOffered || isSubmitting || userPoints < minPoints}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Sending...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Send Offer</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PointsPurchaseModal;
