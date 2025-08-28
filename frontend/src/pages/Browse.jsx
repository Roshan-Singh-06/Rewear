import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion'; // eslint-disable-line
import { useSearchParams, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Modal from './Modal';
import ItemService from '../services/itemService';
import SwapService from '../services/swapService';
import PointsService from '../services/pointsService';
import { useAuth } from '../hooks/useAuthContext';

export default function Browse() {
  const { user: _user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [favorites, setFavorites] = useState(new Set());
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterCondition, setFilterCondition] = useState('All');
  const [filterCity, setFilterCity] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [selectedProductForSwap, setSelectedProductForSwap] = useState(null);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [selectedProductForPurchase, setSelectedProductForPurchase] = useState(null);
  const [products, setProducts] = useState([]);
  const [userListings, setUserListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get city from URL params on component mount
  useEffect(() => {
    const cityParam = searchParams.get('city');
    const locationParam = searchParams.get('location');
    
    if (locationParam) {
      setFilterCity(locationParam);
    } else if (cityParam) {
      setFilterCity(cityParam);
    }
  }, [searchParams]);

  // Load products from backend
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        let response;
        
        // If there's a city filter, use location-based search
        if (filterCity && filterCity.trim()) {
          console.log('Searching by location:', filterCity);
          response = await ItemService.getItemsByLocation(filterCity.trim());
          
          // Handle location search response structure
          if (response && response.data) {
            // Backend returns { items: [...], searchLocation: "...", totalFound: ... }
            setProducts(Array.isArray(response.data.items) ? response.data.items : response.data);
          } else {
            setProducts([]);
          }
        } else {
          // Otherwise use regular filtering
          const filters = {};
          if (filterCategory !== 'All') filters.category = filterCategory;
          if (filterCondition !== 'All') filters.condition = filterCondition;
          
          response = await ItemService.getAllItems(filters);
          
          // Handle regular items response structure
          if (response && response.data) {
            setProducts(Array.isArray(response.data) ? response.data : []);
          } else {
            setProducts([]);
          }
        }
        
        console.log('Items response:', response); // Debug log
        console.log('Products set:', response?.data); // Debug log
        
      } catch (error) {
        console.error('Error loading products:', error);
        setError('Failed to load products');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [filterCategory, filterCondition, filterCity]);

  // Load user's listings for swap functionality
  useEffect(() => {
    const loadUserListings = async () => {
      if (!isAuthenticated) return;
      
      try {
        const response = await ItemService.getAllItems({ userItems: true });
        if (response && response.data) {
          setUserListings(Array.isArray(response.data) ? response.data : []);
        } else {
          setUserListings([]);
        }
      } catch (error) {
        console.error('Error loading user listings:', error);
      }
    };

    loadUserListings();
  }, [isAuthenticated]);

  // Handler functions for modals
  const _handleRequestSwap = async (product) => {
    if (!isAuthenticated) {
      alert('Please login to request a swap');
      return;
    }
    setSelectedProductForSwap(product);
    setIsSwapModalOpen(true);
  };

  const closeSwapModal = () => {
    setIsSwapModalOpen(false);
    setSelectedProductForSwap(null);
  };

  const _handleBuyWithPoints = async (product) => {
    if (!isAuthenticated) {
      alert('Please login to buy with points');
      return;
    }
    setSelectedProductForPurchase(product);
    setIsPurchaseModalOpen(true);
  };

  const closePurchaseModal = () => {
    setIsPurchaseModalOpen(false);
    setSelectedProductForPurchase(null);
  };

  const toggleFavorite = (productId) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(productId)) {
      newFavorites.delete(productId);
    } else {
      newFavorites.add(productId);
    }
    setFavorites(newFavorites);
  };

  const handleViewDetails = (product) => {
    // Navigate to product detail page with product ID
    navigate(`/product/${product._id}`, { state: { product } });
  };

  // Handle "Items Near Me" functionality
  const handleNearMe = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await ItemService.getItemsNearMe();
      
      if (response && response.data) {
        setProducts(Array.isArray(response.data.items) ? response.data.items : []);
        setFilterCity(''); // Clear city filter when using "Near Me"
        
        // Show user's location in the header
        if (response.data.userLocation) {
          const { city, district, state } = response.data.userLocation;
          const locationText = [city, district, state].filter(Boolean).join(', ');
          setFilterCity(locationText);
        }
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error('Error loading items near user:', error);
      setError('Failed to load items near your location. Please make sure your profile has location information.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const getConditionColor = (condition) => {
    switch (condition) {
      case 'new': return 'text-green-700 bg-green-100';
      case 'like-new': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'fair': return 'text-yellow-600 bg-yellow-100';
      case 'worn': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getConditionLabel = (condition) => {
    switch (condition) {
      case 'new': return 'New';
      case 'like-new': return 'Like New';
      case 'good': return 'Good';
      case 'fair': return 'Fair';
      case 'worn': return 'Worn';
      default: return condition;
    }
  };

  const getSubCategoryLabel = (subCategory) => {
    return subCategory.charAt(0).toUpperCase() + subCategory.slice(1);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 14) return '1 week ago';
    return `${Math.floor(diffDays / 7)} weeks ago`;
  };

  // Filter and sort products
  const filteredProducts = (products || [])
    .filter(product => product?.approved && product?.status === 'available')
    .filter(product => filterCategory === 'All' || product?.category === filterCategory)
    .filter(product => filterCondition === 'All' || product?.condition === filterCondition)
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'price-low':
          return a.pointsCost - b.pointsCost;
        case 'price-high':
          return b.pointsCost - a.pointsCost;
        default:
          return 0;
      }
    });

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { 
      y: 50, 
      opacity: 0,
      scale: 0.9
    },
    visible: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  const filterVariants = {
    hidden: { x: -30, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-black mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Loading items...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Oops! Something went wrong</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Hero Section */}
      <motion.section 
        className="bg-gradient-to-r from-gray-900 via-black to-gray-900 text-white py-16"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.h1 
            className="text-4xl md:text-6xl font-bold mb-4"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {filterCity ? `Items in ${filterCity}` : 'Browse All Items'}
          </motion.h1>
          <motion.p 
            className="text-lg text-gray-300 max-w-2xl mx-auto"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {filterCity ? 
              `Find amazing clothing items from sellers in ${filterCity}. Connect with local swappers!` :
              'Discover amazing clothing items from our community. Find your perfect match and start swapping!'
            }
          </motion.p>
          <motion.div 
            className="mt-8 text-2xl"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <span className="bg-white text-black px-4 py-2 rounded-full font-bold">
              {filteredProducts.length} items available {filterCity && `in ${filterCity}`}
            </span>
          </motion.div>
        </div>
      </motion.section>

      {/* Filters Section */}
      <motion.section 
        className="py-8 bg-white shadow-sm"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-wrap gap-6 items-center justify-between">
            <motion.div 
              className="flex flex-wrap gap-4"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div variants={filterVariants}>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  <option value="All">All Categories</option>
                  <option value="Women">Women</option>
                  <option value="Men">Men</option>
                  <option value="Unisex">Unisex</option>
                </select>
              </motion.div>

              <motion.div variants={filterVariants}>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  placeholder="Enter city name"
                  value={filterCity}
                  onChange={(e) => setFilterCity(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent w-48"
                />
              </motion.div>

              <motion.div variants={filterVariants}>
                <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
                <select
                  value={filterCondition}
                  onChange={(e) => setFilterCondition(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  <option value="All">All Conditions</option>
                  <option value="new">New</option>
                  <option value="like-new">Like New</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="worn">Worn</option>
                </select>
              </motion.div>

              <motion.div variants={filterVariants}>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="price-low">Points: Low to High</option>
                  <option value="price-high">Points: High to Low</option>
                </select>
              </motion.div>

              {/* Near Me Button */}
              {isAuthenticated && (
                <motion.div variants={filterVariants}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quick Search</label>
                  <button
                    onClick={handleNearMe}
                    className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 focus:ring-2 focus:ring-black focus:ring-offset-2 transition-colors"
                  >
                    Items Near Me
                  </button>
                </motion.div>
              )}
            </motion.div>

            <motion.div 
              className="text-sm text-gray-600"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              Showing {filteredProducts.length} of {products.filter(p => p.approved && p.status === 'available').length} items
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Products Grid */}
      <motion.section 
        className="py-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.4 }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <AnimatePresence>
            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {filteredProducts.map((product, index) => (
                <motion.div
                  key={product._id}
                  variants={itemVariants}
                  custom={index}
                  whileHover={{ 
                    scale: 1.02,
                    y: -10,
                    transition: { duration: 0.3 }
                  }}
                  className="bg-white border border-gray-200 rounded-2xl shadow-lg hover:shadow-2xl hover:border-gray-300 transition-all duration-500 ease-out overflow-hidden group cursor-pointer"
                  onClick={() => handleViewDetails(product)}
                  layout
                >
                  {/* Image Section */}
                  <div className="relative overflow-hidden">
                    <img
                      src={product.images[0]}
                      alt={product.title}
                      className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                    />
                    
                    {/* Gradient Overlay on Hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    {/* Favorite Button */}
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(product._id);
                      }}
                      className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white hover:scale-110 transition-all duration-300 shadow-lg hover:shadow-xl"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <span className={`text-lg transition-all duration-300 ${favorites.has(product._id) ? 'text-red-500 scale-125' : 'text-gray-400 hover:text-red-400'}`}>
                        {favorites.has(product._id) ? '❤️' : '🤍'}
                      </span>
                    </motion.button>

                    {/* Status Badge */}
                    <div className="absolute top-3 left-3 transform group-hover:scale-105 transition-transform duration-300">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full shadow-lg ${
                        product.status === 'available' 
                          ? 'bg-green-100 text-green-800 group-hover:bg-green-200' 
                          : product.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800 group-hover:bg-yellow-200'
                          : 'bg-red-100 text-red-800 group-hover:bg-red-200'
                      }`}>
                        {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                      </span>
                    </div>

                    {/* Category Tag */}
                    <div className="absolute bottom-3 left-3 transform group-hover:scale-105 transition-transform duration-300">
                      <span className="px-3 py-1 text-xs font-medium bg-white/90 backdrop-blur-sm text-gray-700 rounded-full shadow-lg">
                        {product.category}
                      </span>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="p-4 group-hover:bg-gray-50 transition-colors duration-300">
                    {/* Title and Sub-category */}
                    <div className="mb-2">
                      <h3 className="font-bold text-gray-900 truncate text-base group-hover:text-blue-600 transition-colors duration-300">{product.title}</h3>
                      <p className="text-xs text-gray-600 group-hover:text-gray-700 transition-colors duration-300">{getSubCategoryLabel(product.subCategory)} • Size {product.size}</p>
                    </div>

                    {/* Condition Badge */}
                    <div className="mb-2">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full transform group-hover:scale-105 transition-all duration-300 shadow-sm ${getConditionColor(product.condition)}`}>
                        {getConditionLabel(product.condition)}
                      </span>
                    </div>

                    {/* Points Cost */}
                    <div className="flex items-center justify-between mb-3 p-2 bg-gray-50 group-hover:bg-white rounded-lg transition-colors duration-300">
                      <div className="flex items-center space-x-1">
                        <span className="text-lg group-hover:scale-110 transition-transform duration-300">💎</span>
                        <span className="font-bold text-gray-900 text-base group-hover:text-blue-600 transition-colors duration-300">{product.pointsCost}</span>
                        <span className="text-xs text-gray-500 font-medium">points</span>
                      </div>
                      <span className="text-xs text-gray-500 group-hover:text-gray-600 transition-colors duration-300">{formatDate(product.createdAt)}</span>
                    </div>

                    {/* Listed By */}
                    <div className="text-xs text-gray-500 mb-3 group-hover:text-gray-600 transition-colors duration-300">
                      <span className="font-medium">Listed by @{product.listedBy.username}</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(product);
                        }}
                        className="w-full py-2 px-3 rounded-lg font-semibold text-sm transition-all duration-300 transform hover:scale-105 active:scale-95 border bg-gradient-to-r from-gray-800 to-black hover:from-gray-700 hover:to-gray-900 text-white shadow-lg hover:shadow-xl border-gray-700"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>

          {filteredProducts.length === 0 && (
            <motion.div 
              className="text-center py-16"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No items found</h3>
              <p className="text-gray-600">Try adjusting your filters to see more results.</p>
            </motion.div>
          )}
        </div>
      </motion.section>

      {/* Swap Request Modal */}
      <Modal 
        isOpen={isSwapModalOpen} 
        onClose={closeSwapModal}
        maxWidth="max-w-4xl"
      >
        <SwapRequestModal 
          selectedProduct={selectedProductForSwap}
          userListings={userListings}
          onClose={closeSwapModal}
        />
      </Modal>

      {/* Purchase Confirmation Modal */}
      <Modal 
        isOpen={isPurchaseModalOpen} 
        onClose={closePurchaseModal}
        maxWidth="max-w-md"
      >
        <PurchaseConfirmationModal 
          selectedProduct={selectedProductForPurchase}
          onClose={closePurchaseModal}
        />
      </Modal>
    </div>
  );
}

