/**
 * Universal Message Handler
 * Processes messages from both WhatsApp and SMS channels
 */
import { MessageChannel, MessageChannelType, StandardizedMessage } from './types';
import whatsappClient from '../whatsapp/client';
import smsClient from './sms/client';
import supabase from '../utilities/supabase';
import { logAction } from '../security/audit';
import { UPIAdapter } from '../payment/adapters/upi';

export class UniversalMessageHandler {
  private channels: Map<MessageChannelType, MessageChannel>;
  private upiAdapter: UPIAdapter;
  
  constructor() {
    // Initialize messaging channels
    this.channels = new Map();
    this.channels.set('whatsapp', whatsappClient);
    this.channels.set('sms', smsClient);
    
    // Initialize payment adapter
    this.upiAdapter = new UPIAdapter();
  }
  
  /**
   * Process an incoming message from any channel
   */
  async processMessage(message: StandardizedMessage): Promise<boolean> {
    try {
      // Log the incoming message
      await logAction({
        action: `${message.channel}_message_received`,
        metadata: { 
          from: message.from, 
          type: message.type,
          messageId: message.id
        }
      });
      
      // Find or create a conversation for this contact
      const conversation = await this.findOrCreateConversation(
        message.from,
        message.channel
      );
      
      // Save the message to the database
      await this.saveMessageToDatabase(message, conversation.id);
      
      // Process the message based on type and content
      if (message.type === 'text' && message.text) {
        return await this.handleTextMessage(message, conversation);
      } else if (message.type === 'image' && message.image) {
        return await this.handleImageMessage(message, conversation);
      } else if (message.type === 'document' && message.document) {
        return await this.handleDocumentMessage(message, conversation);
      } else if (message.type === 'location' && message.location) {
        return await this.handleLocationMessage(message, conversation);
      } else if (message.type === 'button' && message.button) {
        return await this.handleButtonMessage(message, conversation);
      } else if (message.type === 'template') {
        return await this.handleTemplateMessage(message, conversation);
      }
      
      // Default response for unsupported message types
      await this.sendMessage(
        message.from,
        message.channel,
        "I'm sorry, I can't process this type of message yet."
      );
      
      return true;
    } catch (error: any) {
      console.error('Error processing message:', error);
      await logAction({
        action: 'message_processing_error',
        metadata: { 
          error: error.message || 'Unknown error', 
          messageId: message.id 
        }
      });
      return false;
    }
  }
  
  /**
   * Find or create a conversation for this contact
   */
  private async findOrCreateConversation(
    phoneNumber: string,
    channel: MessageChannelType
  ) {
    // Extract business ID from phone number (in production this would use a lookup)
    // For demo purposes we'll use a default business ID
    const defaultBusinessId = process.env.DEFAULT_BUSINESS_ID || '00000000-0000-0000-0000-000000000000';
    
    // Try to find an existing conversation
    const { data: existingConversation, error } = await supabase
      .from('conversations')
      .select('id, status, business_id, customer_name')
      .eq('customer_phone', phoneNumber)
      .eq('business_id', defaultBusinessId)
      .eq('channel_type', channel)
      .eq('status', 'active')
      .order('last_message_at', { ascending: false })
      .limit(1)
      .single();
      
    if (!error && existingConversation) {
      // Update the last message timestamp
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', existingConversation.id);
        
      return existingConversation;
    }
    
    // Create a new conversation
    const { data: newConversation, error: insertError } = await supabase
      .from('conversations')
      .insert({
        business_id: defaultBusinessId,
        customer_phone: phoneNumber,
        status: 'active',
        channel_type: channel,
        last_message_at: new Date().toISOString()
      })
      .select()
      .single();
      
    if (insertError) {
      throw new Error(`Failed to create conversation: ${insertError.message}`);
    }
    
    return newConversation;
  }
  
  /**
   * Save message to the database
   */
  private async saveMessageToDatabase(
    message: StandardizedMessage, 
    conversationId: string
  ) {
    let content = '';
    let mediaUrl = '';
    let messageType = 'text';
    
    // Extract content based on message type
    if (message.type === 'text' && message.text) {
      content = message.text.body;
    } else if (message.type === 'image' && message.image) {
      content = message.image.caption || 'Image received';
      mediaUrl = message.image.url || '';
      messageType = 'image';
    } else if (message.type === 'document' && message.document) {
      content = message.document.caption || message.document.filename || 'Document received';
      mediaUrl = message.document.url || '';
      messageType = 'document';
    } else if (message.type === 'location' && message.location) {
      content = message.location.name || `Location: ${message.location.latitude}, ${message.location.longitude}`;
      messageType = 'location';
    } else if (message.type === 'button' && message.button) {
      content = `Button clicked: ${message.button.text}`;
      messageType = 'button';
    }
    
    // Insert the message into the database
    const { error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_type: 'customer',
        content,
        media_url: mediaUrl,
        message_type: messageType,
        whatsapp_message_id: message.id,
        delivery_status: 'read',
        channel_type: message.channel
      });
      
