import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import {
  getAllItems as getProducts,
  deleteItem as deleteProduct,
  approveItem,
  rejectItem,
} from "../services/api";
import Modal from "../components/Modal";
import {
  EyeIcon,
  TrashIcon,
  CalendarIcon,
  UserIcon,
  TagIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

const ManageListing = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [viewItem, setViewItem] = useState(null);

  const fetchItems = useCallback(async () => {
    try {
      const response = await getProducts({ page, search: keyword });
      const result = response.data?.data; // Access the nested data object
      console.log("Fetched items:", result); // Debug log
      setItems(result?.items || []);
      setPages(result?.pagination?.totalPages || 1);
    } catch (error) {
      toast.error("Failed to fetch listings");
    } finally {
      setLoading(false);
    }
  }, [page, keyword]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this listing?")) {
      try {
        await deleteProduct(id);
        toast.success("Listing deleted successfully");
        fetchItems();
      } catch (error) {
        toast.error("Failed to delete listing");
      }
    }
  };

  const handleApprove = async (id) => {
    if (window.confirm("Are you sure you want to approve this listing?")) {
      try {
        await approveItem(id);
        toast.success("Listing approved successfully");
        fetchItems();
      } catch (error) {
        toast.error("Failed to approve listing");
      }
    }
  };

  const handleReject = async (id) => {
    if (window.confirm("Are you sure you want to reject this listing?")) {
      try {
        await rejectItem(id);
        toast.success("Listing rejected successfully");
        fetchItems();
      } catch (error) {
        toast.error("Failed to reject listing");
      }
    }
  };

  const handleSearch = (e) => {
    setKeyword(e.target.value);
    setPage(1);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-0">
          Manage Listings
        </h1>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {items.length} total listings
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search by title, category, or uploader..."
            value={keyword}
            onChange={handleSearch}
            className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
          />
          <TagIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <div
            key={item._id}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            {/* Image Section */}
            <div className="relative h-48 bg-gray-100 dark:bg-gray-700">
              {item.images?.length > 0 ? (
                <div className="flex h-full">
                  <img
                    src={item.images[0]}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  {item.images.length > 1 && (
                    <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full">
                      +{item.images.length - 1}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <div className="text-center">
                    <TagIcon className="h-12 w-12 mx-auto mb-2" />
                    <span className="text-sm">No Images</span>
                  </div>
                </div>
              )}

              {/* Status Badge */}
              <div className="absolute top-2 left-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    item.status === "available"
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                      : item.status === "pending"
                      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                      : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                  }`}
                >
                  {item.status}
                </span>
              </div>

              {/* Approval Badge */}
              <div className="absolute bottom-2 right-2">
                {item.approved ? (
                  <CheckCircleIcon className="h-6 w-6 text-green-500 bg-white rounded-full p-1" />
                ) : (
                  <XCircleIcon className="h-6 w-6 text-red-500 bg-white rounded-full p-1" />
                )}
              </div>
            </div>

            {/* Content Section */}
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 line-clamp-2">
                {item.title}
              </h3>

              <div className="space-y-3 mb-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400 font-medium">
                      Category:
                    </span>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {item.category}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400 font-medium">
                      SubCategory:
                    </span>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {item.subCategory}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400 font-medium">
                      Size:
                    </span>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {item.size}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400 font-medium">
                      Condition:
                    </span>
                    <p className="text-gray-900 dark:text-white mt-1">
                      {item.condition}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-500 dark:text-gray-400">
                    Listed by:
                  </span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {item.listedBy?.username || "N/A"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-500 dark:text-gray-400">
                    Created:
                  </span>
                  <span className="text-gray-900 dark:text-white">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <ClockIcon className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-500 dark:text-gray-400">
                    Approval:
                  </span>
                  <span
                    className={`font-medium ${
                      item.approved
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {item.approved ? "Approved" : "Pending"}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setViewItem(item)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                >
                  <EyeIcon className="h-4 w-4" />
                  View
                </button>
                
                {!item.approved ? (
                  <button
                    onClick={() => handleApprove(item._id)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                  >
                    <CheckCircleIcon className="h-4 w-4" />
                    Approve
                  </button>
                ) : (
                  <button
                    onClick={() => handleReject(item._id)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400 dark:hover:bg-orange-900/30 rounded-lg transition-colors"
                  >
                    <XCircleIcon className="h-4 w-4" />
                    Reject
                  </button>
                )}
                
                <button
                  onClick={() => handleDelete(item._id)}
                  className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                >
                  <TrashIcon className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {items.length === 0 && !loading && (
        <div className="text-center py-12">
          <TagIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No listings found
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {keyword
              ? "Try adjusting your search terms"
              : "Start by adding your first listing"}
          </p>
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={!!viewItem}
        onClose={() => setViewItem(null)}
        maxWidth="max-w-4xl"
      >
        {viewItem && (
          <div className="text-white">
            {/* Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">
                {viewItem.title}
              </h2>
              <div className="flex items-center gap-4 text-sm text-gray-300">
                <div className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4" />
                  <span>Listed by: {viewItem.listedBy?.username || "N/A"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  <span>
                    {new Date(viewItem.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {viewItem.approved ? (
                    <CheckCircleIcon className="h-4 w-4 text-green-400" />
                  ) : (
                    <XCircleIcon className="h-4 w-4 text-red-400" />
                  )}
                  <span
                    className={
                      viewItem.approved ? "text-green-400" : "text-red-400"
                    }
                  >
                    {viewItem.approved ? "Approved" : "Pending Approval"}
                  </span>
                </div>
              </div>
            </div>

            {/* Images */}
            {viewItem.images && viewItem.images.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Images</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {viewItem.images.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={image}
                        alt={`${viewItem.title} - Image ${index + 1}`}
                        className="w-full h-64 object-cover rounded-lg border border-gray-600"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  Basic Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-gray-400 font-medium">Category:</span>
                    <p className="text-white mt-1">{viewItem.category}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 font-medium">
                      SubCategory:
                    </span>
                    <p className="text-white mt-1">{viewItem.subCategory}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 font-medium">Size:</span>
                    <p className="text-white mt-1">{viewItem.size}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 font-medium">
                      Condition:
                    </span>
                    <p className="text-white mt-1">{viewItem.condition}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 font-medium">Status:</span>
                    <span
                      className={`ml-2 px-3 py-1 rounded-full text-xs font-semibold ${
                        viewItem.status === "available"
                          ? "bg-green-100 text-green-800"
                          : viewItem.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {viewItem.status}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">
                  Additional Details
                </h3>
                <div className="space-y-3">
                  {viewItem.brand && (
                    <div>
                      <span className="text-gray-400 font-medium">Brand:</span>
                      <p className="text-white mt-1">{viewItem.brand}</p>
                    </div>
                  )}
                  {viewItem.color && (
                    <div>
                      <span className="text-gray-400 font-medium">Color:</span>
                      <p className="text-white mt-1">{viewItem.color}</p>
                    </div>
                  )}
                  {viewItem.material && (
                    <div>
                      <span className="text-gray-400 font-medium">
                        Material:
                      </span>
                      <p className="text-white mt-1">{viewItem.material}</p>
                    </div>
                  )}
                  {viewItem.pointsCost && (
                    <div>
                      <span className="text-gray-400 font-medium">
                        Points Cost:
                      </span>
                      <p className="text-white mt-1">
                        {viewItem.pointsCost} points
                      </p>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-400 font-medium">Created:</span>
                    <p className="text-white mt-1">
                      {new Date(viewItem.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {viewItem.updatedAt !== viewItem.createdAt && (
                    <div>
                      <span className="text-gray-400 font-medium">
                        Last Updated:
                      </span>
                      <p className="text-white mt-1">
                        {new Date(viewItem.updatedAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            {viewItem.description && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Description</h3>
                <p className="text-gray-300 leading-relaxed">
                  {viewItem.description}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-700">
              <button
                onClick={() => setViewItem(null)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleDelete(viewItem._id);
                  setViewItem(null);
                }}
                className="px-4 py-2 text-sm font-medium text-red-400 hover:text-red-300 bg-red-900/20 hover:bg-red-900/30 rounded-lg transition-colors flex items-center gap-2"
              >
                <TrashIcon className="h-4 w-4" />
                Delete Listing
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Pagination */}
      {pages > 1 && (
        <div className="mt-8 flex justify-center">
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
            {[...Array(pages)].map((_, index) => (
              <button
                key={index + 1}
                onClick={() => setPage(index + 1)}
                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-colors ${
                  page === index + 1
                    ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-600 dark:bg-indigo-900/20 dark:border-indigo-500 dark:text-indigo-400"
                    : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
                } ${index === 0 ? "rounded-l-md" : ""} ${
                  index === pages - 1 ? "rounded-r-md" : ""
                }`}
              >
                {index + 1}
              </button>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
};

export default ManageListing;
