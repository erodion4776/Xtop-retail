export interface Subscriber {
  id: string;
  email: string;
  name?: string;
  status?: string;
  site_name?: string;
  client_id?: string;
  tenants?: {
    brand_name: string;
    site_key: string;
  };
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

export type ActiveTab = 'health' | 'send' | 'welcome' | 'logs' | 'test';

export const SITE_DEFAULTS: Record<string, { subject: string; body: string }> = {
  cyvisahelp: {
    subject: 'Your Free VAWA Strategy Guide is Inside 🔐',
    body: `<h3>Welcome to the VAWA Strategy Academy</h3><p>Your free protection guide has been compiled. Explore it here to map your independent immigration pathway.</p>`
  },
  cybarprep: {
    subject: 'Your Free California Bar Exam Study Kit is ready 📝',
    body: `<h3>Welcome to CY Bar Prep</h3><p>Conceptual clarity is the key to passing. Download your essay and MBE cheat-sheets to begin studying today!</p>`
  },
  cylawtech: {
    subject: 'Your Free LawTech Automation Checklist is inside ⚙️',
    body: `<h3>Welcome to CY Law Tech</h3><p>Start automating your document drafting workflows using our secure tech stack blueprints.</p>`
  }
};
