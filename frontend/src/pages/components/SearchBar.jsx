import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function SearchBar() {
  const [searchValue, setSearchValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSearchChange = (e) => {
    setSearchValue(e.target.value);
  };

  const handleSearch = () => {
    if (searchValue.trim()) {
      console.log('Searching for:', searchValue);
      // Here you would implement actual search functionality
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <motion.div 
      className="max-w-3xl mx-auto px-6 my-6"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <motion.div 
        className="relative"
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
      >
        <motion.input
          type="text"
          value={searchValue}
          onChange={handleSearchChange}
          onKeyPress={handleKeyPress}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Search for clothing items, brands, or categories..."
          className={`w-full border rounded-full py-3 px-5 pr-14 shadow-sm transition-all duration-300 ${
            isFocused 
              ? 'focus:outline-none focus:ring-2 focus:ring-black focus:border-black shadow-lg' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          whileFocus={{ 
            scale: 1.01,
            transition: { duration: 0.2 }
          }}
        />
        
        <motion.button 
          onClick={handleSearch}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-black hover:text-gray-600 transition-colors duration-200"
          whileHover={{ 
            scale: 1.2,
            rotate: 5,
            transition: { duration: 0.2 }
          }}
          whileTap={{ 
            scale: 0.9,
            transition: { duration: 0.1 }
          }}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <motion.span
            className="text-xl"
            animate={{ 
              rotate: isFocused ? [0, -10, 10, 0] : 0 
            }}
            transition={{ 
              duration: 0.5,
              ease: "easeInOut"
            }}
          >
            🔍
          </motion.span>
        </motion.button>

        {/* Search suggestions or results indicator */}
        {searchValue && (
          <motion.div
            className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <div className="p-3 text-sm text-gray-600">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                Press Enter to search for "{searchValue}"
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Animated border glow effect */}
        {isFocused && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-blue-400 opacity-50"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.3 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </motion.div>

      {/* Search stats or popular searches */}
      <motion.div
        className="flex justify-center mt-4 space-x-4 text-xs text-gray-500"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <motion.span
          className="hover:text-black cursor-pointer transition-colors duration-200"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Popular: Denim Jackets
        </motion.span>
        <span className="text-gray-300">•</span>
        <motion.span
          className="hover:text-black cursor-pointer transition-colors duration-200"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Trending: Vintage Clothes
        </motion.span>
        <span className="text-gray-300">•</span>
        <motion.span
          className="hover:text-black cursor-pointer transition-colors duration-200"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          New: Designer Items
        </motion.span>
      </motion.div>
    </motion.div>
  );
}
