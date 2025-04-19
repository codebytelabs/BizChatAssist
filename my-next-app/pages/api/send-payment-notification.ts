import type { NextApiRequest, NextApiResponse } from 'next';
import paymentNotification from '../../messaging/payment-notification';
import { logAction } from '../../security/audit';

/**
 * API endpoint to send payment notifications (link or status)
 * This demonstrates how to connect our payment system with SMS notifications
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      notificationType,   // 'payment_link', 'confirmation', or 'status_update'
      phone,              // Customer phone number (required)
      amount,             // Payment amount in minor units (cents, paise)
      currency,           // Currency code (e.g., 'usd', 'inr')
      transactionId,      // Transaction ID for reference
      paymentUrl,         // Payment URL for payment_link type
      businessName,       // Business name
      status,             // Payment status for status_update type
      language,           // Language for localization
      items               // Items purchased (optional)
    } = req.body;

    // Validate required fields
    if (!phone || !amount || !currency) {
      return res.status(400).json({ 
        error: 'Missing required fields: phone, amount, currency' 
      });
    }

    let success = false;

    // Handle different notification types
    switch (notificationType) {
      case 'payment_link':
        if (!paymentUrl) {
          return res.status(400).json({ error: 'Missing required field: paymentUrl' });
        }

        success = await paymentNotification.sendPaymentLink({
          phone,
          amount: Number(amount),
          currency,
          businessName,
          paymentUrl,
          transactionId,
          language
        });
        break;

      case 'confirmation':
        if (!transactionId) {
          return res.status(400).json({ error: 'Missing required field: transactionId' });
        }

        // In a real scenario, we'd fetch the payment result from database
        // For demo, we're constructing a mock payment result
        const mockPaymentResult = {
          success: true,
          transactionId,
          provider: req.body.provider || 'stripe',
          status: req.body.status || 'succeeded',
          rawResponse: null
        };

        success = await paymentNotification.sendPaymentConfirmation(
          phone,
          mockPaymentResult,
          {
            amount: Number(amount),
            currency,
            businessName,
            language,
            items
          }
        );
        break;

      case 'status_update':
        if (!transactionId || !status) {
          return res.status(400).json({ 
            error: 'Missing required fields: transactionId, status' 
          });
        }

        success = await paymentNotification.sendPaymentStatusUpdate(
          phone,
          status,
          transactionId,
          {
            amount: Number(amount),
            currency,
            businessName,
            language
          }
        );
        break;

      default:
        return res.status(400).json({ 
          error: 'Invalid notificationType. Must be one of: payment_link, confirmation, status_update' 
        });
    }

    if (success) {
      await logAction({
        action: 'payment_notification_sent',
        resourceType: 'payment',
        resourceId: transactionId || 'unknown',
        metadata: { notificationType, phone }
      });

      return res.status(200).json({ 
        success: true, 
        message: `Payment ${notificationType} sent to ${phone}`
      });
    } else {
      return res.status(500).json({ 
        success: false, 
        error: `Failed to send ${notificationType}`
      });
    }
  } catch (error: any) {
    console.error('Payment notification error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to send payment notification'
    });
  }
}
