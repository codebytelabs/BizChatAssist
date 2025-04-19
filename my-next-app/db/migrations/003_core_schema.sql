-- Migration: Core Schema for BizChatAssist
CREATE TABLE IF NOT EXISTS businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    region_code VARCHAR(3) REFERENCES regions(code),
    default_currency VARCHAR(10),
    default_language VARCHAR(10),
    business_type VARCHAR(20),
    timezone VARCHAR(64),
    payment_preferences JSONB,
    compliance JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS regions (
    code VARCHAR(3) PRIMARY KEY, -- ISO country code
    name TEXT NOT NULL,
    currencies TEXT[],
    tax_rates JSONB,
    languages TEXT[],
    phone_regex TEXT,
    currency_format JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id),
    customer_id UUID,
    channel_type VARCHAR(16) NOT NULL, -- 'whatsapp', 'sms', 'web', etc
    metadata JSONB,
    last_message_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversations_channel ON conversations(business_id, channel_type, last_message_at);

CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id),
    amount_cents BIGINT NOT NULL,
    currency VARCHAR(10) NOT NULL,
    payment_provider VARCHAR(32),
    provider_data JSONB,
    status VARCHAR(32),
    status_history JSONB,
    exchange_rate NUMERIC,
    exchange_rate_timestamp TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id),
    template_type VARCHAR(16),
    base_template TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS template_translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES templates(id),
    language_code VARCHAR(10) NOT NULL,
    translation TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id),
    invoice_number TEXT NOT NULL,
    line_items JSONB,
    tax_method VARCHAR(16),
    regional_tax_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS language_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id),
    customer_id UUID,
    ui_language VARCHAR(10),
    messaging_language VARCHAR(10),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Example RLS policy stub
-- ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY tenant_isolation ON businesses USING (auth.uid() = id);
