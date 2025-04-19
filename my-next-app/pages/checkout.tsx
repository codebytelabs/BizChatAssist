import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import axios from 'axios';
// Import Stripe for payment processing
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Initialize Stripe with Stripe's test publishable key (for demo purposes only)
const stripePromise = loadStripe('pk_test_51OtbOJFTcnzh7wDiTyUxjZRMaJoD9qeHSGvMIvsLllrWwwkR3KH1VZdyAd7ISwhvK1EKuCPvIQgRXJhN2ycCJaOW00ymxmvK64');

// Define comprehensive global country/region data with payment methods
const countries = [
  // Asia
  { code: 'IN', name: 'India', currency: 'INR', methods: ['upi', 'credit-card'], continent: 'AS', phoneCode: '+91' },
  { code: 'JP', name: 'Japan', currency: 'JPY', methods: ['credit-card', 'konbini'], continent: 'AS', phoneCode: '+81' },
  { code: 'CN', name: 'China', currency: 'CNY', methods: ['alipay', 'wechat-pay', 'credit-card'], continent: 'AS', phoneCode: '+86' },
  { code: 'SG', name: 'Singapore', currency: 'SGD', methods: ['paynow', 'credit-card'], continent: 'AS', phoneCode: '+65' },
  { code: 'AE', name: 'UAE', currency: 'AED', methods: ['credit-card'], continent: 'AS', phoneCode: '+971' },
  { code: 'MY', name: 'Malaysia', currency: 'MYR', methods: ['fpx', 'credit-card'], continent: 'AS', phoneCode: '+60' },
  { code: 'TH', name: 'Thailand', currency: 'THB', methods: ['promptpay', 'credit-card'], continent: 'AS', phoneCode: '+66' },
  
  // Europe
  { code: 'GB', name: 'United Kingdom', currency: 'GBP', methods: ['credit-card', 'bacs'], continent: 'EU', phoneCode: '+44' },
  { code: 'DE', name: 'Germany', currency: 'EUR', methods: ['sepa', 'credit-card', 'giropay'], continent: 'EU', phoneCode: '+49' },
  { code: 'FR', name: 'France', currency: 'EUR', methods: ['sepa', 'credit-card', 'cartes-bancaires'], continent: 'EU', phoneCode: '+33' },
  { code: 'IT', name: 'Italy', currency: 'EUR', methods: ['sepa', 'credit-card'], continent: 'EU', phoneCode: '+39' },
  { code: 'ES', name: 'Spain', currency: 'EUR', methods: ['sepa', 'credit-card'], continent: 'EU', phoneCode: '+34' },
  { code: 'NL', name: 'Netherlands', currency: 'EUR', methods: ['ideal', 'sepa', 'credit-card'], continent: 'EU', phoneCode: '+31' },
  
  // North America
  { code: 'US', name: 'United States', currency: 'USD', methods: ['credit-card', 'ach'], continent: 'NA', phoneCode: '+1' },
  { code: 'CA', name: 'Canada', currency: 'CAD', methods: ['credit-card', 'interac'], continent: 'NA', phoneCode: '+1' },
  { code: 'MX', name: 'Mexico', currency: 'MXN', methods: ['oxxo', 'credit-card'], continent: 'NA', phoneCode: '+52' },
  
  // South America
  { code: 'BR', name: 'Brazil', currency: 'BRL', methods: ['pix', 'boleto', 'credit-card'], continent: 'SA', phoneCode: '+55' },
  { code: 'AR', name: 'Argentina', currency: 'ARS', methods: ['rapipago', 'credit-card'], continent: 'SA', phoneCode: '+54' },
  
  // Africa
  { code: 'ZA', name: 'South Africa', currency: 'ZAR', methods: ['credit-card', 'efts'], continent: 'AF', phoneCode: '+27' },
  { code: 'NG', name: 'Nigeria', currency: 'NGN', methods: ['credit-card', 'bank-transfer'], continent: 'AF', phoneCode: '+234' },
  
  // Oceania
  { code: 'AU', name: 'Australia', currency: 'AUD', methods: ['credit-card', 'bpay'], continent: 'OC', phoneCode: '+61' },
  { code: 'NZ', name: 'New Zealand', currency: 'NZD', methods: ['credit-card'], continent: 'OC', phoneCode: '+64' }
];

