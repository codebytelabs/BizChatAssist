import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '../../../middleware/auth';
import { getAIResponse } from '../../../utils/ai-engine';
import { createSupabaseClient } from '../../../utils/supabase';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { message, conversationId, customerPhone } = req.body;
    
    // Validate required fields
    if (!message) {
      return res.status(400).json({ error: 'Missing message' });
    }
    
    // Get user info from JWT
    const user = (req as any).user;
    if (!user || !user.tenant) {
      return res.status(401).json({ error: 'Unauthorized: Invalid user context' });
    }
    
    const businessId = user.tenant;
    const supabase = createSupabaseClient();
    
    // Get business context for better AI responses
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', businessId)
      .single();
      
    if (businessError) {
      console.error('Error fetching business data:', businessError);
      return res.status(404).json({ error: 'Business not found' });
    }
    
    // Create or retrieve conversation
    let finalConversationId = conversationId;
    if (!finalConversationId && customerPhone) {
      // Create a new conversation if none exists
      const { data: newConversation, error: conversationError } = await supabase
        .from('conversations')
        .insert({
          business_id: businessId,
          customer_phone: customerPhone,
          status: 'active'
        })
        .select()
        .single();
        
      if (conversationError) {
        console.error('Error creating conversation:', conversationError);
        return res.status(500).json({ error: 'Failed to create conversation' });
      }
      
      finalConversationId = newConversation.id;
    } else if (!finalConversationId) {
      return res.status(400).json({ error: 'Either conversationId or customerPhone is required' });
    }
    
    // Get AI response
    const aiResult = await getAIResponse({
      businessId,
      conversationId: finalConversationId,
      message,
      businessContext: business
    });
    
    // Store the message and AI response in the database
    if (finalConversationId) {
      // Store user message
      await supabase.from('messages').insert({
        conversation_id: finalConversationId,
        sender_type: 'customer',
        content: message,
        message_type: 'text'
      });
      
      // Store AI response
      await supabase.from('messages').insert({
        conversation_id: finalConversationId,
        sender_type: 'system',
        content: aiResult.reply,
        message_type: 'text'
      });
    }
    
    return res.status(200).json({
      ...aiResult,
      conversationId: finalConversationId
    });
  } catch (err: any) {
    console.error('AI conversation error:', err);
    return res.status(500).json({ error: err.message || 'AI processing error' });
  }
}

export default requireAuth(handler);
