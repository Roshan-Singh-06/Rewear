import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion'; // eslint-disable-line
import { 
  User, 
  Star, 
  Package, 
  ArrowUpDown, 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  Clock, 
  CheckCircle, 
  XCircle,
  Settings,
  LogOut,
  Camera,
  TrendingUp,
  Award,
  Shirt,
  Filter,
  Save,
  MapPin
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuthContext';
import AuthService from '../services/authService';
import ItemService from '../services/itemService';
import SwapService from '../services/swapService';

const ReWearUserDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: '',
    phoneNumber: '',
    address: '',
    state: '',
    country: '',
    pinCode: '',
    district: '',
    city: '',
    latitude: '',
    longitude: '',
    profilePicture: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [swapHistory, setSwapHistory] = useState([]);
  const [swapsLoading, setSwapsLoading] = useState(false);
  const [userItems, setUserItems] = useState({
    available: [],
    pending: [],
    swapped: [],
    all: []
  });
  const [recentFeedback, setRecentFeedback] = useState([]);
  const fileInputRef = useRef(null);
  
  const navigate = useNavigate();
  const { user, logout, updateProfile: updateAuthProfile, checkAuthStatus } = useAuth();

  useEffect(() => {
    if (user) {
      const userData = {
        fullName: user.fullName || '',
        phoneNumber: user.phoneNumber || '',
        address: user.address || '',
        state: user.state || '',
        country: user.country || '',
        pinCode: user.pinCode || '',
        district: user.district || '',
        city: user.city || '',
        latitude: user.latitude || '',
        longitude: user.longitude || '',
        profilePicture: user.profilePicture || ''
      };
      setProfileData(userData);
      
      // Check if this is first time (profile incomplete)
      const isIncomplete = !user.fullName || !user.phoneNumber || !user.address || 
                          !user.state || !user.country || !user.pinCode || !user.district || !user.city;
      setIsFirstTime(isIncomplete);
      setIsEditing(isIncomplete);
    }
  }, [user]);

  // Initialize recent feedback (can be replaced with real API call)
  useEffect(() => {
    // Sample recent feedback data - replace with real API call
    const sampleFeedback = [
      { condition: 'like_new', points: 50, date: '2 hours ago' },
      { condition: 'good', points: 40, date: '1 day ago' },
      { condition: 'new', points: 60, date: '3 days ago' },
    ];
    setRecentFeedback(sampleFeedback);

    // Listen for feedback submitted events
    const handleFeedbackSubmitted = async (event) => {
      const { pointsAwarded } = event.detail;
      const newFeedback = {
        condition: pointsAwarded === 60 ? 'new' : 
                  pointsAwarded === 50 ? 'like_new' :
                  pointsAwarded === 40 ? 'good' :
                  pointsAwarded === 30 ? 'fair' : 'worn',
        points: pointsAwarded,
        date: 'Just now'
      };
      
      setRecentFeedback(prev => [newFeedback, ...prev.slice(0, 2)]);
      
      // Refresh user data to update points display
      try {
        await checkAuthStatus(); // This will refresh user data with updated points
      } catch (error) {
        console.error('Failed to refresh user data:', error);
      }
    };

    window.addEventListener('feedbackSubmitted', handleFeedbackSubmitted);
    
    return () => {
      window.removeEventListener('feedbackSubmitted', handleFeedbackSubmitted);
    };
  }, [checkAuthStatus]);

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
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
    
    if (!profileData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!profileData.phoneNumber.trim()) newErrors.phoneNumber = 'Phone number is required';
    if (!profileData.address.trim()) newErrors.address = 'Address is required';
    if (!profileData.state.trim()) newErrors.state = 'State is required';
    if (!profileData.country.trim()) newErrors.country = 'Country is required';
    if (!profileData.pinCode.trim()) newErrors.pinCode = 'Pin code is required';
    if (!profileData.district.trim()) newErrors.district = 'District is required';
    if (!profileData.city.trim()) newErrors.city = 'City is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveProfile = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const response = await AuthService.updateProfile(profileData);
      if (response.success && response.data) {
        await updateAuthProfile(response.data);
        setIsEditing(false);
        setIsFirstTime(false);
        alert('Profile updated successfully!');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleProfilePictureUpload = async (file) => {
    if (!file) return;
    
    const formData = new FormData();
    formData.append('profilePicture', file);
    
    setLoading(true);
    try {
      const response = await AuthService.uploadProfilePicture(formData);
      if (response.success && response.data) {
        setProfileData(prev => ({
          ...prev,
          profilePicture: response.data.profilePicture
        }));
        await updateAuthProfile(response.data.user);
        alert('Profile picture updated successfully!');
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      alert('Failed to upload profile picture. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleProfilePictureUpload(file);
    }
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          handleInputChange('latitude', position.coords.latitude.toString());
          handleInputChange('longitude', position.coords.longitude.toString());
          alert('Location captured successfully!');
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Could not get your location. Please enter manually.');
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  const [myListings, setMyListings] = useState([]);
  const [_listingsLoading, setListingsLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch user's items
  const fetchUserItems = async () => {
    try {
      setListingsLoading(true);
      const response = await ItemService.getUserItemsForDashboard();
      if (response.success) {
        setUserItems(response.data);
        setMyListings(response.data.all || []); // Keep backwards compatibility
      }
    } catch (error) {
      console.error('Error fetching user items:', error);
      setUserItems({
        available: [],
        pending: [],
        swapped: [],
        all: []
      });
    } finally {
      setListingsLoading(false);
    }
  };

  // Fetch items when component mounts
  useEffect(() => {
    if (user) {
      fetchUserItems();
    }
  }, [user]);

  // Listen for when user returns from AddItemForm (refresh listings)
  useEffect(() => {
    const handleFocus = () => {
      // Refresh listings when window gets focus (user returns to this page)
      if (user) {
        fetchUserItems();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user]);

  // Fetch swap history and user items
  const fetchSwapHistory = useCallback(async () => {
    try {
      setSwapsLoading(true);
      const response = await SwapService.getUserSwaps();
      
      // Transform backend data to match frontend format
      const transformedSwaps = response.data.map(swap => ({
        id: swap._id,
        type: 'swap',
        itemGiven: swap.itemOffered?.title || 'Unknown Item',
        itemReceived: swap.itemRequested?.title || 'Unknown Item',
        partner: swap.requester._id === user._id 
          ? (swap.responder?.username || 'Unknown User')
          : (swap.requester?.username || 'Unknown User'),
        date: new Date(swap.createdAt).toLocaleDateString(),
        status: swap.status,
        points: 0, // Points are handled by orders, not swaps directly
        swapData: swap // Store original data for reference
      }));
      
      setSwapHistory(transformedSwaps);
    } catch (error) {
      console.error('Error fetching swap history:', error);
      setSwapHistory([]);
    } finally {
      setSwapsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchSwapHistory();
      fetchUserItems();
    }
  }, [user, fetchSwapHistory]);

  // Add loading state check after all hooks
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-800 flex items-center justify-center">
        <div className="text-white text-xl">Loading user data...</div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-gray-600 text-gray-200';
      case 'pending': return 'bg-gray-700 text-gray-300';
      case 'swapped': return 'bg-gray-800 text-gray-400';
      case 'completed': return 'bg-gray-600 text-gray-200';
      default: return 'bg-gray-700 text-gray-300';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-gray-400" />;
      case 'pending': return <Clock className="w-4 h-4 text-gray-400" />;
      case 'active': return <Eye className="w-4 h-4 text-gray-400" />;
      default: return <XCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const handleAddItem = () => {
    navigate('/addItem');
  };

  // Refresh listings - can be called when returning from AddItemForm
  const _refreshListings = () => {
    fetchUserItems();
  };

  // Handle edit item
  const handleEditItem = (item) => {
    // Navigate to edit form (you can pass item data via state)
    navigate('/addItem', { state: { editItem: item } });
  };

  // Handle delete item
  const handleDeleteItem = (item) => {
    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!itemToDelete) return;
    
    try {
      const response = await ItemService.deleteItem(itemToDelete._id);
      if (response.success) {
        alert('Item deleted successfully!');
        fetchUserItems(); // Refresh listings
        setShowDeleteModal(false);
        setItemToDelete(null);
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item. Please try again.');
    }
  };

  // Cancel delete
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setItemToDelete(null);
  };

  // Filter listings
  const filteredListings = myListings.filter(item => {
    const statusMatch = filterStatus === 'all' || item.status === filterStatus;
    const categoryMatch = filterCategory === 'all' || item.category === filterCategory;
    return statusMatch && categoryMatch;
  });

  const pageTransition = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3 }
  };

  const listItemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (index) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: index * 0.1,
        duration: 0.3
      }
    })
  };

  const StatCard = ({ icon, title, value, subtitle, index }) => {
    const IconComponent = icon;
    return (
      <motion.div 
        className="bg-gray-800 rounded-lg shadow-lg p-6 border-l-4 border-l-gray-400"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1, duration: 0.3 }}
        whileHover={{ scale: 1.02 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
            {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          </div>
          <div className="p-3 rounded-full bg-gray-700">
            <IconComponent className="w-6 h-6 text-gray-300" />
          </div>
        </div>
      </motion.div>
    );
  };

  const ItemCard = ({ item, index }) => (
    <motion.div 
      className="bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow border border-gray-700"
      variants={listItemVariants}
      initial="hidden"
      animate="visible"
      custom={index}
      whileHover={{ scale: 1.02 }}
    >
      <div className="aspect-square bg-gray-700 flex items-center justify-center">
        {item.images && item.images.length > 0 ? (
          <img 
            src={item.images[0]} 
            alt={item.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div className="w-full h-full flex items-center justify-center" style={{ display: item.images && item.images.length > 0 ? 'none' : 'flex' }}>
          <Shirt className="w-12 h-12 text-gray-500" />
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-white mb-2">{item.title}</h3>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-400">{item.category}</span>
          <span className="text-sm font-medium text-gray-300">{item.pointsCost} pts</span>
        </div>
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs text-gray-500">Size: {item.size}</span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
            {item.status}
          </span>
        </div>
        <div className="flex justify-between items-center text-sm text-gray-400 mb-3">
          <span className="text-xs">Condition: {item.condition}</span>
          <span className="text-xs">{item.approved ? 'Approved' : 'Pending'}</span>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={() => handleEditItem(item)}
            className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-md text-sm hover:bg-blue-500 transition-colors"
          >
            <Edit className="w-4 h-4 inline mr-1" />
            Edit
          </button>
          <button 
            onClick={() => handleDeleteItem(item)}
            className="flex-1 bg-red-600 text-white py-2 px-3 rounded-md text-sm hover:bg-red-500 transition-colors"
          >
            <Trash2 className="w-4 h-4 inline mr-1" />
            Delete
          </button>
        </div>
      </div>
    </motion.div>
  );

  const renderOverview = () => (
    <motion.div 
      className="space-y-6"
      {...pageTransition}
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={Star} 
          title="ReWear Points" 
          value={user?.points || 0} 
          subtitle="Available to spend"
          color="blue"
          index={0}
        />
        <StatCard 
          icon={ArrowUpDown} 
          title="Total Swaps" 
          value={user?.totalSwaps || 0} 
          subtitle="Successful exchanges"
          color="green"
          index={1}
        />
        <StatCard 
          icon={Package} 
          title="Available Items" 
          value={userItems.available?.length || 0} 
          subtitle="Ready for swap"
          color="purple"
          index={2}
        />
        <StatCard 
          icon={Clock} 
          title="Pending Swaps" 
          value={userItems.pending?.length || 0} 
          subtitle="Items in swap process"
          color="orange"
          index={3}
        />
      </div>

      {/* Points Earnings Section */}
      <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
            <Award className="w-5 h-5 text-yellow-500" />
            <span>Points Earnings</span>
          </h3>
          <div className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium">
            Available: {user?.points || 0} pts
          </div>
        </div>
        
        {/* Points Scale */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
          <div className="bg-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-400">60</div>
            <div className="text-xs text-gray-400">New Condition</div>
            <div className="text-sm text-gray-300">Perfect</div>
          </div>
          <div className="bg-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">50</div>
            <div className="text-xs text-gray-400">Like New</div>
            <div className="text-sm text-gray-300">Excellent</div>
          </div>
          <div className="bg-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">40</div>
            <div className="text-xs text-gray-400">Good</div>
            <div className="text-sm text-gray-300">Normal</div>
          </div>
          <div className="bg-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-orange-400">30</div>
            <div className="text-xs text-gray-400">Fair</div>
            <div className="text-sm text-gray-300">Some Wear</div>
          </div>
          <div className="bg-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-red-400">20</div>
            <div className="text-xs text-gray-400">Worn</div>
            <div className="text-sm text-gray-300">Well Used</div>
          </div>
        </div>

        {/* Recent Feedback Earnings */}
        <div className="mb-4">
          <h4 className="text-md font-medium text-white mb-3 flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span>Recent Earnings</span>
          </h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {recentFeedback.length > 0 ? (
              recentFeedback.slice(0, 3).map((feedback, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-sm text-gray-300">{feedback.condition} rating</span>
                  </div>
                  <span className="text-sm font-medium text-green-400">+{feedback.points} pts</span>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-400 text-center py-2">
                No recent feedback yet. Start selling to earn points!
              </div>
            )}
          </div>
        </div>
        
        <div className="p-3 bg-blue-900/30 border border-blue-500/30 rounded-lg">
          <p className="text-sm text-blue-200">
            💡 <strong>Earn points by selling quality items!</strong> Better condition ratings = more points earned.
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button onClick={handleAddItem} className="flex items-center justify-center space-x-2 bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-500 transition-colors">
            <Plus className="w-5 h-5" />
            <span>Add New Item</span>
          </button>
          <button className="flex items-center justify-center space-x-2 bg-gray-700 text-white py-3 px-4 rounded-lg hover:bg-gray-600 transition-colors">
            <Package className="w-5 h-5" />
            <span>Browse Items</span>
          </button>
          <button className="flex items-center justify-center space-x-2 bg-gray-500 text-white py-3 px-4 rounded-lg hover:bg-gray-400 transition-colors">
            <TrendingUp className="w-5 h-5" />
            <span>View Analytics</span>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {swapHistory.slice(0, 3).map(swap => (
            <div key={swap.id} className="flex items-center space-x-4 p-3 bg-gray-700 rounded-lg">
              {getStatusIcon(swap.status)}
              <div className="flex-1">
                <p className="text-sm font-medium text-white">
                  {swap.type === 'swap' ? 'Item Swap' : 'Points Redemption'}
                </p>
                <p className="text-sm text-gray-400">
                  {swap.type === 'swap' 
                    ? `Swapped ${swap.itemGiven} for ${swap.itemReceived} with ${swap.partner}`
                    : `Redeemed ${swap.itemReceived} for ${Math.abs(swap.points)} points`
                  }
                </p>
              </div>
              <span className="text-xs text-gray-500">{swap.date}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );

  const renderMyListings = () => (
    <motion.div 
      className="space-y-6"
      {...pageTransition}
    >
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">My Listings ({filteredListings.length})</h2>
        <div className="flex space-x-3">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 bg-gray-700 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
          >
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
          <button onClick={handleAddItem} className="flex items-center space-x-2 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-500 transition-colors">
            <Plus className="w-4 h-4" />
            <span>Add New Item</span>
          </button>
        </div>
      </div>
      
      {showFilters && (
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="available">Available</option>
                <option value="pending">Pending</option>
                <option value="swapped">Swapped</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                <option value="Men">Men</option>
                <option value="Women">Women</option>
                <option value="Kids">Kids</option>
              </select>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredListings.length > 0 ? (
          filteredListings.map((item, index) => (
            <ItemCard key={item._id} item={item} index={index} />
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <Shirt className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-400 mb-2">No items found</h3>
            <p className="text-gray-500 mb-4">
              {myListings.length === 0 ? 'You haven\'t listed any items yet.' : 'No items match your current filters.'}
            </p>
            {myListings.length === 0 && (
              <button 
                onClick={handleAddItem}
                className="bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-500 transition-colors"
              >
                Add Your First Item
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );

  const renderSwapHistory = () => (
    <motion.div 
      className="space-y-6"
      {...pageTransition}
    >
      <h2 className="text-2xl font-bold text-gray-900">Swap History</h2>
      
      {swapsLoading ? (
        <div className="bg-gray-700 text-gray-300 rounded-lg shadow-md p-8 text-center">
          <div className="text-white">Loading swap history...</div>
        </div>
      ) : swapHistory.length === 0 ? (
        <div className="bg-gray-700 text-gray-300 rounded-lg shadow-md p-8 text-center">
          <ArrowUpDown className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <div className="text-white text-lg mb-2">No Swap History</div>
          <div className="text-gray-400">You haven't made any swaps yet. Start swapping to see your history here!</div>
        </div>
      ) : (
        <div className="bg-gray-700 text-gray-300 rounded-lg shadow-md p-4 overflow-hidden">
          <div className="overflow-x-auto rounded-lg">
            <table className="w-full">
              <thead className="bg-gray-700 text-gray-300">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Partner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Points
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-600 rounded-lg">
                {swapHistory.map((swap, index) => (
                <motion.tr 
                  key={swap.id} 
                  className="space-x-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ backgroundColor: 'rgba(75, 85, 99, 0.3)' }}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-4 rounded-lg">
                      {swap.type === 'swap' ? (
                        <ArrowUpDown className="w-5 h-5 text-white-600 mr-2" />
                      ) : (
                        <Package className="w-5 h-5 text-white-600 mr-2 rounded-lg" />
                      )}
                      <span className="text-sm font-medium text-white capitalize">
                        {swap.type}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 space-x-4">
                    <div className="text-sm text-white ">
                      {swap.type === 'swap' 
                        ? `${swap.itemGiven} ↔ ${swap.itemReceived}`
                        : `Redeemed ${swap.itemReceived}`
                      }
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 rounded-xl">{swap.partner}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{swap.date}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(swap.status)}`}>
                      {swap.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${swap.points > 0 ? 'text-green-600' : swap.points < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                      {swap.points !== 0 ? `${swap.points > 0 ? '+' : ''}${swap.points}` : '-'}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}
    </motion.div>
  );

  const renderProfile = () => (
    <motion.div 
      className="space-y-6"
      {...pageTransition}
    >
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Profile Settings</h2>
        {!isEditing && !isFirstTime && (
          <button 
            onClick={() => setIsEditing(true)}
            className="flex items-center space-x-2 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-500 transition-colors"
          >
            <Edit className="w-4 h-4" />
            <span>Edit Profile</span>
          </button>
        )}
      </div>
      
      <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-6 mb-6">
          <div className="relative w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
            {profileData.profilePicture ? (
              <img 
                src={profileData.profilePicture} 
                alt="Profile" 
                className="w-full h-full rounded-full object-cover" 
              />
            ) : (
              <User className="w-12 h-12 text-gray-500" />
            )}
            <button 
              onClick={handleCameraClick}
              className="absolute -bottom-1 -right-1 bg-gray-600 rounded-full p-2 hover:bg-gray-500 transition-colors"
              disabled={loading}
            >
              <Camera className="w-4 h-4 text-white" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">{user?.fullName || 'Complete your profile'}</h3>
            <p className="text-white">{user?.email}</p>
            <p className="text-sm text-white">Member since {new Date(user?.createdAt).toLocaleDateString() || 'N/A'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Full Name *
            </label>
            <input
              type="text"
              value={profileData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              disabled={!isEditing && !isFirstTime}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isEditing || isFirstTime 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-gray-800 border-gray-600 text-gray-300'
              } ${errors.fullName ? 'border-red-500' : ''}`}
              placeholder="Enter your full name"
            />
            {errors.fullName && <p className="text-red-400 text-sm mt-1">{errors.fullName}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Phone Number *
            </label>
            <input
              type="tel"
              value={profileData.phoneNumber}
              onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
              disabled={!isEditing && !isFirstTime}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isEditing || isFirstTime 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-gray-800 border-gray-600 text-gray-300'
              } ${errors.phoneNumber ? 'border-red-500' : ''}`}
              placeholder="Enter your phone number"
            />
            {errors.phoneNumber && <p className="text-red-400 text-sm mt-1">{errors.phoneNumber}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Country *
            </label>
            <input
              type="text"
              value={profileData.country}
              onChange={(e) => handleInputChange('country', e.target.value)}
              disabled={!isEditing && !isFirstTime}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isEditing || isFirstTime 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-gray-800 border-gray-600 text-gray-300'
              } ${errors.country ? 'border-red-500' : ''}`}
              placeholder="Enter your country"
            />
            {errors.country && <p className="text-red-400 text-sm mt-1">{errors.country}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              State *
            </label>
            <input
              type="text"
              value={profileData.state}
              onChange={(e) => handleInputChange('state', e.target.value)}
              disabled={!isEditing && !isFirstTime}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isEditing || isFirstTime 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-gray-800 border-gray-600 text-gray-300'
              } ${errors.state ? 'border-red-500' : ''}`}
              placeholder="Enter your state"
            />
            {errors.state && <p className="text-red-400 text-sm mt-1">{errors.state}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              District *
            </label>
            <input
              type="text"
              value={profileData.district}
              onChange={(e) => handleInputChange('district', e.target.value)}
              disabled={!isEditing && !isFirstTime}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isEditing || isFirstTime 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-gray-800 border-gray-600 text-gray-300'
              } ${errors.district ? 'border-red-500' : ''}`}
              placeholder="Enter your district"
            />
            {errors.district && <p className="text-red-400 text-sm mt-1">{errors.district}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Pin Code *
            </label>
            <input
              type="text"
              value={profileData.pinCode}
              onChange={(e) => handleInputChange('pinCode', e.target.value)}
              disabled={!isEditing && !isFirstTime}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isEditing || isFirstTime 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-gray-800 border-gray-600 text-gray-300'
              } ${errors.pinCode ? 'border-red-500' : ''}`}
              placeholder="Enter your pin code"
            />
            {errors.pinCode && <p className="text-red-400 text-sm mt-1">{errors.pinCode}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              City *
            </label>
            <input
              type="text"
              value={profileData.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
              disabled={!isEditing && !isFirstTime}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isEditing || isFirstTime 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-gray-800 border-gray-600 text-gray-300'
              } ${errors.city ? 'border-red-500' : ''}`}
              placeholder="Enter your city"
            />
            {errors.city && <p className="text-red-400 text-sm mt-1">{errors.city}</p>}
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-white mb-2">
            Address *
          </label>
          <textarea
            rows={4}
            value={profileData.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
            disabled={!isEditing && !isFirstTime}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              isEditing || isFirstTime 
                ? 'bg-gray-700 border-gray-600 text-white' 
                : 'bg-gray-800 border-gray-600 text-gray-300'
            } ${errors.address ? 'border-red-500' : ''}`}
            placeholder="Enter your complete address"
          />
          {errors.address && <p className="text-red-400 text-sm mt-1">{errors.address}</p>}
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Latitude
            </label>
            <input
              type="number"
              step="any"
              value={profileData.latitude}
              onChange={(e) => handleInputChange('latitude', e.target.value)}
              disabled={!isEditing && !isFirstTime}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isEditing || isFirstTime 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-gray-800 border-gray-600 text-gray-300'
              }`}
              placeholder="Latitude"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Longitude
            </label>
            <div className="flex space-x-2">
              <input
                type="number"
                step="any"
                value={profileData.longitude}
                onChange={(e) => handleInputChange('longitude', e.target.value)}
                disabled={!isEditing && !isFirstTime}
                className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isEditing || isFirstTime 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-gray-800 border-gray-600 text-gray-300'
                }`}
                placeholder="Longitude"
              />
              {(isEditing || isFirstTime) && (
                <button
                  type="button"
                  onClick={getLocation}
                  className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
                  disabled={loading}
                >
                  <MapPin className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {(isEditing || isFirstTime) && (
          <div className="mt-6 flex justify-end">
            <button 
              onClick={handleSaveProfile}
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-2 text-white rounded-md bg-gradient-to-r from-black via-gray-800 to-gray-500 hover:from-gray-800 hover:to-gray-600 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Saving...' : (isFirstTime ? 'Save Profile' : 'Save Changes')}</span>
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gray-800">
      {/* Header */}
      <header className="bg-gray-800 shadow-lg border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                  <Shirt className="w-5 h-5 text-gray-900" />
                </div>
                <span className="text-xl font-bold text-white">ReWear</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-gray-700 px-3 py-1 rounded-full">
                <Star className="w-4 h-4 text-gray-300" />
                <span className="text-sm font-medium text-gray-300">{user?.points || 0} points</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                  {user?.profilePicture ? (
                    <img src={user?.profilePicture} alt="User" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-gray-300" />
                  )}
                </div>
                <span className="text-sm font-medium text-gray-300">{user?.fullName || user?.username || 'User'}</span>
              </div>
              <button className="p-2 text-gray-400 hover:text-gray-200">
                <Settings className="w-5 h-5" />
              </button>
              <button 
                onClick={logout}
                className="p-2 text-gray-400 hover:text-gray-200"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full lg:w-64 flex-shrink-0">
            <nav className="bg-gray-800 rounded-lg shadow-lg p-4 space-y-2 border border-gray-700">
              <button
                onClick={() => setActiveTab('overview')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-left transition-colors ${
                  activeTab === 'overview' 
                    ? 'bg-gray-700 text-white' 
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <TrendingUp className="w-5 h-5" />
                <span>Overview</span>
              </button>
              <button
                onClick={() => setActiveTab('listings')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-left transition-colors ${
                  activeTab === 'listings' 
                    ? 'bg-gray-700 text-white' 
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <Package className="w-5 h-5" />
                <span>My Listings</span>
              </button>
              <button
                onClick={() => setActiveTab('swaps')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-left transition-colors ${
                  activeTab === 'swaps' 
                    ? 'bg-gray-700 text-white' 
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <ArrowUpDown className="w-5 h-5" />
                <span>Swap History</span>
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-left transition-colors ${
                  activeTab === 'profile' 
                    ? 'bg-gray-700 text-white' 
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <User className="w-5 h-5" />
                <span>Profile</span>
              </button>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && renderOverview()}
              {activeTab === 'listings' && renderMyListings()}
              {activeTab === 'swaps' && renderSwapHistory()}
              {activeTab === 'profile' && renderProfile()}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-700">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-white">Delete Item</h3>
                <p className="text-sm text-gray-400">This action cannot be undone.</p>
              </div>
            </div>
            
            {itemToDelete && (
              <div className="mb-6">
                <p className="text-gray-300 mb-2">
                  Are you sure you want to delete <span className="font-semibold text-white">"{itemToDelete.title}"</span>?
                </p>
                <div className="bg-gray-700 rounded-lg p-3">
                  <div className="flex items-center space-x-3">
                    {itemToDelete.images && itemToDelete.images.length > 0 ? (
                      <img 
                        src={itemToDelete.images[0]} 
                        alt={itemToDelete.title}
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-600 rounded flex items-center justify-center">
                        <Shirt className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <p className="text-white font-medium">{itemToDelete.title}</p>
                      <p className="text-sm text-gray-400">{itemToDelete.category} • {itemToDelete.pointsCost} pts</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex space-x-3">
              <button
                onClick={cancelDelete}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReWearUserDashboard;