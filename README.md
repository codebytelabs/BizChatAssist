# BizChatAssist

An AI-powered communication automation platform for small-to-medium businesses (SMBs) that enables WhatsApp/SMS automation, information sharing, product/service listing, and appointment scheduling through a clean, intuitive dashboard.

## MVP Features

- **AI-Powered Communication**: Intelligent conversation engine powered by OpenAI for automated customer interactions
- **WhatsApp/SMS Integration**: Direct messaging through customers' preferred channels
- **Business Dashboard**: Comprehensive interface for managing all aspects of communication
- **Product/Service Catalog**: Simple listing and sharing of offerings through messaging channels
- **Appointment Scheduling**: Automated booking system integrated with messaging
- **Client Management**: Track and manage customer conversations in one place
- **Simple Subscription**: Straightforward onboarding and billing for SMB clients

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
