import { useState, startTransition, useEffect } from 'react';
import { Menu, Mail, Bell, Activity, Sparkles, AlertCircle, HelpCircle, Loader2 } from 'lucide-react';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import SubscribersView from './components/SubscribersView';
import CampaignsView from './components/CampaignsView';
import SettingsView from './components/SettingsView';
import EmailCenter from './components/EmailCenter';

import { ActiveTab, Subscriber, Campaign, RecentActivity } from './types';
import { INITIAL_SUBSCRIBERS, INITIAL_CAMPAIGNS, INITIAL_ACTIVITIES } from './mockData';
import {
  SUPABASE_CONFIGURED,
  getOrCreateClient,
  updateClientSender,
  fetchSubscribersFromDB,
  addSubscriberToDB,
  deleteSubscriberFromDB,
  fetchCampaignsFromDB,
  createCampaignInDB,
  seedInitialCache,
  DBClient,
} from './supabase';

export default function App() {
  const [activeTab, setActiveTabState] = useState<ActiveTab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Connection and profile states
  const [activeClient, setActiveClient] = useState<DBClient | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Centralized Master State linked with Supabase
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [activities, setActivities] = useState<RecentActivity[]>(() => {
    // Activities stay in memory/localStorage for logging simplicity
    const saved = localStorage.getItem('xtopflow_activities');
    return saved ? JSON.parse(saved) : INITIAL_ACTIVITIES;
  });

  // Keep logs synchronized in local cache
  useEffect(() => {
    localStorage.setItem('xtopflow_activities', JSON.stringify(activities));
  }, [activities]);

  // Seed default items helper first if unconfigured so sandbox user sees values
  useEffect(() => {
    seedInitialCache(INITIAL_SUBSCRIBERS, INITIAL_CAMPAIGNS);
  }, []);

  // 1. Initial Load Database hook
  useEffect(() => {
    async function initDatabase() {
      setIsLoading(true);
      try {
        // Automatically establish and register client profile matching the user email 
        const client = await getOrCreateClient('eroeliza1234@gmail.com', 'XTOPFlow Broadcasts');
        setActiveClient(client);

        // Load subscribers and campaigns matching this client_id
        const subs = await fetchSubscribersFromDB(client.id);
        const camps = await fetchCampaignsFromDB(client.id);

        setSubscribers(subs);
        setCampaigns(camps);
      } catch (err) {
        console.error('Database connection / query failed:', err);
      } finally {
        setIsLoading(false);
      }
    }
    initDatabase();
  }, []);

  // Wrap state setting in transition for rendering responsiveness
  const setActiveTab = (tab: ActiveTab) => {
    startTransition(() => {
      setActiveTabState(tab);
    });
  };

  // 2. State mutation callbacks connected with API endpoints
  const handleAddSubscriber = async (newSub: Omit<Subscriber, 'id' | 'date_added'>) => {
    if (!activeClient) return;

    // Call backend API instead of direct Supabase insert
    const response = await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: newSub.email, client_id: activeClient.id }),
    });

    if (response.ok) {
      const { subscriber } = await response.json();
      setSubscribers((prev) => [subscriber, ...prev]);

      // Push activity logger
      const activityObj: RecentActivity = {
        id: `act_${Date.now()}`,
        type: 'subscriber_join',
        title: 'New subscriber joined',
        detail: `${subscriber.email} joined as Client ${subscriber.client_id}`,
        timestamp: 'Just now',
      };
      setActivities((prev) => [activityObj, ...prev]);
    } else {
      alert('Could not subscribe user via backend.');
    }
  };

  const handleDeleteSubscriber = async (id: string) => {
    const targeted = subscribers.find((s) => s.id === id);
    if (!targeted) return;

    const success = await deleteSubscriberFromDB(id);
    if (success) {
      setSubscribers((prev) => prev.filter((s) => s.id !== id));

      // Register removal activity
      const activityObj: RecentActivity = {
        id: `act_${Date.now()}`,
        type: 'subscriber_join',
        title: 'Subscriber Record Removed',
        detail: `${targeted.email} deletion sequence completed`,
        timestamp: 'Just now',
      };
      setActivities((prev) => [activityObj, ...prev]);
    } else {
      alert('Could not delete subscriber record from database.');
    }
  };

  const handleCreateCampaign = async (
    newCamp: Omit<Campaign, 'id' | 'open_rate' | 'click_rate' | 'date_created'>
  ) => {
    if (!activeClient) return;

    const created = await createCampaignInDB(activeClient.id, newCamp);

    if (created) {
      // Trigger backend campaign sending if status is 'sent'
      if (newCamp.status === 'sent') {
          await fetch('/api/send-campaign', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: activeClient.id,
                subject: created.subject,
                content: '<h1>Your Newsletter</h1>', // Simplified for now
                campaign_id: created.id
            }),
          });
      }

      setCampaigns((prev) => [created, ...prev]);

      // Register activity block
      const activityObj: RecentActivity = {
        id: `act_${Date.now()}`,
        type: created.status === 'sent' ? 'campaign_sent' : 'campaign_created',
        title: created.status === 'sent' ? 'Campaign Delivered' : 'Campaign draft compiled',
        detail: `"${created.name}" status flagged as ${created.status.toUpperCase()}`,
        timestamp: 'Just now',
      };
      setActivities((prev) => [activityObj, ...prev]);
    } else {
      alert('Could not generate campaign in database.');
    }
  };

  // Helper callback for settings updates
  const handleSaveSender = async (newEmail: string, newName: string): Promise<boolean> => {
    if (!activeClient) return false;
    const success = await updateClientSender(activeClient.id, newEmail, newName);
    if (success) {
      setActiveClient((prev) => prev ? { ...prev, sender_email: newEmail, name: newName } : null);
      
      // Save notification
      const activityObj: RecentActivity = {
        id: `act_${Date.now()}`,
        type: 'domain_verified',
        title: 'Sender Info Updated',
        detail: `Default sender identity updated to ${newName} <${newEmail}>`,
        timestamp: 'Just now',
      };
      setActivities((prev) => [activityObj, ...prev]);
      return true;
    }
    return false;
  };

  const handleClearActivities = () => {
    setActivities([]);
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
            {/* Hamburger Button (Show on mobile) */}
            <button
              id="mobile-menu-hamburger"
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 rounded-lg lg:hidden transition-colors"
              aria-label="Open sidebar menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb Indicator */}
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              <span>SaaS Platform</span>
              <span className="text-zinc-300">/</span>
              <span className="text-zinc-900 font-bold">{activeTab}</span>
            </div>
          </div>

          {/* Right Action Widgets */}
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

            {/* Quick alert indicator */}
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

            {/* Support trigger */}
            <button
              id="help-guide-widget"
              className="text-xs font-bold text-zinc-500 hover:text-indigo-600 transition-colors hidden md:inline-flex items-center gap-1 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" /> Documentation
            </button>
          </div>
        </header>

        {/* Dynamic Warning Alert for Unauthenticated Users */}
        {!SUPABASE_CONFIGURED && (
          <div id="unconfigured-supabase-banner" className="bg-amber-50 border-b border-amber-200 text-amber-900 px-6 py-2.5 text-xs flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4.5 h-4.5 text-amber-600 shrink-0" />
              <span>
                <strong>Configure Supabase:</strong> Mount your remote database credentials inside AI Studio using variables 
                <code className="mx-1.5 px-1 py-0.5 bg-amber-100 border border-amber-200 rounded text-[10px] font-mono">VITE_SUPABASE_URL</code> 
                and 
                <code className="px-1 py-0.5 bg-amber-100 border border-amber-200 rounded text-[10px] font-mono">VITE_SUPABASE_ANON_KEY</code>.
                Currently running on safe local browser storage backups.
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

        {/* Client View Body Panel */}
        <main id="primary-view-panel" className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {isLoading ? (
            <div id="loading-spinner-container" className="h-64 flex flex-col items-center justify-center text-center gap-3">
              <Loader2 className="w-8 h-8 text-indigo-650 animate-spin text-indigo-600" />
              <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Synchronizing with SaaS Backend...</p>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardView
                  subscribers={subscribers}
                  campaigns={campaigns}
                  activities={activities}
                  setActiveTab={setActiveTab}
                  onClearActivities={handleClearActivities}
                />
              )}

              {activeTab === 'subscribers' && (
                <SubscribersView
                  subscribers={subscribers}
                  onAddSubscriber={handleAddSubscriber}
                  onDeleteSubscriber={handleDeleteSubscriber}
                />
              )}

              {activeTab === 'campaigns' && (
                <CampaignsView 
                  campaigns={campaigns} 
                  onCreateCampaign={handleCreateCampaign} 
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
