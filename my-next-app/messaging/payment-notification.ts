/**
 * Payment Notification Service
 * Handles sending payment notifications, links, and status updates via SMS and WhatsApp
 */
import smsClient from './sms/client';
import whatsappClient from './whatsapp/client';
import { logAction } from '../security/audit';
import { PaymentResult } from '../payment/payment-adapter';

export interface PaymentNotificationOptions {
  phone: string;           // Customer phone number
  amount: number;          // Payment amount
  currency: string;        // Currency code
  businessName?: string;   // Business name
  paymentUrl?: string;     // Payment URL if applicable
  expiresInMinutes?: number; // Expiration time
  language?: string;       // Language for localization
  transactionId?: string;  // Transaction ID for reference
  customMessage?: string;  // Custom message override
  channel?: 'sms' | 'whatsapp'; // Notification channel
}

export class PaymentNotificationService {
  /**
   * Send a payment link via SMS
   */
  async sendPaymentLink(options: PaymentNotificationOptions): Promise<boolean> {
    try {
      const { 
        phone, amount, currency, businessName = 'Our Business',
        paymentUrl, expiresInMinutes = 60, language = 'en'
      } = options;

      if (!phone || !amount || !currency || !paymentUrl) {
        console.error('Missing required fields for payment link notification');
        return false;
      }

      // Format the amount with proper currency display
      const formatter = new Intl.NumberFormat(language, {
        style: 'currency',
        currency: currency
      });
      const formattedAmount = formatter.format(amount/100); // Assuming amount is in cents

      // Construct the message
      const message = options.customMessage || 
        `${businessName} payment request for ${formattedAmount}. Pay securely at: ${paymentUrl} (Link expires in ${expiresInMinutes} mins)`;

      // Send the SMS
      let result;
      if (options.channel === 'whatsapp') {
        result = await whatsappClient.sendTextMessage(phone, message);
      } else {
        result = await smsClient.sendTextMessage(phone, message);
      }

      // Log action
      await logAction({
        action: 'payment_link_sent',
        resourceType: 'payment',
        resourceId: options.transactionId || 'unknown',
        metadata: { 
          amount,
          currency,
          phone,
          business: businessName
        }
      });

      return result.success;
    } catch (error: any) {
      console.error('Failed to send payment link notification:', error);
      return false;
    }
  }

  /**
   * Send payment receipt/confirmation
   */
  async sendPaymentConfirmation(
    phone: string, 
    paymentResult: PaymentResult, 
    options: {
      amount: number;
      currency: string;
      businessName?: string;
      language?: string;
      items?: string;
    }
  ): Promise<boolean> {
    try {
      const { 
        amount, currency, 
        businessName = 'Our Business',
        language = 'en',
        items
      } = options;

      // Format the amount with proper currency display
      const formatter = new Intl.NumberFormat(language, {
        style: 'currency',
        currency: currency
      });
      const formattedAmount = formatter.format(amount/100); // Assuming amount is in cents

      // Construct the confirmation message
      let message = `Payment of ${formattedAmount} to ${businessName} is ${paymentResult.status}. Transaction ID: ${paymentResult.transactionId}`;
      
      if (items) {
        message += `\nItems: ${items}`;
      }

      // Send the SMS
      let result;
      if (options.channel === 'whatsapp') {
        result = await whatsappClient.sendTextMessage(phone, message);
      } else {
        result = await smsClient.sendTextMessage(phone, message);
      }

      // Log action
      await logAction({
        action: 'payment_confirmation_sent',
        resourceType: 'payment',
        resourceId: paymentResult.transactionId,
        metadata: { 
          status: paymentResult.status,
          amount,
          currency,
          phone
        }
      });

      return result.success;
    } catch (error: any) {
      console.error('Failed to send payment confirmation:', error);
      return false;
    }
  }

  /**
   * Send payment status update
   */
  async sendPaymentStatusUpdate(
    phone: string,
    status: string,
    transactionId: string,
    options: {
      amount: number;
      currency: string;
      businessName?: string;
      language?: string;
    }
  ): Promise<boolean> {
    try {
      const { 
        amount, currency, 
        businessName = 'Our Business',
        language = 'en'
      } = options;

      // Format amount
      const formatter = new Intl.NumberFormat(language, {
        style: 'currency',
        currency: currency
      });
      const formattedAmount = formatter.format(amount/100);
      
      // Status message
      let statusMsg: string;
      switch (status.toLowerCase()) {
        case 'succeeded':
        case 'success':
        case 'completed':
          statusMsg = 'Payment successful';
          break;
        case 'failed':
          statusMsg = 'Payment failed';
          break;
        case 'pending':
          statusMsg = 'Payment pending';
          break;
        case 'refunded':
          statusMsg = 'Payment refunded';
          break;
        default:
          statusMsg = `Payment status: ${status}`;
      }

      const message = `${statusMsg} for ${formattedAmount} to ${businessName}. Transaction ID: ${transactionId}`;
      
      // Send the SMS
      let result;
      if (options.channel === 'whatsapp') {
        result = await whatsappClient.sendTextMessage(phone, message);
      } else {
        result = await smsClient.sendTextMessage(phone, message);
      }

      // Log action
      await logAction({
        action: 'payment_status_update_sent',
        resourceType: 'payment',
        resourceId: transactionId,
        metadata: { 
          status,
          amount,
          currency,
          phone
        }
      });

      return result.success;
    } catch (error: any) {
      console.error('Failed to send payment status update:', error);
      return false;
    }
  }
}

// Export singleton instance
const paymentNotification = new PaymentNotificationService();
export default paymentNotification;
