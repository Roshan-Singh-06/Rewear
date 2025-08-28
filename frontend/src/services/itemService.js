import axiosInstance from '../axios/axiosInstance';
import { API_ENDPOINTS } from '../axios/apiConfig';

class ItemService {
  static async makeRequest(endpoint, options = {}) {
    try {
      const { method = 'GET', data, params, ...config } = options;
      
      const response = await axiosInstance({
        url: endpoint,
        method,
        data,
        params,
        ...config,
      });

      return response.data;
    } catch (error) {
      console.error('Item API Error:', error);
      
      // Extract error message from response
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'API request failed';
      
      throw new Error(errorMessage);
    }
  }

  // Get all items with optional filters
  static async getAllItems(filters = {}) {
    const params = {};
    if (filters.category) params.category = filters.category;
    if (filters.subCategory) params.subCategory = filters.subCategory;
    if (filters.size) params.size = filters.size;
    if (filters.condition) params.condition = filters.condition;
    if (filters.status) params.status = filters.status;

    return this.makeRequest(API_ENDPOINTS.ITEMS.GET_ALL, {
      method: 'GET',
      params,
    });
  }

  // Get item by ID
  static async getItemById(id) {
    return this.makeRequest(`${API_ENDPOINTS.ITEMS.GET_BY_ID}/${id}`, {
      method: 'GET',
    });
  }

  // Create new item with FormData
  static async createItemWithFormData(formData) {
    console.log('ItemService: Creating item with FormData');
    
    return this.makeRequest(API_ENDPOINTS.ITEMS.CREATE, {
      method: 'POST',
      data: formData,
      // No headers needed - axios interceptor will handle Content-Type for FormData
    });
  }

  // Create new item
  static async createItem(itemData) {
    console.log('ItemService: Creating item with data:', itemData);
    
    const formData = new FormData();
    
    // Add text fields
    Object.keys(itemData).forEach(key => {
      if (key !== 'images') {
        console.log(`Adding field ${key}:`, itemData[key]);
        formData.append(key, itemData[key]);
      }
    });

    // Add image files
    if (itemData.images && itemData.images.length > 0) {
      console.log('Adding images:', itemData.images);
      itemData.images.forEach((image, index) => {
        console.log(`Adding image ${index}:`, image);
        formData.append('images', image);
      });
    } else {
      console.log('No images found in itemData');
    }

    // Debug: Log all FormData entries
    console.log('FormData entries:');
    for (let [key, value] of formData.entries()) {
      console.log(key, value);
    }

    return this.makeRequest(API_ENDPOINTS.ITEMS.CREATE, {
      method: 'POST',
      data: formData,
      headers: {
        // Don't set Content-Type, let axios set it automatically for FormData
        // This ensures proper boundary is set for multipart/form-data
      },
    });
  }

  // Update item
  static async updateItem(id, formDataOrObject) {
    console.log('ItemService: Updating item with ID:', id);
    console.log('ItemService: Update data:', formDataOrObject);
    
    let requestData;
    
    // If it's already FormData, use it directly
    if (formDataOrObject instanceof FormData) {
      requestData = formDataOrObject;
      console.log('ItemService: Using provided FormData');
    } else {
      // Convert object to FormData
      const formData = new FormData();
      
      // Add text fields
      Object.keys(formDataOrObject).forEach(key => {
        if (key !== 'images') {
          console.log(`Adding field ${key}:`, formDataOrObject[key]);
          formData.append(key, formDataOrObject[key]);
        }
      });

      // Add image files if any new ones
      if (formDataOrObject.images && formDataOrObject.images.length > 0) {
        console.log('Adding images:', formDataOrObject.images);
        formDataOrObject.images.forEach(image => {
          if (image instanceof File) {
            console.log('Adding image file:', image.name);
            formData.append('images', image);
          }
        });
      }
      
      requestData = formData;
    }

    // Debug: Log all FormData entries
    console.log('FormData entries for update:');
    for (let [key, value] of requestData.entries()) {
      if (value instanceof File) {
        console.log(`${key}: File(${value.name}, ${value.size} bytes, ${value.type})`);
      } else {
        console.log(`${key}: ${value}`);
      }
    }

    return this.makeRequest(`${API_ENDPOINTS.ITEMS.UPDATE}/${id}`, {
      method: 'PUT',
      data: requestData,
      // No headers needed - axios interceptor will handle Content-Type for FormData
    });
  }

  // Delete item
  static async deleteItem(id) {
    return this.makeRequest(`${API_ENDPOINTS.ITEMS.DELETE}/${id}`, {
      method: 'DELETE',
    });
  }

  // Get user's items (listings)
  static async getUserItems() {
    return this.makeRequest('/items/my-items', {
      method: 'GET',
    });
  }

  // Get user's items for dashboard with status categorization
  static async getUserItemsForDashboard() {
    return this.makeRequest('/items/my-items/dashboard', {
      method: 'GET',
    });
  }

  // Search items by city
  static async getItemsByCity(city) {
    return this.makeRequest(API_ENDPOINTS.ITEMS.SEARCH_BY_CITY, {
      method: 'GET',
      params: { city },
    });
  }

  // Comprehensive location search
  static async getItemsByLocation(location) {
    return this.makeRequest(API_ENDPOINTS.ITEMS.SEARCH_BY_LOCATION, {
      method: 'GET',
      params: { location },
    });
  }

  // Get items near user's location
  static async getItemsNearMe() {
    return this.makeRequest(API_ENDPOINTS.ITEMS.NEAR_ME, {
      method: 'GET',
    });
  }
}

export default ItemService;
