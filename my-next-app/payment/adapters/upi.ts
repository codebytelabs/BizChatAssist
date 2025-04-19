import crypto from 'crypto';
import qrcode from 'qrcode';
import { PaymentAdapter, PaymentRequest } from '../payment-adapter';
import { SecurityVault } from '../../utilities/vault';
import supabase from '../../utilities/supabase';
import { logAction } from '../../security/audit';

interface UPITransactionDetails {
  businessId: string;
  conversationId?: string;
  customerPhone: string;
  amount: number;
  currency: string;
  upiId: string;
  description?: string;
}

export class UPIAdapter implements PaymentAdapter {
  async processPayment(request: PaymentRequest) {
    try {
      const { id, amount } = request;
      const transactionId = crypto.randomUUID();
      
      // Get transaction details from the database
      const { data: trx, error: trxError } = await supabase
        .from('transactions')
        .select('business_id, conversation_id, customer_phone')
        .eq('id', id)
        .single();
      
      if (trxError) {
        throw new Error(`Transaction not found: ${trxError.message}`);
      }
      
      // Get business UPI ID
      const { data: business, error: bizError } = await supabase
        .from('businesses')
        .select('upi_id')
        .eq('id', trx.business_id)
        .single();
      
      if (bizError || !business?.upi_id) {
        throw new Error('Business UPI ID not configured');
      }
      
      // In a real implementation, this would initiate a UPI payment request
      // through a payment gateway or direct UPI API
      
      // Update transaction record
      await supabase
        .from('transactions')
        .update({
          reference_id: transactionId,
          status: 'pending'
        })
        .eq('id', id);
      
      // Log for audit
      await logAction({
        action: 'payment_initiated',
        resourceType: 'transaction',
        resourceId: id,
        metadata: { amount, payment_method: 'upi' }
      });
      
      return { success: true, transactionId };
    } catch (error: any) {
      console.error('UPI payment processing error:', error);
      await logAction({
        action: 'payment_failed',
        resourceType: 'transaction',
        resourceId: request.id,
        metadata: { error: error.message || 'Unknown error' }
      });
      throw error;
    }
  }
  
