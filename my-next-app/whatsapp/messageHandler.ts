/**
 * WhatsApp Message Handler
 * Processes incoming WhatsApp messages and routes them to appropriate handlers
 */
import supabase from '../utilities/supabase';
import { logAction } from '../security/audit';
import whatsappClient from './client';
import { WhatsAppMessage } from './types';
import { UPIAdapter } from '../payment/adapters/upi';

export class MessageHandler {
  private upiAdapter: UPIAdapter;
  
  constructor() {
    this.upiAdapter = new UPIAdapter();
  }
  
  /**
   * Process an incoming WhatsApp message
   */
  async processMessage(message: WhatsAppMessage): Promise<boolean> {
    try {
      // Log the incoming message
      await logAction({
        action: 'whatsapp_message_received',
        metadata: { 
          from: message.from, 
          type: message.type,
          messageId: message.id
        }
      });
      
      // Mark the message as read
      await whatsappClient.markMessageAsRead(message.id);
      
      // Find or create a conversation for this phone number
      const conversation = await this.findOrCreateConversation(message.from);
      
      // Save the message to the database
      await this.saveMessageToDatabase(message, conversation.id);
      
      // Process the message based on type
      if (message.type === 'text' && message.text) {
        return await this.handleTextMessage(message, conversation.id);
      } else if (message.type === 'image' && message.image) {
        return await this.handleImageMessage(message, conversation.id);
      } else if (message.type === 'document' && message.document) {
        return await this.handleDocumentMessage(message, conversation.id);
      } else if (message.type === 'location' && message.location) {
        return await this.handleLocationMessage(message, conversation.id);
      } else if (message.type === 'button' && message.button) {
        return await this.handleButtonMessage(message, conversation.id);
      }
      
      // Default response for unsupported message types
      await whatsappClient.sendTextMessage(
        message.from,
        "I'm sorry, I can't process this type of message yet."
      );
      
      return true;
    } catch (error: any) {
      console.error('Error processing message:', error);
      await logAction({
        action: 'message_processing_error',
        metadata: { error: error.message || 'Unknown error', messageId: message.id }
      });
      return false;
    }
  }
  
  /**
   * Find or create a conversation for this customer
   */
  private async findOrCreateConversation(phoneNumber: string) {
    // Extract business ID from phone number (in production this would use a lookup)
    // For demo purposes we'll use a default business ID
    const defaultBusinessId = process.env.DEFAULT_BUSINESS_ID || '00000000-0000-0000-0000-000000000000';
    
    // Try to find an existing conversation
    const { data: existingConversation, error } = await supabase
      .from('conversations')
      .select('id, status')
      .eq('customer_phone', phoneNumber)
      .eq('business_id', defaultBusinessId)
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
  private async saveMessageToDatabase(message: WhatsAppMessage, conversationId: string) {
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
        delivery_status: 'read'
      });
      
