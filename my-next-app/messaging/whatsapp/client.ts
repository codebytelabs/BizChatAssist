/**
 * WhatsApp Client for BizChatAssist
 * Integrates with Twilio or Meta WhatsApp Business API for messaging
 * This is a stub—add your provider integration as needed
 */
import { MessageSendResult } from '../types';

import twilio from 'twilio';

export class WhatsAppClient {
  private client: ReturnType<typeof twilio>;
  private fromWhatsApp: string;
  private fromSMS: string;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    this.fromWhatsApp = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886'; // Twilio sandbox default
    this.fromSMS = process.env.TWILIO_SMS_NUMBER || '';
    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials are not set in environment variables');
    }
    this.client = twilio(accountSid, authToken);
  }

  /**
   * Send a WhatsApp text message
   */
  async sendTextMessage(to: string, text: string): Promise<MessageSendResult> {
    try {
      const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
      const message = await this.client.messages.create({
        from: this.fromWhatsApp,
        to: formattedTo,
        body: text
      });
      return { success: true, messageId: message.sid };
    } catch (error: any) {
      console.error('Twilio WhatsApp send error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send an SMS text message via Twilio (alternative to MSG91)
   */
  async sendSMS(to: string, text: string): Promise<MessageSendResult> {
    try {
      if (!this.fromSMS) throw new Error('Twilio SMS number is not set');
      const message = await this.client.messages.create({
        from: this.fromSMS,
        to,
        body: text
      });
      return { success: true, messageId: message.sid };
    } catch (error: any) {
      console.error('Twilio SMS send error:', error);
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
const whatsappClient = new WhatsAppClient();
export default whatsappClient;
