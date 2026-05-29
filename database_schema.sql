-- Enable UUID support
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop tables in reverse order of dependency to ensure a clean slate
DROP TABLE IF EXISTS email_templates;
DROP TABLE IF EXISTS subscribers;
DROP TABLE IF EXISTS tenants;

-- Table: tenants
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_key TEXT UNIQUE NOT NULL,
  brand_name TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  primary_color TEXT NOT NULL,
  logo_url TEXT
);

-- Table: email_templates
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT NOT NULL,
  CONSTRAINT fk_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Table: subscribers (linked to tenants)
CREATE TABLE subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  tenant_id UUID NOT NULL,
  status TEXT DEFAULT 'active',
  CONSTRAINT fk_tenant_subscriber FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);
