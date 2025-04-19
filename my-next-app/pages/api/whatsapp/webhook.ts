import { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import messageHandler from '../../../whatsapp/messageHandler';
import { logAction } from '../../../security/audit';

/**
 * WhatsApp Business API Webhook
 * Handles incoming webhook events from WhatsApp
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle webhook verification (GET request)
  if (req.method === 'GET') {
    return handleWebhookVerification(req, res);
  }
  
  // Handle incoming messages (POST request)
  if (req.method === 'POST') {
    return handleIncomingMessage(req, res);
  }
  
  // Method not allowed
  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).json({ error: `Method ${req.method} not allowed` });
}

/**
 * Handle WhatsApp webhook verification
 * This is required when setting up the webhook in the Meta developer portal
 */
function handleWebhookVerification(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Get verification parameters from query
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    
    // Verify the token matches our environment variable
    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
    
    if (mode === 'subscribe' && token === verifyToken) {
      console.log('Webhook verified successfully');
      
      // Respond with the challenge to complete verification
      res.status(200).send(challenge);
    } else {
      // Verification failed
      console.error('Webhook verification failed');
      res.status(403).json({ error: 'Verification failed' });
    }
  } catch (error: any) {
    console.error('Error during webhook verification:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Handle incoming WhatsApp messages
 */
async function handleIncomingMessage(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Verify the request signature for security
    const signature = req.headers['x-hub-signature-256'];
    const isValid = validateSignature(req.body, signature as string);
    
    if (!isValid) {
      console.error('Invalid signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }
    
    // Extract the WhatsApp message from the webhook payload
    const body = req.body;
    
    // WhatsApp sends an empty body for initial handshakes
    if (!body || !body.object || !body.entry || body.entry.length === 0) {
      return res.status(200).send('OK');
    }
    
    // Acknowledge receipt immediately as required by WhatsApp
    res.status(200).send('EVENT_RECEIVED');
    
    // Process messages asynchronously
    try {
      // Check if this is a WhatsApp Business Account message
      if (body.object === 'whatsapp_business_account') {
        for (const entry of body.entry) {
          if (entry.changes && entry.changes.length > 0) {
            for (const change of entry.changes) {
              if (
                change.field === 'messages' && 
                change.value && 
                change.value.messages && 
                change.value.messages.length > 0
              ) {
                // Process each message
                for (const message of change.value.messages) {
                  const phone = change.value.contacts[0]?.wa_id;
                  
                  if (phone) {
                    const whatsappMessage = {
                      id: message.id,
                      from: phone,
                      timestamp: message.timestamp,
                      type: message.type,
                      text: message.text,
                      image: message.image,
                      document: message.document,
                      location: message.location,
                      button: message.button,
                      context: message.context
                    };
                    
                    // Process the message
                    await messageHandler.processMessage(whatsappMessage);
                  }
                }
              }
            }
          }
        }
      }
    } catch (processingError: any) {
      // Log processing errors but don't change the response
      // WhatsApp expects a 200 regardless of processing success/failure
      console.error('Error processing webhook payload:', processingError);
      await logAction({
        action: 'webhook_processing_error',
        metadata: { error: processingError.message || 'Unknown error' }
      });
    }
    
  } catch (error: any) {
    console.error('Webhook handler error:', error);
    // Already sent 200 response, just log the error
    await logAction({
      action: 'webhook_handler_error',
      metadata: { error: error.message || 'Unknown error' }
    });
  }
}

/**
 * Validate the signature of the incoming webhook
 */
function validateSignature(payload: any, signature?: string): boolean {
  if (!signature) return false;
  
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (!appSecret) {
    console.error('WHATSAPP_APP_SECRET not configured');
    return false;
  }
  
  try {
    // Calculate expected signature
    const expectedSignature = crypto
      .createHmac('sha256', appSecret)
      .update(JSON.stringify(payload))
      .digest('hex');
    
    // Get the signature from the header (format: sha256=<signature>)
    const receivedSignature = signature.split('=')[1];
    
    // Compare signatures
    return crypto.timingSafeEqual(
      Buffer.from(receivedSignature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    console.error('Signature validation error:', error);
    return false;
  }
}
