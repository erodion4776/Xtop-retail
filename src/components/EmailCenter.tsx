import { useState, useEffect } from 'react';
import { Mail, Users, History, Send, Loader2, Plus, AlertCircle, CheckCircle2, ToggleLeft, ToggleRight, Building2, Activity, Check, TrendingUp, XCircle, AlertTriangle } from 'lucide-react';
import { siteConfigs } from '../../server/emailConfig';

interface Subscriber {
  id: string;
  email: string;
  tenants?: {
    brand_name: string;
    site_key: string;
  };
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

type ActiveTab = 'health' | 'send' | 'welcome' | 'subscribers' | 'logs' | 'integration' | 'test' | 'debug';

export default function EmailCenter() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('health');
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [debugLogs, setDebugLogs] = useState<{ timestamp: string, message: string, type: string }[]>([]);

  // Campaign send state
  const [siteKey, setSiteKey] = useState(siteConfigs[0].siteKey);
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
  const [addSiteKey, setAddSiteKey] = useState(siteConfigs[0].siteKey);
  const [addingSubscriber, setAddingSubscriber] = useState(false);

  const fetchData = async () => {
    try {
      const [subRes, logsRes, debugRes] = await Promise.all([
        fetch('/api/subscribers'),
        fetch('/api/email-logs'),
        fetch('/api/debug-logs')
      ]);
      if (subRes.ok) setSubscribers(await subRes.json());
      if (logsRes.ok) setLogs(await logsRes.json());
      if (debugRes.ok) setDebugLogs(await debugRes.json());
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
          siteKey,
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
        body: JSON.stringify({ email: newEmail.trim(), siteKey: addSiteKey }),
      });
      if (res.ok) {
        setNewEmail('');
        fetchData();
      }
    } catch {}
    setAddingSubscriber(false);
  };

  const tabs: { id: ActiveTab; label: string; icon: any }[] = [
    { id: 'health', label: 'Email Health', icon: Activity },
    { id: 'send', label: 'Send Campaign', icon: Send },
    { id: 'welcome', label: 'Welcome Email', icon: Mail },
    { id: 'subscribers', label: `Subscribers (${subscribers.length})`, icon: Users },
    { id: 'logs', label: 'Email Logs', icon: History },
    { id: 'integration', label: 'Connect Website', icon: Building2 },
    { id: 'test', label: 'Test API', icon: Mail },
    { id: 'debug', label: 'Debug Logs', icon: AlertCircle },
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

      {/* EMAIL HEALTH DASHBOARD TAB */}
      {activeTab === 'health' && (
        <div className="space-y-6">
          <EmailHealthTab logs={logs} onRefreshSim={fetchData} subscribers={subscribers} />
        </div>
      )}

      {/* SEND CAMPAIGN TAB */}
      {activeTab === 'send' && (
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs space-y-5 max-w-2xl">
          <h3 className="font-bold text-sm text-zinc-900">Compose Campaign</h3>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-600">Select Website <span className="text-rose-500">*</span></label>
            <select
              value={siteKey}
              onChange={(e) => setSiteKey(e.target.value)}
              className="w-full text-xs py-2.5 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {siteConfigs.map(s => <option key={s.siteKey} value={s.siteKey}>{s.brandName}</option>)}
            </select>
          </div>

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
          <div className="flex flex-col sm:flex-row gap-2 bg-zinc-50/50 p-4 rounded-xl border border-zinc-100">
            <div className="flex-1 space-y-1">
              <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Email Address</label>
              <input
                type="email"
                placeholder="Add subscriber email..."
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSubscriber()}
                className="w-full text-xs py-2 px-3 bg-white border border-zinc-200 rounded-lg text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="w-full sm:w-48 space-y-1">
              <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Choose Website</label>
              <select
                value={addSiteKey}
                onChange={(e) => setAddSiteKey(e.target.value)}
                className="w-full text-xs py-2 px-2 bg-white border border-zinc-200 rounded-lg text-zinc-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {siteConfigs.map(s => (
                  <option key={s.siteKey} value={s.siteKey}>{s.brandName}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleAddSubscriber}
                disabled={addingSubscriber}
                className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer h-[34px]"
              >
                {addingSubscriber ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Add
              </button>
            </div>
          </div>

          {/* List */}
          <div className="divide-y divide-zinc-100 max-h-[400px] overflow-y-auto pr-1">
            {subscribers.length === 0 ? (
              <p className="text-xs text-zinc-400 py-6 text-center">No subscribers yet.</p>
            ) : (
              subscribers.map((s) => {
                const siteKey = s.tenants?.site_key || 'cyvisahelp';
                const brandName = s.tenants?.brand_name || 'CY Visa Help';
                
                // Customize badge color matching the site branding
                let badgeColor = 'bg-slate-50 text-slate-700 border-slate-100';
                if (siteKey === 'cylawtech') {
                  badgeColor = 'bg-blue-50 text-blue-700 border-blue-200';
                } else if (siteKey === 'cybarprep') {
                  badgeColor = 'bg-rose-50 text-rose-700 border-rose-250';
                }

                return (
                  <div key={s.id} className="flex items-center justify-between py-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-zinc-100 text-zinc-700 flex items-center justify-center font-bold text-[10px]">
                        {s.email.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-zinc-800">{s.email}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-semibold border px-2 py-0.5 rounded ${badgeColor}`}>
                        {brandName}
                      </span>
                      <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded">Active</span>
                    </div>
                  </div>
                );
              })
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
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                      log.status === 'sent' || log.status === 'delivered'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        : log.status === 'complaint'
                        ? 'bg-amber-50 text-amber-700 border-amber-100'
                        : 'bg-rose-50 text-rose-700 border-rose-100'
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

      {/* TEST API TAB */}
      {activeTab === 'test' && (
        <TestEmailTab />
      )}

      {/* CONNECT WEBSITE / INTEGRATION TAB */}
      {activeTab === 'integration' && (
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs space-y-6">
          <div>
            <h3 className="font-bold text-sm text-zinc-900">Connect Your External Website</h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Integrate your retail store (<span className="underline font-medium text-indigo-600">https://xtop-retail.onrender.com</span>) or other pages to collect leads and trigger instant welcomes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left sidebar: Site selector */}
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-600">Target Website Brand</label>
                <div className="space-y-2">
                  {siteConfigs.map((s) => (
                    <button
                      key={s.siteKey}
                      onClick={() => setSiteKey(s.siteKey)}
                      className={`w-full flex items-center gap-3 p-3 text-align-left rounded-lg border text-xs font-semibold transition-all cursor-pointer text-left ${
                        siteKey === s.siteKey
                          ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900'
                          : 'border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700'
                      }`}
                    >
                      <img src={s.logo} className="w-6 h-6 rounded-full shrink-0" />
                      <div>
                        <p className="font-bold">{s.brandName}</p>
                        <p className="text-[10px] text-zinc-400 font-normal">{s.website}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-[11px] text-indigo-800 space-y-1.5 leading-relaxed">
                <p className="font-bold flex items-center gap-1">
                  💡 Dynamic Branding Architecture
                </p>
                <p>
                  Incoming leads tagged with <code className="font-mono bg-indigo-100 px-1 rounded">siteKey: "{siteKey}"</code> will automatically receive customized emails branded with <strong>{siteConfigs.find(s => s.siteKey === siteKey)?.brandName}</strong> colors, sender names, and logos.
                </p>
              </div>
            </div>

            {/* Right details: Code generator */}
            <div className="md:col-span-2 space-y-5">
              {/* Box 1: Drop-in HTML form code */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-zinc-800">1. Instant HTML Form Snippet</h4>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded">Ready to Embed</span>
                </div>
                <p className="text-[11px] text-zinc-500">
                  Copy and paste this production-ready stylesheet and signup form anywhere on your retail site.
                </p>

                <div className="relative">
                  <textarea
                    readOnly
                    rows={8}
                    className="w-full text-[11px] font-mono p-3 bg-zinc-900 text-zinc-300 border border-zinc-800 rounded-lg focus:outline-none resize-none leading-relaxed"
                    value={"<!-- Paste this into your website at https://xtop-retail.onrender.com/ -->\n" +
"<div id=\"cy-newsletter-embed\" style=\"font-family: system-ui, sans-serif; max-width: 400px; padding: 24px; border: 1px solid #e4e4e7; border-radius: 12px; background: #ffffff;\">\n" +
"  <h3 style=\"margin: 0 0 8px 0; font-size: 16px; font-weight: 700; color: #18181b;\">Subscribe to our updates</h3>\n" +
"  <p style=\"margin: 0 0 16px 0; font-size: 12px; color: #71717a;\">Get instant updates and newsletters from " + siteConfigs.find(s => s.siteKey === siteKey)?.brandName + ".</p>\n" +
"  \n" +
"  <form id=\"cy-subscribe-form\" style=\"display: flex; flex-direction: column; gap: 8px;\">\n" +
"    <input type=\"text\" id=\"cy-name-input\" placeholder=\"Enter your name\" required style=\"padding: 10px 12px; font-size: 13px; border: 1px solid #e4e4e7; border-radius: 6px; outline: none; background: #f4f4f5;\" />\n" +
"    <input type=\"email\" id=\"cy-email-input\" placeholder=\"Enter your email\" required style=\"padding: 10px 12px; font-size: 13px; border: 1px solid #e4e4e7; border-radius: 6px; outline: none; background: #f4f4f5;\" />\n" +
"    <button type=\"submit\" id=\"cy-submit-btn\" style=\"padding: 10px; font-size: 13px; font-weight: 600; color: #ffffff; background: " + siteConfigs.find(s => s.siteKey === siteKey)?.primaryColor + "; border: none; border-radius: 6px; cursor: pointer;\">\n" +
"      Subscribe\n" +
"    </button>\n" +
"  </form>\n" +
"  <p id=\"cy-status-msg\" style=\"margin-top: 10px; font-size: 11px; display: none;\"></p>\n" +
"</div>\n" +
"\n" +
"<script>\n" +
"  document.getElementById(\"cy-subscribe-form\").addEventListener(\"submit\", async function(e) {\n" +
"    e.preventDefault();\n" +
"    const name = document.getElementById(\"cy-name-input\").value;\n" +
"    const email = document.getElementById(\"cy-email-input\").value;\n" +
"    const btn = document.getElementById(\"cy-submit-btn\");\n" +
"    const msg = document.getElementById(\"cy-status-msg\");\n" +
"    \n" +
"    btn.disabled = true;\n" +
"    btn.textContent = \"Subscribing...\";\n" +
"    msg.style.display = \"none\";\n" +
"    \n" +
"    try {\n" +
"      const res = await fetch(\"https://xtop-retail.onrender.com/api/external/subscribe\", {\n" +
"        method: \"POST\",\n" +
"        headers: { \"Content-Type\": \"application/json\" },\n" +
"        body: JSON.stringify({ email: email, name: name, siteKey: \"" + siteKey + "\" })\n" +
"      });\n" +
"      const data = await res.json();\n" +
"      \n" +
"      if (res.ok && data.success) {\n" +
"        msg.textContent = \"🎉 \" + data.message;\n" +
"        msg.style.color = \"#16a34a\";\n" +
"        document.getElementById(\"cy-email-input\").value = \"\";\n" +
"        document.getElementById(\"cy-name-input\").value = \"\";\n" +
"      } else {\n" +
"        msg.textContent = \"❌ \" + (data.error || \"Subscription failed\");\n" +
"        msg.style.color = \"#dc2626\";\n" +
"      }\n" +
"    } catch (err) {\n" +
"      msg.textContent = \"❌ Connection with CY Email Engine failed.\";\n" +
"      msg.style.color = \"#dc2626\";\n" +
"    } finally {\n" +
"      btn.disabled = false;\n" +
"      btn.textContent = \"Subscribe\";\n" +
"      msg.style.display = \"block\";\n" +
"    }\n" +
"  });\n" +
"</script>"}
                  />
                </div>
              </div>

              {/* Box 2: REST API fetch Request */}
              <div className="space-y-2">
                <h4 className="font-bold text-xs text-zinc-800">2. Programmatic Integration (Fetch API)</h4>
                <p className="text-[11px] text-zinc-500">
                  Trigger subscription programmatically in your custom Javascript or React apps.
                </p>
                <div className="relative">
                  <pre className="text-[11px] font-mono p-3 bg-zinc-900 text-zinc-300 border border-zinc-800 rounded-lg overflow-x-auto leading-relaxed">
{"fetch(..." + " ...)"}
                  </pre>
                </div>
              </div>

              {/* Box 3: curl Request */}
              <div className="space-y-2">
                <h4 className="font-bold text-xs text-zinc-800">3. Backend / Terminal Test (cURL)</h4>
                <div className="relative">
                  <pre className="text-[11px] font-mono p-3 bg-zinc-900 text-zinc-300 border border-zinc-800 rounded-lg overflow-x-auto leading-relaxed">
{"curl -X POST 'https://xtop-retail.onrender.com/api/external/subscribe' " +
"  -H 'Content-Type: application/json' " +
"  -d '{\"siteKey\": \"...\", \"email\": \"test-user@domain.com\", \"name\": \"Jane Doe\"}'"}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* DEBUG LOGS TAB */}
      {activeTab === 'debug' && (
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-sm text-zinc-900">Subscription Attempt Logs</h3>
              <p className="text-xs text-zinc-500">Monitoring internal subscription attempts.</p>
            </div>
            <button 
              onClick={async () => {
                try {
                  const res = await fetch('/api/health-check');
                  const data = await res.json();
                  alert(res.ok ? "Connected: " + JSON.stringify(data) : "Error: " + data.message);
                  fetchData();
                } catch(e) { alert('Connection error'); }
              }}
              className="text-xs px-3 py-1.5 bg-zinc-900 text-white rounded hover:bg-zinc-800"
            >
              Check Connection
            </button>
          </div>

          {!debugLogs || debugLogs.length === 0 ? (
            <p className="text-xs text-zinc-400 py-6 text-center">No debug logs yet.</p>
          ) : (
            <div className="divide-y divide-zinc-100">
              {debugLogs.map((log, i) => (
                <div key={i} className="flex items-center justify-between py-3 gap-4">
                  <div className="min-w-0 flex-1">
                    <p className={"text-xs font-semibold truncate " + (log.type === 'ERROR' ? 'text-rose-700' : 'text-zinc-800')}>{log.type}</p>
                    <p className="text-[11px] text-zinc-500 mt-0.5 break-words">{log.message}</p>
                  </div>
                  <div className="shrink-0 text-[10px] text-zinc-400 font-mono">
                    {new Date(log.timestamp).toLocaleTimeString()}
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

function TestEmailTab() {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string; } | null>(null);

  const handleTestSend = async () => {
    if (!to || !subject || !message) {
      setResult({ ok: false, msg: 'All fields are required.' });
      return;
    }
    setSending(true);
    setResult(null);
    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, subject, message }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ ok: true, msg: 'Email sent successfully!' });
      } else {
        setResult({ ok: false, msg: data.error || 'Failed to send email.' });
      }
    } catch (e: any) {
      setResult({ ok: false, msg: e.message || 'Error occurred.' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs space-y-5 max-w-2xl">
      <h3 className="font-bold text-sm text-zinc-900">Test Send Email API</h3>
      <div className="space-y-1">
        <label className="text-xs font-semibold text-zinc-600">To</label>
        <input type="email" value={to} onChange={(e) => setTo(e.target.value)} className="w-full text-xs py-2.5 px-3 bg-zinc-50 border border-zinc-200 rounded-lg" />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-semibold text-zinc-600">Subject</label>
        <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full text-xs py-2.5 px-3 bg-zinc-50 border border-zinc-200 rounded-lg" />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-semibold text-zinc-600">Message</label>
        <textarea rows={5} value={message} onChange={(e) => setMessage(e.target.value)} className="w-full text-xs py-2.5 px-3 bg-zinc-50 border border-zinc-200 rounded-lg" />
      </div>
      <button onClick={handleTestSend} disabled={sending} className="py-2.5 bg-indigo-600 text-white rounded-lg w-full text-xs font-semibold">
        {sending ? 'Sending...' : 'Send Test Email'}
      </button>
      {result && (
        <div className={"p-3 rounded-lg text-xs " + (result.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700')}>
          {result.msg}
        </div>
      )}
    </div>
  );
}

interface EmailHealthTabProps {
  logs: EmailLog[];
  onRefreshSim: () => void;
  subscribers: Subscriber[];
}

function EmailHealthTab({ logs, onRefreshSim, subscribers }: EmailHealthTabProps) {
  const [dnsValidating, setDnsValidating] = useState(false);
  const [dnsResults, setDnsResults] = useState<{
    spfStatus: boolean;
    dkimStatus: boolean;
    dmarcStatus: boolean;
    overall: boolean;
  } | null>(null);

  // Simulation states
  const [simEmail, setSimEmail] = useState('');
  const [simStatus, setSimStatus] = useState<'delivered' | 'bounced' | 'complaint'>('delivered');
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const checkDns = async () => {
    setDnsValidating(true);
    try {
      const res = await fetch('/api/domain/verify/cylawtech.com');
      if (res.ok) {
        setDnsResults(await res.json());
      }
    } catch (err) {
      console.error('DNS record lookup failed:', err);
    } finally {
      setDnsValidating(false);
    }
  };

  useEffect(() => {
    checkDns();
  }, []);

  // Set default simulation recipient from subscribers if available
  useEffect(() => {
    if (subscribers.length > 0 && !simEmail) {
      setSimEmail(subscribers[0].email);
    }
  }, [subscribers, simEmail]);

  // Aggregate stats
  const totalLogs = logs.length;
  const deliveredCount = logs.filter((l) => l.status === 'delivered').length;
  const bouncedCount = logs.filter((l) => l.status === 'bounced').length;
  const complaintsCount = logs.filter((l) => l.status === 'complaint').length;
  const sentOnlyCount = logs.filter((l) => l.status === 'sent').length;

  // For visual tracking, emails are delivered unless they are explicitly bounced/complained
  const validDeliveredCount = deliveredCount + sentOnlyCount;
  const deliveryRate = totalLogs > 0 ? (validDeliveredCount / totalLogs) * 100 : 100.0;
  const bounceRate = totalLogs > 0 ? (bouncedCount / totalLogs) * 100 : 0.0;
  const complaintRate = totalLogs > 0 ? (complaintsCount / totalLogs) * 100 : 0.0;

  // Grade reputation
  let reputationGrade = 'Excellent';
  let reputationDescription = 'All sender metrics correspond to premium deliverability benchmarks set by Gmail and Yahoo.';
  let gradeColor = 'text-emerald-700 bg-emerald-50 border-emerald-100';
  let gaugeColor = 'bg-emerald-500';

  if (deliveryRate < 96 || bounceRate >= 2.0 || complaintRate >= 0.1) {
    reputationGrade = 'Good';
    reputationDescription = 'Stable reputation, but monitor warning logs. Keep bounces below 2.0% and complaints below 0.1%.';
    gradeColor = 'text-amber-700 bg-amber-50 border-amber-100';
    gaugeColor = 'bg-amber-500';
  }
  if (deliveryRate < 90 || bounceRate >= 5.0 || complaintRate >= 0.3) {
    reputationGrade = 'At Risk';
    reputationDescription = 'Critical threshold exceeded. Take corrective actions on SPF/DMARC records immediately to prevent spam filtering.';
    gradeColor = 'text-rose-700 bg-rose-50 border-rose-100';
    gaugeColor = 'bg-rose-500';
  }

  const handleSimulateWebhook = async () => {
    if (!simEmail.trim()) {
      setSimResult({ ok: false, msg: 'Please provide a target email address.' });
      return;
    }
    setSimulating(true);
    setSimResult(null);

    try {
      const res = await fetch('/api/test/simulate-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: simEmail.trim(), status: simStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSimResult({ ok: true, msg: data.message });
        onRefreshSim(); // refresh metrics instantly!
      } else {
        setSimResult({ ok: false, msg: data.error || 'Webhook simulation failed.' });
      }
    } catch (err: any) {
      setSimResult({ ok: false, msg: err.message || 'Connection failure.' });
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Deliverability Meter */}
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Reputation Grade</p>
              <h3 className="text-xl font-extrabold text-zinc-900 mt-1">{deliveryRate.toFixed(1)}%</h3>
            </div>
            <span className={`text-[10px] font-bold px-2 py-1 rounded-md border ${gradeColor}`}>
              {reputationGrade.toUpperCase()}
            </span>
          </div>

          <div className="my-4">
            <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
              <div className={`h-full transition-all duration-500 ${gaugeColor}`} style={{ width: `${Math.max(5, deliveryRate)}%` }}></div>
            </div>
          </div>

          <p className="text-[11px] text-zinc-500 leading-relaxed">
            {reputationDescription}
          </p>
        </div>

        {/* Sender Credentials configured via env */}
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Active Brand Router</p>
            <h3 className="text-sm font-bold text-zinc-800 mt-2">CylawTech Sender Ident</h3>
            
            <div className="mt-3 space-y-1.5 font-mono text-[11px] text-zinc-600 bg-zinc-50 p-2.5 rounded-lg border border-zinc-100">
              <div className="flex justify-between">
                <span className="text-zinc-400">Sender:</span>
                <span className="text-zinc-900 font-semibold">hello@cylawtech.com</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Reply-To:</span>
                <span className="text-zinc-900">support@cylawtech.com</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Env Override:</span>
                <span className="text-amber-600 font-semibold">Active</span>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-zinc-400 leading-relaxed mt-3">
            We prepared configurations to support sending from <strong className="font-semibold text-zinc-600">hello@mail.cylawtech.com</strong> soon. Adjust variables in <code className="bg-zinc-100 px-1 py-0.5 rounded">.env</code> easily.
          </p>
        </div>

        {/* Key Metrics Counters */}
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs space-y-4">
          <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Delivery Counters</p>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-2 bg-emerald-50/50 border border-emerald-100/40 rounded-lg">
              <span className="text-[10px] text-zinc-500">Delivered</span>
              <p className="text-base font-bold text-emerald-700">{validDeliveredCount}</p>
            </div>
            <div className="p-2 bg-rose-50/50 border border-rose-100/40 rounded-lg">
              <span className="text-[10px] text-zinc-500">Bounced</span>
              <p className="text-base font-bold text-rose-700">{bouncedCount}</p>
            </div>
            <div className="p-2 bg-amber-50/50 border border-amber-100/40 rounded-lg">
              <span className="text-[10px] text-zinc-500">Complaints</span>
              <p className="text-base font-bold text-amber-700">{complaintsCount}</p>
            </div>
            <div className="p-2 bg-zinc-50 border border-zinc-100 rounded-lg">
              <span className="text-[10px] text-zinc-500">Total Despatched</span>
              <p className="text-base font-bold text-zinc-700">{totalLogs}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Authentication checklists */}
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-xs font-bold text-zinc-700 uppercase tracking-wide">Domain Authentication Status</h4>
              <p className="text-[10px] text-zinc-400 mt-0.5">DNS security verification records for <strong className="text-zinc-600">cylawtech.com</strong></p>
            </div>
            <button
              onClick={checkDns}
              disabled={dnsValidating}
              className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-md transition-all"
            >
              {dnsValidating ? 'Checking...' : 'Check Records'}
            </button>
          </div>

          <div className="space-y-2.5">
            {/* SPF Check */}
            <div className="flex items-center justify-between p-3 bg-zinc-50 border border-zinc-100 rounded-lg text-xs">
              <div className="space-y-0.5">
                <span className="font-bold text-zinc-700">SPF (Sender Policy Framework)</span>
                <p className="text-[10px] text-zinc-400 font-mono">v=spf1 include:resend.com ~all</p>
              </div>
              {dnsResults?.spfStatus ? (
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  <Check className="w-3 h-3" /> VERIFIED
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                  <AlertTriangle className="w-3 h-3" /> UNCONFIGURED
                </span>
              )}
            </div>

            {/* DKIM Check */}
            <div className="flex items-center justify-between p-3 bg-zinc-50 border border-zinc-100 rounded-lg text-xs">
              <div className="space-y-0.5">
                <span className="font-bold text-zinc-700">DKIM (DomainKeys Identified Mail)</span>
                <p className="text-[10px] text-zinc-400 font-mono">resend._domainkey.cylawtech.com</p>
              </div>
              {dnsResults?.dkimStatus ? (
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  <Check className="w-3 h-3" /> VERIFIED
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                  <AlertTriangle className="w-3 h-3" /> UNCONFIGURED
                </span>
              )}
            </div>

            {/* DMARC Check */}
            <div className="flex items-center justify-between p-3 bg-zinc-50 border border-zinc-100 rounded-lg text-xs">
              <div className="space-y-0.5">
                <span className="font-bold text-zinc-700">DMARC policy (Domain Message Authentication)</span>
                <p className="text-[10px] text-zinc-400 font-mono">_dmarc.cylawtech.com = v=DMARC1; p=none</p>
              </div>
              {dnsResults?.dmarcStatus ? (
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  <Check className="w-3 h-3" /> VERIFIED
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                  <AlertTriangle className="w-3 h-3" /> UNCONFIGURED
                </span>
              )}
            </div>
          </div>

          <p className="text-[10px] text-zinc-400 select-all leading-normal bg-zinc-50/50 p-2.5 rounded-md border border-zinc-100/60 font-mono">
            SPF, DKIM, and DMARC prevent attackers from spoofing your brand name, adhering to Gmail and Yahoo sender guidelines.
          </p>
        </div>

        {/* Webhooks simulator controller */}
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs space-y-4">
          <div>
            <h4 className="text-xs font-bold text-zinc-700 uppercase tracking-wide">Interactive Delivery Sandbox</h4>
            <p className="text-[10px] text-zinc-400 mt-0.5">Trigger mock delivery callbacks to test your statistics and rating widgets.</p>
          </div>

          <div className="space-y-3.5">
            {/* Recipient SELECT / CUSTOM INPUT */}
            <div className="space-y-1">
              <label className="text-[10.5px] font-semibold text-zinc-500">Recipient Email</label>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="e.g. test@example.com"
                  value={simEmail}
                  onChange={(e) => setSimEmail(e.target.value)}
                  className="w-full text-xs py-2 px-3 bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none"
                />
                
                {subscribers.length > 0 && (
                  <select
                    onChange={(e) => setSimEmail(e.target.value)}
                    value={simEmail}
                    className="text-xs bg-zinc-100 border border-zinc-200 py-1.5 px-2 rounded-lg text-zinc-700 animate-none cursor-pointer"
                  >
                    <option value="">Select Subscriber...</option>
                    {subscribers.map((sub) => (
                      <option key={sub.id} value={sub.email}>
                        {sub.email}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Event selection */}
            <div className="space-y-1">
              <label className="text-[10.5px] font-semibold text-zinc-500">Simulate Event Status</label>
              <div className="grid grid-cols-3 gap-2">
                {(['delivered', 'bounced', 'complaint'] as const).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setSimStatus(status)}
                    className={`py-1.5 px-3 rounded-lg text-xs font-semibold border cursor-pointer capitalize text-center ${
                      simStatus === status
                        ? 'bg-zinc-900 border-zinc-900 text-white font-bold'
                        : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Trigger Button */}
            <button
              onClick={handleSimulateWebhook}
              disabled={simulating}
              className="w-full py-2.5 bg-indigo-600 text-white rounded-lg text-xs font-bold shadow-xs hover:bg-indigo-700 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              {simulating ? 'Processing webhook trigger...' : 'Trigger Webhook Callback'}
            </button>

            {simResult && (
              <div className={`p-2.5 rounded-lg text-xs font-medium ${simResult.ok ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
                {simResult.msg}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