  async reverseTransaction(transactionId: string) {
    try {
      // Get transaction details
      const { data: trx, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('reference_id', transactionId)
        .single();
      
      if (error) {
        throw new Error(`Transaction not found: ${error.message}`);
      }
      
      // In a real implementation, this would call the UPI payment gateway API
      // to process a refund or cancel a transaction
      
      // Update transaction status
      await supabase
        .from('transactions')
        .update({ status: 'refunded' })
        .eq('reference_id', transactionId);
      
      // Log for audit
      await logAction({
        action: 'payment_reversed',
        resourceType: 'transaction',
        resourceId: trx.id,
        metadata: { amount: trx.amount }
      });
      
      return { success: true };
    } catch (error: any) {
      console.error('UPI reversal error:', error);
      return { success: false };
    }
  }
  
  async generateQR(details: UPITransactionDetails): Promise<{ qrCode: string, transactionId: string }> {
    try {
      const { businessId, conversationId, customerPhone, amount, upiId, description } = details;
      
      // Create a transaction record first
      const transactionId = crypto.randomUUID();
      
      // Create a transaction in the database
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          business_id: businessId,
          conversation_id: conversationId,
          customer_phone: customerPhone,
          amount,
          currency: details.currency || 'INR',
          payment_method: 'upi',
          reference_id: transactionId,
          status: 'pending',
          notes: description
        })
        .select()
        .single();
      
      if (error) {
        throw new Error(`Failed to create transaction: ${error.message}`);
      }
      
      // Generate a UPI payment URL with proper GST references
      const paymentNote = description || 'Payment to ' + businessId;
      const upiUrl = `upi://pay?pa=${upiId}&pn=BizChatAssist&am=${amount}&cu=INR&tn=${encodeURIComponent(paymentNote)}`;
      
      // Generate QR code
      const qrCode = await qrcode.toDataURL(upiUrl);
      
      // Log for audit
      await logAction({
        action: 'qr_generated',
        resourceType: 'transaction',
        resourceId: data.id,
        metadata: { amount }
      });
      
      return { qrCode, transactionId: data.id };
    } catch (error: any) {
      console.error('QR generation error:', error);
      throw error;
    }
  }
  
  async verifyTransaction(signature: string, payload: string) {
    try {
      const publicKey = await SecurityVault.getUPIPublicKey();
      return crypto.verify('sha256', Buffer.from(payload), publicKey, Buffer.from(signature, 'base64'));
    } catch (error: any) {
      console.error('Signature verification error:', error);
      return false;
    }
  }
  
  // Handle UPI callback from payment gateway
  async handleCallback(payload: any) {
    try {
      // Extract transaction details from callback
      const { reference_id, status, upi_txn_id } = payload;
      
      if (!reference_id) {
        throw new Error('Missing reference_id in callback payload');
      }
      
      // Update transaction in database
      const { data, error } = await supabase
        .from('transactions')
        .update({
          status: status === 'SUCCESS' ? 'completed' : 'failed',
          upi_txn_id,
          updated_at: new Date().toISOString()
        })
        .eq('reference_id', reference_id)
        .select()
        .single();
      
      if (error) {
        throw new Error(`Failed to update transaction: ${error.message}`);
      }
      
      // If payment successful, generate invoice
      if (status === 'SUCCESS') {
        await this.generateInvoice(data.id);
      }
      
      // Log for audit
      await logAction({
        action: `payment_${status.toLowerCase()}`,
        resourceType: 'transaction',
        resourceId: data.id,
        metadata: { upi_txn_id }
      });
      
      return { success: true, transaction: data };
    } catch (error: any) {
      console.error('UPI callback handling error:', error);
      await logAction({
        action: 'payment_callback_error',
        metadata: { error: error.message || 'Unknown error', payload }
      });
      throw error;
    }
  }
  
  // Generate GST-compliant invoice
  private async generateInvoice(transactionId: string) {
    try {
      // Get transaction details
      const { data: trx, error: trxError } = await supabase
        .from('transactions')
        .select('*, businesses(name, gstin)')
        .eq('id', transactionId)
        .single();
      
      if (trxError) {
        throw new Error(`Transaction not found: ${trxError.message}`);
      }
      
      // Generate invoice number
      const date = new Date();
      const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
      
      // Get count of invoices for sequence
      const { count, error: countError } = await supabase
        .from('invoices')
        .select('id', { count: 'exact' })
        .eq('business_id', trx.business_id)
        .gte('created_at', new Date(date.setHours(0, 0, 0, 0)).toISOString());
      
      if (countError) {
        throw new Error(`Failed to generate invoice number: ${countError.message}`);
      }
      
      const sequence = (count || 0) + 1;
      const invoiceNumber = `INV-${dateStr}-${sequence.toString().padStart(4, '0')}`;
      
      // Create invoice
      const taxRate = 0.18; // 18% GST
      const taxAmount = trx.amount * taxRate;
      const totalAmount = trx.amount + taxAmount;
      
      // Get customer name from conversation if available
      let customerName = 'Customer';
      if (trx.conversation_id) {
        const { data: convo, error: convoError } = await supabase
          .from('conversations')
          .select('customer_name')
          .eq('id', trx.conversation_id)
          .single();
          
        if (!convoError && convo?.customer_name) {
          customerName = convo.customer_name;
        }
      }
      
      // Create invoice record
      const { data, error } = await supabase
        .from('invoices')
        .insert({
          invoice_number: invoiceNumber,
          business_id: trx.business_id,
          transaction_id: transactionId,
          customer_name: customerName,
          customer_phone: trx.customer_phone,
          invoice_date: date.toISOString().slice(0, 10),
          amount: trx.amount,
          tax_amount: taxAmount,
          total_amount: totalAmount,
          status: 'issued',
          place_of_supply: 'India' // Default for now
        })
        .select()
        .single();
      
      if (error) {
        throw new Error(`Failed to create invoice: ${error.message}`);
      }
      
      // In a real implementation, generate PDF and update URL
      // const pdfUrl = await generateInvoicePDF(data.id);
      
      return data;
    } catch (error: any) {
      console.error('Invoice generation error:', error);
      throw error;
    }
  }
}