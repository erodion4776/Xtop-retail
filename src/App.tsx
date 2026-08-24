import { useState, startTransition, useEffect, useMemo } from 'react';
import { Menu, Mail, Bell, Activity, Sparkles, AlertCircle, HelpCircle, Loader2 } from 'lucide-react';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import SubscribersView from './components/SubscribersView';
import SettingsView from './components/SettingsView';
import EmailCenter from './components/EmailCenter';

import { ActiveTab, Subscriber, Campaign, RecentActivity } from './types';
import {
  SUPABASE_CONFIGURED,
  getOrCreateClient,
  updateClientSender,
  fetchSubscribersFromDB,
  deleteSubscriberFromDB,
  fetchCampaignsFromDB,
  createCampaignInDB,
  DBClient,
} from './supabase';

// Helper: formats ISO date to friendly relative time
function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return 'Just now';
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);

    if (isNaN(diffSec) || diffSec < 45) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} mins ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hours ago`;
    if (diffSec < 172800) return 'Yesterday';
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return 'Recently';
  }
}

export default function App() {
  const [activeTab, setActiveTabState] = useState<ActiveTab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Connection and profile states
  const [activeClient, setActiveClient] = useState<DBClient | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Centralized Master State linked with Database
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [emailLogs, setEmailLogs] = useState<any[]>([]);

  // 1. Initial Load Database hook: fetch client, subscribers, campaigns, and email logs
  const loadAllData = async () => {
    try {
      const client = await getOrCreateClient('eroeliza1234@gmail.com', 'XTOPFlow Broadcasts');
      setActiveClient(client);

      const [subs, camps, logsRes] = await Promise.all([
        fetchSubscribersFromDB(client.id),
        fetchCampaignsFromDB(client.id),
        fetch('/api/email-logs').catch(() => null)
      ]);

      setSubscribers(subs || []);
      setCampaigns(camps || []);

      if (logsRes && logsRes.ok) {
        const logsData = await logsRes.json();
        setEmailLogs(logsData || []);
      }
    } catch (err) {
      console.error('Database query sequence error:', err);
    }
  };

  useEffect(() => {
    async function initDatabase() {
      setIsLoading(true);
      await loadAllData();
      setIsLoading(false);
    }
    initDatabase();
  }, []);

  // Refresh data whenever user navigates back to Dashboard
  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadAllData();
    }
  }, [activeTab]);

  // 2. Synthesize Real-Time Activity Feed from actual database records
  const dynamicActivities = useMemo<RecentActivity[]>(() => {
    const list: RecentActivity[] = [];

    // Add subscriber join events
    subscribers.forEach((s) => {
      list.push({
        id: `sub_${s.id}`,
        type: 'subscriber_join',
        title: 'New subscriber registered',
        detail: `${s.email} registered on ${s.site_name || 'Website'}`,
        timestamp: formatRelativeTime(s.date_added),
        rawDate: s.date_added || ''
      });
    });

    // Add live email log events (reads, sends, bounces)
    emailLogs.forEach((log) => {
      if (log.status === 'read') {
        list.push({
          id: `log_read_${log.id}`,
          type: 'email_read',
          title: 'Email opened & verified',
          detail: `Recipient ${log.to} opened "${log.subject}"`,
          timestamp: formatRelativeTime(log.opened_at || log.created_at),
          rawDate: log.opened_at || log.created_at || ''
        });
      } else if (log.status === 'bounced') {
        list.push({
          id: `log_bnc_${log.id}`,
          type: 'email_bounced',
          title: 'Email delivery bounced',
          detail: `Message bounced for ${log.to} ("${log.subject}")`,
          timestamp: formatRelativeTime(log.created_at),
          rawDate: log.created_at || ''
        });
      } else {
        list.push({
          id: `log_sent_${log.id}`,
          type: 'campaign_sent',
          title: log.type === 'welcome' ? 'Welcome email dispatched' : 'Campaign email delivered',
          detail: `Sent to ${log.to} ("${log.subject}")`,
          timestamp: formatRelativeTime(log.created_at),
          rawDate: log.created_at || ''
        });
      }
    });

    // Add campaign creation events
    campaigns.forEach((c) => {
      list.push({
        id: `camp_${c.id}`,
        type: c.status === 'sent' ? 'campaign_sent' : 'campaign_created',
        title: c.status === 'sent' ? 'Campaign Broadcast Sent' : 'Campaign Draft Created',
        detail: `"${c.name || c.subject}" (Status: ${c.status})`,
        timestamp: formatRelativeTime(c.date_created),
        rawDate: c.date_created || ''
      });
    });

    // Sort chronologically (newest first)
    list.sort((a, b) => {
      const timeA = a.rawDate ? new Date(a.rawDate).getTime() : 0;
      const timeB = b.rawDate ? new Date(b.rawDate).getTime() : 0;
      return timeB - timeA;
    });

    return list.slice(0, 30); // Top 30 recent events
  }, [subscribers, emailLogs, campaigns]);

  const setActiveTab = (tab: ActiveTab) => {
    startTransition(() => {
      setActiveTabState(tab);
    });
  };

  // 3. State mutations connected with backend APIs
  const handleAddSubscriber = async (newSub: Omit<Subscriber, 'id' | 'date_added'>) => {
    const response = await fetch('/api/subscribers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: newSub.email, 
        name: newSub.name, 
        siteKey: newSub.client_id
      }),
    });

    if (response.ok) {
      const subscriber = await response.json();
      
      const brands: Record<string, string> = {
        'cyvisahelp': 'CY Visa Help',
        'cybarprep': 'CY Bar Prep',
        'cylawtech': 'CY Law Tech'
      };
      
      const mappedSub: Subscriber = {
        id: subscriber.id,
        email: subscriber.email,
        name: subscriber.name || 'Subscriber',
        status: subscriber.status || 'active',
        site_name: brands[newSub.client_id || ''] || 'CY Visa Help',
        client_id: subscriber.tenant_id,
        date_added: subscriber.created_at 
          ? new Date(subscriber.created_at).toISOString().replace('T', ' ').slice(0, 16) 
          : new Date().toISOString().replace('T', ' ').slice(0, 16)
      };

      setSubscribers((prev) => [mappedSub, ...prev]);
      loadAllData();
    } else {
      const errData = await response.json().catch(() => ({}));
      alert(errData.error || 'Could not subscribe user via backend.');
    }
  };

  const handleDeleteSubscriber = async (id: string) => {
    const targeted = subscribers.find((s) => s.id === id);
    if (!targeted) return;

    const success = await deleteSubscriberFromDB(id);
    if (success) {
      setSubscribers((prev) => prev.filter((s) => s.id !== id));
      loadAllData();
    } else {
      alert('Could not delete subscriber record from database.');
    }
  };

  const handleSaveSender = async (newEmail: string, newName: string): Promise<boolean> => {
    if (!activeClient) return false;
    const success = await updateClientSender(activeClient.id, newEmail, newName);
    if (success) {
      setActiveClient((prev) => prev ? { ...prev, sender_email: newEmail, name: newName } : null);
      return true;
    }
    return false;
  };

  return (
    <div id="app-root-container" className="min-h-screen bg-zinc-50 flex font-sans antialiased text-zinc-800">
      
      {/* Navigation Sidebar Panel */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      {/* Primary Dashboard Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Sticky Header */}
        <header id="top-sticky-header" className="h-16 bg-white border-b border-zinc-200 px-6 flex items-center justify-between shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              id="mobile-menu-hamburger"
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 rounded-lg lg:hidden transition-colors"
              aria-label="Open sidebar menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              <span>SaaS Platform</span>
              <span className="text-zinc-300">/</span>
              <span className="text-zinc-900 font-bold">{activeTab}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {SUPABASE_CONFIGURED ? (
              <div className="hidden sm:flex items-center gap-1 bg-emerald-50 border border-emerald-250/50 rounded-full px-3 py-1 text-[10px] font-bold text-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Supabase Connected
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-1 bg-amber-50 border border-amber-200/50 rounded-full px-3 py-1 text-[10px] font-bold text-amber-800">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Sandbox Mode
              </div>
            )}

            <div className="relative">
              <button 
                id="alert-bell-widget"
                className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
                title="System events active"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-indigo-600 rounded-full" />
              </button>
            </div>

            <button
              id="help-guide-widget"
              className="text-xs font-bold text-zinc-500 hover:text-indigo-600 transition-colors hidden md:inline-flex items-center gap-1 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" /> Documentation
            </button>
          </div>
        </header>

        {/* Unconfigured Alert Banner */}
        {!SUPABASE_CONFIGURED && (
          <div id="unconfigured-supabase-banner" className="bg-amber-50 border-b border-amber-200 text-amber-900 px-6 py-2.5 text-xs flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4.5 h-4.5 text-amber-600 shrink-0" />
              <span>
                <strong>Configure Supabase:</strong> Set <code className="mx-1 px-1 py-0.5 bg-amber-100 border border-amber-200 rounded text-[10px] font-mono">VITE_SUPABASE_URL</code> and <code className="px-1 py-0.5 bg-amber-100 border border-amber-200 rounded text-[10px] font-mono">VITE_SUPABASE_ANON_KEY</code>.
              </span>
            </div>
            <a 
              href="#domain-settings" 
              onClick={() => setActiveTab('settings')}
              className="font-bold underline text-amber-950 text-[11px] shrink-0"
            >
              Learn More
            </a>
          </div>
        )}

        {/* Main Workspace Body */}
        <main id="primary-view-panel" className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {isLoading ? (
            <div id="loading-spinner-container" className="h-64 flex flex-col items-center justify-center text-center gap-3">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Synchronizing Activity Feed with Database...</p>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardView
                  subscribers={subscribers}
                  campaigns={campaigns}
                  activities={dynamicActivities}
                  emailLogs={emailLogs}
                  setActiveTab={setActiveTab}
                />
              )}

              {activeTab === 'subscribers' && (
                <SubscribersView
                  subscribers={subscribers}
                  onAddSubscriber={handleAddSubscriber}
                  onDeleteSubscriber={handleDeleteSubscriber}
                />
              )}

              {activeTab === 'settings' && (
                <SettingsView 
                  clientId={activeClient?.id || 'CLIENT_ID_NOT_LOADED'}
                  clientName={activeClient?.name || 'XTOPFlow Broadcasts'}
                  clientEmail="eroeliza1234@gmail.com"
                  senderEmail={activeClient?.sender_email || 'newsletters@xtopflow.com'}
                  senderName={activeClient?.name || 'XTOPFlow Broadcasts'}
                  onSaveSender={handleSaveSender}
                />
              )}

              {activeTab === 'email-center' && (
                <EmailCenter />
              )}
            </>
          )}
        </main>
      </div>

    </div>
  );
}
