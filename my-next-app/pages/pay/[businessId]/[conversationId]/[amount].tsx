import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import Head from 'next/head';
import { UPIAdapter } from '../../../../payment/adapters/upi';

export default function PaymentPage() {
  const router = useRouter();
  const supabase = useSupabaseClient();
  const { businessId, conversationId, amount } = router.query;
  
  const [loading, setLoading] = useState(true);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function loadPaymentDetails() {
      if (!businessId || !conversationId || !amount) return;
      
      try {
        setLoading(true);
        
        // Get business details
        const { data: business, error: bizError } = await supabase
          .from('businesses')
          .select('name, upi_id')
          .eq('id', businessId)
          .single();
          
        if (bizError || !business?.upi_id) {
          throw new Error('Business not found or UPI ID not configured');
        }
        
        setBusinessName(business.name);
        
        // Get customer phone from conversation
        const { data: convo, error: convoError } = await supabase
          .from('conversations')
          .select('customer_phone')
          .eq('id', conversationId)
          .single();
          
        if (convoError) {
          throw new Error('Conversation not found');
        }
        
        // Generate UPI QR code
        const upiAdapter = new UPIAdapter();
        const result = await upiAdapter.generateQR({
          businessId: businessId as string,
          conversationId: conversationId as string,
          customerPhone: convo.customer_phone,
          amount: parseFloat(amount as string),
          currency: 'INR',
          upiId: business.upi_id,
          description: `SMS payment to ${business.name}`
        });
        
        setQrCode(result.qrCode);
      } catch (err: any) {
        console.error('Error loading payment details:', err);
        setError(err.message || 'Failed to load payment details');
      } finally {
        setLoading(false);
      }
    }
    
    loadPaymentDetails();
  }, [businessId, conversationId, amount, supabase]);
  
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
      <Head>
        <title>{businessName ? `Pay ${businessName}` : 'BizChatAssist Payment'}</title>
        <meta name="description" content="Secure payment page for BizChatAssist" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Head>
      
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600">Loading payment details...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="mt-2 text-lg font-medium text-gray-900">Payment Error</h2>
            <p className="mt-1 text-gray-500">{error}</p>
            <button 
              onClick={() => router.push('/')}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Return Home
            </button>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Pay {businessName}</h1>
              <p className="text-gray-600 mt-1">Amount: ₹{amount}</p>
            </div>
            
            {qrCode && (
              <div className="flex flex-col items-center justify-center">
                <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
                  <img src={qrCode} alt="UPI QR Code" className="w-64 h-64" />
                </div>
                <p className="text-sm text-gray-600 mt-4 text-center">
                  Scan this QR code with any UPI app like Google Pay, PhonePe, or Paytm
                </p>
              </div>
            )}
            
            <div className="mt-8 text-center">
              <h3 className="text-sm font-medium text-gray-900">Payment Apps</h3>
              <div className="flex justify-center space-x-4 mt-2">
                <a href={`gpay://upi/pay?pa=${amount}`} className="flex flex-col items-center">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold text-xs">GPay</span>
                  </div>
                  <span className="text-xs mt-1">Google Pay</span>
                </a>
                <a href={`phonepe://pay?pa=${amount}`} className="flex flex-col items-center">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-indigo-600 font-bold text-xs">PhPe</span>
                  </div>
                  <span className="text-xs mt-1">PhonePe</span>
                </a>
                <a href={`paytmmp://pay?pa=${amount}`} className="flex flex-col items-center">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-xs">Paytm</span>
                  </div>
                  <span className="text-xs mt-1">Paytm</span>
                </a>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                Secured by BizChatAssist. This payment is protected by end-to-end encryption.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
