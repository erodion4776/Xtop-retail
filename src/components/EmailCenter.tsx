import { useState, useEffect } from 'react';
import { Mail, Users, History, Send, Loader2, Plus, Trash2, ToggleLeft, ToggleRight, CheckCircle2, AlertCircle } from 'lucide-react';

interface Subscriber {
  id: string;
  email: string;
}

interface EmailLog {
  id: string;
  to: string;
  subject: string;
  status: string;
  type: string;
  created_at: string;
}

interface WelcomeTemplate {
  subject: string;
  body: string;
  enabled: boolean;
}

const DEFAULT_WELCOME: WelcomeTemplate = {
  subject: 'Welcome to our newsletter! 🎉',
  body: `<h1>Welcome aboard!</h1>
<p>Hi there,</p>
<p>Thank you for subscribing. We're thrilled to have you with us.</p>
<p>Here's what you can expect from us:</p>
<ul>
  <li>Weekly updates and news</li>
  <li>Exclusive offers and promotions</li>
  <li>Helpful tips and resources</li>
</ul>
<p>Stay tuned for our next email!</p>
<p>Best regards,<br/>The Team</p>`,
  enabled: true,
};

type ActiveTab = 'send' | 'welcome' | 'subscribers' | 'logs';

export default function EmailCenter() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('send');
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [logs, setLogs] = useState<EmailLog[]>([]);

  // Campaign send state
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sendTo, setSendTo] = useState<'all' | 'single'>('all');
  const [singleEmail, setSingleEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ ok: boolean; msg: string } | null>(null);

  // Welcome template state
  const [welcome, setWelcome] = useState<WelcomeTemplate>(() => {
    try {
      const saved = localStorage.getItem('xtopflow_welcome_template');
      return saved ? JSON.parse(saved) : DEFAULT_WELCOME;
    } catch {
      return DEFAULT_WELCOME;
    }
  });
  const [savingWelcome, setSavingWelcome] = useState(false);
  const [welcomeSaved, setWelcomeSaved] = useState(false);

  // Add subscriber state
  const [newEmail, setNewEmail] = useState('');
  const [addingSubscriber, setAddingSubscriber] = useState(false);

  const fetchData = async () => {
    try {
      const [subRes, logsRes] = await Promise.all([
        fetch('/api/subscribers'),
        fetch('/api/email-logs'),
      ]);
      if (subRes.ok) setSubscribers(await subRes.json());
      if (logsRes.ok) setLogs(await logsRes.json());
    } catch (e) {
      console.error('Failed to fetch data', e);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleSendCampaign = async () => {
    if (!subject.trim() || !message.trim()) {
      setSendResult({ ok: false, msg: 'Subject and message are required.' });
      return;
    }
    if (sendTo === 'single' && !singleEmail.trim()) {
      setSendResult({ ok: false, msg: 'Please enter a recipient email.' });
      return;
    }
    setSending(true);
    setSendResult(null);
    try {
      const res = await fetch('/api/send-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          message,
          sendTo,
          emails: sendTo === 'single' ? [singleEmail] : [],
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSendResult({ ok: true, msg: `Campaign sent successfully!` });
        setSubject('');
        setMessage('');
        setSingleEmail('');
        fetchData();
      } else {
        setSendResult({ ok: false, msg: data.error || 'Failed to send campaign.' });
      }
    } catch (e: any) {
      setSendResult({ ok: false, msg: e.message || 'Network error.' });
    } finally {
      setSending(false);
    }
  };

  const handleSaveWelcome = async () => {
    setSavingWelcome(true);
    localStorage.setItem('xtopflow_welcome_template', JSON.stringify(welcome));
    // Also save to server so new subscribers get correct welcome email
    try {
      await fetch('/api/welcome-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(welcome),
      });
    } catch {}
    setSavingWelcome(false);
    setWelcomeSaved(true);
    setTimeout(() => setWelcomeSaved(false), 3000);
  };

  const handleAddSubscriber = async () => {
    if (!newEmail.trim() || !newEmail.includes('@')) return;
    setAddingSubscriber(true);
    try {
      const res = await fetch('/api/subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail.trim() }),
      });
      if (res.ok) {
        setNewEmail('');
        fetchData();
      }
    } catch {}
    setAddingSubscriber(false);
  };

  const tabs: { id: ActiveTab; label: string; icon: any }[] = [
    { id: 'send', label: 'Send Campaign', icon: Send },
    { id: 'welcome', label: 'Welcome Email', icon: Mail },
    { id: 'subscribers', label: `Subscribers (${subscribers.length})`, icon: Users },
    { id: 'logs', label: 'Email Logs', icon: History },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-zinc-900 tracking-tight">Email Center</h2>
        <p className="text-xs text-zinc-500 mt-1">
          Send campaigns, manage welcome automation, and track delivery logs.
        </p>
      </div>

      {/* Tab Nav */}
      <div className="flex gap-1 bg-zinc-100 p-1 rounded-xl w-fit flex-wrap">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* SEND CAMPAIGN TAB */}
      {activeTab === 'send' && (
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs space-y-5 max-w-2xl">
          <h3 className="font-bold text-sm text-zinc-900">Compose Campaign</h3>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-600">Subject Line <span className="text-rose-500">*</span></label>
            <input
              type="text"
              placeholder="e.g., Our latest updates are here 🚀"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full text-xs py-2.5 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-600">Message Body <span className="text-rose-500">*</span></label>
            <textarea
              rows={8}
              placeholder="Write your email message here. HTML is supported."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full text-xs py-2.5 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-mono resize-y"
            />
            <p className="text-[10px] text-zinc-400">HTML tags are supported (e.g. &lt;p&gt;, &lt;b&gt;, &lt;a&gt;)</p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-600">Send To</label>
            <div className="flex gap-3">
              <button
                onClick={() => setSendTo('all')}
                className={`flex-1 py-2.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  sendTo === 'all'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300'
                }`}
              >
                All Subscribers ({subscribers.length})
              </button>
              <button
                onClick={() => setSendTo('single')}
                className={`flex-1 py-2.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  sendTo === 'single'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300'
                }`}
              >
                Single Recipient
              </button>
            </div>
          </div>

          {sendTo === 'single' && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-600">Recipient Email</label>
              <input
                type="email"
                placeholder="recipient@example.com"
                value={singleEmail}
                onChange={(e) => setSingleEmail(e.target.value)}
                className="w-full text-xs py-2.5 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          )}

          {sendResult && (
            <div className={`flex items-center gap-2 p-3 rounded-lg text-xs font-semibold ${
              sendResult.ok
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}>
              {sendResult.ok
                ? <CheckCircle2 className="w-4 h-4 shrink-0" />
                : <AlertCircle className="w-4 h-4 shrink-0" />
              }
              {sendResult.msg}
            </div>
          )}

          <button
            onClick={handleSendCampaign}
            disabled={sending}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {sending ? 'Sending...' : 'Send Campaign'}
          </button>
        </div>
      )}

      {/* WELCOME EMAIL TAB */}
      {activeTab === 'welcome' && (
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs space-y-5 max-w-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-zinc-900">Welcome Email Automation</h3>
              <p className="text-xs text-zinc-500 mt-0.5">Automatically sent to every new subscriber when they sign up.</p>
            </div>
            <button
              onClick={() => setWelcome(prev => ({ ...prev, enabled: !prev.enabled }))}
              className="flex items-center gap-2 cursor-pointer"
            >
              {welcome.enabled
                ? <ToggleRight className="w-8 h-8 text-indigo-600" />
                : <ToggleLeft className="w-8 h-8 text-zinc-400" />
              }
              <span className={`text-xs font-semibold ${welcome.enabled ? 'text-indigo-600' : 'text-zinc-400'}`}>
                {welcome.enabled ? 'Enabled' : 'Disabled'}
              </span>
            </button>
          </div>

          <div className={`space-y-4 ${!welcome.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-600">Welcome Email Subject</label>
              <input
                type="text"
                value={welcome.subject}
                onChange={(e) => setWelcome(prev => ({ ...prev, subject: e.target.value }))}
                className="w-full text-xs py-2.5 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-600">Welcome Email Body (HTML)</label>
              <textarea
                rows={12}
                value={welcome.body}
                onChange={(e) => setWelcome(prev => ({ ...prev, body: e.target.value }))}
                className="w-full text-xs py-2.5 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-mono resize-y"
              />
              <p className="text-[10px] text-zinc-400">Use HTML to format your welcome email. Use {`{email}`} to insert the subscriber's email address.</p>
            </div>

            {/* Live Preview */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-600">Preview</label>
              <div
                className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-800 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: welcome.body }}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2 border-t border-zinc-100">
            <button
              onClick={handleSaveWelcome}
              disabled={savingWelcome}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              {savingWelcome ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              Save Template
            </button>
            {welcomeSaved && (
              <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Saved!
              </span>
            )}
            <button
              onClick={() => setWelcome(DEFAULT_WELCOME)}
              className="px-4 py-2.5 bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-600 text-xs font-semibold rounded-lg transition-all cursor-pointer ml-auto"
            >
              Reset to Default
            </button>
          </div>
        </div>
      )}

      {/* SUBSCRIBERS TAB */}
      {activeTab === 'subscribers' && (
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-zinc-900">Subscribers</h3>

          {/* Add subscriber */}
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="Add subscriber email..."
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddSubscriber()}
              className="flex-1 text-xs py-2.5 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <button
              onClick={handleAddSubscriber}
              disabled={addingSubscriber}
              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
            >
              {addingSubscriber ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              Add
            </button>
          </div>

          {/* List */}
          <div className="divide-y divide-zinc-100">
            {subscribers.length === 0 ? (
              <p className="text-xs text-zinc-400 py-6 text-center">No subscribers yet.</p>
            ) : (
              subscribers.map((s) => (
                <div key={s.id} className="flex items-center justify-between py-2.5 text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-[10px]">
                      {s.email.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium text-zinc-800">{s.email}</span>
                  </div>
                  <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded">Active</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* LOGS TAB */}
      {activeTab === 'logs' && (
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-zinc-900">Email Delivery Logs</h3>

          {logs.length === 0 ? (
            <p className="text-xs text-zinc-400 py-6 text-center">No emails sent yet.</p>
          ) : (
            <div className="divide-y divide-zinc-100">
              {logs.map((log, i) => (
                <div key={i} className="flex items-center justify-between py-3 gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-zinc-800 truncate">{log.subject}</p>
                    <p className="text-[11px] text-zinc-500 mt-0.5 truncate">To: {log.to}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[10px] text-zinc-400 font-mono">
                      {log.created_at ? new Date(log.created_at).toLocaleString() : ''}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      log.status === 'sent'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-rose-50 text-rose-700'
                    }`}>
                      {log.status?.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
