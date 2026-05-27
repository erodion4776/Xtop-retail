import { useState, FormEvent } from 'react';
import { Search, Plus, Trash2, Filter, UserCheck, Mail, ArrowUpDown, RefreshCw, Layers } from 'lucide-react';
import { Subscriber } from '../types';

interface SubscribersViewProps {
  subscribers: Subscriber[];
  onAddSubscriber: (newSub: Omit<Subscriber, 'id' | 'date_added'>) => void;
  onDeleteSubscriber: (id: string) => void;
}

export default function SubscribersView({
  subscribers,
  onAddSubscriber,
  onDeleteSubscriber,
}: SubscribersViewProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'unsubscribed' | 'pending'>('all');
  const [isAdding, setIsAdding] = useState(false);
  
  // Form fields
  const [newEmail, setNewEmail] = useState('');
  const [newClientId, setNewClientId] = useState('');
  const [newStatus, setNewStatus] = useState<'active' | 'unsubscribed' | 'pending'>('active');
  const [formError, setFormError] = useState('');

  // Auto generate client ID if requested
  const handleGenerateClientId = () => {
    const randomId = 'cl_' + Math.floor(1000 + Math.random() * 9000);
    setNewClientId(randomId);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!newEmail.trim() || !newEmail.includes('@')) {
      setFormError('Please enter a valid email address');
      return;
    }

    if (!newClientId.trim()) {
      setFormError('Please supply or generate a Client ID');
      return;
    }

    // Call callback
    onAddSubscriber({
      email: newEmail.trim().toLowerCase(),
      client_id: newClientId.trim(),
      status: newStatus,
    });

    // Reset view
    setNewEmail('');
    setNewClientId('');
    setNewStatus('active');
    setIsAdding(false);
  };

  // Filter subscribers list
  const filteredSubscribers = subscribers.filter((sub) => {
    const matchesSearch = sub.email.toLowerCase().includes(search.toLowerCase()) || 
                          sub.client_id.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = statusFilter === 'all' ? true : sub.status === statusFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div id="subscribers-view-holder" className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 tracking-tight">Subscribers Audience</h2>
          <p className="text-xs text-zinc-500 mt-1">
            Display, add, and query user records synchronized with your active email campaigns.
          </p>
        </div>
        <button
          id="toggle-add-subscriber"
          onClick={() => setIsAdding(!isAdding)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 duration-150 active:scale-95 cursor-pointer"
        >
          {isAdding ? 'Close Panel' : 'Add Subscriber'} <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Floating Panel / Drawer for New Subscriber */}
      {isAdding && (
        <div id="add-subscriber-panel" className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-6 transition-all animate-slide-down">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-6 h-6 rounded-md bg-indigo-650/10 text-indigo-700 flex items-center justify-center bg-indigo-100">
              <Plus className="w-4 h-4 text-indigo-700" />
            </div>
            <h3 className="font-bold text-sm text-indigo-900">Add New Record</h3>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="md:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-zinc-600">Email Address <span className="text-rose-500">*</span></label>
              <div className="relative">
                <input
                  id="subscriber-email-input"
                  type="email"
                  placeholder="name@company.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full text-xs py-2.5 pl-9 pr-3 bg-white border border-zinc-200 rounded-lg text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-medium"
                />
                <Mail className="absolute left-3 top-3 w-3.5 h-3.5 text-zinc-400" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-600">Client ID <span className="text-rose-500">*</span></label>
              <div className="relative flex">
                <input
                  id="subscriber-client-id-input"
                  type="text"
                  placeholder="e.g., cl_4231"
                  value={newClientId}
                  onChange={(e) => setNewClientId(e.target.value)}
                  className="w-full text-xs py-2.5 px-3 bg-white border border-zinc-200 rounded-lg text-zinc-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-mono font-medium"
                />
                <button
                  id="auto-generate-client-id"
                  type="button"
                  onClick={handleGenerateClientId}
                  title="Auto generate Client ID"
                  className="absolute right-2 top-2 p-1 text-zinc-400 hover:text-indigo-600 hover:bg-zinc-150 rounded"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-600">Subscription Status</label>
              <select
                id="subscriber-status-select"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as any)}
                className="w-full text-xs py-2.5 px-3 bg-white border border-zinc-200 rounded-lg text-zinc-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-medium cursor-pointer"
              >
                <option value="active">Active (Verified)</option>
                <option value="pending">Pending Opt-In</option>
                <option value="unsubscribed">Unsubscribed</option>
              </select>
            </div>

            <div className="md:col-span-4 flex items-center justify-between pt-1 border-t border-indigo-100/50 mt-2">
              <span className="text-[10px] text-zinc-500">
                Newly created records immediately sync across active segmented campaign lists.
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3.5 py-2 bg-white hover:bg-zinc-100 text-zinc-600 text-xs font-semibold rounded-md border border-zinc-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-md shadow-xs cursor-pointer"
                >
                  Save Record
                </button>
              </div>
            </div>
          </form>
          {formError && (
            <p className="text-xs text-rose-500 font-semibold mt-3 inline-flex items-center gap-1.5">
              ⚠️ {formError}
            </p>
          )}
        </div>
      )}

      {/* Query Bar (Search + Filter combo) */}
      <div className="bg-white border border-zinc-200 p-4 rounded-xl shadow-xs flex flex-col md:flex-row gap-3 justify-between items-center">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <input
            id="subscribers-search-bar"
            type="search"
            placeholder="Search email or client ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 bg-zinc-50 hover:bg-zinc-100/70 focus:bg-white border border-zinc-200 rounded-lg text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          />
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-400" />
        </div>

        {/* Filters Select */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <span className="text-xs text-zinc-400 inline-flex items-center gap-1">
            <Filter className="w-3 h-3" /> Filter:
          </span>
          {(['all', 'active', 'pending', 'unsubscribed'] as const).map((filter) => (
            <button
              key={filter}
              id={`filter-tab-${filter}`}
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === filter
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'bg-zinc-50 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
              }`}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table Layout */}
      <div className="bg-white border border-zinc-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left" id="subscribers-table">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-150 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                <th className="py-3 px-5">Email Address</th>
                <th className="py-3 px-5">Client ID</th>
                <th className="py-3 px-5">Date Added</th>
                <th className="py-3 px-5 text-center">Status</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-xs font-medium text-zinc-700">
              {filteredSubscribers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-zinc-400">
                    <Layers className="w-8 h-8 text-zinc-300 mx-auto mb-2.5" />
                    <p className="font-semibold text-zinc-500">No subscribers found</p>
                    <p className="text-[10px] text-zinc-400 mt-1">Try adjusting your query or insert fresh contacts.</p>
                  </td>
                </tr>
              ) : (
                filteredSubscribers.map((sub, i) => {
                  return (
                    <tr key={sub.id} className="hover:bg-zinc-50/50 transition-colors group">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-6.5 h-6.5 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-[10px]">
                            {sub.email.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-semibold text-zinc-900">{sub.email}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 font-mono text-[11px] text-zinc-500">{sub.client_id}</td>
                      <td className="py-3.5 px-5 text-zinc-400 text-[11px]">{sub.date_added}</td>
                      <td className="py-3.5 px-5 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            sub.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700'
                              : sub.status === 'pending'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-zinc-100 text-zinc-600'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              sub.status === 'active'
                                ? 'bg-emerald-500'
                                : sub.status === 'pending'
                                ? 'bg-amber-500'
                                : 'bg-zinc-400'
                            }`}
                          />
                          {sub.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <button
                          id={`delete-subscriber-${sub.id}`}
                          onClick={() => onDeleteSubscriber(sub.id)}
                          className="opacity-60 hover:opacity-100 p-1.5 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-all cursor-pointer"
                          title="Delete Subscriber Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Audit line */}
        <div className="p-4 bg-zinc-50 text-right text-[10px] text-zinc-400 border-t border-zinc-150">
          Showing <strong>{filteredSubscribers.length}</strong> of <strong>{subscribers.length}</strong> system subscriber records
        </div>
      </div>
    </div>
  );
}
