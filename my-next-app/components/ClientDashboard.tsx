import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSupabaseClient } from '@supabase/auth-helpers-react';

// Dashboard component types
type Conversation = {
  id: string;
  customer_phone: string;
  created_at: string;
  last_message?: string;
  unread_count: number;
  status: 'active' | 'closed';
};

type Message = {
  id: string;
  content: string;
  sender_type: 'business' | 'customer' | 'system';
  created_at: string;
  message_type: 'text' | 'image' | 'document';
  media_url?: string;
};

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  image_url?: string;
  category: string;
  in_stock: boolean;
};

type Appointment = {
  id: string;
  customer_name: string;
  customer_phone: string;
  service: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
};

export default function ClientDashboard() {
  // State variables
  const [activeTab, setActiveTab] = useState<'conversations' | 'appointments' | 'products' | 'settings'>('conversations');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const supabase = useSupabaseClient();
  
  // Fetch conversations
  useEffect(() => {
    async function fetchConversations() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('conversations')
          .select('*, messages(count)')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        setConversations(data || []);
        // Select first conversation if available and none selected
        if (data?.length && !selectedConversation) {
          setSelectedConversation(data[0].id);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load conversations');
        console.error('Error fetching conversations:', err);
      } finally {
        setLoading(false);
      }
    }
    
    if (activeTab === 'conversations') {
      fetchConversations();
    }
  }, [activeTab, supabase, selectedConversation]);
  
  // Fetch messages for selected conversation
  useEffect(() => {
    async function fetchMessages() {
      if (!selectedConversation) return;
      
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', selectedConversation)
          .order('created_at', { ascending: true });
        
        if (error) throw error;
        
        setMessages(data || []);
      } catch (err: any) {
        console.error('Error fetching messages:', err);
      }
    }
    
    if (selectedConversation) {
      fetchMessages();
    }
  }, [selectedConversation, supabase]);
  
  // Fetch products
  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('name', { ascending: true });
        
        if (error) throw error;
        
        setProducts(data || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load products');
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    }
    
    if (activeTab === 'products') {
      fetchProducts();
    }
  }, [activeTab, supabase]);
  
  // Fetch appointments
  useEffect(() => {
    async function fetchAppointments() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('appointments')
          .select('*')
          .order('date', { ascending: true });
        
        if (error) throw error;
        
        setAppointments(data || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load appointments');
        console.error('Error fetching appointments:', err);
      } finally {
        setLoading(false);
      }
    }
    
    if (activeTab === 'appointments') {
      fetchAppointments();
    }
  }, [activeTab, supabase]);
  
  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;
    
    try {
      // Send to AI endpoint
      const response = await axios.post('/api/ai/conversation', {
        message: newMessage,
        conversationId: selectedConversation
      });
      
      // Clear input
      setNewMessage('');
      
      // Refresh messages
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', selectedConversation)
        .order('created_at', { ascending: true });
      
      if (!error) {
        setMessages(data || []);
      }
    } catch (err: any) {
      console.error('Error sending message:', err);
    }
  };
  
  // Render conversation list
  const renderConversations = () => {
    if (loading) return <div className="p-4 text-center">Loading conversations...</div>;
    if (error) return <div className="p-4 text-center text-red-500">{error}</div>;
    if (conversations.length === 0) return <div className="p-4 text-center">No conversations yet.</div>;
    
    return (
      <div className="divide-y">
        {conversations.map((conversation) => (
          <div 
            key={conversation.id}
            className={`p-3 cursor-pointer hover:bg-gray-100 ${selectedConversation === conversation.id ? 'bg-blue-50' : ''}`}
            onClick={() => setSelectedConversation(conversation.id)}
          >
            <div className="flex justify-between items-center">
              <div className="font-medium">{conversation.customer_phone}</div>
              <div className="text-xs text-gray-500">
                {new Date(conversation.created_at).toLocaleDateString()}
              </div>
            </div>
            <div className="text-sm text-gray-500 truncate">
              {conversation.last_message || 'No messages yet'}
            </div>
            {conversation.unread_count > 0 && (
              <div className="mt-1 inline-block bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                {conversation.unread_count}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };
  
  // Render message list
  const renderMessages = () => {
    if (!selectedConversation) return <div className="p-4 text-center">Select a conversation</div>;
    if (messages.length === 0) return <div className="p-4 text-center">No messages yet.</div>;
    
    return (
      <div className="space-y-3 p-3">
        {messages.map((message) => (
          <div 
            key={message.id}
            className={`p-2 rounded-lg max-w-[75%] ${
              message.sender_type === 'customer' 
                ? 'bg-gray-200 ml-auto' 
                : message.sender_type === 'system'
                  ? 'bg-blue-100'
                  : 'bg-green-100'
            }`}
          >
            <div className="text-sm">{message.content}</div>
            <div className="text-xs text-gray-500 text-right">
              {new Date(message.created_at).toLocaleTimeString()}
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  // Render products
  const renderProducts = () => {
    if (loading) return <div className="p-4 text-center">Loading products...</div>;
    if (error) return <div className="p-4 text-center text-red-500">{error}</div>;
    if (products.length === 0) return <div className="p-4 text-center">No products yet.</div>;
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {products.map((product) => (
          <div key={product.id} className="border rounded-lg overflow-hidden bg-white shadow-sm">
            {product.image_url && (
              <img 
                src={product.image_url} 
                alt={product.name}
                className="w-full h-40 object-cover"
              />
            )}
            <div className="p-3">
              <div className="flex justify-between items-start">
                <h3 className="font-medium">{product.name}</h3>
                <div className="text-green-600 font-medium">
                  {product.currency} {product.price.toFixed(2)}
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-1">{product.description}</p>
              <div className="mt-2 flex justify-between items-center">
                <span className={`text-xs px-2 py-1 rounded ${product.in_stock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {product.in_stock ? 'In Stock' : 'Out of Stock'}
                </span>
                <span className="text-xs text-gray-500">{product.category}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  // Render appointments
  const renderAppointments = () => {
    if (loading) return <div className="p-4 text-center">Loading appointments...</div>;
    if (error) return <div className="p-4 text-center text-red-500">{error}</div>;
    if (appointments.length === 0) return <div className="p-4 text-center">No appointments yet.</div>;
    
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {appointments.map((appointment) => (
              <tr key={appointment.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{appointment.customer_name}</div>
                  <div className="text-sm text-gray-500">{appointment.customer_phone}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {appointment.service}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(appointment.date).toLocaleDateString()} at {appointment.time}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' : 
                    appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                    appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-blue-100 text-blue-800'}`}>
                    {appointment.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <button className="text-blue-600 hover:text-blue-900 mr-2">Edit</button>
                  <button className="text-red-600 hover:text-red-900">Cancel</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };
  
  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-xl font-bold text-gray-900">BizChatAssist Dashboard</h1>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-gray-50 border-r">
          <div className="p-4">
            <h2 className="text-lg font-medium text-gray-900">Navigation</h2>
            <div className="mt-4 space-y-1">
              <button 
                className={`block w-full text-left px-3 py-2 rounded-md ${activeTab === 'conversations' ? 'bg-blue-500 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                onClick={() => setActiveTab('conversations')}
              >
                Conversations
              </button>
              <button 
                className={`block w-full text-left px-3 py-2 rounded-md ${activeTab === 'appointments' ? 'bg-blue-500 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                onClick={() => setActiveTab('appointments')}
              >
                Appointments
              </button>
              <button 
                className={`block w-full text-left px-3 py-2 rounded-md ${activeTab === 'products' ? 'bg-blue-500 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                onClick={() => setActiveTab('products')}
              >
                Products
              </button>
              <button 
                className={`block w-full text-left px-3 py-2 rounded-md ${activeTab === 'settings' ? 'bg-blue-500 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                onClick={() => setActiveTab('settings')}
              >
                Settings
              </button>
            </div>
          </div>
        </div>
        
        {/* Content area */}
        <div className="flex-1 flex flex-col">
          {activeTab === 'conversations' && (
            <div className="flex-1 flex">
              {/* Conversation list */}
              <div className="w-72 border-r overflow-y-auto">
                <div className="p-3 border-b">
                  <h2 className="font-medium">Conversations</h2>
                </div>
                {renderConversations()}
              </div>
              
              {/* Message area */}
              <div className="flex-1 flex flex-col">
                <div className="flex-1 overflow-y-auto p-4">
                  {renderMessages()}
                </div>
                
                {/* Message input */}
                {selectedConversation && (
                  <div className="p-3 border-t">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        className="flex-1 rounded-full border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      />
                      <button
                        className="bg-blue-500 text-white rounded-full p-2"
                        onClick={sendMessage}
                      >
                        Send
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'products' && (
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 border-b flex justify-between items-center">
                <h2 className="font-medium">Products</h2>
                <button className="bg-blue-500 text-white px-3 py-1 rounded">Add Product</button>
              </div>
              {renderProducts()}
            </div>
          )}
          
          {activeTab === 'appointments' && (
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 border-b flex justify-between items-center">
                <h2 className="font-medium">Appointments</h2>
                <button className="bg-blue-500 text-white px-3 py-1 rounded">New Appointment</button>
              </div>
              {renderAppointments()}
            </div>
          )}
          
          {activeTab === 'settings' && (
            <div className="flex-1 overflow-y-auto p-6">
              <h2 className="text-xl font-medium mb-4">Account Settings</h2>
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Business Information</h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">Update your business details and preferences.</p>
                </div>
                <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
                  <dl className="sm:divide-y sm:divide-gray-200">
                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Business name</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        <input type="text" className="border rounded px-2 py-1 w-full" defaultValue="Your Business Name" />
                      </dd>
                    </div>
                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Industry</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        <select className="border rounded px-2 py-1 w-full">
                          <option>Retail</option>
                          <option>Restaurant</option>
                          <option>Service</option>
                          <option>Healthcare</option>
                          <option>Other</option>
                        </select>
                      </dd>
                    </div>
                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Business hours</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        <textarea className="border rounded px-2 py-1 w-full" rows={3} defaultValue="Monday-Friday: 9AM-5PM
Saturday: 10AM-3PM
Sunday: Closed"></textarea>
                      </dd>
                    </div>
                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">WhatsApp number</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        <input type="text" className="border rounded px-2 py-1 w-full" defaultValue="+1234567890" />
                      </dd>
                    </div>
                  </dl>
                </div>
                <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                  <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
