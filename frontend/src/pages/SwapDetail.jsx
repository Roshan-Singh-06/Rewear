import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  ChevronLeft, 
  ChevronRight, 
  User, 
  MapPin, 
  Phone, 
  Calendar,
  Package,
  CheckCircle,
  Clock,
  Home,
  Building
} from 'lucide-react';
import Navbar from './components/Navbar';
import NotificationService from '../services/notificationService';
import SwapService from '../services/swapService';

import { validateSwapData, isSwapActionable, getSwapId, formatSwapError } from '../utils/swapValidation';

const SwapDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [swapData, setSwapData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  
  // Image navigation states for both items
  const [offeredImageIndex, setOfferedImageIndex] = useState(0);
  const [requestedImageIndex, setRequestedImageIndex] = useState(0);

  useEffect(() => {
    const fetchSwapData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Try to get notification data first (for swap notifications)
        const response = await NotificationService.getNotificationById(id);
        
        if (response.success && response.data) {
          console.log('Initial notification data:', response.data);
          
          // Check if this is a swap notification with proper data
          if (response.data.type && response.data.type.startsWith('swap')) {
            // If notification has complete swap data, use it
            if (response.data.itemOffered && response.data.itemRequested && response.data.swapId) {
              setSwapData(response.data);
              console.log('Using complete notification data');
            } 
            // If notification has swapId but missing item details, fetch swap data
            else if (response.data.swapId) {
              console.log('Fetching additional swap details...');
              try {
                const swapId = response.data.swapId._id || response.data.swapId;
                const swapResponse = await SwapService.getSwapById(swapId);
                console.log('Additional swap data:', swapResponse);
                
                if (swapResponse.success && swapResponse.data) {
                  // Merge notification data with complete swap data
                  const mergedData = {
                    ...response.data,
                    itemOffered: swapResponse.data.itemOffered,
                    itemRequested: swapResponse.data.itemRequested,
                    swapId: swapResponse.data
                  };
                  console.log('Merged swap data:', mergedData);
                  setSwapData(mergedData);
                }
              } catch (swapError) {
                console.warn('Could not fetch additional swap details:', swapError);
                setSwapData(response.data); // Use notification data only
              }
            } else {
              setSwapData(response.data);
            }
          } else {
            // Not a swap notification, set data as is
            setSwapData(response.data);
          }
        } else {
          setError('Swap details not found');
        }
      } catch (err) {
        console.error('Error fetching swap details:', err);
        setError('Failed to load swap details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchSwapData();
    }
  }, [id]);

  const handleSwapAction = async (swapId, action) => {
    // Prevent multiple calls
    if (actionLoading) {
      console.log('Action already in progress, ignoring...');
      return;
    }

    try {
      console.log(`Starting ${action} action for swap ID:`, swapId);
      console.log('Current swap data:', swapData);
      
      // Validate swap data
      const validation = validateSwapData(swapData);
      if (!validation.isValid) {
        alert(`Cannot ${action} swap: ${validation.error}`);
        return;
      }
      
      // Check if swap is actionable
      if (!isSwapActionable(swapData)) {
        alert(`Cannot ${action} swap. Current status: ${swapData.swapId?.status || 'unknown'}`);
        return;
      }
      
      setActionLoading(action);
      
      // Get the correct swap ID
      const correctSwapId = getSwapId(swapData);
      if (!correctSwapId) {
        throw new Error('Cannot determine swap ID');
      }
      
      let response;
      if (action === 'accept') {
        console.log('Calling SwapService.acceptSwap...');
        response = await SwapService.acceptSwap(correctSwapId);
      } else if (action === 'reject') {
        console.log('Calling SwapService.rejectSwap...');
        response = await SwapService.rejectSwap(correctSwapId);
      }
      
      console.log(`${action} response:`, response);
      
      if (response.success) {
        // Refresh swap data after successful action
        console.log('Refreshing swap data after action...');
        try {
          // Try to get updated notification data first
          const refreshResponse = await NotificationService.getNotificationById(id);
          if (refreshResponse.success && refreshResponse.data) {
            // If notification has swap ID, fetch latest swap data
            if (refreshResponse.data.swapId) {
              const swapId = refreshResponse.data.swapId._id || refreshResponse.data.swapId;
              const updatedSwapResponse = await SwapService.getSwapById(swapId);
              if (updatedSwapResponse.success && updatedSwapResponse.data) {
                const refreshedData = {
                  ...refreshResponse.data,
                  itemOffered: updatedSwapResponse.data.itemOffered,
                  itemRequested: updatedSwapResponse.data.itemRequested,
                  swapId: updatedSwapResponse.data
                };
                setSwapData(refreshedData);
                console.log('Swap data refreshed with latest status:', updatedSwapResponse.data.status);
              }
            } else {
              setSwapData(refreshResponse.data);
            }
          }
        } catch (refreshError) {
          console.warn('Could not refresh swap data:', refreshError);
        }
        
        alert(`Swap request ${action}ed successfully! A notification has been sent to the other user.`);
      } else {
        throw new Error(response.message || `Failed to ${action} swap`);
      }
    } catch (error) {
      console.error(`Error ${action}ing swap:`, error);
      
      // Use the error formatting utility
      const errorMessage = formatSwapError(error);
      alert(`Error: ${errorMessage}`);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'accepted': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      case 'completed': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getConditionColor = (condition) => {
    switch (condition) {
      case 'new': return 'bg-green-100 text-green-700';
      case 'like-new': return 'bg-green-100 text-green-600';
      case 'good': return 'bg-blue-100 text-blue-600';
      case 'fair': return 'bg-yellow-100 text-yellow-600';
      default: return 'bg-red-100 text-red-600';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Image navigation functions
  const nextOfferedImage = () => {
    if (swapData?.itemOffered?.images) {
      setOfferedImageIndex((prev) => 
        (prev + 1) % swapData.itemOffered.images.length
      );
    }
  };

  const prevOfferedImage = () => {
    if (swapData?.itemOffered?.images) {
      setOfferedImageIndex((prev) => 
        prev === 0 ? swapData.itemOffered.images.length - 1 : prev - 1
      );
    }
  };

  const nextRequestedImage = () => {
    if (swapData?.itemRequested?.images) {
      setRequestedImageIndex((prev) => 
        (prev + 1) % swapData.itemRequested.images.length
      );
    }
  };

  const prevRequestedImage = () => {
    if (swapData?.itemRequested?.images) {
      setRequestedImageIndex((prev) => 
        prev === 0 ? swapData.itemRequested.images.length - 1 : prev - 1
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-4 text-gray-600">Loading swap details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !swapData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="text-red-500 mb-4">⚠️</div>
            <p className="text-red-600 mb-4">{error || 'Swap details not found'}</p>
            <button
              onClick={() => navigate('/notifications')}
              className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
            >
              Back to Notifications
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Header */}
      <section className="bg-gradient-to-r from-gray-900 via-black to-gray-800 text-white py-6">
        <div className="max-w-7xl mx-auto px-6">
          <button
            onClick={() => navigate('/notifications')}
            className="flex items-center space-x-2 text-gray-300 hover:text-white mb-4"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Notifications</span>
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">{swapData.title}</h1>
              <p className="text-gray-300 mt-2">{swapData.message}</p>
            </div>
            
            <div className="text-right">
              <div className="flex items-center space-x-2 text-gray-300 mb-2">
                <Clock className="h-4 w-4" />
                <span className="text-sm">{formatDate(swapData.createdAt)}</span>
              </div>
              
              {swapData.swapId && (
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(swapData.swapId.status)}`}>
                  {swapData.swapId.status.charAt(0).toUpperCase() + swapData.swapId.status.slice(1)}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Debug Info - Only in development */}
      {import.meta.env.DEV && swapData && (
        <section className="py-4">
          <div className="max-w-7xl mx-auto px-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-bold text-yellow-800 mb-2">Debug Info:</h4>
              <div className="text-sm text-yellow-700 grid grid-cols-2 gap-2">
                <p><strong>Notification Type:</strong> {swapData.type}</p>
                <p><strong>Swap ID:</strong> {getSwapId(swapData) || 'Not found'}</p>
                <p><strong>Swap Status:</strong> {swapData.swapId?.status || 'No status'}</p>
                <p><strong>Has Item Offered:</strong> {swapData.itemOffered ? 'Yes' : 'No'}</p>
                <p><strong>Has Item Requested:</strong> {swapData.itemRequested ? 'Yes' : 'No'}</p>
                <p><strong>Is Actionable:</strong> {isSwapActionable(swapData) ? 'Yes' : 'No'}</p>
                <p className="col-span-2"><strong>Validation:</strong> {validateSwapData(swapData).isValid ? 'Valid' : validateSwapData(swapData).error}</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Main Content */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-6">
          
          {/* Sender Information */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <User className="h-6 w-6 mr-3 text-blue-600" />
              Sender Information
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">
                      {swapData.sender?.fullName || swapData.sender?.username}
                    </h3>
                    <p className="text-gray-600">{swapData.sender?.email}</p>
                  </div>
                </div>
                
                {swapData.sender?.phoneNumber && (
                  <div className="flex items-center space-x-3 text-gray-700">
                    <Phone className="h-5 w-5 text-gray-500" />
                    <span>{swapData.sender.phoneNumber}</span>
                  </div>
                )}
                
                <div className="flex items-center space-x-3 text-gray-700">
                  <Calendar className="h-5 w-5 text-gray-500" />
                  <span>Member since {new Date(swapData.sender?.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              
              {/* Address Info */}
              <div className="space-y-4">
                <h4 className="font-semibold text-lg flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-red-500" />
                  Address Details
                </h4>
                
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  {swapData.sender?.address && (
                    <div className="flex items-start space-x-2">
                      <Home className="h-4 w-4 text-gray-500 mt-1" />
                      <span className="text-gray-700">{swapData.sender.address}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    {swapData.sender?.city && (
                      <span className="flex items-center space-x-1">
                        <Building className="h-4 w-4" />
                        <span>{swapData.sender.city}</span>
                      </span>
                    )}
                    
                    {swapData.sender?.district && (
                      <span>{swapData.sender.district}</span>
                    )}
                    
                    {swapData.sender?.state && (
                      <span>{swapData.sender.state}</span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    {swapData.sender?.pinCode && (
                      <span>PIN: {swapData.sender.pinCode}</span>
                    )}
                    
                    {swapData.sender?.country && (
                      <span>{swapData.sender.country}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Items Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            
            {/* Item Offered */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="bg-green-50 px-6 py-4 border-b">
                <h3 className="text-xl font-bold text-green-700 flex items-center">
                  <Package className="h-6 w-6 mr-2" />
                  Item Offered
                </h3>
              </div>
              
              {/* Images Section */}
              {swapData.itemOffered?.images && swapData.itemOffered.images.length > 0 && (
                <div className="relative">
                  {/* Main Image */}
                  <div className="relative h-80 bg-gray-100">
                    <img
                      src={swapData.itemOffered.images[offeredImageIndex]}
                      alt={swapData.itemOffered.title}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Navigation Arrows */}
                    {swapData.itemOffered.images.length > 1 && (
                      <>
                        <button
                          onClick={prevOfferedImage}
                          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-all"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                          onClick={nextOfferedImage}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-all"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </>
                    )}
                  </div>
                  
                  {/* Thumbnail Images */}
                  {swapData.itemOffered.images.length > 1 && (
                    <div className="flex space-x-2 p-4 overflow-x-auto">
                      {swapData.itemOffered.images.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setOfferedImageIndex(index)}
                          className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${
                            index === offeredImageIndex ? 'border-green-500' : 'border-gray-200'
                          }`}
                        >
                          <img
                            src={image}
                            alt={`${swapData.itemOffered.title} ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {/* Item Details */}
              <div className="p-6">
                <h4 className="text-xl font-bold mb-3">{swapData.itemOffered?.title}</h4>
                <p className="text-gray-600 mb-4">{swapData.itemOffered?.description}</p>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <span className="text-sm text-gray-500">Category</span>
                    <p className="font-medium">{swapData.itemOffered?.category}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Size</span>
                    <p className="font-medium">{swapData.itemOffered?.size}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Points Value</span>
                    <p className="font-bold text-blue-600">{swapData.itemOffered?.pointsCost} points</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Condition</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConditionColor(swapData.itemOffered?.condition)}`}>
                      {swapData.itemOffered?.condition?.replace('-', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Item Requested */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="bg-blue-50 px-6 py-4 border-b">
                <h3 className="text-xl font-bold text-blue-700 flex items-center">
                  <Package className="h-6 w-6 mr-2" />
                  Item Requested
                </h3>
              </div>
              
              {/* Images Section */}
              {swapData.itemRequested?.images && swapData.itemRequested.images.length > 0 && (
                <div className="relative">
                  {/* Main Image */}
                  <div className="relative h-80 bg-gray-100">
                    <img
                      src={swapData.itemRequested.images[requestedImageIndex]}
                      alt={swapData.itemRequested.title}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Navigation Arrows */}
                    {swapData.itemRequested.images.length > 1 && (
                      <>
                        <button
                          onClick={prevRequestedImage}
                          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-all"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                          onClick={nextRequestedImage}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-all"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </>
                    )}
                  </div>
                  
                  {/* Thumbnail Images */}
                  {swapData.itemRequested.images.length > 1 && (
                    <div className="flex space-x-2 p-4 overflow-x-auto">
                      {swapData.itemRequested.images.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setRequestedImageIndex(index)}
                          className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${
                            index === requestedImageIndex ? 'border-blue-500' : 'border-gray-200'
                          }`}
                        >
                          <img
                            src={image}
                            alt={`${swapData.itemRequested.title} ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {/* Item Details */}
              <div className="p-6">
                <h4 className="text-xl font-bold mb-3">{swapData.itemRequested?.title}</h4>
                <p className="text-gray-600 mb-4">{swapData.itemRequested?.description}</p>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <span className="text-sm text-gray-500">Category</span>
                    <p className="font-medium">{swapData.itemRequested?.category}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Size</span>
                    <p className="font-medium">{swapData.itemRequested?.size}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Points Value</span>
                    <p className="font-bold text-blue-600">{swapData.itemRequested?.pointsCost} points</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Condition</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConditionColor(swapData.itemRequested?.condition)}`}>
                      {swapData.itemRequested?.condition?.replace('-', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Accept Request Button - Only for Pending Swap Requests */}
          {swapData.type === 'swap_request' && isSwapActionable(swapData) && (
            <div className="bg-white rounded-lg shadow-sm border p-8">
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-4 text-gray-800">Accept This Swap Request?</h3>
                <p className="text-gray-600 mb-8 text-lg">
                  {swapData.sender?.fullName || swapData.sender?.username} wants to swap their 
                  <span className="font-semibold text-green-600"> "{swapData.itemOffered?.title}"</span> for your 
                  <span className="font-semibold text-blue-600"> "{swapData.itemRequested?.title}"</span>
                </p>
                
                <button
                  onClick={() => handleSwapAction(getSwapId(swapData), 'accept')}
                  disabled={actionLoading === 'accept'}
                  className="bg-green-500 text-white px-12 py-4 rounded-lg hover:bg-green-600 disabled:opacity-50 font-bold text-xl transition-all transform hover:scale-105 shadow-lg"
                >
                  {actionLoading === 'accept' ? (
                    <span className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Accepting...</span>
                    </span>
                  ) : (
                    <span className="flex items-center space-x-3">
                      <CheckCircle className="h-6 w-6" />
                      <span>Accept Swap Request</span>
                    </span>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Status Message for Non-Pending Swaps */}
          {swapData.swapId && !isSwapActionable(swapData) && (
            <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
              <div className={`inline-flex items-center space-x-2 px-6 py-3 rounded-full text-lg font-semibold ${getStatusColor(swapData.swapId.status)}`}>
                <span>
                  This swap request has been {swapData.swapId.status}
                </span>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default SwapDetail;
