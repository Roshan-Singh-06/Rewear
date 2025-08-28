import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin } from 'lucide-react';

export default function Hero() {
  const navigate = useNavigate();
  const [searchCity, setSearchCity] = useState('');

  const handleBrowseItems = () => {
    navigate('/browse');
  };

  const handleSearchByLocation = () => {
    if (searchCity.trim()) {
      // Use the comprehensive location search instead of just city
      navigate(`/browse?location=${encodeURIComponent(searchCity.trim())}`);
    } else {
      navigate('/browse');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearchByLocation();
    }
  };
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { 
      y: 30, 
      opacity: 0 
    },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  const iconVariants = {
    hidden: { 
      scale: 0,
      rotate: -180,
      opacity: 0
    },
    visible: {
      scale: 1,
      rotate: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        type: "spring",
        stiffness: 100,
        delay: 0.8
      }
    }
  };

  return (
    <motion.section 
      className="px-4 sm:px-6 py-16 sm:py-20 bg-gray-50 mt-16"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
    >
      <motion.div 
        className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-10"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <motion.div 
          className="max-w-xl w-full lg:w-auto"
          variants={itemVariants}
        >
          <motion.h1 
            className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-center lg:text-left"
            initial={{ x: -50, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            Swap, Share, Sustain Your Style
          </motion.h1>
          <motion.p 
            className="text-gray-600 mb-6 text-center lg:text-left"
            initial={{ x: -30, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
          >
            Join the sustainable fashion revolution. Exchange your unused clothing through direct swaps or our point-based system.
          </motion.p>

          {/* Location Search */}
          <motion.div 
            className="mb-6"
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            viewport={{ once: true }}
          >
            <div className="relative">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Enter your city name (e.g., Mumbai, Delhi, Boisar)"
                    value={searchCity}
                    onChange={(e) => setSearchCity(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none text-sm sm:text-base"
                  />
                </div>
                <motion.button
                  onClick={handleSearchByLocation}
                  className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 flex items-center justify-center gap-2 whitespace-nowrap"
                  whileHover={{ 
                    scale: 1.05,
                    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)"
                  }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <Search className="h-4 w-4" />
                  Search Items
                </motion.button>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            viewport={{ once: true }}
          >
            <motion.button 
              className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 text-sm sm:text-base"
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)"
              }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              Start Swapping
            </motion.button>
            <motion.button 
              className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 text-sm sm:text-base"
              onClick={handleBrowseItems}
              whileHover={{ 
                scale: 1.05,
                backgroundColor: "#D1D5DB"
              }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              Browse All Items
            </motion.button>
          </motion.div>
        </motion.div>
        
        <motion.div 
          className="flex space-x-4 mt-8 lg:mt-0"
          variants={itemVariants}
        >
          {[
            { icon: "👗", bg: "bg-gray-600", delay: 0 },
            { icon: "♻️", bg: "bg-gray-700", delay: 0.1 },
            { icon: "👕", bg: "bg-black", delay: 0.2 }
          ].map((item, index) => (
            <motion.div 
              key={index}
              className={`w-16 h-16 sm:w-20 sm:h-20 ${item.bg} rounded-full flex items-center justify-center text-white text-lg sm:text-xl`}
              variants={iconVariants}
              custom={index}
              whileHover={{ 
                scale: 1.1,
                rotate: 10,
                y: -5
              }}
              whileTap={{ scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              <motion.span
                animate={{ 
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  delay: index * 0.5
                }}
              >
                {item.icon}
              </motion.span>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </motion.section>
  );
}