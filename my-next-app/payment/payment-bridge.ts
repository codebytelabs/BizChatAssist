/**
 * Global Payment Bridge for BizChatAssist
 * Provides a unified payment interface with regional adapters
 */
import { PaymentAdapter, PaymentRequest, StripeAdapter, UPIAdapter, PayPalAdapter } from './payment-adapter';
import { logAction } from '../security/audit';
// import { AlipayAdapter } from './adapters/alipay';

export type PaymentRegion = 'global' | 'north-america' | 'europe' | 'india' | 'apac' | 'latam' | 'africa';
export type PaymentMethod = 'credit-card' | 'bank-transfer' | 'upi' | 'wallet' | 'bnpl' | 'crypto' | 'paypal' | 'stripe';

export interface RegionalPaymentConfig {
  id: string;
  region: PaymentRegion;
  country: string;
  currency: string;
  defaultMethod: PaymentMethod;
  supportedMethods: PaymentMethod[];
  taxRate: number;
  taxName: string; // "VAT", "GST", "Sales Tax", etc.
  language: string;
  enabled: boolean;
}

/**
 * Global Payment Bridge that routes payment requests
 * to the appropriate regional adapter based on context
 */
export class PaymentBridge {
  private adapters: Map<PaymentRegion, Map<PaymentMethod, PaymentAdapter>>;
  private regions: Map<string, RegionalPaymentConfig>;
  
  constructor() {
    this.adapters = new Map();
    this.regions = new Map();
    
    // Initialize regions
    this.setupRegions();
    
    // Initialize adapters
    this.registerPaymentAdapters();
  }

  /**
   * Register payment adapters for each region/method
   */
  private registerPaymentAdapters() {
    // Example: Register adapters for each region/method
    // US/EU: Stripe (credit-card), India: UPI (upi), Global: PayPal (paypal)
    this.adapters.set('north-america', new Map([
      ['credit-card', new StripeAdapter()],
      ['paypal', new PayPalAdapter()]
    ]));
    this.adapters.set('europe', new Map([
      ['credit-card', new StripeAdapter()],
      ['paypal', new PayPalAdapter()]
    ]));
    this.adapters.set('india', new Map([
      ['upi', new UPIAdapter()],
      ['credit-card', new StripeAdapter()],
      ['paypal', new PayPalAdapter()]
    ]));
    this.adapters.set('global', new Map([
      ['paypal', new PayPalAdapter()],
      ['credit-card', new StripeAdapter()]
    ]));
    // Add more as needed for other regions/methods
  }

  /**
   * Process a payment with appropriate regional adapter
   */
  async processPayment(
    request: PaymentRequest, 
    region: PaymentRegion = 'global',
    method?: PaymentMethod
  ) {
    try {
      // Get region config
      const regionConfig = this.getRegionConfig(region, request.country);
      
      // Determine payment method
      const paymentMethod = method || regionConfig.defaultMethod;
      
      // Get adapter for region and method
      const adapter = this.getAdapter(region, paymentMethod);
      
      if (!adapter) {
        throw new Error(`No payment adapter available for ${region} and ${paymentMethod}`);
      }
      
      // Update request with regional information
      const enrichedRequest = {
        ...request,
        currency: request.currency || regionConfig.currency,
        taxRate: request.taxRate || regionConfig.taxRate,
        taxName: request.taxName || regionConfig.taxName,
        language: request.language || regionConfig.language
      };
      
      // Process payment through adapter
      const result = await adapter.processPayment(enrichedRequest);

      // TODO: Add support for provider-specific logic and metadata (e.g., generateQR, conversationId, customerPhone, upiId)
      // These will be handled via providerMetadata or future extension of PaymentRequest
      
      // Log for audit
      await logAction({
        action: 'payment_processed',
        resourceType: 'transaction',
        resourceId: request.id,
        metadata: { 
          region, 
          method: paymentMethod,
          amount: request.amount,
          currency: enrichedRequest.currency
        }
      });
      
      return result;
    } catch (error: any) {
      console.error('Payment bridge error:', error);
      await logAction({
        action: 'payment_bridge_error',
        metadata: { 
          error: error.message || 'Unknown error',
          region,
          method
        }
      });
      throw error;
    }
  }
  
  /**
   * Get appropriate payment adapter for region and method
   */
  private getAdapter(region: PaymentRegion, method: PaymentMethod): PaymentAdapter | null {
    const regionAdapters = this.adapters.get(region);
    
    if (regionAdapters && regionAdapters.has(method)) {
      return regionAdapters.get(method) || null;
    }
    
    // Fall back to global adapters if region-specific not found
    const globalAdapters = this.adapters.get('global');
    if (globalAdapters && globalAdapters.has(method)) {
      return globalAdapters.get(method) || null;
    }
    
    return null;
  }
  
  /**
   * Get region configuration, with fallback to global
   */
  private getRegionConfig(region: PaymentRegion, country?: string): RegionalPaymentConfig {
    // If country is specified, try to find its region config
    if (country) {
      const countryConfig = Array.from(this.regions.values()).find(
        config => config.country.toLowerCase() === country.toLowerCase()
      );
      
      if (countryConfig) {
        return countryConfig;
      }
    }
    
    // Get region config by region name
    for (const config of this.regions.values()) {
      if (config.region === region) {
        return config;
      }
    }
    
    // Fall back to global config
    const globalConfig = this.regions.get('global');
    if (!globalConfig) {
      throw new Error('Global payment configuration not found');
    }
    
    return globalConfig;
  }
  
