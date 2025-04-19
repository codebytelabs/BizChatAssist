import axios from 'axios';
import { supabaseAdmin } from '../utils/supabase';

// WhatsApp Business API client
export class WhatsAppClient {
  private apiVersion: string;
  private baseUrl: string;
  private accessToken: string;

  constructor() {
    this.apiVersion = 'v17.0';
    this.baseUrl = 'https://graph.facebook.com';
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || '';
    
    if (!this.accessToken) {
      console.warn('WhatsApp access token not found. Please set WHATSAPP_ACCESS_TOKEN in your environment variables.');
    }
  }

  /**
   * Send a text message to a WhatsApp number
   */
  async sendTextMessage(phoneNumberId: string, to: string, message: string) {
    try {
      if (!this.accessToken) {
        throw new Error('WhatsApp access token not configured');
      }
      
      const url = `${this.baseUrl}/${this.apiVersion}/${phoneNumberId}/messages`;
      
      const response = await axios.post(
        url,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to,
          type: 'text',
          text: { body: message }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      );
      
      // Log the action in audit_logs
      await supabaseAdmin.from('audit_logs').insert({
        action: 'whatsapp_message_sent',
        resource_type: 'message',
        metadata: {
          to,
          messageId: response.data?.messages?.[0]?.id,
          status: response.status
        }
      });
      
      return response.data;
    } catch (error: any) {
      console.error('Error sending WhatsApp message:', error);
      
      // Log the error
      await supabaseAdmin.from('audit_logs').insert({
        action: 'whatsapp_message_error',
        metadata: {
          to,
          error: error.message,
          status: error.response?.status
        }
      });
      
      throw error;
    }
  }
  
  /**
   * Send an image message to a WhatsApp number
   */
  async sendImageMessage(phoneNumberId: string, to: string, imageUrl: string, caption?: string) {
    try {
      if (!this.accessToken) {
        throw new Error('WhatsApp access token not configured');
      }
      
      const url = `${this.baseUrl}/${this.apiVersion}/${phoneNumberId}/messages`;
      
      const response = await axios.post(
        url,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to,
          type: 'image',
          image: {
            link: imageUrl,
            caption: caption || ''
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      );
      
      await supabaseAdmin.from('audit_logs').insert({
        action: 'whatsapp_image_sent',
        resource_type: 'message',
        metadata: {
          to,
          messageId: response.data?.messages?.[0]?.id,
          imageUrl,
          status: response.status
        }
      });
      
      return response.data;
    } catch (error: any) {
      console.error('Error sending WhatsApp image:', error);
      
      // Log the error
      await supabaseAdmin.from('audit_logs').insert({
        action: 'whatsapp_message_error',
        metadata: {
          to,
          type: 'image',
          error: error.message,
          status: error.response?.status
        }
      });
      
      throw error;
    }
  }
  
  /**
   * Send a template message to a WhatsApp number
   */
  async sendTemplateMessage(phoneNumberId: string, to: string, templateName: string, components?: any[]) {
    try {
      if (!this.accessToken) {
        throw new Error('WhatsApp access token not configured');
      }
      
      const url = `${this.baseUrl}/${this.apiVersion}/${phoneNumberId}/messages`;
      
      const response = await axios.post(
        url,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to,
          type: 'template',
          template: {
            name: templateName,
            language: { code: 'en' },
            components
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      );
      
      await supabaseAdmin.from('audit_logs').insert({
        action: 'whatsapp_template_sent',
        resource_type: 'message',
        metadata: {
          to,
          messageId: response.data?.messages?.[0]?.id,
          templateName,
          status: response.status
        }
      });
      
      return response.data;
    } catch (error: any) {
      console.error('Error sending WhatsApp template:', error);
      
      // Log the error
      await supabaseAdmin.from('audit_logs').insert({
        action: 'whatsapp_message_error',
        metadata: {
          to,
          type: 'template',
          error: error.message,
          status: error.response?.status
        }
      });
      
      throw error;
    }
  }
  
  /**
   * Mark a message as read
   */
  async markMessageAsRead(phoneNumberId: string, messageId: string) {
    try {
      if (!this.accessToken) {
        throw new Error('WhatsApp access token not configured');
      }
      
      const url = `${this.baseUrl}/${this.apiVersion}/${phoneNumberId}/messages`;
      
      const response = await axios.post(
        url,
        {
          messaging_product: 'whatsapp',
          status: 'read',
          message_id: messageId
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const whatsappClient = new WhatsAppClient();
export default whatsappClient;
