export interface Subscriber {
  id: string;
  email: string;
  name?: string;
  site_name?: string;
  client_id?: string;
  date_added: string;
  status: 'active' | 'unsubscribed' | 'pending';
}

export interface Campaign {
  id: string;
  name: string;
  subject: string;
  status: 'draft' | 'scheduled' | 'sent' | 'sending';
  sent_count: number;
  open_rate: number;
  click_rate: number;
  date_created: string;
}

export interface RecentActivity {
  id: string;
  type: 'subscriber_join' | 'campaign_sent' | 'campaign_created' | 'domain_verified' | 'email_read' | 'email_bounced';
  title: string;
  detail: string;
  timestamp: string;
  rawDate?: string;
}

export type ActiveTab = 'dashboard' | 'subscribers' | 'settings' | 'email-center';