// Swap Request Modal Component
const SwapRequestModal = ({ selectedProduct, userListings, onClose }) => {
  const [selectedUserItem, setSelectedUserItem] = useState(null);
  const [isRequestSent, setIsRequestSent] = useState(false);

  const handleSelectItem = (item) => {
    setSelectedUserItem(item);
  };

  const handleSendRequest = () => {
    // Here you would typically send the request to your backend
    console.log('Sending swap request:', {
      requestedItem: selectedProduct,
      offeredItem: selectedUserItem
    });
    setIsRequestSent(true);
    
    // Auto close modal after 2 seconds and redirect to messages
    setTimeout(() => {
      onClose();
      setIsRequestSent(false);
      setSelectedUserItem(null);
      // Redirect to messages page
      window.location.href = '/messages';
    }, 2000);
  };

  if (isRequestSent) {
    return (
      <div className="text-center py-12">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="mx-auto w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4"
        >
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </motion.div>
        <h3 className="text-xl font-semibold text-white mb-2">Request Sent!</h3>
        <p className="text-gray-300">Your swap request has been sent successfully.</p>
      </div>
    );
  }

  return (
    <div className="text-white">
      {/* Header */}
      <div className="border-b border-gray-700 pb-4 mb-6">
        <h2 className="text-2xl font-bold mb-2">Request Swap</h2>
        <p className="text-gray-300">Select an item from your listings to offer in exchange</p>
      </div>

      {/* Selected Product Info */}
      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-3">You want to get:</h3>
        <div className="flex items-center space-x-4">
          <img 
            src={selectedProduct?.images[0]} 
            alt={selectedProduct?.title}
            className="w-16 h-16 object-cover rounded-lg"
          />
          <div>
            <h4 className="font-medium">{selectedProduct?.title}</h4>
            <p className="text-sm text-gray-400">{selectedProduct?.category} • Size {selectedProduct?.size}</p>
            <p className="text-sm text-yellow-400">💎 {selectedProduct?.pointsCost} points</p>
          </div>
        </div>
      </div>

      {/* User's Listings */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Your Items Available for Swap:</h3>
          <button className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span className="text-sm">Add New Item</span>
          </button>
        </div>

        {userListings.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-gray-600 rounded-lg">
            <svg className="w-12 h-12 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <p className="text-gray-400 mb-2">No items in your listings</p>
            <button className="text-blue-400 hover:text-blue-300 text-sm">Add your first item</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userListings.map((item) => (
              <motion.div
                key={item._id}
                className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                  selectedUserItem?._id === item._id
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-gray-600 hover:border-gray-500'
                }`}
                onClick={() => handleSelectItem(item)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <img 
                  src={item.images[0]} 
                  alt={item.title}
                  className="w-full h-32 object-cover rounded-lg mb-3"
                />
                <h4 className="font-medium mb-1">{item.title}</h4>
                <p className="text-sm text-gray-400 mb-2">{item.category} • Size {item.size}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-yellow-400">💎 {item.pointsCost} points</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    item.condition === 'like-new' ? 'bg-green-100 text-green-800' :
                    item.condition === 'good' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {item.condition}
                  </span>
                </div>
                {selectedUserItem?._id === item._id && (
                  <div className="mt-3 flex items-center text-blue-400 text-sm">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Selected
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Send Request Button */}
      {selectedUserItem && (
        <motion.div 
          className="border-t border-gray-700 pt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-300">
              <p>Offering: <span className="text-white font-medium">{selectedUserItem.title}</span></p>
              <p>For: <span className="text-white font-medium">{selectedProduct?.title}</span></p>
            </div>
            <button 
              onClick={handleSendRequest}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              <span>Send Request</span>
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

// Purchase Confirmation Modal Component
const PurchaseConfirmationModal = ({ selectedProduct, onClose }) => {
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isPurchaseComplete, setIsPurchaseComplete] = useState(false);

  const handleConfirmPurchase = () => {
    setIsPurchasing(true);
    
    // Simulate purchase process
    setTimeout(() => {
      setIsPurchasing(false);
      setIsPurchaseComplete(true);
      
      // Here you would typically send the purchase request to your backend
      console.log('Purchase confirmed:', {
        productId: selectedProduct._id,
        pointsCost: selectedProduct.pointsCost,
        title: selectedProduct.title
      });
      
      // Auto close modal after 2 seconds and redirect to messages
      setTimeout(() => {
        onClose();
        setIsPurchaseComplete(false);
        // Redirect to messages page
        window.location.href = '/messages';
      }, 2000);
    }, 1500);
  };

  if (isPurchaseComplete) {
    return (
      <div className="text-center py-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="mx-auto w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4"
        >
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </motion.div>
        <h3 className="text-xl font-semibold text-white mb-2">Purchase Complete!</h3>
        <p className="text-gray-300">Your item has been purchased successfully.</p>
      </div>
    );
  }

  if (isPurchasing) {
    return (
      <div className="text-center py-8">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="mx-auto w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full mb-4"
        />
        <h3 className="text-xl font-semibold text-white mb-2">Processing Purchase...</h3>
        <p className="text-gray-300">Please wait while we process your transaction.</p>
      </div>
    );
  }

  return (
    <div className="text-white">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
          <span className="text-2xl">💎</span>
        </div>
        <h2 className="text-2xl font-bold mb-2">Confirm Purchase</h2>
        <p className="text-gray-300">Are you sure you want to buy this item with points?</p>
      </div>

      {/* Product Details */}
      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <div className="flex items-center space-x-4">
          <img 
            src={selectedProduct?.images[0]} 
            alt={selectedProduct?.title}
            className="w-20 h-20 object-cover rounded-lg"
          />
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-1">{selectedProduct?.title}</h3>
            <p className="text-sm text-gray-400 mb-2">
              {selectedProduct?.category} • Size {selectedProduct?.size} • {selectedProduct?.condition}
            </p>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <span className="text-yellow-400 text-lg">💎</span>
                <span className="text-xl font-bold text-yellow-400">{selectedProduct?.pointsCost}</span>
                <span className="text-sm text-gray-400">points</span>
              </div>
              <span className="text-sm text-gray-400">
                Listed by @{selectedProduct?.listedBy?.username}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Purchase Summary */}
      <div className="bg-gray-800 rounded-lg p-4 mb-6 border border-gray-700">
        <h4 className="font-semibold mb-3 text-gray-200">Purchase Summary</h4>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Item Cost:</span>
            <span className="text-white">{selectedProduct?.pointsCost} points</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Transaction Fee:</span>
            <span className="text-white">0 points</span>
          </div>
          <div className="border-t border-gray-600 pt-2 mt-2">
            <div className="flex justify-between font-semibold">
              <span className="text-white">Total:</span>
              <span className="text-yellow-400 flex items-center space-x-1">
                <span>💎</span>
                <span>{selectedProduct?.pointsCost} points</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <button 
          onClick={onClose}
          className="flex-1 py-3 px-4 rounded-lg font-semibold text-gray-300 bg-gray-700 hover:bg-gray-600 transition-colors duration-200 border border-gray-600"
        >
          Cancel
        </button>
        <button 
          onClick={handleConfirmPurchase}
          className="flex-1 py-3 px-4 rounded-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg"
        >
          <span className="text-lg">💎</span>
          <span>Yes, Purchase</span>
        </button>
      </div>

      {/* Terms */}
      <p className="text-xs text-gray-500 text-center mt-4">
        By confirming this purchase, you agree to our terms and conditions. 
        Points will be deducted from your account immediately.
      </p>
    </div>
  );
};
