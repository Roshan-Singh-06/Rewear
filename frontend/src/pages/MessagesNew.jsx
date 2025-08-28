import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  Send, 
  Search, 
  MoreVertical,
  ArrowLeft,
  Phone,
  Video,
  Info,
  Smile,
  Paperclip,
  X
} from 'lucide-react';
import Navbar from './components/Navbar';
import { messageService } from '../services/messageService';
import { webSocketService } from '../services/webSocketService';
import { useAuth } from '../hooks/useAuthContext';

export default function Messages() {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  /**
   * Scroll to bottom of messages
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  /**
   * Load user chats
   */
  const loadChats = useCallback(async () => {
    try {
      setLoading(true);
      const response = await messageService.getUserChats();
      
      if (response.success) {
        setChats(response.data.chats || []);
      } else {
        console.error('Failed to load chats:', response.error);
      }
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Load messages for selected chat
   */
  const loadMessages = useCallback(async (chatId) => {
    if (!chatId) return;

    try {
      const response = await messageService.getChatMessages(chatId);
      
      if (response.success) {
        setMessages(response.data.messages || []);
        setTimeout(scrollToBottom, 100);
      } else {
        console.error('Failed to load messages:', response.error);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }, []);

  /**
   * Send message
   */
  const sendMessage = useCallback(async () => {
    if (!messageInput.trim() || !selectedChat || sendingMessage) return;

    const messageText = messageInput.trim();
    setMessageInput('');
    setSendingMessage(true);

    try {
      // Optimistic update
      const tempMessage = {
        _id: `temp_${Date.now()}`,
        content: messageText,
        sender: { _id: user._id, username: user.username, fullName: user.fullName },
        createdAt: new Date().toISOString(),
        isTemporary: true
      };
      setMessages(prev => [...prev, tempMessage]);
      setTimeout(scrollToBottom, 50);

      // Send via WebSocket if connected, otherwise use API
      if (webSocketService.isConnected()) {
        webSocketService.sendMessage(selectedChat.chatId, messageText);
      } else {
        const response = await messageService.sendMessage(selectedChat.chatId, messageText);
        
        if (response.success) {
          // Remove temporary message and add real one
          setMessages(prev => prev.filter(m => m._id !== tempMessage._id));
          setMessages(prev => [...prev, response.data]);
        } else {
          throw new Error(response.error);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove failed message
      setMessages(prev => prev.filter(m => !m.isTemporary));
      setMessageInput(messageText); // Restore input
    } finally {
      setSendingMessage(false);
    }
  }, [messageInput, selectedChat, sendingMessage, user]);

  /**
   * Handle typing indicator
   */
  const handleTyping = useCallback(() => {
    if (!selectedChat) return;

    webSocketService.startTyping(selectedChat.chatId);

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      webSocketService.stopTyping(selectedChat.chatId);
    }, 1000);
  }, [selectedChat]);

  /**
   * Handle chat selection
   */
  const handleChatSelect = useCallback((chat) => {
    setSelectedChat(chat);
    loadMessages(chat.chatId);
    webSocketService.joinChat(chat.chatId);
  }, [loadMessages]);

  /**
   * Filter chats based on search term
   */
  const filteredChats = chats.filter(chat => {
    if (!searchTerm) return true;
    const otherUser = chat.otherParticipant;
    const searchLower = searchTerm.toLowerCase();
    return (
      otherUser?.username?.toLowerCase().includes(searchLower) ||
      otherUser?.fullName?.toLowerCase().includes(searchLower) ||
      chat.lastMessage?.content?.toLowerCase().includes(searchLower)
    );
  });

  /**
   * Format message time
   */
  const formatMessageTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  /**
   * Setup WebSocket listeners
   */
  useEffect(() => {
    if (!user) return;

    // Connect WebSocket
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (token) {
      webSocketService.connect(token);
    }

    // Setup WebSocket event listeners
    const handleNewMessage = (data) => {
      const { message, chatId } = data;
      
      // Update messages if it's for current chat
      if (selectedChat?.chatId === chatId) {
        setMessages(prev => [...prev, message]);
        setTimeout(scrollToBottom, 50);
      }
      
      // Update chat list
      setChats(prev => prev.map(chat => 
        chat.chatId === chatId 
          ? { ...chat, lastMessage: message, lastActivity: message.createdAt }
          : chat
      ));
    };

    const handleUserTyping = (data) => {
      if (selectedChat?.chatId === data.chatId) {
        setTypingUsers(prev => new Set([...prev, data.userId]));
      }
    };

    const handleUserStoppedTyping = (data) => {
      if (selectedChat?.chatId === data.chatId) {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(data.userId);
          return newSet;
        });
      }
    };

    webSocketService.on('new_message', handleNewMessage);
    webSocketService.on('user_typing', handleUserTyping);
    webSocketService.on('user_stopped_typing', handleUserStoppedTyping);

    return () => {
      webSocketService.off('new_message', handleNewMessage);
      webSocketService.off('user_typing', handleUserTyping);
      webSocketService.off('user_stopped_typing', handleUserStoppedTyping);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [user, selectedChat]);

  /**
   * Load chats on component mount
   */
  useEffect(() => {
    loadChats();
  }, [loadChats]);

  /**
   * Scroll to bottom when messages change
   */
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm border h-[calc(100vh-200px)] flex">
          
          {/* Chat List Sidebar */}
          <div className={`w-full md:w-1/3 border-r border-gray-200 flex flex-col ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
              <h1 className="text-xl font-semibold text-gray-900 mb-3">Messages</h1>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-500">
                  Loading conversations...
                </div>
              ) : filteredChats.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-lg font-medium text-gray-900 mb-1">No conversations yet</p>
                  <p className="text-gray-600">Start a conversation from a swap request!</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredChats.map((chat) => (
                    <motion.div
                      key={chat._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onClick={() => handleChatSelect(chat)}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedChat?.chatId === chat.chatId ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        {/* Avatar */}
                        <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                          {chat.otherParticipant?.avatar ? (
                            <img 
                              src={chat.otherParticipant.avatar} 
                              alt={chat.otherParticipant.fullName}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-white font-medium">
                              {(chat.otherParticipant?.fullName || chat.otherParticipant?.username || 'U')[0].toUpperCase()}
                            </span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          {/* Name and Time */}
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="text-sm font-medium text-gray-900 truncate">
                              {chat.otherParticipant?.fullName || chat.otherParticipant?.username || 'Unknown User'}
                            </h3>
                            <span className="text-xs text-gray-500">
                              {chat.lastActivity && formatMessageTime(chat.lastActivity)}
                            </span>
                          </div>

                          {/* Last Message */}
                          {chat.lastMessage && (
                            <p className="text-sm text-gray-600 truncate">
                              {chat.lastMessage.content}
                            </p>
                          )}

                          {/* Swap Info */}
                          {chat.relatedSwap && (
                            <div className="mt-2 flex items-center space-x-2">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Swap Request
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Unread indicator */}
                        {chat.unreadCount > 0 && (
                          <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-xs text-white font-bold">
                              {chat.unreadCount > 9 ? '9+' : chat.unreadCount}
                            </span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className={`flex-1 flex flex-col ${selectedChat ? 'flex' : 'hidden md:flex'}`}>
            {selectedChat ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setSelectedChat(null)}
                      className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                    
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                      {selectedChat.otherParticipant?.avatar ? (
                        <img 
                          src={selectedChat.otherParticipant.avatar} 
                          alt={selectedChat.otherParticipant.fullName}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-white font-medium">
                          {(selectedChat.otherParticipant?.fullName || selectedChat.otherParticipant?.username || 'U')[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                    
                    <div>
                      <h2 className="font-medium text-gray-900">
                        {selectedChat.otherParticipant?.fullName || selectedChat.otherParticipant?.username || 'Unknown User'}
                      </h2>
                      <p className="text-sm text-gray-500">
                        {typingUsers.size > 0 ? 'Typing...' : 'Online'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button className="p-2 hover:bg-gray-100 rounded-lg">
                      <Phone className="h-5 w-5 text-gray-600" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg">
                      <Video className="h-5 w-5 text-gray-600" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg">
                      <Info className="h-5 w-5 text-gray-600" />
                    </button>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  <AnimatePresence>
                    {messages.map((message) => {
                      const isOwnMessage = message.sender._id === user._id;
                      
                      return (
                        <motion.div
                          key={message._id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            isOwnMessage 
                              ? 'bg-blue-500 text-white' 
                              : 'bg-gray-200 text-gray-900'
                          } ${message.isTemporary ? 'opacity-50' : ''}`}>
                            <p className="text-sm">{message.content}</p>
                            <p className={`text-xs mt-1 ${
                              isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              {new Date(message.createdAt).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200">
                  <div className="flex items-center space-x-3">
                    <button className="p-2 hover:bg-gray-100 rounded-lg">
                      <Paperclip className="h-5 w-5 text-gray-600" />
                    </button>
                    
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={messageInput}
                        onChange={(e) => {
                          setMessageInput(e.target.value);
                          handleTyping();
                        }}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="Type a message..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={sendingMessage}
                      />
                      <button className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded">
                        <Smile className="h-5 w-5 text-gray-600" />
                      </button>
                    </div>
                    
                    <button
                      onClick={sendMessage}
                      disabled={!messageInput.trim() || sendingMessage}
                      className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* No Chat Selected */
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Select a conversation
                  </h3>
                  <p className="text-gray-600">
                    Choose a conversation from the sidebar to start messaging.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
