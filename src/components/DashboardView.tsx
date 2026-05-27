import { SVGProps } from 'react';
import { Users, Send, CheckCircle, TrendingUp, AlertCircle, ArrowUpRight, Play, ServerCrash, Sparkles } from 'lucide-react';
import { Subscriber, Campaign, RecentActivity, ActiveTab } from '../types';

interface DashboardViewProps {
  subscribers: Subscriber[];
  campaigns: Campaign[];
  activities: RecentActivity[];
  setActiveTab: (tab: ActiveTab) => void;
  onClearActivities?: () => void;
}

export default function DashboardView({
  subscribers,
  campaigns,
  activities,
  setActiveTab,
  onClearActivities,
}: DashboardViewProps) {
  // Compute key stats dynamically
  const totalSubscribers = subscribers.length;
  const activeSubscribersCount = subscribers.filter(s => s.status === 'active').length;
  const totalCampaigns = campaigns.length;
  const sentCampaigns = campaigns.filter(c => c.status === 'sent').length;
  
  // Custom mock analytics calculation
  const averageOpenRate = campaigns.filter(c => c.status === 'sent' && c.open_rate > 0)
    .reduce((acc, curr, _, arr) => acc + curr.open_rate / arr.length, 0) || 42.8;

  const averageClickRate = campaigns.filter(c => c.status === 'sent' && c.click_rate > 0)
    .reduce((acc, curr, _, arr) => acc + curr.click_rate / arr.length, 0) || 12.4;

  return (
    <div id="dashboard-view-container" className="space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-900 to-indigo-950 rounded-2xl p-6 md:p-8 text-white shadow-md relative overflow-hidden border border-indigo-950">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Sparkles className="w-48 h-48" />
        </div>
        <div className="relative z-10 max-w-xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-400/20 text-xs font-medium text-indigo-300 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            MVP Workspace Ready
          </span>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">Welcome to XTOPFlow</h1>
          <p className="text-indigo-200 text-sm md:text-base leading-relaxed">
            Manage your customer database, distribute beautiful automated sequences, and track real-time open and bounce metrics from a single clean screen.
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            <button
              onClick={() => setActiveTab('campaigns')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 font-medium text-xs rounded-lg transition-colors shadow-xs active:scale-95 duration-150 inline-flex items-center gap-1.5"
            >
              <PlusIcon className="w-3.5 h-3.5" /> Launch Campaign
            </button>
            <button
              onClick={() => setActiveTab('subscribers')}
              className="px-4 py-2 bg-white/10 hover:bg-white/15 border border-white/15 text-indigo-100 font-medium text-xs rounded-lg transition-colors cursor-pointer"
            >
              Configure Target Audience
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI: Total Subscribers */}
        <div className="bg-white border border-zinc-200 p-6 rounded-xl shadow-xs hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Total Subscribers</p>
              <h3 className="text-3xl font-extrabold text-zinc-900 leading-none">{totalSubscribers}</h3>
            </div>
            <div className="w-12 h-12 rounded-lg bg-indigo-550/10 text-indigo-600 flex items-center justify-center bg-indigo-50">
              <Users className="w-5 h-5 text-indigo-600" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
            <span className="flex items-center gap-1 text-emerald-600 font-medium">
              <TrendingUp className="w-3.5 h-3.5" /> +12% this week
            </span>
            <span>{activeSubscribersCount} active</span>
          </div>
        </div>

        {/* KPI: Total Campaigns */}
        <div className="bg-white border border-zinc-200 p-6 rounded-xl shadow-xs hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Total Campaigns</p>
              <h3 className="text-3xl font-extrabold text-zinc-900 leading-none">{totalCampaigns}</h3>
            </div>
            <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Send className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
            <span className="font-semibold text-emerald-600">{sentCampaigns} delivered</span>
            <span>{campaigns.filter(c => c.status === 'draft').length} drafts saved</span>
          </div>
        </div>

        {/* KPI: Average Open Rate */}
        <div className="bg-white border border-zinc-200 p-6 rounded-xl shadow-xs hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Avg. Open Rate</p>
              <h3 className="text-3xl font-extrabold text-zinc-900 leading-none">{averageOpenRate.toFixed(1)}%</h3>
            </div>
            <div className="w-12 h-12 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
            <span className="text-amber-600 font-medium inline-flex items-center gap-0.5">
              Target: 45.0%
            </span>
            <span>Industry avg: 21.3%</span>
          </div>
        </div>

        {/* KPI: Average Click-through Rate */}
        <div className="bg-white border border-zinc-200 p-6 rounded-xl shadow-xs hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Avg. Click Rate</p>
              <h3 className="text-3xl font-extrabold text-zinc-900 leading-none">{averageClickRate.toFixed(1)}%</h3>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
            <span className="text-blue-600 font-semibold">High Engagement</span>
            <span>Industry avg: 2.5%</span>
          </div>
        </div>
      </div>

      {/* Main Section Grid (List & visual charts) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Growth Tracking Chart (Clean pure SVG visual) */}
        <div className="bg-white border border-zinc-200 rounded-xl p-6 lg:col-span-2 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="font-bold text-base text-zinc-900">Weekly Subscriber Growth</h4>
              <p className="text-xs text-zinc-500">Audience acquisitions tracked over the current quarter</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-zinc-100 text-zinc-600 rounded-full inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-indigo-600" /> Active
            </span>
          </div>

          {/* Elegant SVG Custom Curve or Bar Chart */}
          <div className="h-64 flex flex-col justify-end relative">
            {/* Grid references */}
            <div className="absolute inset-x-0 top-0 border-t border-dashed border-zinc-100 h-0" />
            <div className="absolute inset-x-0 top-1/3 border-t border-dashed border-zinc-100 h-0" />
            <div className="absolute inset-x-0 top-2/3 border-t border-dashed border-zinc-100 h-0" />
            
            {/* SVG Illustration */}
            <svg viewBox="0 0 500 180" className="w-full h-44 h-full text-indigo-500 overflow-visible">
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgb(79, 70, 229)" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="rgb(79, 70, 229)" stopOpacity="0.00" />
                </linearGradient>
              </defs>
              {/* Curve Area */}
              <path
                d="M 10,150 Q 80,140 150,110 T 290,60 T 430,25"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <path
                d="M 10,150 Q 80,140 150,110 T 290,60 T 430,25 L 430,170 L 10,170 Z"
                fill="url(#chartGrad)"
              />
              {/* Highlight Nodes */}
              <circle cx="150" cy="110" r="5" className="fill-white stroke-indigo-600 stroke-2" />
              <circle cx="290" cy="60" r="5" className="fill-white stroke-indigo-600 stroke-2" />
              <circle cx="430" cy="25" r="5.5" className="fill-indigo-600 stroke-white stroke-2 shadow-sm animate-pulse" />
            </svg>

            {/* X Labels */}
            <div className="flex justify-between items-center text-[10px] font-medium text-zinc-400 mt-4 border-t border-zinc-100 pt-3">
              <span>WK 17 (May 1)</span>
              <span>WK 18 (May 8)</span>
              <span>WK 19 (May 15)</span>
              <span>WK 20 (May 22)</span>
              <span>WK 21 (May 27)</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-zinc-100 flex justify-between text-xs text-zinc-500">
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              <strong>124 new users</strong> added this quarter
            </span>
            <button 
              onClick={() => setActiveTab('subscribers')} 
              className="text-indigo-600 font-semibold hover:text-indigo-700 hover:underline inline-flex items-center gap-1.5 cursor-pointer"
            >
              Audience Manager <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs flex flex-col h-full justify-between">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-bold text-base text-zinc-900">Recent Activity</h4>
              {onClearActivities && (
                <button
                  onClick={onClearActivities}
                  className="text-[10px] font-semibold text-zinc-400 hover:text-zinc-600 uppercase tracking-wider cursor-pointer"
                >
                  Clear All
                </button>
              )}
            </div>
            <p className="text-xs text-zinc-500">System, subscription, and dispatch logs</p>
          </div>

          <div className="flex-1 space-y-4 max-h-[290px] overflow-y-auto pr-1">
            {activities.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12 text-zinc-400">
                <CheckCircle className="w-8 h-8 text-zinc-300 mb-2" />
                <p className="text-xs font-medium">All caught up!</p>
                <p className="text-[10px] text-zinc-400">No new alerts or system events.</p>
              </div>
            ) : (
              activities.map((act) => {
                // Determine icon matching activity type
                let colorClass = 'bg-zinc-100 text-zinc-600';
                if (act.type === 'subscriber_join') colorClass = 'bg-indigo-50 text-indigo-600 border border-indigo-100';
                if (act.type === 'campaign_sent') colorClass = 'bg-emerald-50 text-emerald-600 border border-emerald-100';
                if (act.type === 'domain_verified') colorClass = 'bg-blue-50 text-blue-600 border border-blue-100';
                if (act.type === 'campaign_created') colorClass = 'bg-yellow-50 text-yellow-600 border border-yellow-100';

                return (
                  <div key={act.id} className="flex gap-3 items-start p-3 hover:bg-zinc-50 rounded-lg transition-colors border border-transparent hover:border-zinc-150">
                    <div className={`mt-0.5 w-7 h-7 rounded-md flex items-center justify-center text-xs shrink-0 ${colorClass}`}>
                      {act.type === 'subscriber_join' && <Users className="w-3.5 h-3.5" />}
                      {act.type === 'campaign_sent' && <Send className="w-3.5 h-3.5" />}
                      {act.type === 'domain_verified' && <CheckCircle className="w-3.5 h-3.5" />}
                      {act.type === 'campaign_created' && <PlusIcon className="w-3.5 h-3.5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-zinc-900 leading-tight">{act.title}</p>
                      <p className="text-[11px] text-zinc-500 truncate mt-0.5">{act.detail}</p>
                      <span className="text-[9px] text-zinc-400 mt-1 block font-mono">{act.timestamp}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-zinc-100 text-center">
            <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-semibold">
              Live updates active
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlusIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}
