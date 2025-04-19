-- BizChatAssist Database Schema
-- Main tables needed for MVP

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Businesses table (SMB clients)
CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users(id),
  type TEXT,
  description TEXT,
  phone TEXT,
  email TEXT,
  business_hours TEXT,
  whatsapp_phone_number_id TEXT,
  timezone TEXT DEFAULT 'UTC',
  active BOOLEAN DEFAULT true
);

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  business_id UUID REFERENCES businesses(id) NOT NULL,
  customer_phone TEXT NOT NULL,
  last_message TEXT,
  unread_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' -- 'active', 'closed'
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  conversation_id UUID REFERENCES conversations(id) NOT NULL,
  sender_type TEXT NOT NULL, -- 'business', 'customer', 'system'
  content TEXT NOT NULL,
  media_url TEXT, -- For images, documents, etc.
  message_type TEXT DEFAULT 'text', -- 'text', 'image', 'document', 'location'
  whatsapp_message_id TEXT, -- Reference from WhatsApp API
  delivery_status TEXT DEFAULT 'sent' -- 'sent', 'delivered', 'read', 'failed'
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  business_id UUID REFERENCES businesses(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  image_url TEXT,
  category TEXT,
  in_stock BOOLEAN DEFAULT true
);

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  business_id UUID REFERENCES businesses(id) NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  service TEXT NOT NULL,
  date DATE NOT NULL,
  time TEXT NOT NULL, -- Using TEXT for time for more flexible formatting
  status TEXT DEFAULT 'pending', -- 'pending', 'confirmed', 'completed', 'cancelled'
  notes TEXT
);

-- Message Templates
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  business_id UUID REFERENCES businesses(id) NOT NULL,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  variables TEXT[], -- Array of variable placeholders in the template
  category TEXT -- 'greeting', 'follow-up', 'appointment', etc.
);

-- Client Subscriptions (for SMB clients to pay for BizChatAssist service)
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  business_id UUID REFERENCES businesses(id) NOT NULL,
  plan TEXT NOT NULL, -- 'basic', 'premium', 'enterprise'
  status TEXT DEFAULT 'active', -- 'active', 'canceled', 'past_due'
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,
  billing_cycle TEXT DEFAULT 'monthly', -- 'monthly', 'yearly'
  price DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  action TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  business_id UUID REFERENCES businesses(id),
  resource_type TEXT,
  resource_id UUID,
  metadata JSONB
);

-- RLS Policies
-- Enable Row Level Security
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Business access policy
CREATE POLICY business_owner_access ON businesses
  FOR ALL USING (owner_id = auth.uid());

-- Conversations access policy
CREATE POLICY conversation_business_access ON conversations
  FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));

-- Messages access policy
CREATE POLICY message_conversation_access ON messages
  FOR ALL USING (conversation_id IN (
    SELECT id FROM conversations WHERE business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid())
  ));

-- Products access policy
CREATE POLICY product_business_access ON products
  FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));

-- Appointments access policy
CREATE POLICY appointment_business_access ON appointments
  FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));

-- Templates access policy
CREATE POLICY template_business_access ON templates
  FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));

-- Subscriptions access policy
CREATE POLICY subscription_business_access ON subscriptions
  FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));

-- Audit logs policy - allow insert for everyone, read only for owners
CREATE POLICY audit_log_insert ON audit_logs FOR INSERT WITH CHECK (true);
CREATE POLICY audit_log_read ON audit_logs FOR SELECT USING (
  (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())) OR 
  (user_id = auth.uid())
);

-- Create indexes for performance
CREATE INDEX idx_businesses_owner ON businesses(owner_id);
CREATE INDEX idx_conversations_business ON conversations(business_id);
CREATE INDEX idx_conversations_customer ON conversations(customer_phone);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_products_business ON products(business_id);
CREATE INDEX idx_appointments_business ON appointments(business_id);
CREATE INDEX idx_appointments_date ON appointments(date);
CREATE INDEX idx_templates_business ON templates(business_id);
CREATE INDEX idx_subscriptions_business ON subscriptions(business_id);
