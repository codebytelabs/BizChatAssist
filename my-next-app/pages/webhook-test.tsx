import React, { useState } from 'react';
import Head from 'next/head';
import axios from 'axios';

export default function WebhookTest() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState('');
  
  // Simulate a WhatsApp webhook event
  const simulateWebhook = async () => {
    if (!phoneNumber || !message) {
      setError('Phone number and message are required');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Format phone number (ensure it includes country code)
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
      
      // Create a mock WhatsApp webhook payload
      const mockPayload = {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: 'mock-whatsapp-business-id',
            changes: [
              {
                value: {
                  messaging_product: 'whatsapp',
                  metadata: {
                    display_phone_number: '1234567890',
                    phone_number_id: 'mock-phone-number-id'
                  },
                  contacts: [
                    {
                      profile: {
                        name: 'Test User'
                      },
                      wa_id: formattedPhone.replace('+', '')
                    }
                  ],
                  messages: [
                    {
                      from: formattedPhone,
                      id: `mock-msg-${Date.now()}`,
                      timestamp: Math.floor(Date.now() / 1000),
                      type: 'text',
                      text: {
                        body: message
                      }
                    }
                  ]
                }
              }
            ]
          }
        ]
      };
      
      // Send the mock webhook to our webhook endpoint
      const result = await axios.post('/api/webhooks/whatsapp', mockPayload);
      
      setResponse(result.data);
    } catch (err: any) {
      console.error('Webhook simulation error:', err);
      setError(err.response?.data?.error || err.message || 'Webhook simulation failed');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <Head>
        <title>WhatsApp Webhook Test | BizChatAssist</title>
      </Head>
      
      <h1 className="text-2xl font-bold mb-4">WhatsApp Webhook Test</h1>
      <p className="mb-6 text-gray-600">Use this tool to test the WhatsApp webhook integration without using the actual WhatsApp Business API.</p>
      
      <div className="bg-white shadow-md rounded p-6 mb-6">
        <div className="mb-4">
          <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number (include country code)
          </label>
          <input
            id="phoneNumber"
            type="text"
            className="w-full p-2 border rounded"
            placeholder="+1234567890"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
            Message
          </label>
          <textarea
            id="message"
            className="w-full p-2 border rounded"
            placeholder="Enter a test message"
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>
        
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          onClick={simulateWebhook}
          disabled={loading}
        >
          {loading ? 'Sending...' : 'Simulate Webhook'}
        </button>
      </div>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          <p>{error}</p>
        </div>
      )}
      
      {response && (
        <div className="mt-6">
          <h2 className="text-lg font-medium mb-2">Webhook Response</h2>
          <div className="bg-gray-100 p-4 rounded overflow-auto">
            <pre className="text-sm">{JSON.stringify(response, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
