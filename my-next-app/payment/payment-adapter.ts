/**
 * Payment Adapter
 * 
 * Defines the interface and implementations for payment processing
 * For BizChatAssist, this is simplified to focus only on client subscription/onboarding payments
 */

export interface PaymentRequest {
  amount: number;
  currency: string;
  customerId?: string;
  description?: string;
  metadata?: Record<string, any>;
  paymentMethodId?: string;
}

export interface PaymentResult {
  success: boolean;
  transactionId: string;
  provider: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  rawResponse: any;
  error?: string;
}

// Common interface for all payment adapters
export interface PaymentAdapter {
  processPayment(request: PaymentRequest): Promise<PaymentResult>;
  reverseTransaction(transactionId: string): Promise<{ success: boolean }>;
}

// Factory function to create the appropriate payment adapter
export function createPaymentAdapter(type: string): PaymentAdapter {
  switch (type) {
    case 'stripe':
      return new StripeAdapter();
    case 'paypal':
      return new PayPalAdapter();
    default:
      throw new Error(`Payment adapter '${type}' not supported`);
  }
}

// Adapter stubs for region-specific providers
// Stripe Adapter
import Stripe from 'stripe';

// Always load from environment variables
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
// Initialize Stripe only if secret key is available
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, { apiVersion: '2025-03-31.basil' }) : null;

export class StripeAdapter implements PaymentAdapter {
  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    // Validate Stripe is properly initialized
    if (!stripe) {
      console.error('Stripe not initialized: Missing Stripe secret key');
      return {
        success: false,
        transactionId: '',
        provider: 'stripe',
        status: 'failed',
        rawResponse: null,
        error: 'Stripe not initialized'
      };
    }

    try {
      // Create a payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(request.amount * 100), // Stripe requires cents
        currency: request.currency.toLowerCase(),
        description: request.description,
        metadata: request.metadata,
        payment_method: request.paymentMethodId,
        confirm: !!request.paymentMethodId,
      });

      return {
        success: true,
        transactionId: paymentIntent.id,
        provider: 'stripe',
        status: paymentIntent.status === 'succeeded' ? 'completed' : 'pending',
        rawResponse: paymentIntent
      };
    } catch (error: any) {
      return {
        success: false,
        transactionId: '',
        provider: 'stripe',
        status: 'failed',
        rawResponse: null,
        error: error.message || 'Stripe error'
      };
    }
  }
  
  async reverseTransaction(transactionId: string): Promise<{ success: boolean }> {
    try {
      // Check if stripe is initialized
      if (!stripe) {
        console.error('Stripe not initialized: Missing Stripe secret key');
        return { success: false };
      }
      await stripe.refunds.create({ payment_intent: transactionId });
      return { success: true };
    } catch (error) {
      return { success: false };
    }
  }
}

// PayPal Adapter - Simplified stub
export class PayPalAdapter implements PaymentAdapter {
  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    // Simplified implementation for MVP
    // Would connect to PayPal SDK in production
    
    return {
      success: true,
      transactionId: `pp-${Date.now()}-${Math.round(Math.random() * 1000)}`,
      provider: 'paypal',
      status: 'pending',
      rawResponse: { status: 'CREATED' }
    };
  }

  async reverseTransaction(transactionId: string): Promise<{ success: boolean }> {
    // Simplified refund implementation
    return { success: true };
  }
}
