/**
 * SMS Client for BizChatAssist
 * Integrates with MSG91 for SMS delivery in India
 */
import axios from 'axios';
import { MessageChannel, MessageChannelType, MessageSendResult, StandardizedMessage } from '../types';
import { logAction } from '../../security/audit';
import supabase from '../../utilities/supabase';
import { v4 as uuidv4 } from 'uuid';
// @ts-ignore
// If you see a TypeScript error about uuid, install types: npm i --save-dev @types/uuid
import twilio from 'twilio';

export class SMSClient implements MessageChannel {
  private apiKey: string;
  private senderId: string; // 6-character sender ID for Indian SMS
  private flowId: string; // MSG91 flow ID for template messages
  private isInitialized: boolean = false;

  // Twilio support
  private twilioClient: ReturnType<typeof twilio> | null = null;
  private twilioFromSMS: string = '';

  constructor() {
    this.apiKey = process.env.MSG91_API_KEY || '';
    this.senderId = process.env.MSG91_SENDER_ID || 'BIZCHAT'; // Default sender ID
    this.flowId = process.env.MSG91_FLOW_ID || '';

    // Twilio setup
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioToken = process.env.TWILIO_AUTH_TOKEN;
    this.twilioFromSMS = process.env.TWILIO_SMS_NUMBER || '';
    if (twilioSid && twilioToken) {
      this.twilioClient = twilio(twilioSid, twilioToken);
    }
  }

  /**
   * Initialize SMS client with credentials
   */
  async initialize(): Promise<boolean> {
    try {
      if (!this.apiKey || !this.senderId) {
        console.error('SMS client initialization failed: Missing API key or sender ID');
        return false;
      }

      // Verify API key with a test call
      const response = await axios.get(
        `https://api.msg91.com/api/v5/balance?authkey=${this.apiKey}`
      );

      if (response.data && response.data.status === 'success') {
        this.isInitialized = true;
        return true;
      }

      return false;
    } catch (error: any) {
      console.error('SMS client initialization failed:', error);
      await logAction({
        action: 'sms_client_init_failed',
        metadata: { error: (error as Error).message || 'Unknown error' }
      });
      return false;
    }
  }

  /**
   * Send a text message via SMS
   */
  async sendTextMessage(to: string, text: string): Promise<MessageSendResult> {
    if (!this.isInitialized && !(await this.initialize())) {
      return { success: false, error: 'SMS client not initialized' };
    }

    try {
      // Format phone number for India (remove any + prefix)
      const formattedPhone = to.replace(/^\+/, '');
      
      // Ensure text is within SMS character limit
      const smsText = text.length > 160 ? text.substring(0, 157) + '...' : text;

      // Check if business has SMS quota available
      // In production, we would look up the business associated with this number
      const businessId = await this.getBusinessIdForSMS(to);
      
      if (businessId) {
        const hasQuota = await this.checkAndDeductSMSQuota(businessId);
        if (!hasQuota) {
          return { 
            success: false, 
            error: 'SMS quota exhausted for the day or month' 
          };
        }
      }

      // Send SMS via MSG91 API
      const response = await axios.post(
        'https://api.msg91.com/api/v5/flow/',
        {
          flow_id: this.flowId,
          sender: this.senderId,
          mobiles: formattedPhone,
          VAR1: smsText // Template variable
        },
        {
          headers: {
            'authkey': this.apiKey,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data && response.data.type === 'success') {
        return { success: true, messageId: response.data.message || 'msg91' };
      } else {
        return { success: false, error: response.data.message || 'SMS send failed' };
      }
    } catch (error: any) {
      console.error('SMS sending error:', error);
      await logAction({
        action: 'sms_send_failed',
        metadata: { to, error: error.message || 'Unknown error' }
      });
      return { 
        success: false, 
        error: error.message || 'Failed to send SMS' 
      };
    }
  }

  /**
   * Send a template message via SMS
   * For SMS, this is simplified compared to WhatsApp templates
   */
  async sendTemplateMessage(
    to: string,
    templateName: string,
    parameters: Record<string, any>
  ): Promise<MessageSendResult> {
    try {
      // Get the SMS template from database
      const { data: template, error } = await supabase
        .from('sms_templates')
        .select('content')
        .eq('name', templateName)
        .single();

      if (error || !template) {
        return {
          success: false,
          error: `Template not found: ${templateName}`
        };
      }

      // Replace variables in template (format: {{variable}})
      let messageText = template.content;
      for (const [key, value] of Object.entries(parameters)) {
        messageText = messageText.replace(
          new RegExp(`{{${key}}}`, 'g'),
          value.toString()
        );
      }

      // Send as regular text message
      return this.sendTextMessage(to, messageText);
    } catch (error: any) {
      console.error('SMS template error:', error);
      return {
        success: false,
        error: error.message || 'Failed to send template SMS'
      };
    }
  }

  /**
   * Process incoming SMS message from webhook
   */
  async processIncomingMessage(payload: any): Promise<boolean> {
    try {
      // Extract SMS details from payload
      // NOTE: format will depend on your SMS provider's webhook format
      const { mobile, message, datetime, requestId } = payload;

      if (!mobile || !message) {
        console.error('Invalid SMS webhook payload:', payload);
        return false;
      }

      // Create standardized message format
      const standardMessage: StandardizedMessage = {
        id: requestId || uuidv4(),
        from: mobile,
        timestamp: datetime || new Date().toISOString(),
        type: 'text',
        text: { body: message },
        channel: 'sms'
      };

      // Log incoming message
      await logAction({
        action: 'sms_received',
        metadata: { from: mobile, length: message.length }
      });

      // In production, this would forward to unified message handler
      // await universalMessageHandler.processMessage(standardMessage);
      
      // For now, just store in database
      await this.saveMessageToDatabase(standardMessage);

      return true;
    } catch (error: any) {
      console.error('Error processing SMS:', error);
      await logAction({
        action: 'sms_processing_error',
        metadata: { error: error.message || 'Unknown error' }
      });
      return false;
    }
  }

  /**
   * Get channel type
   */
  getChannelType(): MessageChannelType {
    return 'sms';
  }

  /**
   * Save SMS message to database
   */
  private async saveMessageToDatabase(message: StandardizedMessage): Promise<boolean> {
    try {
      const { from, text, id, timestamp } = message;

      // Get or create conversation
      const conversationId = await this.findOrCreateConversation(from);

      // Save message to messages table
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_type: 'customer',
          content: text?.body || '',
          message_type: 'text',
          whatsapp_message_id: id,
          delivery_status: 'delivered',
          channel_type: 'sms'
        });

      if (error) {
        throw new Error(`Failed to save SMS message: ${error.message}`);
      }

      return true;
    } catch (error: any) {
      console.error('Error saving SMS to database:', error);
      return false;
    }
  }

