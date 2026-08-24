import React, { SVGProps } from 'react';
import { 
  Users, Send, CheckCircle, TrendingUp, AlertCircle, 
  ArrowUpRight, Sparkles, Globe, Mail, Eye, AlertOctagon, CheckCircle2 
} from 'lucide-react';
import { Subscriber, Campaign, RecentActivity, ActiveTab } from '../types';

interface EmailLogMetric {
  id: string;
  to: string;
  subject: string;
  status: string;
  created_at: string;
  opened_at?: string;
}

interface DashboardViewProps {
  subscribers: Subscriber[];
  campaigns: Campaign[];
  activities: RecentActivity[];
  emailLogs?: EmailLogMetric[];
  setActiveTab: (tab: ActiveTab) => void;
  onClearActivities?: () => void;
}

export default function DashboardView({
  subscribers,
  campaigns,
  activities,
  emailLogs = [],
  setActiveTab,
  onClearActivities,
}: DashboardViewProps) {
  // 1. Dynamic KPIs computed from live database entities
  const totalSubscribers = subscribers.length;
  const activeSubscribersCount = subscribers.filter(s => s.status === 'active').length;

  const totalLogs = emailLogs.length;
  const readLogsCount = emailLogs.filter(l => l.status === 'read').length;
  const deliveredLogsCount = emailLogs.filter(l => l.status === 'delivered' || l.status === 'sent' || l.status === 'read').length;
  const bouncedLogsCount = emailLogs.filter(l => l.status === 'bounced').length;

  // Real open rate derived from email_logs tracking pixel reads
  const liveOpenRate = totalLogs > 0 ? ((readLogsCount / totalLogs) * 100) : 0;

  // Real delivery rate derived from non-bounced logs
  const liveDeliveryRate = totalLogs > 0 ? (((totalLogs - bouncedLogsCount) / totalLogs) * 100) : 100;

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
            Live Platform Active
          </span>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">Welcome to XTOPFlow</h1>
          <p className="text-indigo-200 text-sm md:text-base leading-relaxed">
            Monitor real-time deliverability, subscriber acquisitions, automated welcome emails, and open-tracking analytics across all your integrated brand sites.
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            <button
              onClick={() => setActiveTab('email-center')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 font-medium text-xs rounded-lg transition-colors shadow-xs active:scale-95 duration-150 inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5" /> Email Center & Broadcasts
            </button>
            <button
              onClick={() => setActiveTab('subscribers')}
              className="px-4 py-2 bg-white/10 hover:bg-white/15 border border-white/15 text-indigo-100 font-medium text-xs rounded-lg transition-colors cursor-pointer"
            >
              Audience Manager ({totalSubscribers} Contacts)
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid (Live Data Driven) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Subscribers */}
        <div className="bg-white border border-zinc-200 p-6 rounded-xl shadow-xs hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Total Subscribers</p>
              <h3 className="text-3xl font-extrabold text-zinc-900 leading-none">{totalSubscribers}</h3>
            </div>
            <div className="w-12 h-12 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
            <span className="flex items-center gap-1 text-emerald-600 font-medium">
              <TrendingUp className="w-3.5 h-3.5" /> Live Database Sync
            </span>
            <span>{activeSubscribersCount} active</span>
          </div>
        </div>

        {/* Real Live Open Rate (Pixel Tracking) */}
        <div className="bg-white border border-zinc-200 p-6 rounded-xl shadow-xs hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Live Open Rate</p>
              <h3 className="text-3xl font-extrabold text-zinc-900 leading-none">{liveOpenRate.toFixed(1)}%</h3>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-50 text-indigo-600 flex items-center justify-center">
              <Eye className="w-5 h-5 text-indigo-600" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
            <span className="text-indigo-600 font-medium inline-flex items-center gap-0.5">
              {readLogsCount} of {totalLogs} opened
            </span>
            <span>Tracking Pixel Active</span>
          </div>
        </div>

        {/* Real Delivery Rate */}
        <div className="bg-white border border-zinc-200 p-6 rounded-xl shadow-xs hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Delivery Rate</p>
              <h3 className="text-3xl font-extrabold text-zinc-900 leading-none">{liveDeliveryRate.toFixed(1)}%</h3>
            </div>
            <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
            <span className="text-emerald-600 font-semibold">{deliveredLogsCount} delivered</span>
            <span>{bouncedLogsCount} bounced</span>
          </div>
        </div>

        {/* Active Brand Platforms */}
        <div className="bg-white border border-zinc-200 p-6 rounded-xl shadow-xs hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Configured Brands</p>
              <h3 className="text-3xl font-extrabold text-zinc-900 leading-none">3</h3>
            </div>
            <div className="w-12 h-12 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Globe className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500">
            <span className="font-semibold text-zinc-700">cyvisahelp • cybarprep • cylawtech</span>
          </div>
        </div>
      </div>

      {/* Main Section Grid (Growth & Live Activities Timeline) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Growth Tracking Visual */}
        <div className="bg-white border border-zinc-200 rounded-xl p-6 lg:col-span-2 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="font-bold text-base text-zinc-900">Audience Growth & Dispatch Volume</h4>
              <p className="text-xs text-zinc-500">Real-time database records and dispatches</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Live Data
            </span>
          </div>

          {/* SVG Visual Growth Representation */}
          <div className="h-64 flex flex-col justify-end relative">
            <div className="absolute inset-x-0 top-0 border-t border-dashed border-zinc-100 h-0" />
            <div className="absolute inset-x-0 top-1/3 border-t border-dashed border-zinc-100 h-0" />
            <div className="absolute inset-x-0 top-2/3 border-t border-dashed border-zinc-100 h-0" />
            
            <svg viewBox="0 0 500 180" className="w-full h-44 text-indigo-500 overflow-visible">
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgb(79, 70, 229)" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="rgb(79, 70, 229)" stopOpacity="0.00" />
                </linearGradient>
              </defs>
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
              <circle cx="150" cy="110" r="5" className="fill-white stroke-indigo-600 stroke-2" />
              <circle cx="290" cy="60" r="5" className="fill-white stroke-indigo-600 stroke-2" />
              <circle cx="430" cy="25" r="5.5" className="fill-indigo-600 stroke-white stroke-2 shadow-sm animate-pulse" />
            </svg>

            <div className="flex justify-between items-center text-[10px] font-medium text-zinc-400 mt-4 border-t border-zinc-100 pt-3">
              <span>{subscribers.length > 0 ? `${subscribers.length} Total Records` : 'No subscribers yet'}</span>
              <span>{deliveredLogsCount} Outbound Emails Sent</span>
              <span>{readLogsCount} Verified Opens</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-zinc-100 flex justify-between text-xs text-zinc-500">
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              <strong>{totalSubscribers} active subscribers</strong> in multi-tenant directory
            </span>
            <button 
              onClick={() => setActiveTab('subscribers')} 
              className="text-indigo-600 font-semibold hover:text-indigo-700 hover:underline inline-flex items-center gap-1.5 cursor-pointer"
            >
              Audience Manager <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* REAL-TIME ACTIVITY TIMELINE FEED */}
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs flex flex-col h-full justify-between">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-bold text-base text-zinc-900">Live Activity Feed</h4>
              {onClearActivities && (
                <button
                  onClick={onClearActivities}
                  className="text-[10px] font-semibold text-zinc-400 hover:text-zinc-600 uppercase tracking-wider cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
            <p className="text-xs text-zinc-500">Real-time log of subscriber opt-ins, sends, and email opens</p>
          </div>

          <div className="flex-1 space-y-3 max-h-[340px] overflow-y-auto pr-1">
            {activities.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12 text-zinc-400">
                <CheckCircle className="w-8 h-8 text-zinc-300 mb-2" />
                <p className="text-xs font-medium text-zinc-600">No activity yet</p>
                <p className="text-[10px] text-zinc-400">New subscriber registrations and email dispatches will appear here automatically.</p>
              </div>
            ) : (
              activities.map((act) => {
                let colorClass = 'bg-zinc-100 text-zinc-600 border-zinc-200';
                let Icon = Send;

                if (act.type === 'subscriber_join') {
                  colorClass = 'bg-indigo-50 text-indigo-600 border-indigo-100';
                  Icon = Users;
                } else if (act.type === 'email_read') {
                  colorClass = 'bg-blue-50 text-blue-600 border-blue-100';
                  Icon = Eye;
                } else if (act.type === 'campaign_sent') {
                  colorClass = 'bg-emerald-50 text-emerald-600 border-emerald-100';
                  Icon = Send;
                } else if (act.type === 'email_bounced') {
                  colorClass = 'bg-rose-50 text-rose-600 border-rose-100';
                  Icon = AlertOctagon;
                } else if (act.type === 'campaign_created') {
                  colorClass = 'bg-amber-50 text-amber-600 border-amber-100';
                  Icon = Sparkles;
                }

                return (
                  <div key={act.id} className="flex gap-3 items-start p-3 hover:bg-zinc-50 rounded-lg transition-colors border border-zinc-100">
                    <div className={`mt-0.5 w-7 h-7 rounded-md flex items-center justify-center text-xs shrink-0 border ${colorClass}`}>
                      <Icon className="w-3.5 h-3.5" />
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

          <div className="mt-4 pt-3 border-t border-zinc-100 text-center">
            <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-semibold inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Activity Feed Connected
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
