-- Migration: Payment & Tax Schema
CREATE TABLE IF NOT EXISTS payment_adapters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    region_code VARCHAR(3) REFERENCES regions(code),
    provider VARCHAR(32),
    config JSONB,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tax_compliance_engines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    region_code VARCHAR(3) REFERENCES regions(code),
    engine_type VARCHAR(32),
    config JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Add more as needed for VAT, GST, Sales Tax, etc.
