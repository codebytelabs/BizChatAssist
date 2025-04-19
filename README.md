# BizChatAssist

A multi-channel messaging platform for Indian SMBs with integrated UPI payments and GST-compliant invoicing.

## Features

- **Multi-Channel Communication**: Supports both WhatsApp and SMS for customer interactions
- **UPI Payment Integration**: Generate QR codes and payment links for instant UPI payments
- **GST-Compliant Invoicing**: Automatically generate invoices after successful payments
- **Industry Templates**: Pre-built templates for different types of businesses
- **HIPAA-Ready**: Optional compliance for healthcare providers
- **Indian-First**: Built for Indian SMBs with UPI, GST, and local language support

## Technology Stack

- **Frontend**: Next.js with TypeScript
- **Backend**: Next.js API routes
- **Database**: Supabase (PostgreSQL)
- **Messaging**: WhatsApp Business API + MSG91 for SMS
- **Payments**: UPI with multi-provider support
- **Security**: Row-level security, encryption at rest and in transit

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

## License

MIT

## Contributors

- [Vishnu Vardhan Medara](https://github.com/vishnuvardhanmedara)
- [CodeByteLabs Team](https://github.com/codebytelabs)