  /**
   * Configure regional payment settings
   */
  private setupRegions() {
    // Global fallback
    this.regions.set('global', {
      id: 'global',
      region: 'global',
      country: 'US',
      currency: 'USD',
      defaultMethod: 'credit-card',
      supportedMethods: ['credit-card', 'bank-transfer'],
      taxRate: 0,
      taxName: 'Tax',
      language: 'en',
      enabled: true
    });
    
    // North America
    this.regions.set('us', {
      id: 'us',
      region: 'north-america',
      country: 'US',
      currency: 'USD',
      defaultMethod: 'credit-card',
      supportedMethods: ['credit-card', 'bank-transfer'],
      taxRate: 0, // Varies by state, will be calculated dynamically
      taxName: 'Sales Tax',
      language: 'en',
      enabled: true
    });
    
    // Europe
    this.regions.set('eu', {
      id: 'eu',
      region: 'europe',
      country: 'EU',
      currency: 'EUR',
      defaultMethod: 'credit-card',
      supportedMethods: ['credit-card', 'bank-transfer'],
      taxRate: 0.20, // Most common VAT rate, varies by country
      taxName: 'VAT',
      language: 'en',
      enabled: true
    });
    
    // India
    this.regions.set('india', {
      id: 'india',
      region: 'india',
      country: 'IN',
      currency: 'INR',
      defaultMethod: 'upi',
      supportedMethods: ['upi', 'credit-card', 'bank-transfer'],
      taxRate: 0.18, // Standard GST rate
      taxName: 'GST',
      language: 'en', // Default, supports multiple regional languages
      enabled: true
    });
    
    // APAC (example: Singapore)
    this.regions.set('singapore', {
      id: 'singapore',
      region: 'apac',
      country: 'SG',
      currency: 'SGD',
      defaultMethod: 'credit-card',
      supportedMethods: ['credit-card', 'bank-transfer', 'wallet'],
      taxRate: 0.08, // GST in Singapore
      taxName: 'GST',
      language: 'en',
      enabled: true
    });
    
    // LATAM (example: Brazil)
    this.regions.set('brazil', {
      id: 'brazil',
      region: 'latam',
      country: 'BR',
      currency: 'BRL',
      defaultMethod: 'credit-card',
      supportedMethods: ['credit-card', 'bank-transfer', 'bnpl'],
      taxRate: 0.17, // ICMS (varies by state)
      taxName: 'ICMS',
      language: 'pt',
      enabled: true
    });
  }
  
  /**
   * Register payment adapters for each region and method
   */
  private registerPaymentAdapters() {
    // Example: Register adapters for each region/method
    // US/EU: Stripe (credit-card), India: UPI (upi), Global: PayPal (paypal)
    this.adapters.set('north-america', new Map([
      ['credit-card', new StripeAdapter()],
      ['paypal', new PayPalAdapter()]
    ]));
    this.adapters.set('europe', new Map([
      ['credit-card', new StripeAdapter()],
      ['paypal', new PayPalAdapter()]
    ]));
    this.adapters.set('india', new Map([
      ['upi', new UPIAdapter()],
      ['credit-card', new StripeAdapter()],
      ['paypal', new PayPalAdapter()]
    ]));
    this.adapters.set('global', new Map([
      ['paypal', new PayPalAdapter()],
      ['credit-card', new StripeAdapter()]
    ]));
    // Add more as needed for other regions/methods
  }
  
  /**
   * Generate payment link or QR code based on region and method
   */
  async generatePaymentLink(
    request: PaymentRequest,
    region: PaymentRegion = 'global',
    method?: PaymentMethod
  ) {
    try {
      // Get region config
      const regionConfig = this.getRegionConfig(region, request.country);
      
      // Determine payment method
      const paymentMethod = method || regionConfig.defaultMethod;
      
      // Get adapter for region and method
      const adapter = this.getAdapter(region, paymentMethod);
      
      if (!adapter) {
        throw new Error(`No payment adapter available for ${region} and ${paymentMethod}`);
      }
      
      // Generate payment link or QR code
      if (paymentMethod === 'upi' && 'generateQR' in adapter) {
        // UPI specific flow with QR code
        // TODO: Refactor to use providerMetadata for UPI-specific fields
        // Example:
        // return await (adapter as UPIAdapter).generateQR({
        //   businessId: request.businessId,
        //   conversationId: request.providerMetadata?.conversationId,
        //   customerPhone: request.providerMetadata?.customerPhone,
        //   amount: request.amount,
        //   currency: request.currency || regionConfig.currency,
        //   upiId: request.providerMetadata?.upiId || '',
        //   description: request.description
        // });
        throw new Error('UPI QR generation via generateQR not implemented. Use providerMetadata for custom fields.');
      }
      
      // Default payment URL generation
      // This would be implemented by other adapters
      return {
        paymentUrl: `https://pay.bizchatassist.com/${request.id}?region=${region}&method=${paymentMethod}`,
        transactionId: request.id
      };
    } catch (error: any) {
      console.error('Payment link generation error:', error);
      throw error;
    }
  }
}

// Export singleton instance
const paymentBridge = new PaymentBridge();
export default paymentBridge;
