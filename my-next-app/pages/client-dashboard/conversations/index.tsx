import { useState, useEffect } from 'react';
import Head from 'next/head';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import { PhoneIcon, PaperAirplaneIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { BsWhatsapp } from 'react-icons/bs';

// Types
interface Conversation {
  id: string;
  customerName: string;
  phoneNumber: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  status: 'active' | 'resolved' | 'pending';
}

interface Message {
  id: string;
  content: string;
  timestamp: string;
  sender: 'customer' | 'business' | 'ai';
  read: boolean;
}

export default function Conversations() {
  // State for conversations list and selected conversation
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'resolved', 'pending'

  // Sample data - in a real app this would come from an API
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const sampleConversations: Conversation[] = [
        {
          id: '1',
          customerName: 'Sarah Johnson',
          phoneNumber: '+1 (555) 123-4567',
          lastMessage: 'Do you have this product in blue?',
          lastMessageTime: '10:32 AM',
          unreadCount: 2,
          status: 'active'
        },
        {
          id: '2',
          customerName: 'Michael Smith',
          phoneNumber: '+1 (555) 987-6543',
          lastMessage: 'Thanks for the information!',
          lastMessageTime: 'Yesterday',
          unreadCount: 0,
          status: 'resolved'
        },
        {
          id: '3',
          customerName: 'Emily Williams',
          phoneNumber: '+1 (555) 234-5678',
          lastMessage: 'I need to cancel my appointment.',
          lastMessageTime: 'Yesterday',
          unreadCount: 1,
          status: 'pending'
        },
        {
          id: '4',
          customerName: 'Daniel Brown',
          phoneNumber: '+1 (555) 876-5432',
          lastMessage: 'What are your business hours?',
          lastMessageTime: '2 days ago',
          unreadCount: 0,
          status: 'active'
        },
        {
          id: '5',
          customerName: 'Jessica Miller',
          phoneNumber: '+1 (555) 345-6789',
          lastMessage: 'Is this item in stock?',
          lastMessageTime: '3 days ago',
          unreadCount: 0,
          status: 'resolved'
        },
        {
          id: '6',
          customerName: 'Christopher Wilson',
          phoneNumber: '+1 (555) 456-7890',
          lastMessage: 'I\'d like to schedule an appointment for next week.',
          lastMessageTime: '5 days ago',
          unreadCount: 0,
          status: 'resolved'
        }
      ];
      setConversations(sampleConversations);
      setLoading(false);
    }, 1000);
  }, []);

  // Load messages when a conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      // Simulate API call to get messages
      setLoading(true);
      setTimeout(() => {
        // Sample conversation with Sarah Johnson
        if (selectedConversation === '1') {
          const sampleMessages: Message[] = [
            {
              id: '1',
              content: 'Hello! I saw your blue dress on your website. Do you have it in size medium?',
              timestamp: '10:15 AM',
              sender: 'customer',
              read: true
            },
            {
              id: '2',
              content: 'Hi Sarah! Thanks for your interest in our blue dress. Let me check our inventory for you.',
              timestamp: '10:18 AM',
              sender: 'ai',
              read: true
            },
            {
              id: '3',
              content: 'I\'ve checked our system and we do have the blue dress in medium! Would you like me to reserve it for you?',
              timestamp: '10:20 AM',
              sender: 'ai',
              read: true
            },
            {
              id: '4',
              content: 'Yes, please! Do you have this product in other colors as well?',
              timestamp: '10:32 AM',
              sender: 'customer',
              read: false
            },
            {
              id: '5',
              content: 'We also have it in black and red. Would you like to see photos of those options?',
              timestamp: '10:33 AM',
              sender: 'ai',
              read: false
            }
          ];
          setMessages(sampleMessages);
        } else {
          // Generic messages for other conversations
          const sampleMessages: Message[] = [
            {
              id: '1',
              content: 'Hello! I have a question about your products.',
              timestamp: '2 days ago',
              sender: 'customer',
              read: true
            },
            {
              id: '2',
              content: 'Hi there! How can I help you today?',
              timestamp: '2 days ago',
              sender: 'ai',
              read: true
            },
            {
              id: '3',
              content: 'I\'m looking for information about your services.',
              timestamp: '1 day ago',
              sender: 'customer',
              read: true
            },
            {
              id: '4',
              content: 'I\'d be happy to tell you about our services. We offer...',
              timestamp: '1 day ago',
              sender: 'ai',
              read: true
            }
          ];
          setMessages(sampleMessages);
        }
        setLoading(false);
      }, 800);
    }
  }, [selectedConversation]);

  // Handle sending a new message
  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;

    // Add message to the state
    const newMessageObj: Message = {
      id: Date.now().toString(),
      content: newMessage,
      timestamp: 'Just now',
      sender: 'business',
      read: true
    };

    setMessages([...messages, newMessageObj]);
    setNewMessage('');

    // In a real app, you would send the message to your API
    // and likely trigger the AI assistant to respond
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'll handle this response automatically based on the customer's inquiry. This is where the AI would generate a contextually relevant response.",
        timestamp: 'Just now',
        sender: 'ai',
        read: true
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1500);
  };

  // Filter conversations based on status
  const filteredConversations = filter === 'all' 
    ? conversations 
    : conversations.filter(conv => conv.status === filter);

  return (
    <DashboardLayout>
      <Head>
        <title>Conversations | BizChatAssist</title>
        <meta name="description" content="Manage your WhatsApp and SMS conversations" />
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="py-4">
          <h1 className="text-2xl font-semibold text-gray-900">Conversations</h1>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="flex h-[calc(100vh-12rem)]">
            {/* Conversation list */}
            <div className="w-1/3 border-r border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <div className="relative rounded-md shadow-sm">
                  <input
                    type="text"
                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-4 pr-10 sm:text-sm border-gray-300 rounded-md"
                    placeholder="Search conversations..."
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>

                <div className="flex items-center mt-4 space-x-2 overflow-x-auto pb-2">
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-3 py-1 rounded-full text-sm ${
                      filter === 'all' ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilter('active')}
                    className={`px-3 py-1 rounded-full text-sm ${
                      filter === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    Active
                  </button>
                  <button
                    onClick={() => setFilter('pending')}
                    className={`px-3 py-1 rounded-full text-sm ${
                      filter === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    Pending
                  </button>
                  <button
                    onClick={() => setFilter('resolved')}
                    className={`px-3 py-1 rounded-full text-sm ${
                      filter === 'resolved' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    Resolved
                  </button>
                </div>
              </div>
              
              <div className="overflow-y-auto h-full pb-20">
                {loading && !selectedConversation ? (
                  <div className="flex justify-center items-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="text-center py-10 px-4">
                    <p className="text-gray-500">No conversations found</p>
                  </div>
                ) : (
                  filteredConversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      onClick={() => setSelectedConversation(conversation.id)}
                      className={`p-4 border-b border-gray-200 hover:bg-gray-50 cursor-pointer ${
                        selectedConversation === conversation.id ? 'bg-indigo-50' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-600 font-medium">
                                {conversation.customerName.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{conversation.customerName}</p>
                            <div className="flex items-center">
                              {conversation.phoneNumber.includes('whatsapp') ? (
                                <BsWhatsapp className="h-3 w-3 text-green-500 mr-1" />
                              ) : (
                                <PhoneIcon className="h-3 w-3 text-gray-400 mr-1" />
                              )}
                              <p className="text-xs text-gray-500">{conversation.phoneNumber}</p>
                            </div>
                            <p className="mt-1 text-sm text-gray-600 truncate w-44">{conversation.lastMessage}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <p className="text-xs text-gray-500">{conversation.lastMessageTime}</p>
                          {conversation.unreadCount > 0 && (
                            <span className="mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                              {conversation.unreadCount}
                            </span>
                          )}
                          <span className={`mt-1.5 inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                            conversation.status === 'active' ? 'bg-green-100 text-green-800' : 
                            conversation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {conversation.status.charAt(0).toUpperCase() + conversation.status.slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Message area */}
            <div className="w-2/3 flex flex-col">
              {!selectedConversation ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <ChatBubbleIllustration />
                  <h3 className="mt-2 text-lg font-medium">Select a conversation</h3>
                  <p className="mt-1">Choose a conversation from the list to view messages</p>
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                    {loading ? (
                      <div className="animate-pulse flex space-x-4 w-full">
                        <div className="rounded-full bg-gray-200 h-10 w-10"></div>
                        <div className="flex-1 space-y-2 py-1">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-5/12"></div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-600 font-medium">
                                {conversations.find(c => c.id === selectedConversation)?.customerName.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {conversations.find(c => c.id === selectedConversation)?.customerName}
                            </p>
                            <div className="flex items-center">
                              <BsWhatsapp className="h-3 w-3 text-green-500 mr-1" />
                              <p className="text-xs text-gray-500">
                                {conversations.find(c => c.id === selectedConversation)?.phoneNumber}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div>
                          <button
                            type="button"
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            View Details
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Messages */}
                  <div className="flex-1 p-4 overflow-y-auto">
                    {loading ? (
                      <div className="flex justify-center items-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((message) => (
                          <div 
                            key={message.id}
                            className={`flex ${message.sender === 'customer' ? 'justify-start' : 'justify-end'}`}
                          >
                            <div 
                              className={`max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg px-4 py-2 rounded-lg ${
                                message.sender === 'customer' 
                                  ? 'bg-gray-100 text-gray-800' 
                                  : message.sender === 'ai'
                                    ? 'bg-green-100 text-gray-800'
                                    : 'bg-indigo-600 text-white'
                              }`}
                            >
                              <p className="text-sm">{message.content}</p>
                              <p className="text-xs text-right mt-1 opacity-75">
                                {message.timestamp}
                                {message.sender === 'ai' && (
                                  <span className="ml-1 text-xs italic">(AI)</span>
                                )}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Message input */}
                  <div className="p-4 border-t border-gray-200">
                    <div className="flex items-center">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                          placeholder="Type a message..."
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                        className="ml-3 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <PaperAirplaneIcon className="h-4 w-4 mr-1" />
                        Send
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      Messages are automatically handled by AI but you can send manual responses when needed
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// Chat bubble illustration
function ChatBubbleIllustration() {
  return (
    <svg
      className="h-24 w-24 text-gray-300"
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        fillRule="evenodd"
        d="M4 14a1 1 0 01-1-1V5a3 3 0 013-3h12a3 3 0 013 3v4a3 3 0 01-3 3H9l-3 3a1 1 0 01-2 0zm3-3h12V5H6v6zm2 2h.01m3.99 0h.01m3.99 0h.01"
        clipRule="evenodd"
        strokeWidth="1.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
