import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../../utils/supabase';
import { getAIResponse } from '../../../../utils/ai-engine';

// WhatsApp webhook handler
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verify webhook on GET requests (required by WhatsApp Business API)
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    
    // Verify webhook with token from environment variable
    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
    
    if (mode === 'subscribe' && token === verifyToken) {
      console.log('Webhook verified successfully');
      res.status(200).send(challenge);
    } else {
      console.error('Webhook verification failed');
      res.status(403).end();
    }
    return;
  }
  
  // Handle incoming messages on POST requests
  if (req.method === 'POST') {
    try {
      const body = req.body;
      
      // Check if this is a valid WhatsApp message
      if (!body.object || !body.entry || !body.entry[0].changes || !body.entry[0].changes[0].value) {
        return res.status(400).json({ error: 'Invalid webhook payload' });
      }
      
      const value = body.entry[0].changes[0].value;
      
      // Only process messages, not statuses or other events
      if (!value.messages || !value.messages[0]) {
        return res.status(200).end(); // Acknowledge but don't process
      }
      
      // Extract message data
      const message = value.messages[0];
      const messageId = message.id;
      const from = message.from; // Customer's phone number
      const messageType = message.type;
      const businessPhoneNumberId = value.metadata.phone_number_id;
      
      // Find or create business entity based on WhatsApp phone number ID
      const { data: business, error: businessError } = await supabaseAdmin
        .from('businesses')
        .select('*')
        .eq('whatsapp_phone_number_id', businessPhoneNumberId)
        .single();
      
      if (businessError) {
        console.error('Error finding business:', businessError);
        return res.status(404).json({ error: 'Business not found' });
      }
      
      // Find or create conversation
      const { data: existingConvo, error: convoQueryError } = await supabaseAdmin
        .from('conversations')
        .select('*')
        .eq('business_id', business.id)
        .eq('customer_phone', from)
        .eq('status', 'active')
        .single();
      
      let conversationId = existingConvo?.id;
      
      // Create new conversation if none exists
      if (!existingConvo) {
        const { data: newConvo, error: convoInsertError } = await supabaseAdmin
          .from('conversations')
          .insert({
            business_id: business.id,
            customer_phone: from,
            status: 'active'
          })
          .select()
          .single();
        
        if (convoInsertError) {
          console.error('Error creating conversation:', convoInsertError);
          return res.status(500).json({ error: 'Failed to create conversation' });
        }
        
        conversationId = newConvo.id;
      }
      
      // Extract message content based on message type
      let content = '';
      let mediaUrl = null;
      
      if (messageType === 'text' && message.text) {
        content = message.text.body;
      } else if (messageType === 'image' && message.image) {
        content = message.image.caption || 'Image received';
        mediaUrl = message.image.url;
      } else if (messageType === 'document' && message.document) {
        content = message.document.caption || message.document.filename || 'Document received';
        mediaUrl = message.document.url;
      } else if (messageType === 'location' && message.location) {
        content = `Location: ${message.location.latitude}, ${message.location.longitude}`;
        if (message.location.name) {
          content = `${message.location.name}: ${content}`;
        }
      } else {
        content = `Received message of type: ${messageType}`;
      }
      
      // Store incoming message
      const { data: msgData, error: msgError } = await supabaseAdmin
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_type: 'customer',
          content,
          message_type: messageType,
          media_url: mediaUrl,
          whatsapp_message_id: messageId
        })
        .select()
        .single();
      
      if (msgError) {
        console.error('Error storing message:', msgError);
        return res.status(500).json({ error: 'Failed to store message' });
      }
      
      // Get AI response
      if (messageType === 'text') {
        const aiResult = await getAIResponse({
          businessId: business.id,
          conversationId,
          message: content,
          businessContext: business
        });
        
        // Store AI response
        await supabaseAdmin
          .from('messages')
          .insert({
            conversation_id: conversationId,
            sender_type: 'system',
            content: aiResult.reply,
            message_type: 'text'
          });
        
        // Send response back to WhatsApp (implementation in next step)
        await sendWhatsAppMessage(from, aiResult.reply, businessPhoneNumberId);
      } else {
        // For non-text messages, send a simple acknowledgment
        const defaultResponse = "Thanks for your message. We'll get back to you shortly.";
        
        await supabaseAdmin
          .from('messages')
          .insert({
            conversation_id: conversationId,
            sender_type: 'system',
            content: defaultResponse,
            message_type: 'text'
          });
        
        await sendWhatsAppMessage(from, defaultResponse, businessPhoneNumberId);
      }
      
      // Acknowledge receipt of webhook
      res.status(200).json({ success: true });
    } catch (error: any) {
      console.error('Webhook processing error:', error);
      res.status(500).json({ error: error.message || 'Webhook processing failed' });
    }
  } else {
    // Method not allowed
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

// Helper function to send WhatsApp messages
async function sendWhatsAppMessage(to: string, message: string, phoneNumberId: string) {
  try {
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    if (!accessToken) {
      console.error('WhatsApp access token not found');
      return false;
    }
    
    const response = await fetch(
      `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to,
          type: 'text',
          text: {
            body: message
          }
        })
      }
    );
    
    const data = await response.json();
    return data.messages && data.messages[0].id;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return false;
  }
}
