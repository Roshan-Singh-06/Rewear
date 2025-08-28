import React, { useState, useEffect } from 'react';
import { Camera, X, Plus, Upload, Tag, Shirt, Package, Star, Users, ArrowLeft } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import ItemService from '../services/itemService';

export default function AddItemForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const editItem = location.state?.editItem;
  const isEditing = !!editItem;

  const [images, setImages] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    subCategory: '',
    size: '',
    condition: '',
    pointsCost: ''
  });
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Load edit data when component mounts
  useEffect(() => {
    if (editItem) {
      setFormData({
        title: editItem.title || '',
        description: editItem.description || '',
        category: editItem.category || '',
        subCategory: editItem.subCategory || '',
        size: editItem.size || '',
        condition: editItem.condition || '',
        pointsCost: editItem.pointsCost?.toString() || ''
      });
      
      // Load existing images
      if (editItem.images && editItem.images.length > 0) {
        const existingImages = editItem.images.map((url, index) => ({
          id: Date.now() + index,
          url: url,
          isExisting: true
        }));
        setImages(existingImages);
      }
    }
  }, [editItem]);

  const categories = [
    'Men', 'Women', 'Kids'
  ];

  const subCategories = [
    'casual', 'formal', 'party', 'sports', 'wedding', 'other'
  ];

  const conditions = [
    'new', 'like-new', 'good', 'fair', 'worn'
  ];

  const sizes = [
    'XS', 'S', 'M', 'L', 'XL', 'XXL', 
    '6', '8', '10', '12', '14', '16', '18'
  ];

  const handleImageUpload = (files) => {
    const newImages = Array.from(files).slice(0, 5 - images.length);
    const imageUrls = newImages.map(file => ({
      id: Date.now() + Math.random(),
      url: URL.createObjectURL(file),
      file: file
    }));
    setImages(prev => [...prev, ...imageUrls]);
  };

  const removeImage = (id) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    handleImageUpload(files);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.subCategory) newErrors.subCategory = 'Sub-category is required';
    if (!formData.size) newErrors.size = 'Size is required';
    if (!formData.condition) newErrors.condition = 'Condition is required';
    if (!formData.pointsCost || formData.pointsCost < 0) newErrors.pointsCost = 'Valid points cost is required';
    
    // For editing, we don't require new images since they might keep existing ones
    const hasNewImages = images.some(img => img.file && img.file instanceof File);
    const hasExistingImages = isEditing && editItem?.images?.length > 0;
    
    if (!hasNewImages && !hasExistingImages) {
      newErrors.images = 'At least one image is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      // Ensure we have valid images for new items, or keep existing for edits
      const validImageFiles = images
        .filter(img => img.file && img.file instanceof File)
        .map(img => img.file);
      
      if (!isEditing && validImageFiles.length === 0) {
        alert('Please upload at least one image');
        setLoading(false);
        return;
      }
      
      // Create FormData
      const submitFormData = new FormData();
      
      // Add text fields
      submitFormData.append('title', formData.title.trim());
      submitFormData.append('description', formData.description.trim());
      submitFormData.append('category', formData.category);
      submitFormData.append('subCategory', formData.subCategory);
      submitFormData.append('size', formData.size);
      submitFormData.append('condition', formData.condition);
      submitFormData.append('pointsCost', Number(formData.pointsCost));
      
      // Add new image files only
      validImageFiles.forEach((file, index) => {
        submitFormData.append('images', file);
        console.log(`Added image ${index}:`, file.name, file.size);
      });
      
      // Debug: Log all FormData entries before sending
      console.log('FormData entries before sending:');
      for (let [key, value] of submitFormData.entries()) {
        if (value instanceof File) {
          console.log(`${key}: File(${value.name}, ${value.size} bytes, ${value.type})`);
        } else {
          console.log(`${key}: ${value}`);
        }
      }
      
      let response;
      if (isEditing) {
        response = await ItemService.updateItem(editItem._id, submitFormData);
      } else {
        response = await ItemService.createItemWithFormData(submitFormData);
      }
      
      if (response.success) {
        alert(`Item ${isEditing ? 'updated' : 'created'} successfully!`);
        navigate('/dashboard');
      }
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} item:`, error);
      
      // Better error handling to see the exact backend error
      let errorMessage = `Failed to ${isEditing ? 'update' : 'create'} item. Please try again.`;
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleArrow = () => {
    navigate(-1)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <ArrowLeft onClick={handleArrow}  className="h-5 w-5 text-gray-600" />
              </button>
              <h1 className="text-2xl font-bold bg-gradient-to-br from-gray-300 via-gray-800 to-black bg-clip-text text-transparent">
                ReWear
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-gray-100 px-3 py-1 rounded-full">
                <Users className="h-4 w-4 text-black-600" />
                <span className="text-sm font-medium text-gray-700">245 Points</span>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-gray-300 via-gray-800 to-black rounded-full flex items-center justify-center">
                <span className="text-white font-medium">JD</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {isEditing ? 'Edit Item' : 'List a New Item'}
          </h2>
          <p className="text-gray-600">
            {isEditing 
              ? 'Update your item details and make changes as needed'
              : 'Share your preloved fashion and earn points for sustainable swapping'
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Image Upload Section */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  <Camera className="h-5 w-5 mr-2 text-black-600" />
                  Photos ({images.length}/5)
                </h3>
                
                <div
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                    dragOver 
                      ? 'border-black-500 bg-gray-100' 
                      : 'border-gray-300 hover:border-black-500 hover:bg-gray-50'
                  } ${images.length >= 5 ? 'opacity-50 pointer-events-none' : ''}`}
                  onDrop={handleDrop}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                >
                  <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 mb-2">Drag & drop images here, or click to browse</p>
                  <p className="text-sm text-gray-500">PNG, JPG up to 5MB each</p>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e.target.files)}
                    className="hidden"
                    id="image-upload"
                    disabled={images.length >= 5}
                  />
                  <label
                    htmlFor="image-upload"
                    className="inline-block mt-4 px-6 py-2 text-white rounded-lg cursor-pointer bg-gradient-to-br from-gray-500 via-gray-800 to-black"
                  >
                    Choose Files
                  </label>
                </div>

                {images.length > 0 && (
                  <div className="grid grid-cols-3 gap-4 mt-6">
                    {images.map((image, index) => (
                      <div key={image.id} className="relative group">
                        <img
                          src={image.url}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(image.id)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        {index === 0 && (
                          <div className="absolute bottom-1 left-1 bg-emerald-600 text-white text-xs px-2 py-1 rounded">
                            Main
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {errors.images && <p className="text-red-500 text-sm mt-1">{errors.images}</p>}
              </div>

              {/* Previous Listings Preview */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <h3 className="text-lg font-semibold mb-4">Your Recent Listings</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((item) => (
                    <div key={item} className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors cursor-pointer">
                      <div className="h-20 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg mb-2"></div>
                      <p className="text-sm font-medium text-gray-700">Vintage Denim Jacket</p>
                      <p className="text-xs text-gray-500">Listed 2 days ago</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Form Fields Section */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <h3 className="text-xl font-semibold mb-6 flex items-center">
                  <Package className="h-5 w-5 mr-2 text-black-600" />
                  Item Details
                </h3>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Item Title *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                      placeholder="e.g., Vintage Levi's Denim Jacket"
                    />
                    {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                      <select
                        value={formData.category}
                        onChange={(e) => handleInputChange('category', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                      >
                        <option value="">Select Category</option>
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                      {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Size *</label>
                      <select
                        value={formData.size}
                        onChange={(e) => handleInputChange('size', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                      >
                        <option value="">Select Size</option>
                        {sizes.map(size => (
                          <option key={size} value={size}>{size}</option>
                        ))}
                      </select>
                      {errors.size && <p className="text-red-500 text-sm mt-1">{errors.size}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Condition *</label>
                    <div className="grid grid-cols-5 gap-2">
                      {conditions.map((condition) => (
                        <button
                          key={condition}
                          type="button"
                          onClick={() => handleInputChange('condition', condition)}
                          className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                            formData.condition === condition
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-emerald-300'
                          }`}
                        >
                          {condition}
                        </button>
                      ))}
                    </div>
                    {errors.condition && <p className="text-red-500 text-sm mt-1">{errors.condition}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={4}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors resize-none"
                      placeholder="Describe the item's condition, style, fit, and any unique features..."
                    />
                    {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Sub-Category *</label>
                      <select
                        value={formData.subCategory}
                        onChange={(e) => handleInputChange('subCategory', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                      >
                        <option value="">Select Sub-Category</option>
                        {subCategories.map(subCat => (
                          <option key={subCat} value={subCat}>{subCat}</option>
                        ))}
                      </select>
                      {errors.subCategory && <p className="text-red-500 text-sm mt-1">{errors.subCategory}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Points Cost *</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.pointsCost}
                        onChange={(e) => handleInputChange('pointsCost', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                        placeholder="Enter points cost for this item"
                      />
                      {errors.pointsCost && <p className="text-red-500 text-sm mt-1">{errors.pointsCost}</p>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Section */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Ready to List?</h3>
                  <div className="flex items-center space-x-2">
                    <Star className="h-5 w-5 text-yellow-400 fill-current" />
                    <span className="text-sm text-gray-600">Earn 10 points</span>
                  </div>
                </div>
                <p className="text-gray-600 mb-6">Your item will be reviewed and approved within 24 hours.</p>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-3 bg-gradient-to-r bg-gradient-to-br from-gray-500 via-gray-800 to-black text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading 
                    ? (isEditing ? 'Updating...' : 'Listing...') 
                    : (isEditing ? 'Update Item' : 'List Item')
                  }
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}