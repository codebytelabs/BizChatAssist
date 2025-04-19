-- BizChatAssist Initial Schema
-- Focusing on Indian SMBs first with UPI payments and GST compliance

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';
ALTER DATABASE postgres SET "app.jwt_exp" TO 3600;

----------------
-- Core Tables --
----------------

-- Businesses table - core entity
CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users(id) NOT NULL,
  phone TEXT,
  email TEXT,
  gstin TEXT, -- GST Identification Number for Indian businesses
  language TEXT DEFAULT 'en', -- Default language
  timezone TEXT DEFAULT 'Asia/Kolkata', -- Default timezone for Indian businesses
  logo_url TEXT,
  upi_id TEXT, -- UPI ID for payment collection
  business_type TEXT NOT NULL, -- 'retail', 'restaurant', 'service', 'healthcare'
  active BOOLEAN DEFAULT true
);

-- Templates for chat responses
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  business_id UUID REFERENCES businesses(id) NOT NULL,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  language TEXT DEFAULT 'en',
  template_type TEXT NOT NULL, -- 'greeting', 'faq', 'price', 'order', 'payment'
  keywords TEXT[] -- For searching/matching
);

-- Conversations table
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  business_id UUID REFERENCES businesses(id) NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_name TEXT,
  whatsapp_thread_id TEXT, -- WhatsApp Business API reference
  status TEXT DEFAULT 'active', -- 'active', 'closed', 'archived'
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages within conversations
CREATE TABLE messages (
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

-- Payments and transactions
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  business_id UUID REFERENCES businesses(id) NOT NULL,
  conversation_id UUID REFERENCES conversations(id),
  customer_phone TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  payment_method TEXT DEFAULT 'upi', -- 'upi', 'cash', 'card'
  reference_id TEXT, -- External payment reference
  upi_txn_id TEXT, -- UPI transaction ID
  status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded'
  notes TEXT
);

-- GST-compliant invoices
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  invoice_number TEXT NOT NULL, -- Format: INV-{YYYYMMDD}-{SEQUENCE}
  business_id UUID REFERENCES businesses(id) NOT NULL,
  transaction_id UUID REFERENCES transactions(id),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_gstin TEXT, -- Customer's GST number if B2B
  invoice_date DATE DEFAULT CURRENT_DATE,
  amount DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'issued', -- 'issued', 'paid', 'cancelled'
  pdf_url TEXT, -- GST invoice PDF location
  hsn_code TEXT, -- Harmonized System Nomenclature code for GST
  place_of_supply TEXT -- Required for GST
);

-- Products/services catalog
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  business_id UUID REFERENCES businesses(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  hsn_code TEXT, -- For GST calculation
  tax_rate DECIMAL(5,2) DEFAULT 18.00, -- GST percentage
  inventory_count INTEGER, -- For tracking stock
  image_url TEXT,
  active BOOLEAN DEFAULT true
);

-- Audit logs for HIPAA and compliance
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  action TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  business_id UUID REFERENCES businesses(id),
  resource_type TEXT,
  resource_id UUID,
  ip_address TEXT,
  metadata JSONB,
  retention_period INTEGER -- Days to retain this record
);

-----------------------
-- Row Level Security --
-----------------------

-- Enable RLS on all tables
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Business access policy
CREATE POLICY business_owner_access ON businesses
  FOR ALL USING (auth.uid() = owner_id);

-- Templates access policy
CREATE POLICY template_owner_access ON templates
  FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));

-- Conversations access policy
CREATE POLICY conversation_business_access ON conversations
  FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));

-- Messages access policy
CREATE POLICY message_conversation_access ON messages
  FOR ALL USING (conversation_id IN (
    SELECT id FROM conversations WHERE business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid())));

-- Transactions access policy
CREATE POLICY transaction_business_access ON transactions
  FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));

-- Invoices access policy
CREATE POLICY invoice_business_access ON invoices
  FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));

-- Products access policy
CREATE POLICY product_business_access ON products
  FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));

-- Audit logs - append only for write, restricted read
CREATE POLICY audit_log_insert ON audit_logs FOR INSERT WITH CHECK (true);
CREATE POLICY audit_log_read ON audit_logs FOR SELECT USING (
  (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())) OR 
  (user_id = auth.uid())
);

-- Create indexes for performance
CREATE INDEX idx_businesses_owner ON businesses(owner_id);
CREATE INDEX idx_templates_business ON templates(business_id);
CREATE INDEX idx_conversations_business ON conversations(business_id);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_transactions_business ON transactions(business_id);
CREATE INDEX idx_invoices_business ON invoices(business_id);
CREATE INDEX idx_products_business ON products(business_id);
CREATE INDEX idx_audit_business ON audit_logs(business_id);

-- Functions for triggers
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Set up triggers for updated_at
CREATE TRIGGER set_businesses_updated_at BEFORE UPDATE ON businesses FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER set_templates_updated_at BEFORE UPDATE ON templates FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER set_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER set_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER set_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
