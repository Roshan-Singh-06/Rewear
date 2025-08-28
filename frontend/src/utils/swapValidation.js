/**
 * Utility functions for validating swap data structure
 */

export const validateSwapData = (swapData) => {
  if (!swapData) return { isValid: false, error: 'No swap data provided' };
  
  // Check if swapId exists
  if (!swapData.swapId) {
    return { isValid: false, error: 'Swap ID is missing' };
  }
  
  // Check if required items are present
  if (!swapData.itemOffered) {
    return { isValid: false, error: 'Offered item data is missing' };
  }
  
  if (!swapData.itemRequested) {
    return { isValid: false, error: 'Requested item data is missing' };
  }
  
  // Check if sender information is present
  if (!swapData.sender) {
    return { isValid: false, error: 'Sender information is missing' };
  }
  
  return { isValid: true };
};

export const isSwapActionable = (swapData) => {
  const validation = validateSwapData(swapData);
  if (!validation.isValid) return false;
  
  // Check if swap is in pending status
  const swapStatus = swapData.swapId?.status || swapData.swapId?.swapStatus;
  return swapStatus === 'pending';
};

export const getSwapId = (swapData) => {
  if (!swapData?.swapId) return null;
  
  // Handle both object and string references
  return typeof swapData.swapId === 'object' 
    ? swapData.swapId._id 
    : swapData.swapId;
};

export const formatSwapError = (error) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  
  if (error.message) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
};
