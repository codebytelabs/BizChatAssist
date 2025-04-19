/**
 * WhatsApp Client Service
 * Handles communication with WhatsApp Business API
 */
import axios from 'axios';
import { SecurityVault } from '../utilities/vault';
import { logAction } from '../security/audit';
import { 
  WhatsAppMessage, 
  WhatsAppMessageResponse, 
  WhatsAppMessageOptions,
  WhatsAppProfile,
  WhatsAppTemplateMessage 
} from './types';

class WhatsAppClient {
  private apiVersion = 'v17.0';
  private baseUrl: string;
  private phoneNumberId: string;
  private accessToken: string;

  constructor() {
    // In production, these would be retrieved from the SecurityVault
    this.baseUrl = 'https://graph.facebook.com';
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || '';
  }

  /**
   * Initialize the client with secure credentials
   */
  async initialize() {
    try {
      // In a real implementation, retrieve encrypted credentials
      // this.phoneNumberId = await SecurityVault.decryptSecret('WHATSAPP_PHONE_ID');
      // this.accessToken = await SecurityVault.decryptSecret('WHATSAPP_TOKEN');
      
      return true;
    } catch (error: any) {
      console.error('WhatsApp client initialization failed:', error);
      await logAction({
        action: 'whatsapp_client_init_failed',
        metadata: { error: error.message || 'Unknown error' }
      });
      return false;
    }
  }

  /**
   * Send a text message to a WhatsApp number
   */
  async sendTextMessage(to: string, text: string): Promise<WhatsAppMessageResponse | null> {
    const url = `${this.baseUrl}/${this.apiVersion}/${this.phoneNumberId}/messages`;
    
    const data = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'text',
      text: { body: text }
    };

    try {
      const response = await axios.post(url, data, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      await logAction({
        action: 'whatsapp_message_sent',
        metadata: { to, messageType: 'text' }
      });

      return response.data;
    } catch (error: any) {
      console.error('Failed to send WhatsApp message:', error);
      await logAction({
        action: 'whatsapp_message_failed',
        metadata: { to, error: error.message || 'Unknown error' }
      });
      return null;
    }
  }

  /**
   * Send a template message (for payment requests, appointment reminders, etc.)
   */
  async sendTemplateMessage(
    to: string, 
    templateName: string, 
    languageCode: string = 'en_US',
    components: any[] = []
  ): Promise<WhatsAppMessageResponse | null> {
    const url = `${this.baseUrl}/${this.apiVersion}/${this.phoneNumberId}/messages`;
    
    const data = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: languageCode
        },
        components
      }
    };

    try {
      const response = await axios.post(url, data, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      await logAction({
        action: 'whatsapp_template_sent',
        metadata: { to, template: templateName }
      });

      return response.data;
    } catch (error: any) {
      console.error(`Failed to send WhatsApp template ${templateName}:`, error);
      await logAction({
        action: 'whatsapp_template_failed',
        metadata: { to, template: templateName, error: error.message || 'Unknown error' }
      });
      return null;
    }
  }

  /**
   * Send a payment request via WhatsApp
   * This uses UPI for Indian businesses
   */
  async sendPaymentRequest(
    to: string,
    businessName: string,
    amount: number,
    currency: string = 'INR',
    description: string = 'Payment request'
  ): Promise<WhatsAppMessageResponse | null> {
    // First send a payment template message
    const components = [
      {
        type: 'header',
        parameters: [
          {
            type: 'text',
            text: businessName
          }
        ]
      },
      {
        type: 'body',
        parameters: [
          {
            type: 'currency',
            currency: {
              code: currency,
              amount: amount * 100 // Amount in hundredths
            }
          },
          {
            type: 'text',
            text: description
          }
        ]
      }
    ];

    return this.sendTemplateMessage(to, 'payment_request', 'en_IN', components);
  }

  /**
   * Send an image message
   */
  async sendImageMessage(to: string, imageUrl: string, caption?: string): Promise<WhatsAppMessageResponse | null> {
    const url = `${this.baseUrl}/${this.apiVersion}/${this.phoneNumberId}/messages`;
    
    const data = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'image',
      image: {
        link: imageUrl,
        caption
      }
    };

    try {
      const response = await axios.post(url, data, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      await logAction({
        action: 'whatsapp_image_sent',
        metadata: { to }
      });

      return response.data;
    } catch (error: any) {
      console.error('Failed to send WhatsApp image:', error);
      await logAction({
        action: 'whatsapp_image_failed',
        metadata: { to, error: error.message || 'Unknown error' }
      });
      return null;
    }
  }

  /**
   * Send a document (e.g., PDF invoice)
   */
  async sendDocument(
    to: string, 
    documentUrl: string, 
    filename: string, 
    caption?: string
  ): Promise<WhatsAppMessageResponse | null> {
    const url = `${this.baseUrl}/${this.apiVersion}/${this.phoneNumberId}/messages`;
    
    const data = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'document',
      document: {
        link: documentUrl,
        caption,
        filename
      }
    };

    try {
      const response = await axios.post(url, data, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      await logAction({
        action: 'whatsapp_document_sent',
        metadata: { to, filename }
      });

      return response.data;
    } catch (error: any) {
      console.error('Failed to send WhatsApp document:', error);
      await logAction({
        action: 'whatsapp_document_failed',
        metadata: { to, filename, error: error.message || 'Unknown error' }
      });
      return null;
    }
  }

  /**
   * Send UPI QR code as image
   * For accepting payments via WhatsApp
   */
  async sendUpiQrCode(
    to: string,
    qrCodeDataUrl: string,
    amount: number,
    businessName: string
  ): Promise<WhatsAppMessageResponse | null> {
    // First send contextual message
    await this.sendTextMessage(
      to,
      `Please scan the following QR code to pay ${amount} INR to ${businessName} via UPI`
    );
    
    // Then send the QR code as image
    return this.sendImageMessage(
      to,
      qrCodeDataUrl,
      `Payment: ${amount} INR to ${businessName}`
    );
  }

  /**
   * Mark a message as read
   */
  async markMessageAsRead(messageId: string): Promise<boolean> {
    const url = `${this.baseUrl}/${this.apiVersion}/${this.phoneNumberId}/messages`;
    
    const data = {
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId
    };

    try {
      await axios.post(url, data, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      return true;
    } catch (error: any) {
      console.error('Failed to mark message as read:', error);
      return false;
    }
  }

  /**
   * Get WhatsApp Business Profile information
   */
  async getBusinessProfile(): Promise<WhatsAppProfile | null> {
    const url = `${this.baseUrl}/${this.apiVersion}/${this.phoneNumberId}/whatsapp_business_profile`;
    
    try {
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        },
        params: {
          fields: 'about,address,description,email,profile_picture_url,websites,vertical'
        }
      });

      return response.data;
    } catch (error: any) {
      console.error('Failed to get WhatsApp business profile:', error);
      return null;
    }
  }
}

// Export singleton instance
const whatsappClient = new WhatsAppClient();
export default whatsappClient;