    if (error) {
      throw new Error(`Failed to save message: ${error.message}`);
    }
  }
  
  /**
   * Handle text messages
   */
  private async handleTextMessage(message: WhatsAppMessage, conversationId: string): Promise<boolean> {
    if (!message.text) return false;
    
    const text = message.text.body.toLowerCase();
    
    // Check for payment-related keywords
    if (text.includes('pay') || text.includes('payment') || text.includes('upi') || text.includes('money')) {
      return await this.handlePaymentRequest(message, conversationId);
    }
    
    // Check for order-related keywords
    if (text.includes('order') || text.includes('buy') || text.includes('purchase')) {
      return await this.handleOrderRequest(message, conversationId);
    }
    
    // Check for price-related keywords
    if (text.includes('price') || text.includes('cost') || text.includes('rate') || text.includes('how much')) {
      return await this.handlePriceRequest(message, conversationId);
    }
    
    // Default response
    await whatsappClient.sendTextMessage(
      message.from,
      "Thank you for your message. How can I help you today? You can ask about our products, prices, or place an order."
    );
    
    return true;
  }
  
  /**
   * Handle payment requests
   */
  private async handlePaymentRequest(message: WhatsAppMessage, conversationId: string): Promise<boolean> {
    // In a real implementation, look up the business associated with this conversation
    const { data: conversation, error } = await supabase
      .from('conversations')
      .select('business_id')
      .eq('id', conversationId)
      .single();
      
    if (error) {
      throw new Error(`Failed to find conversation: ${error.message}`);
    }
    
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
    
    // Generate UPI QR code
    const result = await this.upiAdapter.generateQR({
      businessId: business.id,
      conversationId,
      customerPhone: message.from,
      amount,
      currency: 'INR',
      upiId: business.upi_id,
      description: `Payment to ${business.name}`
    });
    
    // Send QR code via WhatsApp
    await whatsappClient.sendUpiQrCode(
      message.from,
      result.qrCode,
      amount,
      business.name
    );
    
    // Send follow-up instructions
    await whatsappClient.sendTextMessage(
      message.from,
      `Please scan this QR code using any UPI app like Google Pay, PhonePe, or Paytm to pay ₹${amount}. Your payment will be automatically confirmed.`
    );
    
    return true;
  }
  
  /**
   * Handle order requests
   */
  private async handleOrderRequest(message: WhatsAppMessage, conversationId: string): Promise<boolean> {
    // Send a menu or order form
    await whatsappClient.sendTextMessage(
      message.from,
      "Thank you for your interest in placing an order. Here are our popular products:"
    );
    
    // In production, this would pull products from the database
    const products = [
      { name: "Product A", price: 499 },
      { name: "Product B", price: 999 },
      { name: "Product C", price: 1499 }
    ];
    
    const productList = products.map(p => `- ${p.name}: ₹${p.price}`).join("\n");
    
    await whatsappClient.sendTextMessage(
      message.from,
      `${productList}\n\nTo order, please reply with the product name and quantity (e.g., "2 Product A").`
    );
    
    return true;
  }
  
  /**
   * Handle price requests
   */
  private async handlePriceRequest(message: WhatsAppMessage, conversationId: string): Promise<boolean> {
    // Send pricing information
    await whatsappClient.sendTextMessage(
      message.from,
      "Here are our current prices:"
    );
    
    // In production, this would pull products from the database
    const products = [
      { name: "Product A", price: 499 },
      { name: "Product B", price: 999 },
      { name: "Product C", price: 1499 }
    ];
    
    const productList = products.map(p => `- ${p.name}: ₹${p.price}`).join("\n");
    
    await whatsappClient.sendTextMessage(
      message.from,
      `${productList}\n\nAll prices include GST. Shipping is free for orders above ₹999.`
    );
    
    return true;
  }
  
  /**
   * Handle image messages
   */
  private async handleImageMessage(message: WhatsAppMessage, conversationId: string): Promise<boolean> {
    await whatsappClient.sendTextMessage(
      message.from,
      "Thank you for sending the image. Our team will review it shortly."
    );
    
    return true;
  }
  
  /**
   * Handle document messages
   */
  private async handleDocumentMessage(message: WhatsAppMessage, conversationId: string): Promise<boolean> {
    await whatsappClient.sendTextMessage(
      message.from,
      "Thank you for sending the document. Our team will review it shortly."
    );
    
    return true;
  }
  
  /**
   * Handle location messages
   */
  private async handleLocationMessage(message: WhatsAppMessage, conversationId: string): Promise<boolean> {
    await whatsappClient.sendTextMessage(
      message.from,
      "Thank you for sharing your location. Our team will check if we deliver to your area."
    );
    
    return true;
  }
  
  /**
   * Handle button click messages
   */
  private async handleButtonMessage(message: WhatsAppMessage, conversationId: string): Promise<boolean> {
    if (!message.button) return false;
    
    const payload = message.button.payload;
    
    // Handle different button actions based on payload
    if (payload.startsWith('pay_')) {
      // Extract amount from payload (e.g., pay_500)
      const amount = parseInt(payload.split('_')[1], 10);
      if (!isNaN(amount)) {
        return await this.handlePaymentRequest(message, conversationId);
      }
    }
    
    await whatsappClient.sendTextMessage(
      message.from,
      `Thank you for your selection: ${message.button.text}`
    );
    
    return true;
  }
}

// Export singleton instance
const messageHandler = new MessageHandler();
export default messageHandler;
