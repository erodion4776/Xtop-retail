import { useState, FormEvent } from 'react';
import { Send, Plus, Filter, MailOpen, MousePointerClick, Calendar, CheckCircle2, Clock, AlertCircle, Sparkles, X, ChevronRight } from 'lucide-react';
import { Campaign } from '../types';

interface CampaignsViewProps {
  campaigns: Campaign[];
  onCreateCampaign: (newCampaign: Omit<Campaign, 'id' | 'open_rate' | 'click_rate' | 'date_created'>) => void;
}

export default function CampaignsView({ campaigns, onCreateCampaign }: CampaignsViewProps) {
  const [filter, setFilter] = useState<'all' | 'draft' | 'scheduled' | 'sent' | 'sending'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [campName, setCampName] = useState('');
  const [campSubject, setCampSubject] = useState('');
  const [campStatus, setCampStatus] = useState<'draft' | 'scheduled' | 'sent' | 'sending'>('draft');
  const [campSentCount, setCampSentCount] = useState<number>(0);
  const [formError, setFormError] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!campName.trim()) {
      setFormError('Campaign name is required');
      return;
    }
    if (!campSubject.trim()) {
      setFormError('Email subject line is required');
      return;
    }

    onCreateCampaign({
      name: campName.trim(),
      subject: campSubject.trim(),
      status: campStatus,
      sent_count: campStatus === 'sent' ? campSentCount || 1200 : campStatus === 'sending' ? 45 : 0,
    });

    // Reset Form
    setCampName('');
    setCampSubject('');
    setCampStatus('draft');
    setCampSentCount(0);
    setIsModalOpen(false);
  };

  const filteredCampaigns = campaigns.filter((camp) => {
    if (filter === 'all') return true;
    return camp.status === filter;
  });

  return (
    <div id="campaigns-view-holder" className="space-y-6 animate-fade-in">
      {/* Top Banner & Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 tracking-tight">Email Campaigns</h2>
          <p className="text-xs text-zinc-500 mt-1">
            Dispatch promotional sequences, newsletter notifications, and system welcome newsletters.
          </p>
        </div>
        <button
          id="open-create-campaign-modal"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 duration-150 active:scale-95 cursor-pointer"
        >
          Create Campaign <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Campaign Advice alert */}
      <div className="p-4 bg-amber-50/60 border border-amber-200/50 rounded-xl flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs">
          <p className="font-semibold text-amber-800">XTOPFlow Quick tip to boost metrics</p>
          <p className="text-amber-700/80 mt-0.5 leading-relaxed">
            Keep subject lines under <strong>60 characters</strong> and insert relevant emojis. Campaigns loaded with emojis experience an average <strong>+4.5% uptick</strong> in reader engagement.
          </p>
        </div>
      </div>

      {/* Filter Options bar */}
      <div className="bg-white border border-zinc-200 p-4 rounded-xl shadow-xs flex justify-between items-center flex-wrap gap-2">
        <div className="flex items-center gap-1 text-xs text-zinc-400">
          <Filter className="w-3.5 h-3.5" /> Filter status:
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(['all', 'sent', 'sending', 'scheduled', 'draft'] as const).map((status) => (
            <button
              key={status}
              id={`campaign-tab-${status}`}
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filter === status
                  ? 'bg-zinc-900 text-white'
                  : 'bg-zinc-50 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
              }`}
            >
              {status.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Campaigns Listing Grid */}
      <div className="space-y-4">
        {filteredCampaigns.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-xl p-12 text-center text-zinc-400 shadow-xs">
            <Send className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
            <h4 className="font-bold text-sm text-zinc-600">No campaigns found</h4>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1 leading-normal">
              You do not have any campaigns matching this state. Hit "Create Campaign" to compile your first mailing blast.
            </p>
          </div>
        ) : (
          filteredCampaigns.map((camp) => {
            return (
              <div
                key={camp.id}
                className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs hover:shadow-md transition-shadow group flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                {/* Meta details & naming */}
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        camp.status === 'sent'
                          ? 'bg-emerald-50 text-emerald-700'
                          : camp.status === 'sending'
                          ? 'bg-indigo-50 text-indigo-700'
                          : camp.status === 'scheduled'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-zinc-100 text-zinc-600'
                      }`}
                    >
                      {camp.status === 'sent' && <CheckCircle2 className="w-3 h-3" />}
                      {camp.status === 'sending' && <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-ping inline-block" />}
                      {camp.status === 'scheduled' && <Clock className="w-3 h-3" />}
                      {camp.status === 'draft' && <AlertCircle className="w-3 h-3" />}
                      {camp.status.toUpperCase()}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">Created: {camp.date_created || 'Now'}</span>
                  </div>

                  <h3 className="font-bold text-base text-zinc-950 group-hover:text-indigo-600 transition-colors truncate">
                    {camp.name}
                  </h3>
                  <p className="text-xs text-zinc-500 font-medium italic truncate max-w-xl">
                    Subject: &quot;{camp.subject}&quot;
                  </p>
                </div>

                {/* Engagement stats panel (Only for sent/sending/scheduled status) */}
                {camp.status === 'sent' ? (
                  <div className="flex items-center gap-6 self-start md:self-center border-t md:border-t-0 md:border-l border-zinc-100 pt-4 md:pt-0 md:pl-6 shrink-0 bg-zinc-50/50 p-4 md:p-0 md:bg-transparent rounded-lg md:rounded-none w-full md:w-auto">
                    <div className="text-left">
                      <p className="text-[10px] text-zinc-400 font-semibold uppercase">Recipients</p>
                      <p className="text-base font-extrabold text-zinc-900 font-mono mt-0.5">
                        {camp.sent_count.toLocaleString()}
                      </p>
                    </div>

                    <div className="text-left">
                      <p className="text-[10px] text-zinc-400 font-semibold uppercase inline-flex items-center gap-1">
                        <MailOpen className="w-3 h-3 text-amber-500" /> Open Rate
                      </p>
                      <p className="text-base font-extrabold text-amber-600 font-mono mt-0.5">
                        {camp.open_rate}%
                      </p>
                    </div>

                    <div className="text-left">
                      <p className="text-[10px] text-zinc-400 font-semibold uppercase inline-flex items-center gap-1">
                        <MousePointerClick className="w-3 h-3 text-blue-500" /> Click Rate
                      </p>
                      <p className="text-base font-extrabold text-blue-600 font-mono mt-0.5">
                        {camp.click_rate}%
                      </p>
                    </div>
                  </div>
                ) : camp.status === 'sending' ? (
                  <div className="flex items-center gap-4 py-1.5 px-3 bg-indigo-50 border border-indigo-100 rounded-lg shrink-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse" />
                    <div className="text-xs">
                      <p className="font-semibold text-indigo-900">Actively Dispatched</p>
                      <p className="text-[10px] text-indigo-700/80 font-mono">{camp.sent_count} / 1,200 pending</p>
                    </div>
                  </div>
                ) : camp.status === 'scheduled' ? (
                  <div className="flex items-center gap-3 py-1.5 px-3 bg-blue-50 border border-blue-100 rounded-lg shrink-0">
                    <Calendar className="w-4.5 h-4.5 text-blue-600" />
                    <div className="text-xs">
                      <p className="font-semibold text-blue-900">Scheduled Trigger</p>
                      <p className="text-[10px] text-blue-700/80">Queue executes in 48 hours</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 py-1 px-2.5 bg-zinc-100 rounded-lg text-[10px] font-semibold text-zinc-500 shrink-0 self-start md:self-center">
                    Saved Draft
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* CREATE MODAL DIALOG (UI only mock data logic) */}
      {isModalOpen && (
        <div id="create-campaign-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop overlay */}
          <div 
            id="modal-backdrop"
            className="fixed inset-0 bg-zinc-900/40 backdrop-blur-xs transition-opacity" 
            onClick={() => setIsModalOpen(false)}
          />

          {/* Modal Container */}
          <div className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-150 transform transition-all animate-scale-up z-10 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center font-bold">
                  <Send className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-zinc-900 text-base">New Email Campaign</h3>
              </div>
              <button
                id="close-modal-button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-zinc-100 rounded-lg text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-600">Campaign Name <span className="text-rose-500">*</span></label>
                <input
                  id="campaign-name-field"
                  type="text"
                  placeholder="e.g., Summer Weekend Clearance"
                  value={campName}
                  onChange={(e) => setCampName(e.target.value)}
                  className="w-full text-xs py-2.5 px-3 bg-white border border-zinc-200 rounded-lg text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-600">Subject Line <span className="text-rose-500">*</span></label>
                <input
                  id="campaign-subject-field"
                  type="text"
                  placeholder="e.g., 🔥 40% OFF everything this Saturday only!"
                  value={campSubject}
                  onChange={(e) => setCampSubject(e.target.value)}
                  className="w-full text-xs py-2.5 px-3 bg-white border border-zinc-200 rounded-lg text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-600">Initial Status</label>
                  <select
                    id="campaign-status-field"
                    value={campStatus}
                    onChange={(e) => setCampStatus(e.target.value as any)}
                    className="w-full text-xs py-2.5 px-3 bg-white border border-zinc-200 rounded-lg text-zinc-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-medium cursor-pointer"
                  >
                    <option value="draft">Save as Draft</option>
                    <option value="scheduled">Scheduled Queue</option>
                    <option value="sending">Instantly Send</option>
                    <option value="sent">Mark as Sent (Mock history)</option>
                  </select>
                </div>

                {campStatus === 'sent' && (
                  <div className="space-y-1 animate-slide-down">
                    <label className="text-xs font-semibold text-zinc-600">Mock Recipients Count</label>
                    <input
                      id="campaign-recipients-count-field"
                      type="number"
                      placeholder="e.g., 2500"
                      value={campSentCount || ''}
                      onChange={(e) => setCampSentCount(Number(e.target.value))}
                      className="w-full text-xs py-2.5 px-3 bg-white border border-zinc-200 rounded-lg text-zinc-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-medium"
                    />
                  </div>
                )}
              </div>

              {formError && (
                <p className="text-xs text-rose-500 font-semibold inline-flex items-center gap-1">
                  ⚠️ {formError}
                </p>
              )}

              <div className="pt-4 border-t border-zinc-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  id="cancel-campaign-button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-600 text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="save-campaign-submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm cursor-pointer"
                >
                  Compile Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
