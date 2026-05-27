import { Subscriber, Campaign, RecentActivity } from './types';

export const INITIAL_SUBSCRIBERS: Subscriber[] = [
  {
    id: 'sub_1',
    email: 'sarah.connor@cyberdyne.io',
    client_id: 'cl_9821',
    date_added: '2026-05-26 14:32',
    status: 'active',
  },
  {
    id: 'sub_2',
    email: 'bruce.wayne@waynecorp.com',
    client_id: 'cl_4523',
    date_added: '2026-05-25 09:12',
    status: 'active',
  },
  {
    id: 'sub_3',
    email: 'tony.stark@starkindustries.com',
    client_id: 'cl_1120',
    date_added: '2026-05-22 18:45',
    status: 'active',
  },
  {
    id: 'sub_4',
    email: 'peter.parker@dailybugle.net',
    client_id: 'cl_3345',
    date_added: '2026-05-20 11:20',
    status: 'pending',
  },
  {
    id: 'sub_5',
    email: 'clark.kent@dailyplanet.com',
    client_id: 'cl_9901',
    date_added: '2026-05-18 08:05',
    status: 'active',
  },
  {
    id: 'sub_6',
    email: 'selina.kyle@gothamcat.org',
    client_id: 'cl_2210',
    date_added: '2026-05-15 22:50',
    status: 'unsubscribed',
  },
  {
    id: 'sub_7',
    email: 'wade.wilson@chimichanga.co',
    client_id: 'cl_3009',
    date_added: '2026-05-14 13:14',
    status: 'active',
  },
];

export const INITIAL_CAMPAIGNS: Campaign[] = [
  {
    id: 'camp_1',
    name: 'May Product Update Newsletter',
    subject: '✨ Big features inside: Live Tracking & Team Channels',
    status: 'sent',
    sent_count: 1420,
    open_rate: 42.8,
    click_rate: 12.4,
    date_created: '2026-05-20 09:00',
  },
  {
    id: 'camp_2',
    name: 'Welcome Series - Onboarding Part 1',
    subject: 'Welcome to XTOPFlow! Let\'s scale your outreach 🚀',
    status: 'sending',
    sent_count: 48,
    open_rate: 76.2,
    click_rate: 34.1,
    date_created: '2025-05-01 12:00',
  },
  {
    id: 'camp_3',
    name: 'Special Black Friday VIP Sneak Peek',
    subject: 'SHH... early access inside for VIP members only!',
    status: 'draft',
    sent_count: 0,
    open_rate: 0,
    click_rate: 0,
    date_created: '2026-05-24 15:40',
  },
  {
    id: 'camp_4',
    name: 'Inactivity Re-engagement Campaign',
    subject: 'We miss you! Here is 30 days of Free Premium',
    status: 'scheduled',
    sent_count: 0,
    open_rate: 0,
    click_rate: 0,
    date_created: '2026-05-26 10:15',
  },
];

export const INITIAL_ACTIVITIES: RecentActivity[] = [
  {
    id: 'act_1',
    type: 'subscriber_join',
    title: 'New subscriber joined',
    detail: 'sarah.connor@cyberdyne.io joined via API API key',
    timestamp: '2 hours ago',
  },
  {
    id: 'act_2',
    type: 'campaign_sent',
    title: 'Campaign status: Sent',
    detail: '"May Product Update Newsletter" completed delivery to 1,420 targets',
    timestamp: 'Yesterday',
  },
  {
    id: 'act_3',
    type: 'domain_verified',
    title: 'Domain verified successfully',
    detail: 'mail.emailflow-saas.com SPF/DKIM flags green',
    timestamp: '3 days ago',
  },
  {
    id: 'act_4',
    type: 'campaign_created',
    title: 'New draft campaign',
    detail: 'Draft "Special Black Friday VIP Sneak Peek" created',
    timestamp: '3 days ago',
  },
];
