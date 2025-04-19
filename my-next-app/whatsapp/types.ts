/**
 * WhatsApp Integration Types
 * Defines the structure for WhatsApp Business API integration
 */

export interface WhatsAppMessage {
  id: string;
  from: string;
  timestamp: string;
  type: 'text' | 'image' | 'document' | 'location' | 'button' | 'template';
  text?: {
    body: string;
  };
  image?: {
    id: string;
    caption?: string;
    mime_type: string;
    sha256: string;
    url?: string;
  };
  document?: {
    id: string;
    caption?: string;
    filename: string;
    mime_type: string;
    sha256: string;
    url?: string;
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
  context?: {
    message_id: string;
  };
}

export interface WhatsAppMessageResponse {
  messaging_product: 'whatsapp';
  contacts: Array<{
    input: string;
    wa_id: string;
  }>;
  messages: Array<{
    id: string;
  }>;
}

export interface WhatsAppProfile {
  name: string;
  phone: string;
  about?: string;
  email?: string;
  address?: string;
  description?: string;
  vertical?: string;
  photo_url?: string;
}

export interface WhatsAppTemplateMessage {
  name: string;
  language: {
    code: string;
  };
  components: WhatsAppTemplateComponent[];
}

export interface WhatsAppTemplateComponent {
  type: 'header' | 'body' | 'button' | 'footer';
  parameters?: Array<{
    type: 'text' | 'currency' | 'date_time' | 'image' | 'document' | 'video';
    text?: string;
    currency?: {
      code: string;
      amount: number;
    };
    date_time?: {
      fallback_value: string;
    };
    image?: {
      link: string;
    };
    document?: {
      link: string;
    };
    video?: {
      link: string;
    };
  }>;
  sub_type?: 'quick_reply' | 'url';
  index?: number;
}

export interface WhatsAppMessageOptions {
  messagingProduct: string;
  recipientType: string;
  to: string;
  type: string;
  template?: WhatsAppTemplateMessage;
  text?: {
    body: string;
    preview_url?: boolean;
  };
  image?: {
    link: string;
    caption?: string;
  };
  document?: {
    link: string;
    caption?: string;
    filename?: string;
  };
}

export interface WhatsAppContact {
  profile: {
    name: string;
  };
  wa_id: string;
}
