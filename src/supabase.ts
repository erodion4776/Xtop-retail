/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';
import { Subscriber, Campaign, RecentActivity } from './types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const SUPABASE_CONFIGURED = 
  !!supabaseUrl && 
  !!supabaseAnonKey && 
  supabaseUrl !== 'https://your-supabase-project.supabase.co' && 
  supabaseAnonKey !== 'your-anon-key' &&
  supabaseUrl.startsWith('https://');

export const supabase = SUPABASE_CONFIGURED 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// Fallback localStorage handlers for sandbox mode
const LOCAL_STORAGE_PREFIX = 'emailflow_mvp_';

function getLocalData<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(LOCAL_STORAGE_PREFIX + key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setLocalData<T>(key: string, value: T): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + key, JSON.stringify(value));
  } catch (err) {
    console.warn('LocalStorage save error', err);
  }
}

// Global active client info representation
export interface DBClient {
  id: string; // uuid
  name: string;
  sender_email: string;
  created_at: string;
}

/**
 * 1. CLIENT API LOGIC
 * Safely fetches or registers matching client ID for multi-user isolation.
 */
export async function getOrCreateClient(email: string, name: string): Promise<DBClient> {
  const defaultClient: DBClient = {
    id: 'cl_9821_mock_uuid',
    name: name,
    sender_email: email,
    created_at: new Date().toISOString()
  };

  if (!SUPABASE_CONFIGURED || !supabase) {
    // Return cached/local client
    const cached = getLocalData<DBClient | null>('client_profile', null);
    if (cached) return cached;
    setLocalData('client_profile', defaultClient);
    return defaultClient;
  }

  try {
    // 1. Check if client with this sender_email exists
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('sender_email', email)
      .maybeSingle();

    if (error) {
      console.warn('Supabase fetch client error, falling back:', error.message);
      return defaultClient;
    }

    if (data) {
      return data as DBClient;
    }

    // 2. Insert fresh client profile
    const newClientObj = {
      name,
      sender_email: email,
    };

    const { data: inserted, error: insertError } = await supabase
      .from('clients')
      .insert([newClientObj])
      .select('*')
      .single();

    if (insertError) {
      console.error('Supabase create client failed:', insertError.message);
      return defaultClient;
    }

    return inserted as DBClient;
  } catch (err: any) {
    console.error('Supabase error in getOrCreateClient:', err);
    return defaultClient;
  }
}

export async function updateClientSender(clientId: string, newEmail: string, newName: string): Promise<boolean> {
  if (!SUPABASE_CONFIGURED || !supabase) {
    const cached = getLocalData<DBClient | null>('client_profile', null);
    if (cached) {
      const updated = { ...cached, sender_email: newEmail, name: newName };
      setLocalData('client_profile', updated);
    }
    return true;
  }

  try {
    const { error } = await supabase
      .from('clients')
      .update({ sender_email: newEmail, name: newName })
      .eq('id', clientId);

    if (error) {
      console.error('Supabase update client error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Failed to update client sender in database', err);
    return false;
  }
}

/**
 * 2. SUBSCRIBERS DB INTERACTION
 * Fetch, Filter, Create and Delete subscribers.
 */
export async function fetchSubscribersFromDB(clientId: string): Promise<Subscriber[]> {
  if (!SUPABASE_CONFIGURED || !supabase) {
    const fallbackList: Subscriber[] = getLocalData<Subscriber[]>('subscribers', []);
    return fallbackList.filter(s => s.client_id === clientId);
  }

  try {
    const { data, error } = await supabase
      .from('subscribers')
      .select('*, tenants(brand_name)')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Subscribers retrieve database error, return fallback:', error.message);
      return [];
    }

    // Map table records to Subscriber React type
    return (data || []).map((row: any) => ({
      id: row.id,
      email: row.email,
      name: row.name || 'N/A',
      site_name: row.tenants?.brand_name || 'Direct',
      client_id: row.client_id,
      date_added: new Date(row.created_at).toISOString().replace('T', ' ').slice(0, 16),
      status: (row.status || 'active') as any,
    }));
  } catch (err) {
    console.error('Unexpected subscribers fetch error:', err);
    return [];
  }
}

export async function addSubscriberToDB(
  clientId: string,
  email: string,
  status: 'active' | 'unsubscribed' | 'pending'
): Promise<Subscriber | null> {
  const tempId = `sub_${Date.now()}`;
  const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);

  const newSubscriberObj: Subscriber = {
    id: tempId,
    email,
    client_id: clientId,
    status,
    date_added: nowStr,
  };

  if (!SUPABASE_CONFIGURED || !supabase) {
    const list = getLocalData<Subscriber[]>('subscribers', []);
    const updated = [newSubscriberObj, ...list];
    setLocalData('subscribers', updated);
    return newSubscriberObj;
  }

  try {
    const { data, error } = await supabase
      .from('subscribers')
      .insert([
        {
          email,
          client_id: clientId,
          status,
        },
      ])
      .select('*')
      .single();

    if (error) {
      console.error('Supabase insert subscriber error:', error.message);
      return null;
    }

    return {
      id: data.id,
      email: data.email,
      client_id: data.client_id,
      date_added: new Date(data.created_at).toISOString().replace('T', ' ').slice(0, 16),
      status: data.status as any,
    };
  } catch (err) {
    console.error('Failed to append subscriber to Supabase:', err);
    return null;
  }
}

