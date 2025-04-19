-- BizChatAssist SMS Integration Support
-- Add multi-channel support to the existing schema

-- Add channel_type to conversations table
ALTER TABLE conversations 
ADD COLUMN channel_type TEXT DEFAULT 'whatsapp' CHECK (channel_type IN ('whatsapp', 'sms', 'web'));

-- Add channel_type to messages table
ALTER TABLE messages
ADD COLUMN channel_type TEXT DEFAULT 'whatsapp' CHECK (channel_type IN ('whatsapp', 'sms', 'web'));

-- Create SMS templates table
CREATE TABLE sms_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  business_id UUID REFERENCES businesses(id) NOT NULL,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  character_count INTEGER GENERATED ALWAYS AS (length(content)) STORED,
  template_type TEXT NOT NULL, -- 'greeting', 'payment', 'order', 'price', 'confirmation'
  keywords TEXT[]
);

-- Add SMS configuration to businesses table
ALTER TABLE businesses
ADD COLUMN sms_sender_id TEXT, -- 6-character sender ID for Indian SMS (e.g., BIZCHAT)
ADD COLUMN sms_enabled BOOLEAN DEFAULT false,
ADD COLUMN sms_daily_limit INTEGER DEFAULT 100, -- Default SMS limit per day
ADD COLUMN sms_monthly_quota INTEGER DEFAULT 3000; -- Default SMS quota per month

-- Create SMS usage tracking table
CREATE TABLE sms_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  business_id UUID REFERENCES businesses(id) NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  month TEXT GENERATED ALWAYS AS (to_char(date, 'YYYY-MM')) STORED,
  count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' -- 'active', 'limit_reached', 'suspended'
);

-- Create indexes for performance
CREATE INDEX idx_conversations_channel ON conversations(channel_type);
CREATE INDEX idx_messages_channel ON messages(channel_type);
CREATE INDEX idx_sms_templates_business ON sms_templates(business_id);
CREATE INDEX idx_sms_usage_business_date ON sms_usage(business_id, date);
CREATE INDEX idx_sms_usage_business_month ON sms_usage(business_id, month);

-- Enable RLS on new tables
ALTER TABLE sms_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_usage ENABLE ROW LEVEL SECURITY;

-- Set up RLS policies
CREATE POLICY sms_template_business_access ON sms_templates
  FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));

CREATE POLICY sms_usage_business_access ON sms_usage
  FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));

-- Set up trigger for updated_at
CREATE TRIGGER set_sms_templates_updated_at BEFORE UPDATE ON sms_templates FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
