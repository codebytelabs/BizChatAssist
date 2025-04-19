# BizChatAssist

A global multi-channel conversational commerce platform for businesses of all sizes with localized payment integrations and regional compliance support.

## Features

- **Multi-Channel Communication**: Supports both WhatsApp and SMS for global customer interactions
- **Flexible Payment Integration**: Support for global payment methods with regional adaptations
  - Western Markets: Stripe, PayPal, credit cards
  - India: UPI, payment links, and QR codes
  - APAC: AliPay, WeChat Pay ready
- **Regional Tax Compliance**: 
  - US/EU: Sales tax and VAT invoicing
  - India: GST-compliant invoicing
  - Brazil: Nota Fiscal support
- **Industry Templates**: Pre-built templates optimized for different business types
- **Regulatory Compliance**: GDPR, HIPAA, and CCPA compliance options
- **Multi-Language Support**: Ready for 40+ languages with specialized handling for key markets

## Technology Stack

- **Frontend**: Next.js with TypeScript
- **Backend**: Next.js API routes
- **Database**: Supabase (PostgreSQL)
- **Messaging**: 
  - WhatsApp Business API (global coverage)
  - SMS providers with regional adapters:
    - Twilio (US/EU)
    - MSG91 (India)
    - Nexmo (Global)
- **Payments**: 
  - Payment adapter system for multiple providers
  - Stripe, PayPal, UPI, and more
- **Security**: Row-level security, encryption at rest and in transit, GDPR compliance

## Getting Started

### Prerequisites

- Node.js 16+
- WhatsApp Business API access
- MSG91 Account (for SMS)
- Supabase Account

### Installation

1. Clone the repository
```
git clone https://github.com/codebytelabs/BizChatAssist.git
cd BizChatAssist/my-next-app
```

2. Install dependencies
```
npm install
```

3. Set up environment variables
```
cp .env.example .env.local
```

4. Run database migrations
```
npx supabase migrations up
```

5. Start the development server
```
npm run dev
```

## Development Roadmap

See our [todo.md](todo.md) file for the current development plan and progress.

## Regional Adaptations

BizChatAssist provides powerful regional adaptations while maintaining a global core:

- **North America**: Credit card processing, CCPA compliance, English/Spanish support
- **Europe**: GDPR compliance, VAT handling, multi-language support, SEPA payments
- **India**: UPI payments, GST compliance, regional language support
- **APAC**: WeChat/Alipay readiness, local payment methods, CJK language support
- **LATAM**: Installment payment support, Nota Fiscal compliance, Portuguese/Spanish support

## License

MIT

## Contributors

- [Vishnu Vardhan Medara](https://github.com/vishnuvardhanmedara)
- [CodeByteLabs Team](https://github.com/codebytelabs)