// Payment method display names
const paymentMethodNames: Record<string, string> = {
  'credit-card': 'Credit Card (Stripe)',
  'upi': 'UPI',
  'paynow': 'PayNow',
  'sepa': 'SEPA Direct Debit',
  'ideal': 'iDEAL',
  'alipay': 'Alipay',
  'wechat-pay': 'WeChat Pay',
  'pix': 'PIX',
  'boleto': 'Boleto',
  'oxxo': 'OXXO',
  'konbini': 'Konbini',
  'promptpay': 'PromptPay',
  'ach': 'ACH Direct Debit',
  'bacs': 'BACS Direct Debit',
  'fpx': 'FPX',
  'giropay': 'Giropay',
  'interac': 'Interac',
  'bpay': 'BPAY',
  'cartes-bancaires': 'Cartes Bancaires',
  'efts': 'EFT',
  'bank-transfer': 'Bank Transfer',
  'rapipago': 'Rapipago'
};

// Define notification options type
type NotificationOptions = {
  email: string;
  phone: string;
  amount: string;
  currency: string;
  channel: 'sms' | 'whatsapp';
  paymentUrl: string;
};

// Define the type for the notification function
type SendPaymentNotification = (
  transactionId: string, 
  type: 'payment_link' | 'confirmation', 
  options: NotificationOptions
) => Promise<boolean>;

// The checkout form component
import { useRef } from 'react';
function CheckoutForm({ 
  selectedCountry, 
  selectedPaymentMethod, 
  amount, 
  email, 
  phone, 
  methodSpecificData, 
  setLoading, 
  setError, 
  setSuccessMessage, 
  setPaymentIntent, 
  notificationChannel, 
  sendPaymentNotification 
}: { 
  selectedCountry: any; 
  selectedPaymentMethod: string; 
  amount: string; 
  email: string; 
  phone: string; 
  methodSpecificData: any; 
  setLoading: (loading: boolean) => void; 
  setError: (error: string) => void; 
  setSuccessMessage: (message: string) => void; 
  setPaymentIntent: (intent: any) => void; 
  notificationChannel: 'sms' | 'whatsapp';
  sendPaymentNotification: SendPaymentNotification;
}) {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // Validate inputs
      if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        throw new Error('Please enter a valid amount');
      }
      
      if (!email) {
        throw new Error('Please enter your email');
      }
      
      if (!phone) {
        throw new Error('Please enter your phone number');
      }
      
      // Convert amount to minor units (cents/paise)
      const amountInMinor = Math.round(parseFloat(amount) * 100);

      // Additional method-specific validations
      if (selectedPaymentMethod === 'upi' && !methodSpecificData.vpa) {
        throw new Error('Please enter your UPI ID/VPA');
      } else if (selectedPaymentMethod === 'sepa' && !methodSpecificData.iban) {
        throw new Error('Please enter your IBAN number');
      } else if (selectedPaymentMethod === 'ideal' && !methodSpecificData.bank) {
        throw new Error('Please select your bank');
      }

      // Process based on payment method
      if (selectedPaymentMethod === 'credit-card') {
        // 1. Create payment intent on the server
        const intentResponse = await axios.post('/api/test-stripe-payment', {
          amount: amountInMinor,
          currency: selectedCountry.currency.toLowerCase(),
          email,
          method: selectedPaymentMethod,
          country: selectedCountry.code,
          description: `BizChatAssist demo payment from ${email}`
        });

        const { paymentIntentId, clientSecret } = intentResponse.data;
        
        if (!clientSecret) {
          throw new Error('Could not retrieve payment credentials');
        }
        
        // 2. Collect payment method details and confirm payment
        const cardElement = elements.getElement(CardElement);
        
        const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement,
            billing_details: { email }
          }
        });
        
        if (error) {
          throw new Error(error.message);
        }
        
        // 3. Handle successful payment
        setPaymentIntent({
          paymentIntentId: paymentIntent.id,
          status: paymentIntent.status,
          provider: 'stripe'
        });
        
        setSuccessMessage('Payment processed successfully!');
        
        // Skipping notification system due to security vault errors
        setSuccessMessage('Payment processed successfully!\n(Notifications disabled for demo purposes)');
        
      } else {
        // Handle other payment methods
        const res = await axios.post('/api/test-stripe-payment', {
          amount: amountInMinor,
          currency: selectedCountry.currency.toLowerCase(),
          email,
          method: selectedPaymentMethod,
          country: selectedCountry.code,
          metadata: methodSpecificData,
          description: `BizChatAssist ${selectedPaymentMethod} payment from ${email}`
        });
        
        const paymentIntentId = res.data.paymentIntentId || `${selectedPaymentMethod}_${Date.now()}`;
        
        setPaymentIntent({
          paymentIntentId: paymentIntentId,
          status: 'pending',
          provider: selectedPaymentMethod
        });
        
        setSuccessMessage(`${paymentMethodNames[selectedPaymentMethod]} payment request generated. Check your phone for payment instructions.`);
        
        // Skipping notification system due to security vault errors
        setSuccessMessage(`${paymentMethodNames[selectedPaymentMethod]} payment request generated. Check your phone for payment instructions.\n(Notifications disabled for demo purposes)`);
        
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Payment processing failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {selectedPaymentMethod === 'credit-card' && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Card Details
          </label>
          <div className="p-3 border border-gray-300 rounded-md">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#424770',
                    '::placeholder': {
                      color: '#aab7c4',
                    },
                  },
                  invalid: {
                    color: '#9e2146',
                  },
                },
              }}
            />
          </div>
        </div>
      )}
      
      <button
        type="submit"
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        disabled={!stripe || !selectedPaymentMethod}
      >
        {`Pay ${selectedCountry.currency} ${amount || '0.00'} with ${paymentMethodNames[selectedPaymentMethod] || selectedPaymentMethod}`}
      </button>
    </form>
  );
}

