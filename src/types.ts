export interface Subscriber {
  id: string;
  email: string;
  client_id: string;
  date_added: string;
  status: 'active' | 'unsubscribed' | 'pending';
}

export interface Campaign {
  id: string;
  name: string;
  subject: string;
  status: 'draft' | 'scheduled' | 'sent' | 'sending';
  sent_count: number;
  open_rate: number; // e.g., 24.5 for 24.5%
  click_rate: number; // e.g., 3.2 for 3.2%
  date_created: string;
}

export interface RecentActivity {
  id: string;
  type: 'subscriber_join' | 'campaign_sent' | 'campaign_created' | 'domain_verified';
  title: string;
  detail: string;
  timestamp: string;
}

export type ActiveTab = 'dashboard' | 'subscribers' | 'campaigns' | 'settings' | 'email-center';