    if (error) {
      throw new Error(`Failed to save message: ${error.message}`);
    }
  }
  
  /**
   * Send a message to a specific channel
   */
  private async sendMessage(
    to: string,
    channel: MessageChannelType,
    content: string
  ): Promise<boolean> {
    const channelClient = this.channels.get(channel);
    if (!channelClient) {
      console.error(`Unsupported channel: ${channel}`);
      return false;
    }
    
    const result = await channelClient.sendTextMessage(to, content);
    
    // Save outgoing message to database
    if (result.success) {
      await this.saveOutgoingMessage(to, channel, content, result.messageId);
    }
    
    return result.success;
  }
  
  /**
   * Save outgoing message to database
   */
  private async saveOutgoingMessage(
    to: string,
    channel: MessageChannelType,
    content: string,
    messageId?: string
  ) {
    try {
      // Find conversation
      const { data: conversation, error } = await supabase
        .from('conversations')
        .select('id')
        .eq('customer_phone', to)
        .eq('channel_type', channel)
        .eq('status', 'active')
        .order('last_message_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error || !conversation) {
        console.error('Failed to find conversation for outgoing message');
        return;
      }
      
      // Save message
      await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          sender_type: 'business',
          content,
          message_type: 'text',
          whatsapp_message_id: messageId,
          delivery_status: 'sent',
          channel_type: channel
        });
        
      // Update conversation last message time
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversation.id);
    } catch (error: any) {
      console.error('Error saving outgoing message:', error);
    }
  }
  
  /**
   * Handle text messages
   */
  private async handleTextMessage(
    message: StandardizedMessage, 
    conversation: any
  ): Promise<boolean> {
    if (!message.text) return false;
    
    const text = message.text.body.toLowerCase();
    
    // For SMS, check for simple numeric responses
    if (message.channel === 'sms' && /^[1-9]\d*$/.test(text.trim())) {
      return await this.handleNumericSMSResponse(message, conversation, parseInt(text.trim(), 10));
    }
    
    // Check for payment-related keywords
    if (text.includes('pay') || text.includes('payment') || text.includes('upi') || text.includes('money')) {
      return await this.handlePaymentRequest(message, conversation);
    }
    
    // Check for order-related keywords
    if (text.includes('order') || text.includes('buy') || text.includes('purchase')) {
      return await this.handleOrderRequest(message, conversation);
    }
    
    // Check for price-related keywords
    if (text.includes('price') || text.includes('cost') || text.includes('rate') || text.includes('how much')) {
      return await this.handlePriceRequest(message, conversation);
    }
    
    // Channel-specific default responses
    if (message.channel === 'sms') {
      return await this.sendMessage(
        message.from,
        message.channel,
        "Thank you for your message. Reply with: 1-Products, 2-Prices, 3-Pay"
      );
    } else {
      return await this.sendMessage(
        message.from,
        message.channel,
        "Thank you for your message. How can I help you today? You can ask about our products, prices, or place an order."
      );
    }
  }
  
  /**
   * Handle numeric SMS responses (menu selections)
   */
  private async handleNumericSMSResponse(
    message: StandardizedMessage,
    conversation: any,
    selection: number
  ): Promise<boolean> {
    switch (selection) {
      case 1: // Products
        return await this.handleOrderRequest(message, conversation);
        
      case 2: // Prices
        return await this.handlePriceRequest(message, conversation);
        
      case 3: // Payment
        return await this.handlePaymentRequest(message, conversation);
        
      default:
        await this.sendMessage(
          message.from,
          'sms',
          "Invalid selection. Reply with: 1-Products, 2-Prices, 3-Pay"
        );
        return true;
    }
  }
  
  /**
   * Handle payment requests
   */
  private async handlePaymentRequest(
    message: StandardizedMessage,
    conversation: any
  ): Promise<boolean> {
    try {
      // Get business details
      const { data: business, error: bizError } = await supabase
        .from('businesses')
        .select('id, name, upi_id')
        .eq('id', conversation.business_id)
        .single();
        
      if (bizError || !business?.upi_id) {
        throw new Error('Business UPI ID not configured');
      }
      
      // For demo purposes, use a fixed amount
      // In production, we would parse the amount from the message or lookup from an order
      const amount = 499;
      
      // Different payment flows for different channels
      if (message.channel === 'whatsapp') {
        // Generate UPI QR code
        const result = await this.upiAdapter.generateQR({
          businessId: business.id,
          conversationId: conversation.id,
          customerPhone: message.from,
          amount,
          currency: 'INR',
          upiId: business.upi_id,
          description: `Payment to ${business.name}`
        });
        
        // Send QR code via WhatsApp
        const whatsapp = this.channels.get('whatsapp') as any;
        await whatsapp.sendUpiQrCode(
          message.from,
          result.qrCode,
          amount,
          business.name
        );
        
        // Send follow-up instructions
        await this.sendMessage(
          message.from,
          'whatsapp',
          `Please scan this QR code using any UPI app to pay ₹${amount}. Your payment will be confirmed automatically.`
        );
      } else {
        // For SMS, we send a payment link instead of QR code
        // Generate a short payment link
        const paymentLink = `https://pay.bizchat.app/${business.id}/${conversation.id}/${amount}`;
        
        // Send payment link via SMS
        await this.sendMessage(
          message.from,
          'sms',
          `To pay ₹${amount} to ${business.name}, click this secure link: ${paymentLink}`
        );
        
        // Register pending payment in database
        await this.upiAdapter.generateQR({
          businessId: business.id,
          conversationId: conversation.id,
          customerPhone: message.from,
          amount,
          currency: 'INR',
          upiId: business.upi_id,
          description: `SMS payment to ${business.name}`
        });
      }
      
      return true;
    } catch (error: any) {
      console.error('Payment request error:', error);
      
      // Send error message
      await this.sendMessage(
        message.from,
        message.channel,
        "I'm sorry, there was a problem processing your payment request. Please try again later."
      );
      
      return false;
    }
  }
  
  /**
   * Handle order requests
   */
  private async handleOrderRequest(
    message: StandardizedMessage,
    conversation: any
  ): Promise<boolean> {
    // Get products from database (in production)
    // For now, use hardcoded products
    const products = [
      { name: "Product A", price: 499 },
      { name: "Product B", price: 999 },
      { name: "Product C", price: 1499 }
    ];
    
    // Format product list for display
    const productList = products.map(p => `- ${p.name}: ₹${p.price}`).join("\n");
    
    // Send channel-specific responses
    if (message.channel === 'sms') {
      // For SMS, keep it brief
      await this.sendMessage(
        message.from,
        'sms',
        `Products:\n${productList}\nReply with product name & qty (e.g. 'A 2')`
      );
    } else {
      // For WhatsApp, we can be more verbose
      await this.sendMessage(
        message.from,
        'whatsapp',
        `Thank you for your interest in placing an order. Here are our popular products:\n\n${productList}\n\nTo order, please reply with the product name and quantity (e.g., "2 Product A").`
      );
    }
    
    return true;
  }
  
  /**
   * Handle price requests
   */
  private async handlePriceRequest(
    message: StandardizedMessage,
    conversation: any
  ): Promise<boolean> {
    // Get products from database (in production)
    // For now, use hardcoded products
    const products = [
      { name: "Product A", price: 499 },
      { name: "Product B", price: 999 },
      { name: "Product C", price: 1499 }
    ];
    
    // Format product list for display
    const productList = products.map(p => `- ${p.name}: ₹${p.price}`).join("\n");
    
    // Send channel-specific responses
    if (message.channel === 'sms') {
      // For SMS, keep it brief
      await this.sendMessage(
        message.from,
        'sms',
        `Prices:\n${productList}\nInc GST. Free ship >₹999.`
      );
    } else {
      // For WhatsApp, we can be more verbose
      await this.sendMessage(
        message.from,
        'whatsapp',
        `Here are our current prices:\n\n${productList}\n\nAll prices include GST. Shipping is free for orders above ₹999.`
      );
    }
    
    return true;
  }
  
  /**
   * Handle image messages
   */
  private async handleImageMessage(
    message: StandardizedMessage,
    conversation: any
  ): Promise<boolean> {
    await this.sendMessage(
      message.from,
      message.channel,
      "Thank you for sending the image. Our team will review it shortly."
    );
    
    return true;
  }
  
  /**
   * Handle document messages
   */
  private async handleDocumentMessage(
    message: StandardizedMessage,
    conversation: any
  ): Promise<boolean> {
    await this.sendMessage(
      message.from,
      message.channel,
      "Thank you for sending the document. Our team will review it shortly."
    );
    
    return true;
  }
  
  /**
   * Handle location messages
   */
  private async handleLocationMessage(
    message: StandardizedMessage,
    conversation: any
  ): Promise<boolean> {
    await this.sendMessage(
      message.from,
      message.channel,
      "Thank you for sharing your location. Our team will check if we deliver to your area."
    );
    
    return true;
  }
  
  /**
   * Handle button click messages
   */
  private async handleButtonMessage(
    message: StandardizedMessage,
    conversation: any
  ): Promise<boolean> {
    if (!message.button) return false;
    
    const payload = message.button.payload;
    
    // Handle different button actions based on payload
    if (payload.startsWith('pay_')) {
      // Extract amount from payload (e.g., pay_500)
      const amount = parseInt(payload.split('_')[1], 10);
      if (!isNaN(amount)) {
        // Create a modified message to handle as payment
        const paymentMessage: StandardizedMessage = {
          ...message,
          type: 'text',
          text: { body: `pay ${amount}` }
        };
        return await this.handlePaymentRequest(paymentMessage, conversation);
      }
    }
    
    await this.sendMessage(
      message.from,
      message.channel,
      `Thank you for your selection: ${message.button.text}`
    );
    
    return true;
  }
  
  /**
   * Handle template messages
   */
  private async handleTemplateMessage(
    message: StandardizedMessage,
    conversation: any
  ): Promise<boolean> {
    // Most template responses would be platform-specific
    // For now, just acknowledge receipt
    await this.sendMessage(
      message.from,
      message.channel,
      "Thank you for your response."
    );
    
    return true;
  }
}

// Export singleton instance
const universalMessageHandler = new UniversalMessageHandler();
export default universalMessageHandler;
