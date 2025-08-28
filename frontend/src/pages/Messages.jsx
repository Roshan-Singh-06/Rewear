import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion'; // eslint-disable-line
import Navbar from './components/Navbar';

export default function Messages() {
  const [selectedChat, setSelectedChat] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef(null);

  // Sample conversations data
  const [conversations, setConversations] = useState([
    {
      id: 1,
      user: {
        id: "507f1f77bcf86cd799439012",
        username: "sarah_m",
        email: "sarah@example.com",
        avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b47c?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
        isOnline: true,
        lastSeen: new Date()
      },
      product: {
        id: "507f1f77bcf86cd799439011",
        title: "Vintage Denim Jacket",
        image: "https://images.unsplash.com/photo-1544966503-7cc5ac882d5a?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80",
        pointsCost: 150
      },
      type: "swap_request",
      lastMessage: "Hi! I'd love to swap my blue dress for your denim jacket.",
      lastMessageTime: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      unreadCount: 2,
      messages: [
        {
          id: 1,
          senderId: "507f1f77bcf86cd799439012",
          message: "Hi! I saw your denim jacket listing and I'm interested in swapping.",
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
          type: "text"
        },
        {
          id: 2,
          senderId: "507f1f77bcf86cd799439012",
          message: "I'd love to swap my blue dress for your denim jacket. Would you be interested?",
          timestamp: new Date(Date.now() - 25 * 60 * 1000),
          type: "text"
        },
        {
          id: 3,
          senderId: "current_user",
          message: "Hi Sarah! Your blue dress looks great. I'd be interested in the swap.",
          timestamp: new Date(Date.now() - 20 * 60 * 1000),
          type: "text"
        },
        {
          id: 4,
          senderId: "507f1f77bcf86cd799439012",
          message: "Perfect! When would be a good time to meet up for the exchange?",
          timestamp: new Date(Date.now() - 5 * 60 * 1000),
          type: "text"
        }
      ]
    },
    {
      id: 2,
      user: {
        id: "507f1f77bcf86cd799439014",
        username: "emma_l",
        email: "emma@example.com",
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80",
        isOnline: false,
        lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      },
      product: {
        id: "507f1f77bcf86cd799439013",
        title: "Summer Floral Dress",
        image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80",
        pointsCost: 120
      },
      type: "purchase",
      lastMessage: "Thank you for purchasing my dress!",
      lastMessageTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
      unreadCount: 0,
      messages: [
        {
          id: 1,
          senderId: "507f1f77bcf86cd799439014",
          message: "Hi! Thank you so much for purchasing my summer dress with points!",
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          type: "text"
        },
        {
          id: 2,
          senderId: "507f1f77bcf86cd799439014",
          message: "I hope you love it as much as I did. Let me know if you have any questions!",
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          type: "text"
        }
      ]
    }
  ]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedChat?.messages]);

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedChat) return;

    const newMessage = {
      id: Date.now(),
      senderId: "current_user",
      message: messageInput.trim(),
      timestamp: new Date(),
      type: "text"
    };

    // Update conversations
    setConversations(prev => prev.map(conv => {
      if (conv.id === selectedChat.id) {
        const updatedConv = {
          ...conv,
          messages: [...conv.messages, newMessage],
          lastMessage: messageInput.trim(),
          lastMessageTime: new Date()
        };
        setSelectedChat(updatedConv);
        return updatedConv;
      }
      return conv;
    }));

    setMessageInput('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      return diffInMinutes < 1 ? 'Just now' : `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const formatMessageTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const filteredConversations = conversations.filter(conv =>
    conv.user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.product.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-6">
        <motion.div
          className="bg-white rounded-2xl shadow-xl overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex h-[calc(100vh-200px)]">
            {/* Conversations Sidebar */}
            <motion.div 
              className={`w-full md:w-1/3 border-r border-gray-200 flex flex-col ${selectedChat ? 'hidden md:flex' : 'flex'}`}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-900 to-black text-white">
                <h1 className="text-2xl font-bold mb-4">Messages</h1>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-full py-2 px-4 pr-10 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/30"
                  />
                  <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {/* Conversations List */}
              <div className="flex-1 overflow-y-auto">
                <AnimatePresence>
                  {filteredConversations.map((conversation, index) => (
                    <motion.div
                      key={conversation.id}
                      className={`p-4 border-b border-gray-100 cursor-pointer transition-colors duration-200 ${
                        selectedChat?.id === conversation.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedChat(conversation)}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="relative">
                          <img
                            src={conversation.user.avatar}
                            alt={conversation.user.username}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          {conversation.user.isOnline && (
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900 truncate">@{conversation.user.username}</h3>
                            <div className="flex items-center space-x-2">
                              {conversation.unreadCount > 0 && (
                                <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                                  {conversation.unreadCount}
                                </span>
                              )}
                              <span className="text-xs text-gray-500">{formatTime(conversation.lastMessageTime)}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              conversation.type === 'swap_request' 
                                ? 'bg-purple-100 text-purple-700' 
                                : 'bg-green-100 text-green-700'
                            }`}>
                              {conversation.type === 'swap_request' ? 'Swap Request' : 'Purchase'}
                            </span>
                            <span className="text-xs text-gray-500 truncate">
                              {conversation.product.title}
                            </span>
                          </div>
                          
                          <p className="text-sm text-gray-600 truncate mt-1">
                            {conversation.lastMessage}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {filteredConversations.length === 0 && (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations found</h3>
                    <p className="text-gray-500">Start by making a swap request or purchase!</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Chat Area */}
            <motion.div 
              className={`flex-1 flex flex-col ${selectedChat ? 'flex' : 'hidden md:flex'}`}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {selectedChat ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-gray-200 bg-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => setSelectedChat(null)}
                          className="md:hidden p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <div className="relative">
                          <img
                            src={selectedChat.user.avatar}
                            alt={selectedChat.user.username}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          {selectedChat.user.isOnline && (
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                          )}
                        </div>
                        <div>
                          <h2 className="font-semibold text-gray-900">@{selectedChat.user.username}</h2>
                          <p className="text-sm text-gray-500">
                            {selectedChat.user.isOnline ? 'Online' : `Last seen ${formatTime(selectedChat.user.lastSeen)}`}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">{selectedChat.product.title}</p>
                          <p className="text-xs text-gray-500">💎 {selectedChat.product.pointsCost} points</p>
                        </div>
                        <img
                          src={selectedChat.product.image}
                          alt={selectedChat.product.title}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                    <AnimatePresence>
                      {selectedChat.messages.map((message, index) => (
                        <motion.div
                          key={message.id}
                          className={`flex ${message.senderId === 'current_user' ? 'justify-end' : 'justify-start'}`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                              message.senderId === 'current_user'
                                ? 'bg-blue-500 text-white'
                                : 'bg-white text-gray-900 shadow-sm'
                            }`}
                          >
                            <p className="text-sm">{message.message}</p>
                            <p className={`text-xs mt-1 ${
                              message.senderId === 'current_user' ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              {formatMessageTime(message.timestamp)}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t border-gray-200 bg-white">
                    <div className="flex space-x-3">
                      <div className="flex-1 relative">
                        <textarea
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="Type your message..."
                          className="w-full border border-gray-300 rounded-2xl py-3 px-4 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                          rows={1}
                          style={{ minHeight: '44px', maxHeight: '120px' }}
                        />
                        <button
                          onClick={handleSendMessage}
                          disabled={!messageInput.trim()}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                // No chat selected
                <div className="flex-1 flex items-center justify-center bg-gray-50">
                  <div className="text-center">
                    <svg className="w-24 h-24 text-gray-300 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Messages</h2>
                    <p className="text-gray-600 max-w-md mx-auto">
                      Select a conversation from the sidebar to start chatting with other users about your swaps and purchases.
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
