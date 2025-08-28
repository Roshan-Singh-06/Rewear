import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ImageSlider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const slides = useMemo(() => [
    {
      image: "/clothing-swap-elements-clothes-shoes-600nw-2446133019.webp",
      title: "Sustainable Fashion Revolution",
      description: "Join thousands of fashion lovers who are making a difference by swapping clothes instead of buying new ones. Reduce waste, save money, and discover unique pieces."
    },
    {
      image: "/swap2.webp",
      title: "Easy Clothing Exchange",
      description: "Our platform makes it simple to swap your unused clothes with others. Upload photos, browse collections, and arrange swaps with people in your area."
    },
    {
      image: "https://images.unsplash.com/photo-1516762689617-e1cffcef479d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2011&q=80",
      title: "Community of Style Lovers",
      description: "Connect with like-minded individuals who share your passion for fashion and sustainability. Build your network while refreshing your wardrobe."
    },
    {
        image: "/swap3.jpg",
      title: "Quality & Trust Guaranteed",
      description: "Every item goes through our quality verification process. Trade with confidence knowing all clothes meet our cleanliness and condition standards."
    }
  ], []);

  // Typewriter effect
  useEffect(() => {
    const currentText = slides[currentSlide].description;
    
    if (!isDeleting && displayText === currentText) {
      // Very short pause (300ms) before changing to next slide
      const changeSlideTimeout = setTimeout(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
        setDisplayText('');
        setIsDeleting(false);
      }, 300);
      
      return () => clearTimeout(changeSlideTimeout);
    }

    const timeout = setTimeout(() => {
      if (isDeleting) {
        setDisplayText(currentText.substring(0, displayText.length - 1));
      } else {
        setDisplayText(currentText.substring(0, displayText.length + 1));
      }
    }, isDeleting ? 50 : 80);

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, currentSlide, slides]);

  // Fallback auto slide change (in case typewriter gets stuck)
  useEffect(() => {
    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
      setDisplayText('');
      setIsDeleting(false);
    }, 12000); // Longer fallback interval

    return () => clearInterval(slideInterval);
  }, [slides.length]);

  return (
    <motion.section 
      className="px-6 py-12 bg-gray-50"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
    >
      <motion.div 
        className="max-w-7xl mx-auto"
        initial={{ y: 50, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        viewport={{ once: true }}
      >
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Image */}
          <motion.div 
            className="relative overflow-hidden rounded-2xl shadow-2xl"
            whileHover={{ scale: 1.02, rotate: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="aspect-[4/3] relative">
              <img
                src={slides[currentSlide].image}
                alt={slides[currentSlide].title}
                className="w-full h-full object-cover transition-all duration-500 ease-in-out"
              />
              {/* Overlay gradient */}
              <motion.div 
                className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              ></motion.div>
            </div>
            
            {/* Slide indicators */}
            <motion.div 
              className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.4 }}
            >
              {slides.map((_, index) => (
                <motion.button
                  key={index}
                  onClick={() => {
                    setCurrentSlide(index);
                    setDisplayText('');
                    setIsDeleting(false);
                  }}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentSlide 
                      ? 'bg-white scale-110' 
                      : 'bg-white/50 hover:bg-white/75'
                  }`}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1 * index + 0.6, duration: 0.3 }}
                />
              ))}
            </motion.div>
          </motion.div>

          {/* Right side - Content */}
          <motion.div 
            className="space-y-6"
            initial={{ x: 50, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <div>
              <AnimatePresence mode="wait">
                <motion.h2 
                  key={currentSlide}
                  className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4"
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -30, opacity: 0 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                >
                  {slides[currentSlide].title}
                </motion.h2>
              </AnimatePresence>
              
              {/* Typewriter effect description */}
              <div className="text-lg text-gray-600 leading-relaxed min-h-[120px] flex items-start">
                <motion.p 
                  className="relative"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.3 }}
                >
                  {displayText}
                  <motion.span 
                    className="text-black"
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    |
                  </motion.span>
                </motion.p>
              </div>
            </div>

            {/* Call to action buttons */}
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 pt-4"
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <motion.button 
                className="bg-black text-white px-8 py-3 rounded-lg hover:bg-gray-800 transition-colors duration-300 font-medium"
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)"
                }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                Start Swapping Now
              </motion.button>
              <motion.button 
                className="border-2 border-gray-300 text-gray-700 px-8 py-3 rounded-lg hover:border-black hover:text-black transition-colors duration-300 font-medium"
                whileHover={{ 
                  scale: 1.05,
                  borderColor: "#000000",
                  color: "#000000"
                }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                Learn More
              </motion.button>
            </motion.div>

            {/* Statistics */}
            <motion.div 
              className="grid grid-cols-3 gap-6 pt-8 border-t border-gray-200"
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              viewport={{ once: true }}
            >
              {[
                { number: "10K+", label: "Active Users" },
                { number: "50K+", label: "Items Swapped" },
                { number: "95%", label: "Satisfaction Rate" }
              ].map((stat, index) => (
                <motion.div 
                  key={stat.label}
                  className="text-center"
                  initial={{ scale: 0, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  transition={{ 
                    delay: 0.8 + index * 0.1,
                    duration: 0.4,
                    type: "spring",
                    stiffness: 100
                  }}
                  whileHover={{ 
                    scale: 1.1,
                    y: -5
                  }}
                  viewport={{ once: true }}
                >
                  <motion.div 
                    className="text-2xl font-bold text-black"
                    initial={{ y: 20 }}
                    whileInView={{ y: 0 }}
                    transition={{ delay: 1 + index * 0.1, duration: 0.3 }}
                    viewport={{ once: true }}
                  >
                    {stat.number}
                  </motion.div>
                  <motion.div 
                    className="text-sm text-gray-600"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ delay: 1.2 + index * 0.1, duration: 0.3 }}
                    viewport={{ once: true }}
                  >
                    {stat.label}
                  </motion.div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </motion.section>
  );
};

export default ImageSlider;
