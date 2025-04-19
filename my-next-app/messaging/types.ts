/**
 * Unified Messaging Types for BizChatAssist
 * Supports both WhatsApp and SMS channels
 */

export type MessageChannelType = 'whatsapp' | 'sms' | 'web';

export interface StandardizedMessage {
  id: string;
  from: string;
  timestamp: string;
  type: 'text' | 'image' | 'document' | 'location' | 'button' | 'template';
  text?: {
    body: string;
  };
  image?: {
    url?: string;
    caption?: string;
  };
  document?: {
    url?: string;
    filename?: string;
    caption?: string;
  };
  location?: {
    latitude: number;
    longitude: number;
    name?: string;
    address?: string;
  };
  button?: {
    payload: string;
    text: string;
  };
  template?: {
    name: string;
    parameters: Record<string, string>;
  };
  channel: MessageChannelType;
  metadata?: Record<string, any>;
}

export interface MessageSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface MessageChannel {
  // Initialize the channel with credentials
  initialize(): Promise<boolean>;
  
  // Send a text message
  sendTextMessage(to: string, text: string): Promise<MessageSendResult>;
  
  // Send a template/structured message
  sendTemplateMessage(
    to: string, 
    templateName: string, 
    parameters: Record<string, any>
  ): Promise<MessageSendResult>;
  
  // Process an incoming message from this channel
  processIncomingMessage(payload: any): Promise<boolean>;
  
  // Send media content (image, document, etc.)
  sendMedia?(
    to: string, 
    mediaType: 'image' | 'document' | 'audio' | 'video',
    mediaUrl: string,
    caption?: string
  ): Promise<MessageSendResult>;
  
  // Get channel type
  getChannelType(): MessageChannelType;
}
