import { useState, useEffect } from 'react';
import { Mail, Users, History, Send, Loader2, Plus, AlertCircle, CheckCircle2, ToggleLeft, ToggleRight, Building2 } from 'lucide-react';
import { siteConfigs } from '../../server/emailConfig';

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

type ActiveTab = 'send' | 'welcome' | 'subscribers' | 'logs' | 'integration' | 'debug';

export default function EmailCenter() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('send');
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
    { id: 'integration', label: 'Connect Website', icon: Building2 },
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
                    value={`<!-- Paste this into your website at https://xtop-retail.onrender.com/ -->
<div id="cy-newsletter-embed" style="font-family: system-ui, sans-serif; max-width: 400px; padding: 24px; border: 1px solid #e4e4e7; border-radius: 12px; background: #ffffff;">
  <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 700; color: #18181b;">Subscribe to our updates</h3>
  <p style="margin: 0 0 16px 0; font-size: 12px; color: #71717a;">Get instant updates and newsletters from ${siteConfigs.find(s => s.siteKey === siteKey)?.brandName}.</p>
  
  <form id="cy-subscribe-form" style="display: flex; flex-direction: column; gap: 8px;">
    <input type="email" id="cy-email-input" placeholder="Enter your email" required style="padding: 10px 12px; font-size: 13px; border: 1px solid #e4e4e7; border-radius: 6px; outline: none; background: #f4f4f5;" />
    <button type="submit" id="cy-submit-btn" style="padding: 10px; font-size: 13px; font-weight: 600; color: #ffffff; background: ${siteConfigs.find(s => s.siteKey === siteKey)?.primaryColor}; border: none; border-radius: 6px; cursor: pointer;">
      Subscribe
    </button>
  </form>
  <p id="cy-status-msg" style="margin-top: 10px; font-size: 11px; display: none;"></p>
</div>

<script>
  document.getElementById("cy-subscribe-form").addEventListener("submit", async function(e) {
    e.preventDefault();
    const email = document.getElementById("cy-email-input").value;
    const btn = document.getElementById("cy-submit-btn");
    const msg = document.getElementById("cy-status-msg");
    
    btn.disabled = true;
    btn.textContent = "Subscribing...";
    msg.style.display = "none";
    
    try {
      const res = await fetch("https://xtop-retail.onrender.com/api/external/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, siteKey: "${siteKey}" })
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        msg.textContent = "🎉 " + data.message;
        msg.style.color = "#16a34a";
        document.getElementById("cy-email-input").value = "";
      } else {
        msg.textContent = "❌ " + (data.error || "Subscription failed");
        msg.style.color = "#dc2626";
      }
    } catch (err) {
      msg.textContent = "❌ Connection with CY Email Engine failed.";
      msg.style.color = "#dc2626";
    } finally {
      btn.disabled = false;
      btn.textContent = "Subscribe";
      msg.style.display = "block";
    }
  });
</sc` + `ript>`}
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
{`fetch("https://xtop-retail.onrender.com/api/external/subscribe", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    siteKey: "${siteKey}",
    email: "customer@example.com",
    name: "John Doe"
  })
})
.then(res => res.json())
.then(data => console.log("CY Engine Response:", data));`}
                  </pre>
                </div>
              </div>

              {/* Box 3: curl Request */}
              <div className="space-y-2">
                <h4 className="font-bold text-xs text-zinc-800">3. Backend / Terminal Test (cURL)</h4>
                <div className="relative">
                  <pre className="text-[11px] font-mono p-3 bg-zinc-900 text-zinc-300 border border-zinc-800 rounded-lg overflow-x-auto leading-relaxed">
{`curl -X POST "https://xtop-retail.onrender.com/api/external/subscribe" \\
  -H "Content-Type: application/json" \\
  -d '{"siteKey": "${siteKey}", "email": "test-user@domain.com", "name": "Jane Doe"}'`}
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
          <h3 className="font-bold text-sm text-zinc-900">Subscription Attempt Logs</h3>
          <p className="text-xs text-zinc-500">Monitoring internal subscription attempts.</p>

          {!debugLogs || debugLogs.length === 0 ? (
            <p className="text-xs text-zinc-400 py-6 text-center">No debug logs yet.</p>
          ) : (
            <div className="divide-y divide-zinc-100">
              {debugLogs.map((log, i) => (
                <div key={i} className="flex items-center justify-between py-3 gap-4">
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-semibold truncate ${log.type === 'ERROR' ? 'text-rose-700' : 'text-zinc-800'}`}>{log.type}</p>
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