// --- UI Components ---
function Spinner() {
  return (
    <div className="flex justify-center">
      <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>
  );
}

function Banner({ type, message, onClose }: { type: 'error' | 'success'; message: string; onClose: () => void }) {
  return (
    <div className={`rounded p-3 mb-4 flex items-center ${type === 'error' ? 'bg-red-100 border border-red-400 text-red-700' : 'bg-green-100 border border-green-400 text-green-700'}`}> 
      <span className="flex-1">{message}</span>
      <button className="ml-4 text-lg font-bold" onClick={onClose} aria-label="Close banner">×</button>
    </div>
  );
}

export default function Checkout() {
  const [notificationChannel, setNotificationChannel] = useState<'sms' | 'whatsapp'>('sms');
  const router = useRouter();
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(countries[0].methods[0]);
  const [amount, setAmount] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [upiVpa, setUpiVpa] = useState('');
  const [ibanNumber, setIbanNumber] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [paymentIntent, setPaymentIntent] = useState<any>(null);
  const formRef = useRef<HTMLFormElement>(null);
  
  // Get method-specific data
  const getMethodSpecificData = () => {
    if (selectedPaymentMethod === 'upi') {
      return { vpa: upiVpa };
    } else if (selectedPaymentMethod === 'sepa') {
      return { iban: ibanNumber };
    } else if (selectedPaymentMethod === 'ideal') {
      return { bank: selectedBank };
    }
    return {};
  };
  

  
// Notification function is disabled to prevent security vault errors
// In a production environment, this would be properly implemented with valid encryption keys
const sendPaymentNotification = async (transactionId: string, type: 'payment_link' | 'confirmation', options: NotificationOptions) => {
  setError(`[DEMO MODE] Would send ${type} notification for transaction ${transactionId}`);
  setError(`[DEMO MODE] Recipient: ${options.phone}, Amount: ${options.amount} ${options.currency}`);
  return true; // Always return success in demo mode
};
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>BizChatAssist - Checkout</title>
      </Head>
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-lg mx-auto py-8 px-4 sm:px-6 lg:px-8 rounded shadow bg-white">
          <h1 className="text-2xl font-bold mb-6 text-center">Checkout</h1>
          {/* Notification banners */}
          {error && <Banner type="error" message={error} onClose={() => setError('')} />}
          {successMessage && <Banner type="success" message={successMessage} onClose={() => setSuccessMessage('')} />}
          {/* Loading spinner */}
          {loading && <Spinner />}
          {/* Checkout form */}
          <Elements stripe={stripePromise}>
            <CheckoutForm
              selectedCountry={selectedCountry}
              selectedPaymentMethod={selectedPaymentMethod}
              amount={amount}
              email={email}
              phone={phone}
              methodSpecificData={{ upiVpa, ibanNumber, selectedBank }}
              setLoading={setLoading}
              setError={setError}
              setSuccessMessage={setSuccessMessage}
              setPaymentIntent={setPaymentIntent}
              notificationChannel={notificationChannel}
              sendPaymentNotification={sendPaymentNotification}
            />
          </Elements>
          {/* API docs link */}
          <div className="mt-8 text-center text-xs text-gray-500">
            {/* OpenAPI endpoint for backend documentation */}
            API docs: <a href="/api/docs" className="underline text-blue-600">OpenAPI/Swagger</a>
          </div>
        </div>
      </main>
    </div>
  );
}
