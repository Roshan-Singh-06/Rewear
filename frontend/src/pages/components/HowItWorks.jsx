import React from 'react';
import { motion } from 'framer-motion';

export default function HowItWorks() {
  const steps = [
    {
      id: 1,
      title: "List Your Items",
      description: "Upload photos and details of clothes you want to swap. Set your preferred points value.",
      icon: "📸",
      details: [
        "Take clear photos from multiple angles",
        "Add detailed descriptions and measurements", 
        "Set condition level (New, Like-new, Good, etc.)",
        "Choose category and subcategory"
      ]
    },
    {
      id: 2,
      title: "Browse & Discover",
      description: "Explore items from other users. Filter by your preferences and find perfect matches.",
      icon: "🔍",
      details: [
        "Filter by gender, size, and category",
        "Save items to your favorites",
        "Check item condition and points cost",
        "View seller profiles and ratings"
      ]
    },
    {
      id: 3,
      title: "Request Swap",
      description: "Send a request for the item you love. Chat with owners and negotiate terms.",
      icon: "🤝",
      details: [
        "Send swap request with your offer",
        "Chat with the item owner",
        "Agree on exchange terms",
        "Schedule pickup or delivery"
      ]
    },
    {
      id: 4,
      title: "Complete Exchange",
      description: "Meet or use delivery service. Finalize the swap and rate your experience!",
      icon: "✨",
      details: [
        "Meet at safe public locations",
        "Or use our delivery service",
        "Inspect items before finalizing",
        "Rate and review your experience"
      ]
    },
  ];

  const benefits = [
    {
      icon: "🌍",
      title: "Eco-Friendly",
      description: "Reduce fashion waste by giving clothes a second life"
    },
    {
      icon: "💰",
      title: "Save Money",
      description: "Get new-to-you clothes without spending money"
    },
    {
      icon: "👗",
      title: "Refresh Wardrobe",
      description: "Constantly update your style with fresh pieces"
    },
    {
      icon: "🏆",
      title: "Quality Items",
      description: "All items are reviewed and quality-checked"
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { 
      y: 50, 
      opacity: 0,
      scale: 0.9
    },
    visible: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  const stepCardVariants = {
    hidden: { 
      x: 50, 
      opacity: 0 
    },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    },
    hover: {
      scale: 1.02,
      y: -5,
      transition: {
        duration: 0.3,
        ease: "easeInOut"
      }
    }
  };

  return (
    <section id="how-it-works" className="py-16 bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-800">
      <motion.div 
        className="max-w-6xl mx-auto px-6"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        {/* Header */}
        <motion.div 
          className="text-center mb-16"
          variants={itemVariants}
        >
          <h2 className="text-4xl font-bold mb-4 text-gray-800">
            How It Works
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Join thousands of fashion lovers who are already swapping, saving money, and helping the planet. 
            It's easy, fun, and sustainable!
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative mb-16">
          {/* Vertical Track */}
          <motion.div 
            className="hidden md:block absolute left-1/2 top-0 transform -translate-x-1/2 h-full w-1 bg-gradient-to-b from-gray-600 to-gray-800 rounded-full"
            initial={{ scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            viewport={{ once: true }}
          ></motion.div>

          <div className="space-y-12">
            {steps.map((step, index) => (
              <motion.div
                key={step.id}
                className={`relative md:flex md:items-center ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}
                variants={stepCardVariants}
                initial="hidden"
                whileInView="visible"
                whileHover="hover"
                viewport={{ once: true, amount: 0.3 }}
                custom={index}
              >
                <div className="md:w-1/2">
                  <motion.div 
                    className="bg-gradient-to-br from-gray-900 to-gray-800 p-5 rounded-xl shadow-2xl border border-gray-700 hover:border-gray-600 transition-colors duration-300"
                    whileHover={{ 
                      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
                      borderColor: "#4B5563"
                    }}
                  >
                    <motion.div 
                      className="text-3xl mb-3"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ duration: 0.3 }}
                    >
                      {step.icon}
                    </motion.div>
                    <h3 className="text-xl font-bold mb-2 text-white">{step.title}</h3>
                    <p className="text-gray-300 mb-3 leading-relaxed text-sm">{step.description}</p>
                    
                    {/* Details List */}
                    <ul className="space-y-1">
                      {step.details.map((detail, idx) => (
                        <motion.li 
                          key={idx} 
                          className="flex items-start text-xs text-gray-400"
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 + 0.5, duration: 0.5 }}
                          viewport={{ once: true }}
                        >
                          <span className="text-gray-500 mr-2 mt-0.5">•</span>
                          {detail}
                        </motion.li>
                      ))}
                    </ul>
                  </motion.div>
                </div>

                {/* Connector Dot */}
                <motion.div 
                  className="hidden md:flex justify-center items-center w-10 h-10 bg-gradient-to-r from-gray-700 to-gray-600 text-white font-bold text-sm rounded-full shadow-lg absolute left-1/2 transform -translate-x-1/2 z-10 border-2 border-gray-500"
                  initial={{ scale: 0, rotate: -180 }}
                  whileInView={{ scale: 1, rotate: 0 }}
                  transition={{ 
                    delay: 0.3 + index * 0.2, 
                    duration: 0.6,
                    type: "spring",
                    stiffness: 100
                  }}
                  whileHover={{ 
                    scale: 1.1,
                    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.3)"
                  }}
                  viewport={{ once: true }}
                >
                  {step.id}
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Benefits Section */}
        <motion.div 
          className="mb-16"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          <motion.h3 
            className="text-3xl font-bold text-center mb-12 text-gray-900"
            variants={itemVariants}
          >
            Why Choose ClothSwap?
          </motion.h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <motion.div 
                key={index} 
                className="text-center group"
                variants={itemVariants}
                whileHover={{ scale: 1.05, y: -5 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div 
                  className="text-5xl mb-4"
                  whileHover={{ scale: 1.2, rotate: 10 }}
                  transition={{ duration: 0.3 }}
                >
                  {benefit.icon}
                </motion.div>
                <h4 className="font-bold text-white mb-3 text-lg">{benefit.title}</h4>
                <p className="text-gray-400 leading-relaxed">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Statistics */}
        <motion.div 
          className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-10 shadow-2xl border border-gray-700 mb-16"
          variants={itemVariants}
          initial="hidden"
          whileInView="visible"
          whileHover={{ 
            scale: 1.02,
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
          }}
          viewport={{ once: true }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {[
              { number: "10,000+", label: "Happy Swappers" },
              { number: "50,000+", label: "Items Swapped" },
              { number: "95%", label: "Satisfaction Rate" }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ scale: 0, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                transition={{ 
                  delay: index * 0.2 + 0.3,
                  duration: 0.6,
                  type: "spring",
                  stiffness: 100
                }}
                viewport={{ once: true }}
              >
                <motion.div 
                  className="text-4xl font-bold text-white mb-2"
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.2 }}
                >
                  {stat.number}
                </motion.div>
                <div className="text-gray-400">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Call to Action */}
        <motion.div 
          className="text-center"
          variants={itemVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <motion.h3 
            className="text-3xl font-bold mb-4 text-gray-900"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3 }}
          >
            Ready to Start Swapping?
          </motion.h3>
          <p className="text-gray-400 mb-8 max-w-md mx-auto leading-relaxed">
            Join our community today and discover a new way to refresh your wardrobe sustainably.
          </p>
          <div className="space-x-4">
            <motion.button 
              className="bg-gradient-to-r from-gray-800 to-black text-white px-10 py-4 rounded-xl font-semibold shadow-lg border border-gray-600"
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)",
                background: "linear-gradient(to right, #374151, #111827)"
              }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              Start Swapping Now
            </motion.button>
            <motion.button 
              className="border-2 border-gray-600 text-gray-300 px-10 py-4 rounded-xl font-semibold hover:bg-gray-800 hover:border-gray-500 transition-all duration-300"
              whileHover={{ 
                scale: 1.05,
                backgroundColor: "#1F2937",
                borderColor: "#6B7280"
              }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              Learn More
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