  /**
   * Find or create conversation for SMS
   */
  private async findOrCreateConversation(phone: string): Promise<string> {
    try {
      // For demo purposes, use a default business ID
      // In production, this would lookup which business this number belongs to
      const defaultBusinessId = process.env.DEFAULT_BUSINESS_ID || '00000000-0000-0000-0000-000000000000';

      // Look for existing conversation
      const { data: existingConversation, error } = await supabase
        .from('conversations')
        .select('id')
        .eq('customer_phone', phone)
        .eq('business_id', defaultBusinessId)
        .eq('channel_type', 'sms')
        .eq('status', 'active')
        .order('last_message_at', { ascending: false })
        .limit(1)
        .single();

      if (!error && existingConversation) {
        // Update last message timestamp
        await supabase
          .from('conversations')
          .update({ last_message_at: new Date().toISOString() })
          .eq('id', existingConversation.id);
          
        return existingConversation.id;
      }

      // Create new conversation
      const { data: newConversation, error: insertError } = await supabase
        .from('conversations')
        .insert({
          business_id: defaultBusinessId,
          customer_phone: phone,
          status: 'active',
          channel_type: 'sms',
          last_message_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError || !newConversation) {
        throw new Error(`Failed to create conversation: ${insertError?.message || 'Unknown error'}`);
      }

      return newConversation.id;
    } catch (error: any) {
      console.error('Error with SMS conversation:', error);
      throw error;
    }
  }

  /**
   * Check and deduct from SMS quota
   */
  private async checkAndDeductSMSQuota(businessId: string): Promise<boolean> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const currentMonth = today.substring(0, 7); // YYYY-MM format
      
      // Check if business has SMS enabled
      const { data: business, error: bizError } = await supabase
        .from('businesses')
        .select('sms_enabled, sms_daily_limit, sms_monthly_quota')
        .eq('id', businessId)
        .single();
        
      if (bizError || !business || !business.sms_enabled) {
        return false;
      }
      
      // Get current usage
      const { data: usage, error: usageError } = await supabase
        .from('sms_usage')
        .select('id, count')
        .eq('business_id', businessId)
        .eq('date', today)
        .single();
        
      // If no record for today, create one
      if (usageError || !usage) {
        // But first check monthly quota
        const { data: monthUsage, error: monthError } = await supabase
          .from('sms_usage')
        const { error: insertError } = await supabase
          .from('sms_usage')
          .insert({
            business_id: businessId,
            date: today,
            count: 1
          });
          
        return !insertError;
      }
      
      // Check daily limit
      if (usage.count >= business.sms_daily_limit) {
        return false; // Daily limit reached
      }
      
      // Increment count
      const { error: updateError } = await supabase
        .from('sms_usage')
        .update({ count: usage.count + 1 })
        .eq('id', usage.id);
        
      return !updateError;
    } catch (error: any) {
      console.error('Error checking SMS quota:', error);
      return false;
    }
  }

  /**
   * Get business ID for a phone number
   * In production, this would lookup which business this SMS is for
   */
  private async getBusinessIdForSMS(phone: string): Promise<string | null> {
    // For demo, use default business ID
    return process.env.DEFAULT_BUSINESS_ID || null;
  }
}

// Export singleton instance
const smsClient = new SMSClient();
export default smsClient;
