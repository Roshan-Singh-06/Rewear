import { useState, useEffect } from "react";
import {
  UsersIcon,
  ShoppingBagIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  EllipsisVerticalIcon,
  CalendarIcon,
  ChartPieIcon,
  MapPinIcon,
  GlobeAltIcon,
  CreditCardIcon,
  TruckIcon,
  ShoppingCartIcon,
  StarIcon,
} from "@heroicons/react/24/outline";
import { Line, Bar, Doughnut, Radar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale,
} from "chart.js";
import { getAllUsers, getAllOrders, getAllItems } from "../services/api";
import toast from "react-hot-toast";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale
);

const Dashboard = () => {
  const [timeRange, setTimeRange] = useState("week");
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    totalListings: 0,
    swapPoints: 50,
  });
  const [editingPoints, setEditingPoints] = useState(false);
  const [newPointValue, setNewPointValue] = useState(50);

  // Add state for real-time data
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentListings, setRecentListings] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);

  // Fetch dashboard data
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);

      // Check authentication before making API calls
      const token = localStorage.getItem("accessToken");
      const user = localStorage.getItem("user");

      console.log("Dashboard - Auth check:", {
        hasToken: !!token,
        hasUser: !!user,
        token: token ? `${token.substring(0, 20)}...` : null,
        userRole: user ? JSON.parse(user).role : null,
      });

      if (!token) {
        toast.error("No authentication token found. Please login.");
        return;
      }

      // Check if user is admin
      if (user) {
        const userData = JSON.parse(user);
        if (userData.role !== "admin") {
          toast.error("Admin access required for dashboard.");
          return;
        }
      }

      // Fetch data from APIs with consistent response parsing
      const [usersResponse, ordersResponse, listingsResponse] =
        await Promise.all([
          getAllUsers().catch(() => ({
            data: { data: { users: [], pagination: {} } },
          })),
          getAllOrders().catch(() => ({
            data: { data: { orders: [], pagination: {} } },
          })),
          getAllItems().catch(() => ({
            data: { data: { items: [], pagination: {} } },
          })),
        ]);

      // Parse responses according to the updated API structure (data.data)
      const usersData = usersResponse.data?.data || {};
      const ordersData = ordersResponse.data?.data || {};
      const listingsData = listingsResponse.data?.data || {};

      console.log("Dashboard API Responses:", {
        usersResponse: usersResponse.data,
        ordersResponse: ordersResponse.data,
        listingsResponse: listingsResponse.data,
        usersData,
        ordersData,
        listingsData,
      });

      // Store the actual data arrays for real-time display
      const users = usersData.users || [];
      const orders = ordersData.orders || [];
      const listings = listingsData.items || [];

      // Update stats
      setStats({
        totalUsers: usersData.pagination?.totalUsers || users.length || 0,
        totalOrders: ordersData.pagination?.totalOrders || orders.length || 0,
        totalListings:
          listingsData.pagination?.totalItems || listings.length || 0,
        swapPoints: localStorage.getItem("swapPoints")
          ? parseInt(localStorage.getItem("swapPoints"))
          : 50,
      });

      // Update real-time data (get recent 5 items)
      setRecentUsers(users.slice(0, 5));
      setRecentListings(listings.slice(0, 5));
      setRecentOrders(orders.slice(0, 5));

      console.log("Dashboard Data:", {
        users: usersData,
        orders: ordersData,
        listings: listingsData,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);

      if (error.response?.status === 401) {
        toast.error("Authentication required. Please login again.");
      } else if (error.response?.status === 403) {
        toast.error("Access denied. Admin privileges required.");
      } else {
        toast.error("Failed to load dashboard data");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePointsUpdate = () => {
    if (newPointValue < 1) {
      toast.error("Points must be at least 1");
      return;
    }
    setStats((prev) => ({ ...prev, swapPoints: newPointValue }));
    localStorage.setItem("swapPoints", newPointValue.toString());
    setEditingPoints(false);
    toast.success("Swap points updated successfully");
  };

  // Enhanced stats data with ReWear metrics
  const dashboardStats = [
    {
      name: "Total Users",
      value: stats.totalUsers.toLocaleString(),
      change: "+12.1%",
      trend: "up",
      icon: UsersIcon,
      color: "blue",
      details: "registered members",
    },
    {
      name: "Total Orders",
      value: stats.totalOrders.toLocaleString(),
      change: "+8.7%",
      trend: "up",
      icon: ShoppingCartIcon,
      color: "emerald",
      details: "swaps & redemptions",
    },
    {
      name: "Listed Items",
      value: stats.totalListings.toLocaleString(),
      change: "+15.3%",
      trend: "up",
      icon: ShoppingBagIcon,
      color: "purple",
      details: "clothing items",
    },
    {
      name: "Swap Points",
      value: stats.swapPoints.toString(),
      change: editingPoints ? "editing" : "configurable",
      trend: "up",
      icon: StarIcon,
      color: "amber",
      details: "points per swap",
    },
  ];

  // Swap activity data for chart
  const swapData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        label: "Item Swaps",
        data: [12, 19, 8, 15, 25, 22, 18],
        borderColor: "#4F46E5",
        backgroundColor: "rgba(79, 70, 229, 0.1)",
        fill: true,
        tension: 0.4,
      },
      {
        label: "Point Redemptions",
        data: [8, 12, 6, 10, 18, 15, 12],
        borderColor: "#9333EA",
        backgroundColor: "rgba(147, 51, 234, 0.1)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  // Category distribution of listed items
  const categoryData = {
    labels: [
      "Tops & Shirts",
      "Pants & Jeans",
      "Dresses",
      "Outerwear",
      "Shoes",
      "Accessories",
      "Others",
    ],
    datasets: [
      {
        data: [35, 25, 20, 15, 12, 8, 5],
        backgroundColor: [
          "#4F46E5",
          "#9333EA",
          "#06B6D4",
          "#10B981",
          "#F59E0B",
          "#EF4444",
          "#6B7280",
        ],
      },
    ],
  };

  // Size distribution data
  const sizeData = {
    labels: ["XS", "S", "M", "L", "XL", "XXL"],
    datasets: [
      {
        label: "Size Distribution",
        data: [15, 35, 45, 40, 25, 10],
        backgroundColor: [
          "rgba(79, 70, 229, 0.7)",
          "rgba(147, 51, 234, 0.7)",
          "rgba(6, 182, 212, 0.7)",
          "rgba(16, 185, 129, 0.7)",
          "rgba(245, 158, 11, 0.7)",
          "rgba(239, 68, 68, 0.7)",
        ],
      },
    ],
  };

  // Create dynamic recent activity from actual data
  const recentSwaps = recentOrders.map((order, index) => ({
    id: order._id || index,
    from: order.requester?.username || "Unknown User",
    to: order.responder?.username || "System",
    fromItem: order.itemOffered?.title || order.item?.title || "Item",
    toItem: order.itemRequested?.title || "Points/Credits",
    status: order.status || "pending",
    date: order.createdAt ? new Date(order.createdAt).toLocaleString() : "N/A",
    type: order.orderType === "swap" ? "Item Swap" : "Point Redemption",
  }));

  // Create dynamic top listings from actual data
  const topListings = recentListings.map((item, index) => ({
    id: item._id || index,
    name: item.title || "Untitled Item",
    category: item.category || "Unknown",
    views: Math.floor(Math.random() * 300) + 50, // Random views for demo
    swaps: Math.floor(Math.random() * 10), // Random swaps for demo
    condition: item.condition || "Good",
    size: item.size || "N/A",
    uploader: item.listedBy?.username || "Unknown User",
    status: item.status || "available",
    approved: item.approved || false,
  }));

  // User activity metrics
  const userMetrics = {
    labels: [
      "Active Users",
      "Swap Activity",
      "Listings",
      "Points Earned",
      "Engagement",
    ],
    datasets: [
      {
        label: "Current Week",
        data: [85, 75, 90, 80, 85],
        borderColor: "#4F46E5",
        backgroundColor: "rgba(79, 70, 229, 0.2)",
        fill: true,
      },
    ],
  };

  return (
    <div className="space-y-6 ">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            ReWear Admin Dashboard
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <p className="text-gray-500 dark:text-gray-400">
              Manage your clothing exchange platform
            </p>
            <span className="px-2 py-1 text-xs font-medium text-green-600 bg-green-100 rounded-full dark:bg-green-900/30 dark:text-green-400">
              Live Updates
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="appearance-none rounded-lg border-gray-300 pl-3 pr-10 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="day">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
            <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>
          <button className="p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors">
            <ChartBarIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardStats.map((stat) => (
          <div
            key={stat.name}
            className="relative overflow-hidden rounded-xl bg-white p-6 shadow-sm hover:shadow-md transition-all dark:bg-gray-800 border border-gray-100 dark:border-gray-700 group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent dark:from-gray-800 to-transparent dark:to-gray-800 opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative">
              <div className="flex items-center justify-between">
                <div
                  className={`rounded-lg bg-${stat.color}-100 p-3 dark:bg-${stat.color}-900/20`}
                >
                  <stat.icon
                    className={`h-6 w-6 text-${stat.color}-600 dark:text-${stat.color}-400`}
                  />
                </div>
                {stat.name === "Swap Points" && (
                  <button
                    onClick={() => {
                      setEditingPoints(true);
                      setNewPointValue(stats.swapPoints);
                    }}
                    className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                  >
                    <EllipsisVerticalIcon className="h-6 w-6" />
                  </button>
                )}
              </div>

              <div className="mt-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {stat.name}
                </p>
                <div className="mt-2 flex items-baseline justify-between">
                  {stat.name === "Swap Points" && editingPoints ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={newPointValue}
                        onChange={(e) =>
                          setNewPointValue(parseInt(e.target.value) || 0)
                        }
                        className="w-20 px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        min="1"
                      />
                      <button
                        onClick={handlePointsUpdate}
                        className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingPoints(false)}
                        className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {stat.value}
                    </p>
                  )}
                  {!editingPoints && (
                    <span
                      className={`flex items-center text-sm ${
                        stat.trend === "up"
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {stat.trend === "up" ? (
                        <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                      ) : (
                        <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
                      )}
                      {stat.change}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {stat.details}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Enhanced Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Swap Activity Trend */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Swap Activity
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Daily swap and redemption activity
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-indigo-600" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Item Swaps
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-purple-600" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Point Redemptions
                </span>
              </div>
            </div>
          </div>
          <div className="h-[300px]">
            <Line
              data={swapData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                  tooltip: {
                    mode: "index",
                    intersect: false,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: {
                      color: "rgba(0, 0, 0, 0.05)",
                    },
                    beginAtZero: true,
                    ticks: {
                      callback: (value) => `${value}`,
                    },
                  },
                  x: {
                    grid: {
                      display: false,
                    },
                  },
                },
                interaction: {
                  mode: "nearest",
                  axis: "x",
                  intersect: false,
                },
              }}
            />
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white rounded-xl shadow-sm p-6 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Item Categories
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Distribution of listed items
              </p>
            </div>
            <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <ChartPieIcon className="h-6 w-6" />
            </button>
          </div>
          <div className="h-[300px] flex items-center justify-center">
            <Doughnut
              data={categoryData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "bottom",
                    labels: {
                      usePointStyle: true,
                      padding: 20,
                    },
                  },
                },
                cutout: "75%",
              }}
            />
          </div>
        </div>
      </div>

      {/* Size Distribution & User Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Size Distribution */}
        <div className="bg-white rounded-xl shadow-sm p-6 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Size Distribution
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Available clothing sizes
              </p>
            </div>
          </div>
          <div className="h-[300px]">
            <Bar
              data={sizeData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: {
                      color: "rgba(0, 0, 0, 0.05)",
                    },
                  },
                  x: {
                    grid: {
                      display: false,
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* User Activity Metrics */}
        <div className="bg-white rounded-xl shadow-sm p-6 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                User Activity
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Platform engagement metrics
              </p>
            </div>
          </div>
          <div className="h-[300px]">
            <Radar
              data={userMetrics}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  r: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                      stepSize: 20,
                    },
                  },
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* Recent Swaps & Top Listings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enhanced Recent Swaps */}
        <div className="bg-white rounded-xl shadow-sm dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Recent Swaps
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Latest swap activity
                </p>
              </div>
              <button className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                View All
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                    From
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {recentSwaps && recentSwaps.length > 0 ? (
                  recentSwaps.map((swap) => (
                    <tr
                      key={swap.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {swap.from}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {swap.fromItem}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {swap.to}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {swap.toItem}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            swap.type === "Item Swap"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                              : "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
                          }`}
                        >
                          {swap.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            swap.status === "completed"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : swap.status === "confirmed" ||
                                swap.status === "pending"
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                              : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                          }`}
                        >
                          {swap.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center">
                      <div className="text-gray-500 dark:text-gray-400">
                        <ShoppingCartIcon className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                        <p>No recent swaps found</p>
                        <p className="text-sm">
                          Swaps and orders will appear here
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Enhanced Top Listings */}
        <div className="bg-white rounded-xl shadow-sm dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Popular Listings
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Most viewed items this week
                </p>
              </div>
              <button className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                View All
              </button>
            </div>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {topListings && topListings.length > 0 ? (
              topListings.map((listing) => (
                <div
                  key={listing.id}
                  className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {listing.name}
                        </p>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {listing.views} views
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {listing.category} • Size {listing.size}
                        </p>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            listing.condition === "Excellent"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : listing.condition === "Good"
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                              : "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
                          }`}
                        >
                          {listing.condition}
                        </span>
                        {listing.approved && (
                          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            Approved
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          By {listing.uploader}
                        </span>
                        <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                          {listing.swaps} swaps
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center">
                <ShoppingBagIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 mb-1">
                  No listings found
                </p>
                <p className="text-sm text-gray-400">
                  Popular items will appear here
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Users Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Users
            </h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {stats.totalUsers} total users
            </span>
          </div>
          <div className="space-y-4">
            {recentUsers.length > 0 ? (
              recentUsers.map((user) => (
                <div
                  key={user._id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {user.username?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {user.username}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          user.role === "admin"
                            ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                        }`}
                      >
                        {user.role}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      <div>Points: {user.points || 0}</div>
                      <div>Items: {user.listedItems?.length || 0}</div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">
                  No recent users found
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
