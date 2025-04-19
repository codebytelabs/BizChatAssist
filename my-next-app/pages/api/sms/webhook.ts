/**
 * SMS Webhook Handler
 * Processes incoming SMS from MSG91 or other providers
 */
import { NextApiRequest, NextApiResponse } from 'next';
import smsClient from '../../../messaging/sms/client';
import { logAction } from '../../../security/audit';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }
  
  try {
    // Validate webhook secret if provided
    const secret = req.headers['x-webhook-secret'];
    if (process.env.SMS_WEBHOOK_SECRET && secret !== process.env.SMS_WEBHOOK_SECRET) {
      console.error('Invalid SMS webhook secret');
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Log incoming webhook
    console.log('SMS webhook received:', JSON.stringify(req.body));
    
    // Acknowledge receipt immediately
    res.status(200).json({ success: true });
    
    // Process SMS asynchronously
    try {
      // Extract SMS data based on provider format
      // Different SMS providers have different webhook formats
      const smsData = extractSMSData(req.body);
      
      if (smsData) {
        // Process the SMS message
        await smsClient.processIncomingMessage(smsData);
        
        // Log successful processing
        await logAction({
          action: 'sms_webhook_processed',
          metadata: { 
            from: smsData.mobile,
            provider: detectSMSProvider(req.headers)
          }
        });
      } else {
        console.error('Invalid SMS webhook payload format');
        await logAction({
          action: 'invalid_sms_webhook',
          metadata: { body: req.body }
        });
      }
    } catch (processingError: any) {
      // Log processing errors but don't affect response
      // We've already sent a 200 OK to acknowledge receipt
      console.error('Error processing SMS webhook:', processingError);
      await logAction({
        action: 'sms_webhook_processing_error',
        metadata: { error: processingError.message || 'Unknown error' }
      });
    }
  } catch (error: any) {
    console.error('SMS webhook handler error:', error);
    // Only send error response if we haven't already sent a response
    if (!res.writableEnded) {
      res.status(500).json({ error: 'Internal server error' });
    }
    
    await logAction({
      action: 'sms_webhook_handler_error',
      metadata: { error: error.message || 'Unknown error' }
    });
  }
}

/**
 * Extract SMS data from different provider formats
 */
function extractSMSData(body: any): any {
  // Handle MSG91 format
  if (body.msisdn || body.sender) {
    return {
      mobile: body.msisdn || body.sender,
      message: body.message || body.content,
      datetime: body.datetime || new Date().toISOString(),
      requestId: body.requestId || body.id
    };
  }
  
  // Handle Twilio format
  if (body.From && body.Body) {
    return {
      mobile: body.From.replace(/^\+/, ''),
      message: body.Body,
      datetime: new Date().toISOString(),
      requestId: body.MessageSid
    };
  }
  
  // Handle AWS SNS format
  if (body.Type === 'Notification' && body.Message) {
    try {
      const message = JSON.parse(body.Message);
      return {
        mobile: message.originationNumber || message.phoneNumber,
        message: message.messageBody || message.message,
        datetime: new Date().toISOString(),
        requestId: message.messageId
      };
    } catch (e) {
      console.error('Failed to parse SNS message:', e);
    }
  }
  
  return null;
}

/**
 * Detect SMS provider from request headers
 */
function detectSMSProvider(headers: any): string {
  if (headers['x-msg91-signature']) {
    return 'msg91';
  }
  
  if (headers['x-twilio-signature']) {
    return 'twilio';
  }
  
  if (headers['x-amz-sns-message-type']) {
    return 'aws-sns';
  }
  
  return 'unknown';
}