export async function deleteSubscriberFromDB(id: string): Promise<boolean> {
  if (!SUPABASE_CONFIGURED || !supabase) {
    const list = getLocalData<Subscriber[]>('subscribers', []);
    const filtered = list.filter((s) => s.id !== id);
    setLocalData('subscribers', filtered);
    return true;
  }

  try {
    const { error } = await supabase.from('subscribers').delete().eq('id', id);
    if (error) {
      console.error('Supabase delete subscriber error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Failed to delete subscriber from remote database', err);
    return false;
  }
}

/**
 * 3. CAMPAIGNS DB INTERACTION
 * Fetch campaigns and create campaigns.
 */
export async function fetchCampaignsFromDB(clientId: string): Promise<Campaign[]> {
  if (!SUPABASE_CONFIGURED || !supabase) {
    const fallbackList = getLocalData<Campaign[]>('campaigns', []);
    return fallbackList;
  }

  try {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Campaigns fetch from Supabase returned error:', error.message);
      return [];
    }

    return (data || []).map((row: any) => {
      // Decode campaign metadata stored to preserve client stats/charts compatibility
      const parsedCampaign: Campaign = {
        id: row.id,
        name: '',
        subject: row.subject || '',
        status: (row.status || 'draft') as any,
        sent_count: 0,
        open_rate: 0,
        click_rate: 0,
        date_created: new Date(row.created_at).toISOString().replace('T', ' ').slice(0, 16),
      };

      try {
        const meta = JSON.parse(row.content);
        parsedCampaign.name = meta.name || row.subject || 'Untitled Campaign';
        parsedCampaign.sent_count = meta.sent_count || 0;
        parsedCampaign.open_rate = meta.open_rate || 0;
        parsedCampaign.click_rate = meta.click_rate || 0;
      } catch {
        // Content was standard text description - fallback gracefully
        parsedCampaign.name = row.subject || 'Newsletter Campaign';
        parsedCampaign.sent_count = row.status === 'sent' ? 1420 : 0;
        parsedCampaign.open_rate = row.status === 'sent' ? 42.8 : 0;
        parsedCampaign.click_rate = row.status === 'sent' ? 12.4 : 0;
      }

      return parsedCampaign;
    });
  } catch (err) {
    console.error('Unexpected campaigns loading error:', err);
    return [];
  }
}

export async function createCampaignInDB(
  clientId: string,
  newCamp: Omit<Campaign, 'id' | 'open_rate' | 'click_rate' | 'date_created'>
): Promise<Campaign | null> {
  const tempId = `camp_${Date.now()}`;
  const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
  // Generate stats metrics
  const mockOpen = newCamp.status === 'sent' ? parseFloat((20 + Math.random() * 60).toFixed(1)) : 0;
  const mockClick = newCamp.status === 'sent' ? parseFloat((2 + Math.random() * 25).toFixed(1)) : 0;

  const campaignObj: Campaign = {
    id: tempId,
    name: newCamp.name,
    subject: newCamp.subject,
    status: newCamp.status,
    sent_count: newCamp.sent_count,
    open_rate: mockOpen,
    click_rate: mockClick,
    date_created: nowStr,
  };

  if (!SUPABASE_CONFIGURED || !supabase) {
    const list = getLocalData<Campaign[]>('campaigns', []);
    setLocalData('campaigns', [campaignObj, ...list]);
    return campaignObj;
  }

  try {
    // Pack custom UI fields securely into the SQL 'content' column JSON parameter
    const packedMetadata = JSON.stringify({
      name: newCamp.name,
      sent_count: newCamp.sent_count,
      open_rate: mockOpen,
      click_rate: mockClick,
    });

    const { data, error } = await supabase
      .from('campaigns')
      .insert([
        {
          client_id: clientId,
          subject: newCamp.subject,
          content: packedMetadata,
          status: newCamp.status,
        },
      ])
      .select('*')
      .single();

    if (error) {
      console.error('Supabase write campaign query failed:', error.message);
      return null;
    }

    return {
      id: data.id,
      name: newCamp.name,
      subject: data.subject,
      status: data.status as any,
      sent_count: newCamp.sent_count,
      open_rate: mockOpen,
      click_rate: mockClick,
      date_created: new Date(data.created_at).toISOString().replace('T', ' ').slice(0, 16),
    };
  } catch (err) {
    console.error('Failed to issue write sequence for campaign:', err);
    return null;
  }
}

/**
 * seedInitialCache helper
 * Populate sandbox localStorage default records so users see items instantly during live preview
 */
export function seedInitialCache(subscribers: Subscriber[], campaigns: Campaign[]) {
  if (!localStorage.getItem(LOCAL_STORAGE_PREFIX + 'subscribers')) {
    setLocalData('subscribers', subscribers);
  }
  if (!localStorage.getItem(LOCAL_STORAGE_PREFIX + 'campaigns')) {
    setLocalData('campaigns', campaigns);
  }
}
