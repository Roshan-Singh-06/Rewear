import React, { useState, useEffect, useCallback } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion"; // eslint-disable-line
import { 
  ArrowLeft, 
  ArrowRight,
  MapPin, 
  User, 
  Phone, 
  Mail, 
  Calendar,
  Package,
  Star,
  Shield,
  MessageCircle,
  CreditCard,
  Home,
  Building
} from "lucide-react";
import Navbar from "./components/Navbar";
import Modal from "./Modal";
import ItemService from "../services/itemService";
import SwapService from "../services/swapService";

const ProductDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState(location.state?.product || null);
  const [loading, setLoading] = useState(!product);
  const [error, setError] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);

  // Helper function to format complete address from seller profile
  const formatSellerAddress = (seller) => {
    if (!seller) return null;
    
    const addressParts = [];
    
    // Add street address
    if (seller.address) addressParts.push(seller.address);
    
    // Add city/district
    if (seller.city || seller.district) {
      addressParts.push(seller.city || seller.district);
    }
    
    // Add state
    if (seller.state) addressParts.push(seller.state);
    
    // Add country with pin code
    let countryPart = '';
    if (seller.country) countryPart = seller.country;
    if (seller.pinCode) countryPart += seller.country ? ` - ${seller.pinCode}` : seller.pinCode;
    if (countryPart) addressParts.push(countryPart);
    
    return addressParts.length > 0 ? addressParts.join(', ') : null;
  };

  // Helper function to check if seller has complete address
  const hasCompleteAddress = (seller) => {
    return seller && (seller.address || seller.city || seller.district || seller.state || seller.country);
  };

  // Image navigation functions
  const goToPreviousImage = () => {
    if (product?.images?.length > 1) {
      setSelectedImageIndex((prev) => 
        prev === 0 ? product.images.length - 1 : prev - 1
      );
    }
  };

  const goToNextImage = () => {
    if (product?.images?.length > 1) {
      setSelectedImageIndex((prev) => 
        prev === product.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  // Fetch product details if not passed via state
  const fetchProductDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await ItemService.getItemById(id);
      if (response.success) {
        setProduct(response.data);
        
        // Debug: Log seller's address information
        console.log('=== FRONTEND ADDRESS DEBUG ===');
        console.log('Seller Profile Address Information:', {
          sellerId: response.data.listedBy?._id,
          fullName: response.data.listedBy?.fullName,
          address: response.data.listedBy?.address,
          city: response.data.listedBy?.city,
          district: response.data.listedBy?.district,
          state: response.data.listedBy?.state,
          country: response.data.listedBy?.country,
          pinCode: response.data.listedBy?.pinCode,
          latitude: response.data.listedBy?.latitude,
          longitude: response.data.listedBy?.longitude,
          isVerified: response.data.listedBy?.isVerified,
          createdAt: response.data.listedBy?.createdAt
        });
        console.log('Address fields populated:', {
          hasAddress: !!response.data.listedBy?.address,
          hasCity: !!response.data.listedBy?.city,
          hasDistrict: !!response.data.listedBy?.district,
          hasState: !!response.data.listedBy?.state,
          hasCountry: !!response.data.listedBy?.country,
          hasPinCode: !!response.data.listedBy?.pinCode,
          hasCoordinates: !!(response.data.listedBy?.latitude && response.data.listedBy?.longitude),
          isVerified: !!response.data.listedBy?.isVerified
        });
        console.log('==============================');
      } else {
        setError("Product not found");
      }
    } catch (err) {
      console.error("Error fetching product:", err);
      setError("Failed to load product details");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!product && id) {
      fetchProductDetails();
    }
  }, [id, product, fetchProductDetails]);

  const handleSendRequest = () => {
    setIsRequestModalOpen(true);
  };

  const handleBuyWithPoints = () => {
    setIsPurchaseModalOpen(true);
  };

  const closeRequestModal = () => {
    setIsRequestModalOpen(false);
  };

  const closePurchaseModal = () => {
    setIsPurchaseModalOpen(false);
  };

  const getConditionColor = (condition) => {
    switch (condition) {
      case "excellent":
        return "bg-green-100 text-green-800";
      case "good":
        return "bg-blue-100 text-blue-800";
      case "fair":
        return "bg-yellow-100 text-yellow-800";
      case "poor":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <p className="text-red-600 text-xl mb-4">{error || "Product not found"}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      {/* Navbar */}
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Products</span>
          </button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Main Image */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden relative">
              <img
                src={product.images[selectedImageIndex]}
                alt={product.title}
                className="w-full h-96 object-cover"
              />
              
              {/* Left Navigation Arrow */}
              {product.images.length > 1 && (
                <button
                  onClick={goToPreviousImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-3 shadow-lg transition-all duration-200 hover:scale-110"
                >
                  <ArrowLeft className="h-6 w-6 text-gray-700" />
                </button>
              )}
              
              {/* Right Navigation Arrow */}
              {product.images.length > 1 && (
                <button
                  onClick={goToNextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-3 shadow-lg transition-all duration-200 hover:scale-110"
                >
                  <ArrowRight className="h-6 w-6 text-gray-700" />
                </button>
              )}

              {/* Image Counter */}
              {product.images.length > 1 && (
                <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                  {selectedImageIndex + 1} / {product.images.length}
                </div>
              )}
            </div>

            {/* Thumbnail Images */}
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`relative rounded-lg overflow-hidden aspect-square ${
                      selectedImageIndex === index
                        ? "ring-2 ring-blue-500"
                        : "ring-1 ring-gray-200 hover:ring-gray-300"
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.title} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Product Information */}
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Basic Product Info */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.title}</h1>
                  <p className="text-lg text-gray-600">{product.category} • {product.subCategory}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-2 text-2xl font-bold text-blue-600">
                    <span>💎</span>
                    <span>{product.pointsCost}</span>
                  </div>
                  <p className="text-sm text-gray-500">points</p>
                </div>
              </div>

              {/* Status and Condition */}
              <div className="flex items-center space-x-4 mb-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  product.status === "available"
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}>
                  {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getConditionColor(product.condition)}`}>
                  {product.condition.charAt(0).toUpperCase() + product.condition.slice(1)} Condition
                </span>
              </div>

              {/* Size */}
              <div className="flex items-center space-x-2 mb-4">
                <Package className="h-5 w-5 text-gray-500" />
                <span className="text-gray-700">Size: <span className="font-medium">{product.size}</span></span>
              </div>

              {/* Listed Date */}
              <div className="flex items-center space-x-2 mb-6">
                <Calendar className="h-5 w-5 text-gray-500" />
                <span className="text-gray-700">Listed on {formatDate(product.createdAt)}</span>
              </div>

              {/* Description */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-700 leading-relaxed">{product.description}</p>
              </div>
            </div>

            {/* User Information */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="h-5 w-5 mr-2" />
                Seller Information
              </h3>
              
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-gray-300 via-gray-800 to-black rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xl">
                    {product.listedBy?.fullName?.charAt(0).toUpperCase() || 
                     product.listedBy?.username?.charAt(0).toUpperCase() || "U"}
                  </span>
                </div>
                
                <div className="flex-1 space-y-3">
                  <h4 className="text-xl font-semibold text-gray-900">
                    {product.listedBy?.fullName || product.listedBy?.username || "Unknown User"}
                  </h4>
                  
                  {/* Contact Information */}
                  <div className="space-y-2">
                    {product.listedBy?.email && (
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Mail className="h-4 w-4" />
                        <span>{product.listedBy.email}</span>
                      </div>
                    )}
                    
                    {product.listedBy?.phoneNumber && (
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Phone className="h-4 w-4" />
                        <span>{product.listedBy.phoneNumber}</span>
                      </div>
                    )}
                  </div>

                  {/* Complete Address Information from Seller's Profile */}
                  <div className="space-y-3">
                    <h5 className="font-medium text-gray-900 flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      Seller's Profile Address:
                    </h5>
                    <p className="text-xs text-gray-500 mb-2">
                      This address is taken from the seller's profile information
                      {hasCompleteAddress(product.listedBy) && (
                        <span className="block mt-1 font-medium text-green-600">
                          ✓ Complete address available
                        </span>
                      )}
                    </p>
                    
                    {/* Quick formatted address summary */}
                    {formatSellerAddress(product.listedBy) && (
                      <div className="bg-blue-50 border-l-4 border-blue-400 p-2 mb-3">
                        <p className="text-sm text-blue-800 font-medium">Complete Address:</p>
                        <p className="text-sm text-blue-700">{formatSellerAddress(product.listedBy)}</p>
                      </div>
                    )}
                    
                    <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-4 border border-gray-200 space-y-3">
                      {/* Street Address */}
                      {product.listedBy?.address && (
                        <div className="flex items-start space-x-3 text-gray-700">
                          <Home className="h-5 w-5 mt-0.5 flex-shrink-0 text-blue-600" />
                          <div className="flex-1">
                            <span className="font-medium text-sm text-gray-600 block">Street Address:</span>
                            <p className="text-gray-800 mt-1 leading-relaxed">{product.listedBy.address}</p>
                          </div>
                        </div>
                      )}
                      
                      {/* City/District and State */}
                      {(product.listedBy?.city || product.listedBy?.district || product.listedBy?.state) && (
                        <div className="flex items-start space-x-3 text-gray-700">
                          <Building className="h-5 w-5 mt-0.5 flex-shrink-0 text-green-600" />
                          <div className="flex-1">
                            <span className="font-medium text-sm text-gray-600 block">City/District & State:</span>
                            <p className="text-gray-800 mt-1">
                              {product.listedBy?.city || product.listedBy?.district}
                              {product.listedBy?.state && (
                                <span>, {product.listedBy.state}</span>
                              )}
                            </p>
                          </div>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* PIN Code */}
                        {product.listedBy?.pinCode && (
                          <div className="flex items-start space-x-3 text-gray-700">
                            <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0 text-red-600" />
                            <div className="flex-1">
                              <span className="font-medium text-sm text-gray-600 block">PIN Code:</span>
                              <p className="text-gray-800 mt-1 font-mono bg-white px-2 py-1 rounded text-sm inline-block">
                                {product.listedBy.pinCode}
                              </p>
                            </div>
                          </div>
                        )}
                        
                        {/* Country */}
                        {product.listedBy?.country && (
                          <div className="flex items-start space-x-3 text-gray-700">
                            <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0 text-purple-600" />
                            <div className="flex-1">
                              <span className="font-medium text-sm text-gray-600 block">Country:</span>
                              <p className="text-gray-800 mt-1">{product.listedBy.country}</p>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* GPS Coordinates (if available) */}
                      {(product.listedBy?.latitude && product.listedBy?.longitude) && (
                        <div className="flex items-start space-x-3 text-gray-700 pt-2 border-t border-gray-200">
                          <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0 text-orange-600" />
                          <div className="flex-1">
                            <span className="font-medium text-sm text-gray-600 block">GPS Coordinates:</span>
                            <p className="text-gray-800 mt-1 font-mono text-sm">
                              {product.listedBy.latitude.toFixed(6)}, {product.listedBy.longitude.toFixed(6)}
                            </p>
                            <button 
                              onClick={() => window.open(`https://maps.google.com/?q=${product.listedBy.latitude},${product.listedBy.longitude}`, '_blank')}
                              className="text-blue-600 hover:text-blue-800 text-sm mt-1 underline"
                            >
                              View on Google Maps
                            </button>
                          </div>
                        </div>
                      )}
                      
                      {/* Show fallback message if no address information is available */}
                      {!product.listedBy?.address && !product.listedBy?.city && !product.listedBy?.district && 
                       !product.listedBy?.state && !product.listedBy?.pinCode && !product.listedBy?.country && (
                        <div className="flex items-center justify-center space-x-2 text-gray-500 py-4">
                          <MapPin className="h-5 w-5" />
                          <span className="italic">Address information not provided by seller</span>
                        </div>
                      )}
                      
                      {/* Profile Verification Status */}
                      <div className="flex items-center justify-between pt-2 mt-2 border-t border-gray-200">
                        <div className="flex items-center space-x-2">
                          <Shield className={`h-4 w-4 ${product.listedBy?.isVerified ? 'text-green-600' : 'text-yellow-600'}`} />
                          <span className={`text-sm font-medium ${product.listedBy?.isVerified ? 'text-green-700' : 'text-yellow-700'}`}>
                            {product.listedBy?.isVerified ? 'Verified Profile' : 'Profile Pending Verification'}
                          </span>
                        </div>
                        {product.listedBy?.createdAt && (
                          <span className="text-xs text-gray-500">
                            Member since {new Date(product.listedBy.createdAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* User Stats */}
                  <div className="flex items-center space-x-4 pt-2 border-t">
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm text-gray-600">
                        {product.listedBy?.rating || "4.8"} rating
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Shield className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-gray-600">
                        {product.listedBy?.isVerified ? "Verified" : "Pending Verification"}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Package className="h-4 w-4 text-blue-500" />
                      <span className="text-sm text-gray-600">
                        {product.listedBy?.totalListings || "1"} items listed
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-emerald-500" />
                      <span className="text-sm text-gray-600">
                        {product.listedBy?.points || 0} points
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {product.status === "available" && (
              <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
                <button
                  onClick={handleSendRequest}
                  className="w-full py-4 px-6 bg-gradient-to-r from-gray-800 to-black hover:from-gray-700 hover:to-gray-900 text-white rounded-lg font-semibold text-lg transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
                >
                  <MessageCircle className="h-5 w-5" />
                  <span>Send Swap Request</span>
                </button>
                
                <button
                  onClick={handleBuyWithPoints}
                  className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-semibold text-lg transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
                >
                  <CreditCard className="h-5 w-5" />
                  <span>Buy with {product.pointsCost} Points</span>
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Swap Request Modal */}
      <Modal 
        isOpen={isRequestModalOpen} 
        onClose={closeRequestModal}
        maxWidth="max-w-4xl"
      >
        <SwapRequestModal 
          product={product} 
          onClose={closeRequestModal}
        />
      </Modal>

      {/* Purchase Confirmation Modal */}
      <Modal 
        isOpen={isPurchaseModalOpen} 
        onClose={closePurchaseModal}
        maxWidth="max-w-md"
      >
        <PurchaseConfirmationModal 
          product={product} 
          onClose={closePurchaseModal}
        />
      </Modal>
    </div>
  );
};

// Swap Request Modal Component
const SwapRequestModal = ({ product, onClose }) => {
  const [userItems, setUserItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchUserItems = useCallback(async () => {
    try {
      const response = await ItemService.getUserItems();
      if (response.success) {
        // Filter out the current product and only show available items
        const availableItems = response.data.filter(
          item => item._id !== product._id && item.status === "available"
        );
        setUserItems(availableItems);
      }
    } catch (error) {
      console.error("Error fetching user items:", error);
    } finally {
      setLoading(false);
    }
  }, [product._id]);

  useEffect(() => {
    fetchUserItems();
  }, [fetchUserItems]);

  const handleSendRequest = async () => {
    if (!selectedItem) {
      alert("Please select an item to swap");
      return;
    }
    
    try {
      // Make the actual swap request API call
      console.log("Sending swap request:", {
        requestedItem: product._id,
        offeredItem: selectedItem._id,
        message: message
      });
      
      const response = await SwapService.requestSwap({
        itemRequested: product._id,
        itemOffered: selectedItem._id,
        message: message
      });
      
      console.log('Swap request response:', response);
      alert("Swap request sent successfully!");
      onClose();
    } catch (error) {
      console.error('Error sending swap request:', error);
      alert("Failed to send swap request. Please try again.");
    }
  };

  const handleAddItem = () => {
    onClose();
    navigate('/add-item');
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Send Swap Request</h2>
        <button 
          onClick={onClose}
          className="text-gray-300 hover:text-white text-xl"
        >
          ✕
        </button>
      </div>

      {/* Requested Item */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 text-white">Requested Item:</h3>
        <div className="flex items-center space-x-4 p-4 bg-gray-800 rounded-lg">
          <img 
            src={product.images[0]} 
            alt={product.title}
            className="w-16 h-16 object-cover rounded-lg"
          />
          <div>
            <h4 className="font-semibold text-white">{product.title}</h4>
            <p className="text-gray-300">{product.category} • Size {product.size}</p>
            <p className="text-blue-400 font-semibold">{product.pointsCost} points</p>
          </div>
        </div>
      </div>

      {/* User's Items */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 text-white">Select Your Item to Offer:</h3>
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            <p className="mt-2 text-white">Loading your items...</p>
          </div>
        ) : userItems.length === 0 ? (
          <div className="text-center py-8">
            <div className="bg-gray-800 rounded-lg p-6">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-white text-lg font-medium mb-2">No items available for swap</p>
              <p className="text-gray-300 mb-4">You need to add items to your collection before you can send swap requests.</p>
              <button
                onClick={handleAddItem}
                className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-6 py-3 rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-colors font-medium"
              >
                Add Your First Item
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-64 overflow-y-auto">
            {userItems.map((item) => (
              <div
                key={item._id}
                onClick={() => setSelectedItem(item)}
                className={`cursor-pointer p-3 rounded-lg border-2 transition-all ${
                  selectedItem?._id === item._id
                    ? "border-emerald-500 bg-emerald-900 bg-opacity-30"
                    : "border-gray-600 bg-gray-800 hover:border-gray-500"
                }`}
              >
                <img 
                  src={item.images[0]} 
                  alt={item.title}
                  className="w-full h-24 object-cover rounded-lg mb-2"
                />
                <h4 className="font-medium text-sm text-white">{item.title}</h4>
                <p className="text-xs text-gray-300">{item.category} • Size {item.size}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Message */}
      {userItems.length > 0 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-white mb-2">
            Message (Optional):
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Add a message to your swap request..."
            className="w-full p-3 border border-gray-600 bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-gray-400"
            rows="3"
          />
        </div>
      )}

      {/* Action Buttons */}
      {userItems.length > 0 && (
        <div className="flex space-x-4">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSendRequest}
            disabled={!selectedItem}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send Request
          </button>
        </div>
      )}
    </div>
  );
};

// Purchase Confirmation Modal Component
const PurchaseConfirmationModal = ({ product, onClose }) => {
  const [userPoints] = useState(250); // This should come from user context/API
  const canAfford = userPoints >= product.pointsCost;

  const handlePurchase = () => {
    if (!canAfford) {
      alert("You don't have enough points for this purchase");
      return;
    }

    // Here you would implement the actual purchase API call
    console.log("Processing purchase:", {
      productId: product._id,
      pointsCost: product.pointsCost
    });

    alert("Purchase successful!");
    onClose();
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Confirm Purchase</h2>
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>

      {/* Product Summary */}
      <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg mb-6">
        <img 
          src={product.images[0]} 
          alt={product.title}
          className="w-16 h-16 object-cover rounded-lg"
        />
        <div className="flex-1">
          <h3 className="font-semibold">{product.title}</h3>
          <p className="text-gray-600">{product.category} • Size {product.size}</p>
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-2xl">💎</span>
            <span className="text-xl font-bold text-blue-600">{product.pointsCost}</span>
            <span className="text-gray-500">points</span>
          </div>
        </div>
      </div>

      {/* Points Balance */}
      <div className="mb-6 p-4 border rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-600">Your Current Points:</span>
          <span className="font-bold text-lg">{userPoints} 💎</span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-600">Cost:</span>
          <span className="font-bold text-lg">-{product.pointsCost} 💎</span>
        </div>
        <hr className="my-2" />
        <div className="flex justify-between items-center">
          <span className="font-semibold">Remaining Points:</span>
          <span className={`font-bold text-lg ${canAfford ? 'text-green-600' : 'text-red-600'}`}>
            {userPoints - product.pointsCost} 💎
          </span>
        </div>
      </div>

      {!canAfford && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">
            You need {product.pointsCost - userPoints} more points to purchase this item.
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-4">
        <button
          onClick={onClose}
          className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handlePurchase}
          disabled={!canAfford}
          className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          <CreditCard className="h-5 w-5" />
          <span>Confirm Purchase</span>
        </button>
      </div>
    </div>
  );
};

export default ProductDetail;
