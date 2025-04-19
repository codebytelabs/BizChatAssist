import type { NextApiRequest, NextApiResponse } from 'next';
import { StripeAdapter } from '../../payment/payment-adapter';
import { requireAuth } from '../../middleware/auth';
import { rateLimit } from '../../middleware/rate-limit';
import { z } from 'zod';
import Stripe from 'stripe';
import logger from '../../utils/logger';
import { PaymentError, ValidationError } from '../../utils/errors';


// This endpoint triggers a test Stripe payment intent
const PaymentRequestSchema = z.object({
  amount: z.number().int().positive(),
  currency: z.string().min(3),
  description: z.string().optional(),
  email: z.string().email(),
  method: z.string().min(2).optional(),
  country: z.string().min(2).optional(),
  metadata: z.record(z.any()).optional()
});

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }


  // Verify Stripe API key exists
  if (!process.env.STRIPE_SECRET_KEY) {
    logger.error('Missing STRIPE_SECRET_KEY environment variable');
    throw new PaymentError('Stripe API key not configured', 'STRIPE_API_KEY_MISSING');
  }

  // Zod validation
  const parseResult = PaymentRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    logger.warn({ body: req.body, errors: parseResult.error.flatten() }, 'Invalid payment request received');
    throw new ValidationError('Invalid request', 'INVALID_PAYMENT_REQUEST', parseResult.error.flatten());
  }
  const { amount, currency, description, email, method, country, metadata } = parseResult.data;
  const paymentMethod = method || 'credit-card';

  try {
    logger.info({ paymentMethod, country: country || 'US', amount, currency, metadata }, 'Processing payment');
    
    const adapter = new StripeAdapter();
    const paymentRequest = {
      id: `test-${Date.now()}`,
      amount: Number(amount),
      currency,
      country: country || 'US',
      method: paymentMethod,
      providerMetadata: { 
        email,
        // Pass any method-specific data from the metadata
        ...(metadata || {})
      },
      description,
      metadata: { test: true, ...(metadata || {}) }
    };
    
    logger.debug('Sending payment request to Stripe adapter');
    const paymentResult = await adapter.processPayment(paymentRequest);

    if (paymentResult.success) {
      // Extract the client secret from the raw response for front-end confirmation
      const clientSecret = paymentResult.rawResponse?.client_secret;
      
      res.status(200).json({
        message: 'Payment intent created',
        paymentIntentId: paymentResult.transactionId,
        clientSecret: clientSecret, // This is required for frontend confirmation
        status: paymentResult.status,
        stripeResponse: paymentResult.rawResponse
      });
    } else {
      res.status(500).json({
        error: paymentResult.error || 'Stripe payment failed',
        stripeResponse: paymentResult.rawResponse
      });
    }
  } catch (error) {
    if (error instanceof ValidationError) {
      logger.warn({ error }, 'Validation error');
      return res.status(400).json({ error: error.message, code: error.code, details: error.details });
    }
    if (error instanceof PaymentError) {
      logger.error({ error }, 'Payment error');
      return res.status(500).json({ error: error.message, code: error.code, details: error.details });
    }

    logger.error({ error: error instanceof Stripe.errors.StripeError ? error.message : error }, 'Stripe API error');
    
    // Detailed error logging
    if (error instanceof Stripe.errors.StripeError) {
      logger.error({
        type: error.type,
        code: error.code,
        param: error.param,
        message: error.message
      }, 'Stripe error details');
    } else if (error instanceof Error) {
      logger.error({ stack: error.stack }, 'Error stack');
    }
    
    return res.status(500).json({
      error: error instanceof Stripe.errors.StripeError ? 
        `Stripe API error: ${error.message}` : 
        'An unexpected error occurred with the payment processor',
      code: error instanceof Stripe.errors.StripeError ? error.code : 'unknown_error'
    });
  }
}
