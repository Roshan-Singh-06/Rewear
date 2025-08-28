import React from 'react';
import { motion } from 'framer-motion';
import Navbar from './components/Navbar';

export default function About() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { 
      y: 50, 
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

  const cardVariants = {
    hidden: { 
      scale: 0.8,
      opacity: 0,
      y: 60
    },
    visible: {
      scale: 1,
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        type: "spring",
        stiffness: 100
      }
    }
  };

  const iconVariants = {
    hidden: { 
      scale: 0,
      rotate: -180
    },
    visible: {
      scale: 1,
      rotate: 0,
      transition: {
        duration: 0.5,
        type: "spring",
        stiffness: 120
      }
    }
  };

  const teamMembers = [
    {
      name: "Sarah Johnson",
      role: "Founder & CEO",
      image: "👩‍💼",
      description: "Passionate about sustainable fashion and environmental impact."
    },
    {
      name: "Michael Chen",
      role: "CTO",
      image: "👨‍💻",
      description: "Building technology solutions for a more sustainable future."
    },
    {
      name: "Emma Rodriguez",
      role: "Community Manager",
      image: "👩‍🎨",
      description: "Connecting fashion enthusiasts and building our swap community."
    },
    {
      name: "David Kim",
      role: "Sustainability Officer",
      image: "🌱",
      description: "Ensuring our platform maximizes environmental benefits."
    }
  ];

  const values = [
    {
      icon: "🌍",
      title: "Environmental Impact",
      description: "Reducing textile waste and promoting circular fashion economy through clothing swaps."
    },
    {
      icon: "🤝",
      title: "Community First",
      description: "Building a trusted community where fashion lovers can connect and share sustainably."
    },
    {
      icon: "💡",
      title: "Innovation",
      description: "Using technology to make sustainable fashion accessible and convenient for everyone."
    },
    {
      icon: "✨",
      title: "Quality",
      description: "Ensuring every swap maintains high standards for clothing condition and authenticity."
    }
  ];

  const stats = [
    { number: "50K+", label: "Items Swapped", icon: "👗" },
    { number: "25K+", label: "Happy Users", icon: "😊" },
    { number: "2M+", label: "CO2 Saved (kg)", icon: "🌿" },
    { number: "15+", label: "Cities", icon: "🏙️" }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section */}
      <motion.section 
        className="px-6 py-20 bg-gradient-to-br from-gray-50 to-gray-100"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <motion.div 
          className="max-w-6xl mx-auto text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.h1 
            className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-gray-800 to-black bg-clip-text text-transparent"
            variants={itemVariants}
          >
            About SwapStyle
          </motion.h1>
          <motion.p 
            className="text-xl text-gray-600 max-w-3xl mx-auto mb-8"
            variants={itemVariants}
          >
            We're revolutionizing fashion consumption by creating a sustainable platform where style meets responsibility. 
            Join our community of conscious fashion enthusiasts making a positive impact on the planet.
          </motion.p>
          <motion.div 
            className="flex justify-center space-x-6"
            variants={itemVariants}
          >
            {["🌱", "👕", "♻️", "🌍"].map((emoji, index) => (
              <motion.div
                key={index}
                className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-2xl shadow-lg"
                variants={iconVariants}
                custom={index}
                whileHover={{ 
                  scale: 1.1, 
                  rotate: 10,
                  y: -5
                }}
                whileTap={{ scale: 0.9 }}
              >
                <motion.span
                  animate={{ 
                    rotate: [0, 5, -5, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    delay: index * 0.5
                  }}
                >
                  {emoji}
                </motion.span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Mission Statement */}
      <motion.section 
        className="px-6 py-16"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2 
            className="text-4xl font-bold mb-8 text-gray-800"
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            Our Mission
          </motion.h2>
          <motion.p 
            className="text-lg text-gray-600 leading-relaxed"
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            To transform the fashion industry by making sustainable clothing exchange accessible, enjoyable, and rewarding. 
            We believe that every piece of clothing deserves a second life, and every fashion lover deserves access to 
            diverse, quality pieces without the environmental guilt. Through our innovative swap platform, we're building 
            a community that values style, sustainability, and social responsibility.
          </motion.p>
        </div>
      </motion.section>

      {/* Statistics */}
      <motion.section 
        className="px-6 py-16 bg-gray-50"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="max-w-6xl mx-auto">
          <motion.h2 
            className="text-4xl font-bold text-center mb-12 text-gray-800"
            initial={{ y: -30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            Our Impact
          </motion.h2>
          <motion.div 
            className="grid md:grid-cols-4 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {stats.map((stat, index) => (
              <motion.div 
                key={index}
                className="text-center bg-white p-8 rounded-2xl shadow-lg"
                variants={cardVariants}
                whileHover={{ 
                  y: -10,
                  scale: 1.02,
                  transition: { duration: 0.3 }
                }}
              >
                <motion.div 
                  className="text-4xl mb-4"
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    delay: index * 0.3
                  }}
                >
                  {stat.icon}
                </motion.div>
                <motion.h3 
                  className="text-3xl font-bold text-gray-800 mb-2"
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  transition={{ 
                    duration: 0.5,
                    delay: 0.2 + index * 0.1,
                    type: "spring",
                    stiffness: 150
                  }}
                  viewport={{ once: true }}
                >
                  {stat.number}
                </motion.h3>
                <p className="text-gray-600">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Our Values */}
      <motion.section 
        className="px-6 py-16"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="max-w-6xl mx-auto">
          <motion.h2 
            className="text-4xl font-bold text-center mb-12 text-gray-800"
            initial={{ y: -30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            Our Values
          </motion.h2>
          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {values.map((value, index) => (
              <motion.div 
                key={index}
                className="text-center p-6 rounded-xl hover:bg-gray-50 transition-colors duration-300"
                variants={cardVariants}
                whileHover={{ 
                  scale: 1.05,
                  transition: { duration: 0.3 }
                }}
              >
                <motion.div 
                  className="text-5xl mb-4"
                  initial={{ scale: 0, rotate: -180 }}
                  whileInView={{ scale: 1, rotate: 0 }}
                  transition={{ 
                    duration: 0.6,
                    delay: index * 0.1,
                    type: "spring",
                    stiffness: 120
                  }}
                  viewport={{ once: true }}
                >
                  {value.icon}
                </motion.div>
                <h3 className="text-xl font-semibold mb-3 text-gray-800">{value.title}</h3>
                <p className="text-gray-600 text-sm">{value.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Team Section */}
      <motion.section 
        className="px-6 py-16 bg-gray-50"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="max-w-6xl mx-auto">
          <motion.h2 
            className="text-4xl font-bold text-center mb-12 text-gray-800"
            initial={{ y: -30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            Meet Our Team
          </motion.h2>
          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {teamMembers.map((member, index) => (
              <motion.div 
                key={index}
                className="text-center bg-white p-8 rounded-2xl shadow-lg"
                variants={cardVariants}
                whileHover={{ 
                  y: -10,
                  scale: 1.02,
                  rotate: index % 2 === 0 ? 1 : -1,
                  transition: { duration: 0.3 }
                }}
              >
                <motion.div 
                  className="text-6xl mb-4"
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  transition={{ 
                    duration: 0.5,
                    delay: index * 0.1,
                    type: "spring",
                    stiffness: 150
                  }}
                  viewport={{ once: true }}
                  whileHover={{ 
                    scale: 1.2,
                    rotate: 10
                  }}
                >
                  {member.image}
                </motion.div>
                <h3 className="text-xl font-semibold mb-2 text-gray-800">{member.name}</h3>
                <p className="text-sm text-gray-500 mb-3 font-medium">{member.role}</p>
                <p className="text-sm text-gray-600">{member.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Call to Action */}
      <motion.section 
        className="px-6 py-20 bg-gradient-to-r from-gray-800 to-black text-white"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <motion.div 
          className="max-w-4xl mx-auto text-center"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <motion.h2 
            className="text-4xl md:text-5xl font-bold mb-6"
            variants={itemVariants}
          >
            Ready to Join the Revolution?
          </motion.h2>
          <motion.p 
            className="text-xl mb-8 text-gray-300"
            variants={itemVariants}
          >
            Start your sustainable fashion journey today. Swap, discover, and make a difference.
          </motion.p>
          <motion.div 
            className="space-x-4"
            variants={itemVariants}
          >
            <motion.button 
              className="bg-white text-black px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0 10px 25px rgba(255, 255, 255, 0.2)"
              }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              Start Swapping
            </motion.button>
            <motion.button 
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-black transition-colors"
              whileHover={{ 
                scale: 1.05,
                backgroundColor: "white",
                color: "black"
              }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              Learn More
            </motion.button>
          </motion.div>
        </motion.div>
      </motion.section>
    </div>
  );
}
