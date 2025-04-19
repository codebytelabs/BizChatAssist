import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import logger from '../../utils/logger';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2022-11-15',
});

export const config = {
  api: {
    bodyParser: false, // Stripe requires raw body
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  let event;
  try {
    const rawBody = await getRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, sig as string, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    logger.error({ err }, 'Webhook signature verification failed');
    return res.status(400).json({ error: 'Webhook signature verification failed' });
  }

  // Handle event
  switch (event.type) {
    case 'payment_intent.succeeded':
      logger.info({ id: event.data.object.id }, 'Payment succeeded');
      break;
    case 'payment_intent.payment_failed':
      logger.warn({ id: event.data.object.id }, 'Payment failed');
      break;
    default:
      logger.info({ type: event.type }, 'Unhandled Stripe webhook event');
  }

  res.status(200).json({ received: true });
}

// Helper to get raw body
async function getRawBody(req: NextApiRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}
