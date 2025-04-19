import twilio from 'twilio';
import { supabaseAdmin } from '../utils/supabase';

// Twilio client for WhatsApp and SMS messaging
class TwilioClient {
  private client: any;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    
    if (!accountSid || !authToken) {
      console.warn('Twilio credentials not found. Please check your environment variables.');
    } else {
      this.client = twilio(accountSid, authToken);
    }
  }

  /**
   * Send a WhatsApp message
   */
  async sendWhatsAppMessage(to: string, message: string) {
    try {
      if (!this.client) {
        throw new Error('Twilio client not initialized');
      }
      
      // Ensure the recipient number has WhatsApp: prefix for Twilio
      const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
      
      const response = await this.client.messages.create({
        from: process.env.TWILIO_WHATSAPP_NUMBER,
        to: formattedTo,
        body: message
      });
      
      // Log the action in audit_logs
      await supabaseAdmin.from('audit_logs').insert({
        action: 'whatsapp_message_sent',
        resource_type: 'message',
        metadata: {
          to,
          messageId: response.sid,
          status: response.status
        }
      });
      
      return {
        success: true,
        messageId: response.sid,
        status: response.status
      };
    } catch (error: any) {
      console.error('Error sending WhatsApp message:', error);
      
      // Log the error
      await supabaseAdmin.from('audit_logs').insert({
        action: 'whatsapp_message_error',
        metadata: {
          to,
          error: error.message
        }
      });
      
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Send a WhatsApp message with media
   */
  async sendWhatsAppMedia(to: string, mediaUrl: string, caption?: string) {
    try {
      if (!this.client) {
        throw new Error('Twilio client not initialized');
      }
      
      // Ensure the recipient number has WhatsApp: prefix for Twilio
      const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
      
      const response = await this.client.messages.create({
        from: process.env.TWILIO_WHATSAPP_NUMBER,
        to: formattedTo,
        body: caption || '',
        mediaUrl: [mediaUrl]
      });
      
      // Log the action in audit_logs
      await supabaseAdmin.from('audit_logs').insert({
        action: 'whatsapp_media_sent',
        resource_type: 'message',
        metadata: {
          to,
          messageId: response.sid,
          mediaUrl,
          status: response.status
        }
      });
      
      return {
        success: true,
        messageId: response.sid,
        status: response.status
      };
    } catch (error: any) {
      console.error('Error sending WhatsApp media:', error);
      
      // Log the error
      await supabaseAdmin.from('audit_logs').insert({
        action: 'whatsapp_message_error',
        metadata: {
          to,
          type: 'media',
          error: error.message
        }
      });
      
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Send an SMS message
   */
  async sendSMS(to: string, message: string) {
    try {
      if (!this.client) {
        throw new Error('Twilio client not initialized');
      }
      
      const response = await this.client.messages.create({
        from: process.env.TWILIO_PHONE_NUMBER,
        to,
        body: message
      });
      
      // Log the action in audit_logs
      await supabaseAdmin.from('audit_logs').insert({
        action: 'sms_sent',
        resource_type: 'message',
        metadata: {
          to,
          messageId: response.sid,
          status: response.status
        }
      });
      
      return {
        success: true,
        messageId: response.sid,
        status: response.status
      };
    } catch (error: any) {
      console.error('Error sending SMS:', error);
      
      // Log the error
      await supabaseAdmin.from('audit_logs').insert({
        action: 'sms_error',
        metadata: {
          to,
          error: error.message
        }
      });
      
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Export singleton instance
export const twilioClient = new TwilioClient();
export default twilioClient;
