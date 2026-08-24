export interface SiteConfig {
  siteKey: string;
  brandName: string;
  senderName: string;
  website: string;
  logo: string;
  primaryColor: string;
}

export const siteConfigs: SiteConfig[] = [
  {
    siteKey: "cyvisahelp",
    brandName: "CY Visa Help",
    senderName: "CY Visa Help Team",
    website: "https://cyvisahelp.com",
    logo: "https://images.unsplash.com/photo-1524661135-423995f22d0b?w=100&h=100&fit=crop",
    primaryColor: "#0f172a"
  },
  {
    siteKey: "cybarprep",
    brandName: "CY Bar Prep",
    senderName: "CY Bar Prep Support",
    website: "https://cybarprep.com",
    logo: "https://images.unsplash.com/photo-1589829545856-d44a1edb928f?w=100&h=100&fit=crop",
    primaryColor: "#b91c1c"
  },
  {
    siteKey: "cylawtech",
    brandName: "CY Law Tech",
    senderName: "CY Law Tech Team",
    website: "https://cylawtech.com",
    logo: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=100&h=100&fit=crop",
    primaryColor: "#1d4ed8"
  }
];

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
  opened_at?: string;
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
