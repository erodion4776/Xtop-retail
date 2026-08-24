export interface Subscriber {
  id: string;
  email: string;
  name?: string;
  status?: string;
  site_name?: string;
  client_id?: string;
  tenants?: { brand_name: string; site_key: string; };
}

export interface EmailLog {
  id: string;
  to: string;
  subject: string;
  status: string;
  type: string;
  created_at: string;
}

export interface WelcomeTemplate {
  subject: string;
  body: string;
  enabled: boolean;
}

export interface SavedTemplate {
  id: string;
  tenant_id: string;
  name: string;
  description: string;
  html_content: string;
  category: string;
  created_at: string;
  updated_at: string;
}

export type ActiveTab = 'health' | 'send' | 'welcome' | 'logs' | 'test' | 'library';

export const SITE_DEFAULTS: Record<string, { subject: string; body: string }> = {
  cyvisahelp: {
    subject: 'Your Free VAWA Strategy Guide is Inside 🔐',
    body: `<h3>Welcome to VAWA Strategy Academy</h3><p>Your guide is ready.</p>`
  },
  cybarprep: {
    subject: 'Welcome to CyAzor LawTech Solutions',
    body: `<h3>Welcome to Cross-Border Legal Conversations</h3><p>Thank you for joining.</p>`
  },
  cylawtech: {
    subject: 'Your Free LawTech Automation Checklist',
    body: `<h3>Welcome to CY Law Tech</h3><p>Start automating today.</p>`
  }
};
