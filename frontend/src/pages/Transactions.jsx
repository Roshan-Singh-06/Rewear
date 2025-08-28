import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion'; // eslint-disable-line
import { 
  Coins, 
  Package, 
  Star, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye,
  Filter,
  Download
} from 'lucide-react';
import Navbar from './components/Navbar';
import { AuthContext } from '../contexts/AuthContext';
import transactionService from '../services/transactionService';
import FeedbackModal from '../components/FeedbackModal';

export default function Transactions() {
  const { user } = useContext(AuthContext);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, purchases, sales
  const [feedbackModal, setFeedbackModal] = useState({ isOpen: false, transaction: null });

  useEffect(() => {
    loadTransactions();
  }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadTransactions = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await transactionService.getUserTransactions(filter);
      if (response.success) {
        setTransactions(response.data);
      } else {
        setError(response.message || 'Failed to load transactions');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkReceived = async (transactionId) => {
    try {
      await transactionService.markItemReceived(transactionId);
      await loadTransactions(); // Refresh the list
      alert('Item marked as received! You can now provide feedback.');
    } catch (error) {
      alert(`Failed to mark item as received: ${error.message}`);
    }
  };

  const handleOpenFeedback = (transaction) => {
    setFeedbackModal({ isOpen: true, transaction });
  };

  const handleFeedbackSubmitted = async (pointsAwarded) => {
    await loadTransactions();
    alert(`Feedback submitted! Seller earned ${pointsAwarded} points.`);
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'text-yellow-600 bg-yellow-100',
      'accepted': 'text-green-600 bg-green-100',
      'rejected': 'text-red-600 bg-red-100',
      'completed': 'text-blue-600 bg-blue-100',
      'cancelled': 'text-gray-600 bg-gray-100'
    };
    return colors[status] || 'text-gray-600 bg-gray-100';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'accepted':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const isUserBuyer = (transaction) => {
    return transaction.buyer._id === user?._id;
  };

  const canMarkReceived = (transaction) => {
    return (
      isUserBuyer(transaction) && 
      transaction.status === 'accepted' && 
      !transaction.itemReceived
    );
  };

  const canProvideFeedback = (transaction) => {
    return (
      isUserBuyer(transaction) && 
      transaction.itemReceived && 
      !transaction.feedback?.feedbackGiven
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading transactions...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Header */}
      <motion.section 
        className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-16"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <Coins className="w-16 h-16 mx-auto mb-6 opacity-90" />
              <h1 className="text-4xl font-bold mb-4">Transaction History</h1>
              <p className="text-xl opacity-90 max-w-2xl mx-auto">
                View all your points purchases, sales, and transaction details
              </p>
            </motion.div>
            
            {/* User Points Display */}
            <motion.div
              className="mt-8 flex justify-center"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="bg-white/10 backdrop-blur rounded-lg px-6 py-3">
                <div className="flex items-center space-x-2">
                  <Coins className="w-5 h-5" />
                  <span className="font-medium">Your Points:</span>
                  <span className="font-bold text-lg">{user?.points || 0}</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Filters */}
      <motion.section 
        className="bg-white border-b"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Filter className="w-5 h-5 text-gray-500" />
              <div className="flex space-x-2">
                {[
                  { key: 'all', label: 'All Transactions' },
                  { key: 'purchases', label: 'My Purchases' },
                  { key: 'sales', label: 'My Sales' }
                ].map((filterOption) => (
                  <button
                    key={filterOption.key}
                    onClick={() => setFilter(filterOption.key)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filter === filterOption.key
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                    }`}
                  >
                    {filterOption.label}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="text-sm text-gray-600">
              {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </motion.section>

      {/* Transactions List */}
      <section className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <motion.div
            className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-red-600">{error}</p>
          </motion.div>
        )}

        {transactions.length === 0 ? (
          <motion.div
            className="text-center py-12"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Transactions Yet</h3>
            <p className="text-gray-500">
              {filter === 'purchases' 
                ? "You haven't made any purchases yet."
                : filter === 'sales'
                ? "You haven't made any sales yet."
                : "You haven't made any transactions yet."
              }
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {transactions.map((transaction, index) => (
              <motion.div
                key={transaction._id}
                className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    {/* Item Image */}
                    <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {transaction.item?.images?.[0] ? (
                        <img
                          src={transaction.item.images[0]}
                          alt={transaction.item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Transaction Details */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-gray-900">
                          {transaction.item?.name || 'Unknown Item'}
                        </h3>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                          {getStatusIcon(transaction.status)}
                          <span className="ml-1 capitalize">{transaction.status}</span>
                        </span>
                      </div>

                      <div className="space-y-1 text-sm text-gray-600">
                        <p>
                          <span className="font-medium">
                            {isUserBuyer(transaction) ? 'Seller:' : 'Buyer:'}
                          </span>{' '}
                          {isUserBuyer(transaction) 
                            ? transaction.seller?.name 
                            : transaction.buyer?.name
                          }
                        </p>
                        <p>
                          <span className="font-medium">Points:</span> {transaction.pointsUsed}
                        </p>
                        <p>
                          <span className="font-medium">Date:</span>{' '}
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </p>
                        
                        {transaction.feedback?.feedbackGiven && (
                          <div className="flex items-center space-x-2 mt-2">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <span className="text-sm">
                              Rated as: {transactionService.formatCondition(transaction.feedback.condition)}
                            </span>
                            <span className="text-green-600 font-medium">
                              +{transaction.feedback.pointsAwarded} pts
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col space-y-2">
                    {canMarkReceived(transaction) && (
                      <button
                        onClick={() => handleMarkReceived(transaction._id)}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                      >
                        <Package className="h-4 w-4 mr-2" />
                        Mark Received
                      </button>
                    )}

                    {canProvideFeedback(transaction) && (
                      <button
                        onClick={() => handleOpenFeedback(transaction)}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 transition-colors"
                      >
                        <Star className="h-4 w-4 mr-2" />
                        Rate Item
                      </button>
                    )}

                    <button
                      className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={feedbackModal.isOpen}
        onClose={() => setFeedbackModal({ isOpen: false, transaction: null })}
        transaction={feedbackModal.transaction}
        onFeedbackSubmitted={handleFeedbackSubmitted}
      />
    </div>
  );
}
