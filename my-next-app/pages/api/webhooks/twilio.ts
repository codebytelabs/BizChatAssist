import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../utils/supabase';
import { getAIResponse } from '../../../utils/ai-engine';
import twilioClient from '../../../messaging/twilio-client';

// Twilio webhook handler for WhatsApp and SMS
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Parse Twilio webhook payload
    const {
      From,           // Phone number that sent the message (with WhatsApp: prefix for WhatsApp)
      To,             // Twilio phone number that received the message
      Body,           // Message content
      MessageSid,     // Unique message identifier
      NumMedia,       // Number of media items
      MediaUrl0,      // URL of first media item (if any)
      WaId            // WhatsApp ID (for WhatsApp messages)
    } = req.body;
    
    if (!From || !Body) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Determine if this is WhatsApp or SMS
    const isWhatsApp = From.startsWith('whatsapp:');
    
    // Extract phone number (remove WhatsApp: prefix if present)
    const customerPhone = isWhatsApp ? From.replace('whatsapp:', '') : From;
    
    // Get business by Twilio phone number
    const businessPhoneNumber = isWhatsApp 
      ? process.env.TWILIO_WHATSAPP_NUMBER?.replace('whatsapp:', '')
      : process.env.TWILIO_PHONE_NUMBER;
      
    const { data: business, error: businessError } = await supabaseAdmin
      .from('businesses')
      .select('*')
      .eq('phone', businessPhoneNumber)
      .single();
    
    if (businessError) {
      // For testing, create a default business if none exists
      const { data: newBusiness, error: createError } = await supabaseAdmin
        .from('businesses')
        .insert({
          name: 'BizChatAssist Demo',
          type: 'Technology',
          description: 'AI-powered communication automation platform',
          phone: businessPhoneNumber,
          business_hours: 'Monday-Friday: 9AM-5PM'
        })
        .select()
        .single();
        
      if (createError) {
        console.error('Error creating default business:', createError);
        return res.status(500).json({ error: 'Failed to process message' });
      }
      
      var businessId = newBusiness.id;
    } else {
      var businessId = business.id;
    }
    
    // Find or create conversation
    const { data: conversation, error: convoError } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('business_id', businessId)
      .eq('customer_phone', customerPhone)
      .eq('status', 'active')
      .single();
      
    let conversationId;
    
    if (convoError) {
      // Create new conversation
      const { data: newConvo, error: createConvoError } = await supabaseAdmin
        .from('conversations')
        .insert({
          business_id: businessId,
          customer_phone: customerPhone,
          status: 'active'
        })
        .select()
        .single();
        
      if (createConvoError) {
        console.error('Error creating conversation:', createConvoError);
        return res.status(500).json({ error: 'Failed to create conversation' });
      }
      
      conversationId = newConvo.id;
    } else {
      conversationId = conversation.id;
    }
    
    // Store incoming message
    let mediaUrl = null;
    let messageType = 'text';
    
    if (parseInt(NumMedia || '0') > 0 && MediaUrl0) {
      mediaUrl = MediaUrl0;
      messageType = 'media';
    }
    
    await supabaseAdmin.from('messages').insert({
      conversation_id: conversationId,
      sender_type: 'customer',
      content: Body,
      message_type: messageType,
      media_url: mediaUrl,
      whatsapp_message_id: MessageSid
    });
    
    // Generate AI response
    const aiResult = await getAIResponse({
      businessId,
      conversationId,
      message: Body,
      businessContext: business || { 
        name: 'BizChatAssist Demo',
        type: 'Technology',
        description: 'AI-powered communication automation platform'  
      }
    });
    
    // Store AI response
    await supabaseAdmin.from('messages').insert({
      conversation_id: conversationId,
      sender_type: 'system',
      content: aiResult.reply,
      message_type: 'text'
    });
    
    // Send response back to user
    if (isWhatsApp) {
      await twilioClient.sendWhatsAppMessage(From, aiResult.reply);
    } else {
      await twilioClient.sendSMS(From, aiResult.reply);
    }
    
    // Generate TwiML response
    // This isn't strictly necessary for webhooks, but helps with testing
    const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${aiResult.reply}</Message>
</Response>`;
    
    res.setHeader('Content-Type', 'text/xml');
    return res.status(200).send(twimlResponse);
  } catch (error: any) {
    console.error('Twilio webhook error:', error);
    res.status(500).json({ error: error.message || 'Failed to process message' });
  }
}
