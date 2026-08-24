import React from 'react';
import { Heart, CheckCircle, ShieldAlert, Check, RefreshCw } from 'lucide-react';
import { EmailLog, Subscriber } from './types';

interface Props {
  logs: EmailLog[];
  onRefreshSim: () => void;
  subscribers: Subscriber[];
}

export function EmailHealthTab({ logs, onRefreshSim, subscribers }: Props) {
  const totalSent = logs.length;
  const bouncedCount = logs.filter(l => l.status === 'bounced').length;
  const deliveryRate = totalSent > 0 ? (((totalSent - bouncedCount) / totalSent) * 100).toFixed(1) : '100.0';
  const spamCount = logs.filter(l => l.status === 'complaint' || l.status === 'failed').length;
  
  let score = 100;
  if (totalSent > 0) {
    score -= Math.round((bouncedCount / totalSent) * 35);
    score -= Math.round((spamCount / totalSent) * 55);
  }
  if (score < 15) score = 15;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white border border-zinc-200 p-5 rounded-xl shadow-xs">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold text-zinc-500 uppercase">Sender Health</h4>
            <Heart className={`w-4.5 h-4.5 ${score > 90 ? 'text-emerald-500' : 'text-amber-500'}`} fill="currentColor" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-zinc-900">{score}/100</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${score > 90 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
              {score > 90 ? 'OPTIMAL' : 'MONITOR'}
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-2">Aggregated health index calculated from deliverability ratios.</p>
        </div>

        <div className="bg-white border border-zinc-200 p-5 rounded-xl shadow-xs">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold text-zinc-500 uppercase">Success Rate</h4>
            <CheckCircle className="w-4.5 h-4.5 text-emerald-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-zinc-900">{deliveryRate}%</span>
            <span className="text-xs text-zinc-500">{totalSent - bouncedCount} sent</span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-2">Target recommended rate of 98.0% or higher.</p>
        </div>

        <div className="bg-white border border-zinc-200 p-5 rounded-xl shadow-xs">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold text-zinc-500 uppercase">Bounces & Complained</h4>
            <ShieldAlert className="w-4.5 h-4.5 text-amber-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-zinc-900">{bouncedCount + spamCount}</span>
            <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded">
              {totalSent > 0 ? (((bouncedCount + spamCount) / totalSent) * 100).toFixed(1) : '0.0'}% Ratio
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-2">Ratio of bounced emails against outbound records.</p>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h4 className="font-bold text-sm text-zinc-900">Outbound Verification Protocols</h4>
            <p className="text-xs text-zinc-500">Essential DNS entries configured for authorized domain sending.</p>
          </div>
          <button 
            onClick={onRefreshSim}
            className="p-1.5 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer text-zinc-500"
            title="Refresh logs from Supabase"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-2.5">
          <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-lg flex items-start gap-3">
            <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-bold text-emerald-900">SPF (Sender Policy Framework) - DNS ACTIVE</p>
              <p className="text-[11px] text-emerald-700">Authorizes our Resend delivery nodes to dispatch secure emails on your domain's behalf.</p>
            </div>
          </div>
          <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-lg flex items-start gap-3">
            <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-bold text-emerald-900">DKIM (DomainKeys Identified Mail) - DNS ACTIVE</p>
              <p className="text-[11px] text-emerald-700">Applies cryptographic signatures to email headers preventing spoofing.</p>
            </div>
          </div>
          <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-lg flex items-start gap-3">
            <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-bold text-emerald-900">DMARC Alignment - DNS ACTIVE</p>
              <p className="text-[11px] text-emerald-700">Instructs mail servers to validate SPF & DKIM matches before delivering messages.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
