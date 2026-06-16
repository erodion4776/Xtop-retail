import React, { useState, useEffect } from 'react';
import { Mail, Users, History, Send, Loader2, Plus, AlertCircle, CheckCircle2, ToggleLeft, ToggleRight, Building2, Activity, Check, Search, Filter, RotateCcw, ShieldCheck, HelpCircle, Upload, FileText } from 'lucide-react';
import { siteConfigs } from '../../server/emailConfig';

interface Subscriber {
  id: string;
  email: string;
  name?: string;
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

const SITE_DEFAULTS: Record<string, { subject: string; body: string }> = {
  cyvisahelp: {
    subject: 'Your Free VAWA Strategy Guide is Inside 🔐',
    body: `<!DOCTYPE html>
<html lang="en">
<body style="margin: 0; padding: 0; background-color: #F8F9FA; font-family: 'Georgia', serif;">
  <table width="100%" bgcolor="#F8F9FA" style="padding: 40px 10px;">
    <tr>
      <td align="center">
        <table width="600" bgcolor="#FFFFFF" style="border: 1px solid #E2E8F0; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
          <tr>
            <td align="center" bgcolor="#0F172A" style="padding: 40px;">
              <span style="font-size: 26px; font-weight: bold; color: #FFFFFF; letter-spacing: 1px;">CY VISA HELP</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px; color: #334155; line-height: 1.6;">
              <h3 style="color: #0F172A; text-align: center;">Welcome to the Academy Portal</h3>
              <p>Hello there,</p>
              <p>Thank you for connecting with the <strong>CY Visa Help Digital Academy</strong>. We simplify complex immigration procedures into clear, manageable steps.</p>
              <p>As requested, your digital access pass to the complimentary entry edition of the <strong>VAWA Protection Guide</strong> has been provisioned.</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://cyvisahelp.com/vawa-free-reader" target="_blank" style="background-color: #C5A059; color: #FFFFFF; text-decoration: none; padding: 14px 28px; font-weight: bold; border-radius: 50px; display: inline-block;">Open Interactive Reader</a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  },
  cybarprep: {
    subject: 'Your Free California Bar Exam Study Kit is ready 📝',
    body: `<!DOCTYPE html>
<html lang="en">
<body style="margin: 0; padding: 0; background-color: #FDFDFD; font-family: 'Helvetica Neue', sans-serif;">
  <table width="100%" bgcolor="#FDFDFD" style="padding: 40px 10px;">
    <tr>
      <td align="center">
        <table width="600" bgcolor="#FFFFFF" style="border: 1px solid #E2E8F0; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
          <tr>
            <td align="center" bgcolor="#B91C1C" style="padding: 30px;">
              <span style="font-size: 24px; font-weight: bold; color: #FFFFFF; letter-spacing: 1px;">CY BAR PREP</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px; color: #334155; line-height: 1.6;">
              <p>Hello there,</p>
              <p>Thank you for subscribing to <strong>CY Bar Prep</strong>. Our ultimate goal is to build deep conceptual clarity so you can conquer the Bar Exam with confidence.</p>
              <p>We have prepared your secure legal study toolkit. Access it immediately below:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://cybarprep.com/free-resources" target="_blank" style="background-color: #B91C1C; color: #FFFFFF; text-decoration: none; padding: 14px 28px; font-weight: bold; border-radius: 8px; display: inline-block;">Access Study Kit</a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  },
  cylawtech: {
    subject: 'Your Free LawTech Automation Checklist is inside ⚙️',
    body: `<!DOCTYPE html>
<html lang="en">
<body style="margin: 0; padding: 0; background-color: #FAFBFD; font-family: 'Helvetica Neue', sans-serif;">
  <table width="100%" bgcolor="#FAFBFD" style="padding: 40px 10px;">
    <tr>
      <td align="center">
        <table width="600" bgcolor="#FFFFFF" style="border: 1px solid #E2E8F0; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
          <tr>
            <td align="center" bgcolor="#1D4ED8" style="padding: 30px;">
              <span style="font-size: 24px; font-weight: bold; color: #FFFFFF; letter-spacing: 1px;">CY LAW TECH</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px; color: #334155; line-height: 1.6;">
              <p>Hello there,</p>
              <p>Welcome to <strong>CY Law Tech</strong>! We are excited to have you join our network of legal engineers, automation architects, and advanced tech practitioners.</p>
              <p>We have prepared our premium Automation Checklist guiding code and document integration pipelines.</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://cylawtech.com/checklist" target="_blank" style="background-color: #1D4ED8; color: #FFFFFF; text-decoration: none; padding: 14px 28px; font-weight: bold; border-radius: 8px; display: inline-block;">Get Automation Checklist</a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  }
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

  // Welcome templates state
  const [welcomeSiteKey, setWelcomeSiteKey] = useState(siteConfigs[0].siteKey);
  const [welcome, setWelcome] = useState<WelcomeTemplate>({
    subject: SITE_DEFAULTS.cyvisahelp.subject,
    body: SITE_DEFAULTS.cyvisahelp.body,
    enabled: true
  });
  const [savingWelcome, setSavingWelcome] = useState(false);
  const [welcomeSaved, setWelcomeSaved] = useState(false);
  const [loadingWelcome, setLoadingWelcome] = useState(false);

  // Filters
  const [subFilterSite, setSubFilterSite] = useState<string>('all');
  const [subSearchQuery, setSubSearchQuery] = useState('');
  
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [logFilterStatus, setLogFilterStatus] = useState<string>('all');

  // Add subscriber state
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [addSiteKey, setAddSiteKey] = useState(siteConfigs[0].siteKey);
  const [addingSubscriber, setAddingSubscriber] = useState(false);

  // New Client-Side Parser States & Functions for Mailchimp Exports (CSV/PDF)
  const [sidebarMode, setSidebarMode] = useState<'manual' | 'import'>('manual');
  const [importSiteKey, setImportSiteKey] = useState(siteConfigs[0].siteKey);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [parsedContacts, setParsedContacts] = useState<{ email: string; name: string; status: 'valid' | 'invalid' }[]>([]);
  const [importing, setImporting] = useState(false);
  const [importStats, setImportStats] = useState<{ imported: number; duplicates: number; invalid: number } | null>(null);
  const [pasteText, setPasteText] = useState('');
  const [isPasteMode, setIsPasteMode] = useState(false);
  const [parsingError, setParsingError] = useState<string | null>(null);

  const processFile = (file: File) => {
    setImportFile(file);
    setParsingError(null);
    setImportStats(null);
    const reader = new FileReader();

    if (file.name.toLowerCase().endsWith('.pdf')) {
      reader.onload = (e) => {
        try {
          const result = e.target?.result;
          let text = '';
          if (result instanceof ArrayBuffer) {
             const dec = new TextDecoder('utf-8');
             text = dec.decode(result);
          } else {
             text = result as string;
          }
          
          const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
          const foundEmails = text.match(emailRegex) || [];
          
          if (foundEmails.length === 0) {
            setParsingError("No clear email addresses parsed from this PDF file. Please copy-paste the text instead.");
            setParsedContacts([]);
            return;
          }

          const uniqueEmails = Array.from(new Set(foundEmails.map(email => email.toLowerCase().trim()))) as string[];
          const contacts = uniqueEmails.map(email => {
             const username = email.split('@')[0];
             const cleanName = username.charAt(0).toUpperCase() + username.slice(1);
             return {
               email,
               name: cleanName,
               status: 'valid' as const
             };
          });

          setParsedContacts(contacts);
        } catch (err: any) {
          setParsingError("Parse error: " + err.message);
          setParsedContacts([]);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
          
          if (lines.length === 0) {
            setParsingError("Selected file is empty.");
            setParsedContacts([]);
            return;
          }

          const hasComma = lines[0].includes(',');
          const hasSemicolon = lines[0].includes(';');
          const separator = hasSemicolon && !hasComma ? ';' : ',';

          const parseCSVLine = (line: string) => {
            const result = [];
            let current = '';
            let inQuotes = false;
            for (let i = 0; i < line.length; i++) {
              const char = line[i];
              if (char === '"' || char === "'") {
                inQuotes = !inQuotes;
              } else if (char === separator && !inQuotes) {
                result.push(current.trim());
                current = '';
              } else {
                current += char;
              }
            }
            result.push(current.trim());
            return result;
          };

          const rawHeaders = parseCSVLine(lines[0]);
          const headers = rawHeaders.map(h => h.replace(/^["']|["']$/g, '').toLowerCase().trim());

          const emailIdx = headers.findIndex(h => h.includes('email') || h.includes('addr') || h === 'mail' || h === 'e-mail');
          const firstNameIdx = headers.findIndex(h => h.includes('first name') || h === 'fname' || h === 'first_name' || h.includes('first'));
          const lastNameIdx = headers.findIndex(h => h.includes('last name') || h === 'lname' || h === 'last_name' || h.includes('last'));
          const nameIdx = headers.findIndex(h => h.includes('name') && !h.includes('first') && !h.includes('last'));

          const contacts: { email: string; name: string; status: 'valid' | 'invalid' }[] = [];

          if (emailIdx === -1) {
            const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
            for (const line of lines) {
              const match = line.match(emailRegex);
              if (match) {
                const email = match[0].trim().toLowerCase();
                const cleanName = email.split('@')[0];
                contacts.push({
                  email,
                  name: cleanName.charAt(0).toUpperCase() + cleanName.slice(1),
                  status: 'valid'
                });
              }
            }
          } else {
            for (let i = 1; i < lines.length; i++) {
              const columns = parseCSVLine(lines[i]);
              if (columns.length === 0) continue;

              const rawEmail = columns[emailIdx] || '';
              const email = rawEmail.replace(/^["']|["']$/g, '').trim().toLowerCase();

              if (!email || !email.includes('@')) {
                continue;
              }

              let contactName = 'Subscriber';
              if (firstNameIdx !== -1) {
                const fName = (columns[firstNameIdx] || '').replace(/^["']|["']$/g, '').trim();
                const lName = lastNameIdx !== -1 ? (columns[lastNameIdx] || '').replace(/^["']|["']$/g, '').trim() : '';
                contactName = `${fName} ${lName}`.trim() || 'Subscriber';
              } else if (nameIdx !== -1) {
                contactName = (columns[nameIdx] || '').replace(/^["']|["']$/g, '').trim() || 'Subscriber';
              } else {
                const prefixName = email.split('@')[0];
                contactName = prefixName.charAt(0).toUpperCase() + prefixName.slice(1);
              }

              contacts.push({
                email,
                name: contactName,
                status: 'valid'
              });
            }
          }

          if (contacts.length === 0) {
            setParsingError("No subscriber email columns parsed. Please paste raw text list instead.");
          }
          setParsedContacts(contacts);
        } catch (err: any) {
          setParsingError("Error parsing file format: " + err.message);
          setParsedContacts([]);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handlePasteParse = () => {
    setParsingError(null);
    setImportStats(null);
    if (!pasteText.trim()) {
      setParsingError("Please enter raw text info first.");
      return;
    }

    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const foundEmails = pasteText.match(emailRegex) || [];

    if (foundEmails.length === 0) {
      setParsingError("Could not extract any valid email address patterns.");
      setParsedContacts([]);
      return;
    }

    const uniqueEmails = Array.from(new Set(foundEmails.map(e => e.toLowerCase().trim()))) as string[];
    const contacts = uniqueEmails.map(email => {
      const username = email.split('@')[0];
      const cleanName = username.charAt(0).toUpperCase() + username.slice(1);
      return {
        email,
        name: cleanName,
        status: 'valid' as const
      };
    });

    setParsedContacts(contacts);
  };

  const handleBulkImport = async () => {
    if (parsedContacts.length === 0) return;
    setImporting(true);
    setImportStats(null);
    try {
      const res = await fetch('/api/subscribers/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscribers: parsedContacts,
          siteKey: importSiteKey
        })
      });

      if (res.ok) {
        const stats = await res.json();
        setImportStats({
          imported: stats.imported,
          duplicates: stats.duplicates,
          invalid: stats.invalid
        });
        setParsedContacts([]);
        setImportFile(null);
        setPasteText('');
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to complete bulk import.");
      }
    } catch (e: any) {
      alert("Import failed: " + e.message);
    } finally {
      setImporting(false);
    }
  };

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

  const fetchWelcomeTemplate = async (key: string) => {
    setLoadingWelcome(true);
    try {
      const res = await fetch(`/api/welcome-template/${key}`);
      if (res.ok) {
        const data = await res.json();
        setWelcome({
          subject: data.subject || '',
          body: data.body || '',
          enabled: data.enabled ?? true
        });
      } else {
        // Fallback to defaults
        const defaults = SITE_DEFAULTS[key] || SITE_DEFAULTS.cyvisahelp;
        setWelcome({
          subject: defaults.subject,
          body: defaults.body,
          enabled: true
        });
      }
    } catch (e) {
      console.error('Error fetching welcome template', e);
      const defaults = SITE_DEFAULTS[key] || SITE_DEFAULTS.cyvisahelp;
      setWelcome({
        subject: defaults.subject,
        body: defaults.body,
        enabled: true
      });
    } finally {
      setLoadingWelcome(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeTab === 'welcome') {
      fetchWelcomeTemplate(welcomeSiteKey);
    }
  }, [activeTab, welcomeSiteKey]);

  const handleSendCampaign = async () => {
    if (!subject.trim() || !message.trim()) {
      setSendResult({ ok: false, msg: 'Subject and message body are required.' });
      return;
    }
    if (sendTo === 'single' && !singleEmail.trim()) {
      setSendResult({ ok: false, msg: 'Please enter a valid single recipient email.' });
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
        setSendResult({ ok: true, msg: `Campaign sent successfully to targeted users!` });
        setSubject('');
        setMessage('');
        setSingleEmail('');
        fetchData();
      } else {
        setSendResult({ ok: false, msg: data.error || 'Failed to dispatch email campaign.' });
      }
    } catch (e: any) {
      setSendResult({ ok: false, msg: e.message || 'Network communication error.' });
    } finally {
      setSending(false);
    }
  };

  const handleSaveWelcome = async () => {
    setSavingWelcome(true);
    try {
      const res = await fetch(`/api/welcome-template/${welcomeSiteKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(welcome),
      });
      if (res.ok) {
        setWelcomeSaved(true);
        setTimeout(() => setWelcomeSaved(false), 3000);
      } else {
        const errData = await res.json();
        alert("Failed to save welcome template: " + (errData.error || "Unknown server error"));
      }
    } catch (e: any) {
      console.error(e);
      alert("Network error: " + e.message);
    } finally {
      setSavingWelcome(false);
    }
  };

  const handleAddSubscriber = async () => {
    if (!newEmail.trim() || !newEmail.includes('@')) {
      alert("Please enter a valid email address.");
      return;
    }
    setAddingSubscriber(true);
    try {
      const res = await fetch('/api/subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail.trim(), name: newName.trim(), siteKey: addSiteKey }),
      });
      if (res.ok) {
        setNewEmail('');
        setNewName('');
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || "Could not register subscriber.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAddingSubscriber(false);
    }
  };

  const handleResetWelcomeToDefault = () => {
    const defaults = SITE_DEFAULTS[welcomeSiteKey];
    if (defaults && confirm(`Are you sure you want to reset the welcome email for "${siteConfigs.find(s=>s.siteKey===welcomeSiteKey)?.brandName}" back to the site general defaults?`)) {
      setWelcome({
        subject: defaults.subject,
        body: defaults.body,
        enabled: true
      });
    }
  };

  // Filter lists
  const filteredSubscribers = subscribers.filter(s => {
    const sKey = s.tenants?.site_key || 'cyvisahelp';
    const matchesSite = subFilterSite === 'all' || sKey === subFilterSite;
    const matchesSearch = subSearchQuery.trim() === '' || 
      s.email.toLowerCase().includes(subSearchQuery.toLowerCase()) ||
      (s.name && s.name.toLowerCase().includes(subSearchQuery.toLowerCase()));
    return matchesSite && matchesSearch;
  });

  const filteredLogs = logs.filter(l => {
    const matchesSearch = logSearchQuery.trim() === '' ||
      l.to.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
      l.subject.toLowerCase().includes(logSearchQuery.toLowerCase());
    const matchesStatus = logFilterStatus === 'all' || l.status === logFilterStatus;
    return matchesSearch && matchesStatus;
  });

  const tabs: { id: ActiveTab; label: string; icon: any }[] = [
    { id: 'health', label: 'Email Health & Status', icon: Activity },
    { id: 'send', label: 'Send Newsletters', icon: Send },
    { id: 'welcome', label: 'Welcome Mail Automation', icon: Mail },
    { id: 'subscribers', label: `Lead Manager (${subscribers.length})`, icon: Users },
    { id: 'logs', label: 'Delivery logs', icon: History },
    { id: 'integration', label: 'Embedded Form Widget', icon: Building2 },
    { id: 'test', label: 'Direct Send API', icon: ShieldCheck },
    { id: 'debug', label: 'Internal Logs', icon: AlertCircle },
  ];

  return (
    <div className="space-y-6 animate-fade-in p-1">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-zinc-900 to-zinc-800 text-white rounded-2xl p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-indigo-500 text-[10px] uppercase font-extrabold tracking-widest px-2 py-0.5 rounded-full">Pro Engine</span>
            <span className="text-zinc-400 text-xs">• Dynamic Multitenancy Router</span>
          </div>
          <h2 className="text-2xl font-black mt-1 tracking-tight">CY Broadcast & Lead Center</h2>
          <p className="text-zinc-300 text-xs mt-1 max-w-xl">
            Design targeted welcoming automation, dispatch rich HTML news campaigns, query verified domain reputations, and review delivery callbacks.
          </p>
        </div>
        <div className="flex gap-3 text-xs shrink-0 bg-white/10 p-3 rounded-xl border border-white/10 self-start md:self-center">
          <div className="text-center px-2">
            <div className="font-extrabold text-indigo-300 text-lg">{subscribers.length}</div>
            <div className="text-[10px] text-zinc-300">Total Leads</div>
          </div>
          <div className="w-[1px] bg-white/20 my-1"></div>
          <div className="text-center px-2">
            <div className="font-extrabold text-emerald-400 text-lg">
              {logs.filter(l => l.status === 'delivered').length + logs.filter(l => l.status === 'sent').length}
            </div>
            <div className="text-[10px] text-zinc-300">Delivered</div>
          </div>
          <div className="w-[1px] bg-white/20 my-1"></div>
          <div className="text-center px-2">
            <div className="font-extrabold text-amber-300 text-lg">3</div>
            <div className="text-[10px] text-zinc-300">Web Properties</div>
          </div>
        </div>
      </div>

      {/* Tab Nav */}
      <div className="flex gap-1.5 bg-zinc-100 p-1 rounded-xl w-full flex-wrap border border-zinc-200 shadow-2xs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-white text-zinc-900 shadow-xs border border-zinc-200/40'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/50'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
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

      {/* SEND NEWSLETTERS CAMPAIGN TAB */}
      {activeTab === 'send' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Editor Form */}
          <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-xl p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <h3 className="font-bold text-sm text-zinc-900">Compose New Campaign</h3>
                <p className="text-[11px] text-zinc-500">Send custom messages directly to specific system leads.</p>
              </div>
              <span className="text-[10px] bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-md">
                SMTP Active
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700">Select Sender Profile / Brand <span className="text-rose-500">*</span></label>
                <select
                  value={siteKey}
                  onChange={(e) => setSiteKey(e.target.value)}
                  className="w-full text-xs py-2.5 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 font-medium focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                >
                  {siteConfigs.map(s => <option key={s.siteKey} value={s.siteKey}>{s.brandName}</option>)}
                </select>
                <p className="text-[10px] text-zinc-400">
                  Will use brand prefix name & customized branding assets of <span className="underline font-bold text-zinc-600">
                    {siteConfigs.find(s => s.siteKey === siteKey)?.brandName}
                  </span>.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700">Target Recipient Scope</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSendTo('all')}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                      sendTo === 'all'
                        ? 'bg-zinc-900 text-white border-zinc-900'
                        : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'
                    }`}
                  >
                    Site Subscribers ({subscribers.filter(s => (s.tenants?.site_key || 'cyvisahelp') === siteKey).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSendTo('single')}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                      sendTo === 'single'
                        ? 'bg-zinc-900 text-white border-zinc-900'
                        : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'
                    }`}
                  >
                    Single Email
                  </button>
                </div>
              </div>
            </div>

            {sendTo === 'single' && (
              <div className="space-y-1 animate-fade-in">
                <label className="text-xs font-semibold text-zinc-600">Recipient Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. lead-recipient@domain.com"
                  value={singleEmail}
                  onChange={(e) => setSingleEmail(e.target.value)}
                  className="w-full text-xs py-2.5 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-700">Subject Line <span className="text-rose-500">*</span></label>
              <input
                type="text"
                placeholder="e.g., Secure your legal protection guide today! 🚀"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full text-xs py-2.5 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-medium"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-zinc-700">Message Content (HTML Supported) <span className="text-rose-500">*</span></label>
                {message && !message.includes('{{Unsubscribe_Link}}') && (
                  <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-semibold">
                    ⚠️ Missing Unsubscribe Link
                  </span>
                )}
              </div>
              <textarea
                rows={9}
                placeholder="Write message here. Tip: Use HTML lists, and paragraphs freely with <p>, <ul>, <li>, <b> tags."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full text-xs py-2.5 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-mono resize-y"
              />
              <div className="flex justify-between text-[10px] text-zinc-400">
                <span>Supports tag substitutions: <code>{`{email}`}</code>, <code>{`{name}`}</code></span>
                <button 
                  type="button" 
                  onClick={() => setMessage(prev => prev + "\n\n<p style='font-size:11px;color:#94a3b8;'>If you wish to opt-out, please <a href='{{Unsubscribe_Link}}'>unsubscribe</a>.</p>")} 
                  className="text-indigo-600 hover:underline font-bold"
                >
                  + Add opt-out footer
                </button>
              </div>
            </div>

            {sendResult && (
              <div className={`p-3 rounded-lg text-xs font-semibold ${
                sendResult.ok
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}>
                {sendResult.msg}
              </div>
            )}

            <button
              onClick={handleSendCampaign}
              disabled={sending}
              className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4.5 h-4.5" />}
              {sending ? 'Dispatching campaign...' : 'Send Campaign Broadcast Now'}
            </button>
          </div>

          {/* Real-time brand validator summary card */}
          <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-5 shadow-xs space-y-4 h-fit">
            <h4 className="text-xs font-bold text-zinc-700 uppercase tracking-widest">Interactive Dispatch Guard</h4>
            <p className="text-xs text-zinc-500 leading-normal">
              Review how Resend will routerize and sign this campaign before broadcasting to live mailboxes:
            </p>

            <div className="space-y-3 font-mono text-[11px] bg-white border border-zinc-200 p-4 rounded-lg shadow-2xs">
              <div>
                <span className="text-zinc-400 block text-[9px] uppercase font-bold">Authenticated Sender:</span>
                <span className="text-zinc-800 font-bold">{siteConfigs.find(s=>s.siteKey===siteKey)?.senderName} &lt;hello@cylawtech.com&gt;</span>
              </div>
              <div className="w-full h-[1px] bg-zinc-100"></div>
              <div>
                <span className="text-zinc-400 block text-[9px] uppercase font-bold">Envelope From Header:</span>
                <span className="text-indigo-600 font-semibold">{siteKey}@cylawtech.com</span>
              </div>
              <div className="w-full h-[1px] bg-zinc-100"></div>
              <div>
                <span className="text-zinc-400 block text-[9px] uppercase font-bold">Reply-To Route:</span>
                <span className="text-zinc-800">support@{siteKey}.com</span>
              </div>
              <div className="w-full h-[1px] bg-zinc-100"></div>
              <div>
                <span className="text-zinc-400 block text-[9px] uppercase font-bold">Recipient count:</span>
                <span className="text-zinc-900 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                  {sendTo === 'all' 
                    ? subscribers.filter(s => (s.tenants?.site_key || 'cyvisahelp') === siteKey).length + " active subscriber(s)"
                    : "1 single recipient"
                  }
                </span>
              </div>
            </div>

            <div className="p-3.5 bg-indigo-50 border border-indigo-100 text-indigo-900 rounded-lg text-xs space-y-1.5 leading-relaxed">
              <p className="font-bold flex items-center gap-1">🛡️ Anti-Spam Security Protocol</p>
              <p>
                Our server dynamic router prefixes headers with your custom sub-client name format. Even under one sending domain, recipient mail servers separate reputation tracking cleanly.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* WELCOME EMAIL AUTOMATION TAB */}
      {activeTab === 'welcome' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main settings panel */}
          <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-xl p-6 shadow-xs space-y-5">
            <div className="border-b border-zinc-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-sm text-zinc-900">Custom Welcome Flow Setup</h3>
                <p className="text-xs text-zinc-500 mt-0.5">Define unique autoresponders sent to new subscribers on signup.</p>
              </div>
              
              <button
                onClick={() => setWelcome(prev => ({ ...prev, enabled: !prev.enabled }))}
                className="flex items-center gap-2 self-start bg-zinc-50 border border-zinc-200 px-3 py-1.5 rounded-lg cursor-pointer"
              >
                {welcome.enabled
                  ? <ToggleRight className="w-7 h-7 text-indigo-600 shrink-0" />
                  : <ToggleLeft className="w-7 h-7 text-zinc-400 shrink-0" />
                }
                <span className="text-xs font-bold text-zinc-700">
                  {welcome.enabled ? 'ON' : 'OFF'}
                </span>
              </button>
            </div>

            {/* Site selector tabs specifically to configure welcome template for each site */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700">Which web property welcome email are you editing?</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {siteConfigs.map((s) => {
                  const isSelected = welcomeSiteKey === s.siteKey;
                  return (
                    <button
                      key={s.siteKey}
                      type="button"
                      onClick={() => setWelcomeSiteKey(s.siteKey)}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-bold cursor-pointer transition-all text-left ${
                        isSelected
                          ? `border-indigo-600 bg-indigo-50/25 shadow-2xs`
                          : 'border-zinc-200 bg-white hover:bg-zinc-50 hover:border-zinc-300'
                      }`}
                    >
                      <img src={s.logo} className="w-5.5 h-5.5 rounded-full shrink-0 border border-zinc-200" />
                      <div>
                        <p className="text-zinc-900 font-bold leading-none">{s.brandName}</p>
                        <p className="text-[10px] text-zinc-400 font-normal mt-0.5">{s.siteKey}.com</p>
                      </div>
                      {isSelected && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {loadingWelcome ? (
              <div className="flex flex-col items-center justify-center p-12 text-zinc-400 text-xs gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                <span>Synchronizing workspace template...</span>
              </div>
            ) : (
              <div className={`space-y-4 ${!welcome.enabled ? 'opacity-40 pointer-events-none' : ''} animate-fade-in`}>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700">Welcome Subject Header</label>
                  <input
                    type="text"
                    value={welcome.subject}
                    onChange={(e) => setWelcome(prev => ({ ...prev, subject: e.target.value }))}
                    className="w-full text-xs py-2.5 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700">HTML Welcome Content</label>
                  <textarea
                    rows={11}
                    value={welcome.body}
                    onChange={(e) => setWelcome(prev => ({ ...prev, body: e.target.value }))}
                    className="w-full text-xs py-2.5 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono resize-y"
                  />
                  <p className="text-[10px] text-zinc-400">
                    Formatting with tags is completely supported. Use <code>{`{email}`}</code> or <code>{`{name}`}</code> to personalize message strings dynamically.
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 pt-4 border-t border-zinc-100 flex-wrap">
              <button
                onClick={handleSaveWelcome}
                disabled={savingWelcome || loadingWelcome}
                className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white disabled:opacity-50 text-xs font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
              >
                {savingWelcome ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Save {siteConfigs.find(s=>s.siteKey===welcomeSiteKey)?.brandName} Welcome Template
              </button>
              {welcomeSaved && (
                <span className="text-xs text-emerald-600 font-bold flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Template Stored In DB!
                </span>
              )}
              <button
                onClick={handleResetWelcomeToDefault}
                className="px-4 py-2.5 bg-white hover:bg-zinc-50 border border-zinc-200 text-rose-600 hover:text-rose-700 text-xs font-bold rounded-lg transition-all cursor-pointer ml-auto flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Site Fallback
              </button>
            </div>
          </div>

          {/* HTML live frame preview */}
          <div className="space-y-4">
            <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs space-y-3">
              <h4 className="text-xs font-bold text-zinc-700 uppercase tracking-widest">Template Rendering Sandbox</h4>
              <p className="text-xs text-zinc-400 leading-normal">
                An active simulation in deep workspace of the actual rendered email sent to <strong>new subscribers</strong>:
              </p>

              <div className="border border-zinc-200 rounded-lg overflow-hidden bg-zinc-150">
                <div className="bg-zinc-100 border-b border-zinc-200 px-3 py-2 flex items-center gap-1.5 text-[10px] text-zinc-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                  <span className="font-mono text-[9px] ml-2 truncate">Subject: {welcome.subject}</span>
                </div>
                
                {/* Visual simulated preview frame inside custom card */}
                <div className="p-4 bg-zinc-50/50 max-h-[350px] overflow-y-auto">
                  <div 
                    className="bg-white border border-zinc-100 p-4 rounded shadow-2xs text-[11px] prose prose-zinc max-w-none break-words leading-relaxed"
                    dangerouslySetInnerHTML={{ 
                      __html: welcome.body.replace(/{email}/g, 'user-lead@domain.com') 
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-[11px] text-amber-800 space-y-1">
              <p className="font-bold flex items-center gap-1">💡 Pro-tip: Instant Personalization Test</p>
              <p>Type custom tags inside input values. The rendering sandbox strips scripts automatically but accurately reproduces CSS tables on mobile clients.</p>
            </div>
          </div>
        </div>
      )}

      {/* SUBSCRIBERS / LEAD MANAGER TAB */}
      {activeTab === 'subscribers' && (
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-100 pb-4 gap-3">
            <div>
              <h3 className="font-bold text-sm text-zinc-900">Lead Subscribers Registry</h3>
              <p className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1">
                <span>Direct overview of subscribers registered across active properties.</span>
              </p>
            </div>
            
            <div className="flex gap-2">
              <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-1 rounded border border-emerald-100 inline-flex items-center gap-1">
                <Check className="w-3 h-3" /> REST Connection Secured
              </span>
            </div>
          </div>

          {/* Setup filter and search toolbars */}
          <div className="flex flex-col lg:flex-row gap-3">
            {/* Filter buttons */}
            <div className="flex flex-wrap gap-1 bg-zinc-100 p-1 rounded-lg border border-zinc-200 shrink-0 h-fit">
              <button
                type="button"
                onClick={() => setSubFilterSite('all')}
                className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  subFilterSite === 'all'
                    ? 'bg-zinc-900 text-white shadow-2xs'
                    : 'text-zinc-650 hover:text-zinc-900 hover:bg-zinc-200/50'
                }`}
              >
                All ({subscribers.length})
              </button>
              {siteConfigs.map(s => {
                const count = subscribers.filter(sub => (sub.tenants?.site_key || 'cyvisahelp') === s.siteKey).length;
                return (
                  <button
                    key={s.siteKey}
                    type="button"
                    onClick={() => setSubFilterSite(s.siteKey)}
                    className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                      subFilterSite === s.siteKey
                        ? 'bg-zinc-900 text-white shadow-2xs'
                        : 'text-zinc-650 hover:text-zinc-900 hover:bg-zinc-200/50'
                    }`}
                  >
                    {s.brandName} ({count})
                  </button>
                );
              })}
            </div>

            {/* Keyword search input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search leads by email or registration name..."
                value={subSearchQuery}
                onChange={(e) => setSubSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs placeholder-zinc-400 justify-center outline-none focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* List subscribers panel */}
            <div className="md:col-span-2 space-y-2">
              <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 flex justify-between items-center bg-zinc-50 px-3 py-1.5 border border-zinc-150 rounded">
                <span>Leads Match Details</span>
                <span>Showing {filteredSubscribers.length} of {subscribers.length} entries</span>
              </div>

              <div className="border border-zinc-200 rounded-lg overflow-hidden max-h-[420px] overflow-y-auto divide-y divide-zinc-100">
                {filteredSubscribers.length === 0 ? (
                  <div className="text-center py-10 text-zinc-400 text-xs flex flex-col items-center justify-center gap-1 bg-zinc-50/50">
                    <Filter className="w-6 h-6 text-zinc-300" />
                    <span>No subscribers match criteria.</span>
                  </div>
                ) : (
                  filteredSubscribers.map((s) => {
                    const siteKey = s.tenants?.site_key || 'cyvisahelp';
                    const brandName = s.tenants?.brand_name || 'CY Visa Help';
                    
                    let badgeColor = 'bg-slate-50 text-slate-700 border-slate-100';
                    if (siteKey === 'cylawtech') {
                      badgeColor = 'bg-blue-50 text-blue-700 border-blue-200';
                    } else if (siteKey === 'cybarprep') {
                      badgeColor = 'bg-rose-50 text-rose-700 border-rose-200';
                    }

                    return (
                      <div key={s.id} className="flex items-center justify-between p-3 text-xs bg-white hover:bg-zinc-50/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-800 flex items-center justify-center font-extrabold text-[11px] border border-zinc-200/50">
                            {s.email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-zinc-800">{s.email}</p>
                            {s.name && <p className="text-[10px] text-zinc-500 font-medium">{s.name}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold border px-2 py-0.5 rounded ${badgeColor}`}>
                            {brandName}
                          </span>
                          <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                            Active
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Dual Mode Subscriber Sidebar */}
            <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-5 shadow-2xs h-fit space-y-4">
              <div className="flex border-b border-zinc-200 pb-1.5 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSidebarMode('manual');
                    setParsingError(null);
                    setImportStats(null);
                  }}
                  className={`flex-1 pb-2 text-center text-xs font-bold border-b-2 cursor-pointer transition-all ${
                    sidebarMode === 'manual'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-zinc-400 hover:text-zinc-600'
                  }`}
                >
                  Manual Entry
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSidebarMode('import');
                    setParsingError(null);
                    setImportStats(null);
                  }}
                  className={`flex-1 pb-2 text-center text-xs font-bold border-b-2 cursor-pointer transition-all ${
                    sidebarMode === 'import'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-zinc-400 hover:text-zinc-600'
                  }`}
                >
                  Mailchimp Import
                </button>
              </div>

              {sidebarMode === 'manual' ? (
                <div className="space-y-3.5 animate-fade-in">
                  <div>
                    <h4 className="text-xs font-bold text-zinc-700 uppercase tracking-widest">Manual Sub-Registration</h4>
                    <p className="text-[10px] text-zinc-500 mt-0.5 leading-normal">
                      Introduce leads manual campaigns into specific tenants:
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-extrabold text-zinc-500">Contact Email <span className="text-rose-500">*</span></label>
                    <input
                      type="email"
                      placeholder="e.g. client@example.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full text-xs py-2 px-3 bg-white border border-zinc-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-extrabold text-zinc-500">Client Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Michael Scott"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full text-xs py-2 px-3 bg-white border border-zinc-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-extrabold text-zinc-500">Choose Website Property</label>
                    <select
                      value={addSiteKey}
                      onChange={(e) => setAddSiteKey(e.target.value)}
                      className="w-full text-xs py-2.5 px-2 bg-white border border-zinc-200 rounded-lg outline-none cursor-pointer focus:ring-1 focus:ring-indigo-500 text-zinc-750"
                    >
                      {siteConfigs.map(s => (
                        <option key={s.siteKey} value={s.siteKey}>{s.brandName}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handleAddSubscriber}
                    disabled={addingSubscriber}
                    className="w-full py-2.5 bg-zinc-900 border border-zinc-950 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 hover:bg-zinc-800 cursor-pointer disabled:opacity-50"
                  >
                    {addingSubscriber ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Register lead
                  </button>
                </div>
              ) : (
                <div className="space-y-3.5 animate-fade-in">
                  <div>
                    <h4 className="text-xs font-bold text-zinc-700 uppercase tracking-widest">Mailchimp / CRM CRM Import</h4>
                    <p className="text-[10px] text-zinc-500 mt-0.5 leading-normal">
                      Supports direct exports from Mailchimp using <strong>CSV</strong>, <strong>TXT</strong> or <strong>PDF</strong> formats.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-extrabold text-zinc-500">Target Website Property</label>
                    <select
                      value={importSiteKey}
                      onChange={(e) => setImportSiteKey(e.target.value)}
                      className="w-full text-xs py-2 px-2 bg-white border border-zinc-200 rounded-lg outline-none cursor-pointer focus:ring-1 focus:ring-indigo-500 text-zinc-750 font-semibold"
                    >
                      {siteConfigs.map(s => (
                        <option key={s.siteKey} value={s.siteKey}>{s.brandName} ({s.siteKey}.com)</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center justify-between border-b border-dashed border-zinc-200 pb-1.5">
                    <span className="text-[10px] uppercase font-extrabold text-zinc-500">Method Choice</span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsPasteMode(!isPasteMode);
                        setParsedContacts([]);
                        setImportFile(null);
                        setParsingError(null);
                      }}
                      className="text-[10px] font-bold text-indigo-600 hover:underline"
                    >
                      {isPasteMode ? 'Switch to File Upload' : 'Switch to Copy-Paste Text'}
                    </button>
                  </div>

                  {!isPasteMode ? (
                    <div className="space-y-2">
                      <label className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-350 hover:border-indigo-500 rounded-lg py-5 px-3 bg-white cursor-pointer hover:bg-zinc-50/50 transition-all text-center">
                        <Upload className="w-6 h-6 text-zinc-400 mb-1" />
                        <span className="text-xs font-bold text-zinc-700">Choose Mailchimp Export File</span>
                        <span className="text-[9px] text-zinc-400 mt-0.5">Supports .csv, .txt, .pdf</span>
                        <input
                          type="file"
                          accept=".csv,.txt,.pdf"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>

                      {importFile && (
                        <div className="flex items-center gap-2 p-2 bg-zinc-100 rounded border border-zinc-200/60 text-xs text-zinc-700 font-medium">
                          <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                          <span className="truncate flex-1">{importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)</span>
                          <button
                            type="button"
                            onClick={() => {
                              setImportFile(null);
                              setParsedContacts([]);
                              setParsingError(null);
                              setImportStats(null);
                            }}
                            className="text-rose-500 font-bold hover:text-rose-700 cursor-pointer px-1 text-[11px]"
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <textarea
                        rows={4}
                        placeholder="Paste list of emails and names here... (e.g. John Doe john@example.com)"
                        value={pasteText}
                        onChange={(e) => setPasteText(e.target.value)}
                        className="w-full text-xs p-2 bg-white border border-zinc-200 rounded-lg font-mono focus:ring-1 focus:ring-indigo-500 overflow-y-auto"
                      />
                      <button
                        type="button"
                        onClick={handlePasteParse}
                        className="w-full py-1.5 bg-zinc-200 hover:bg-zinc-300 border border-zinc-300 text-zinc-800 text-xs font-bold rounded-lg cursor-pointer"
                      >
                        Extract Emails
                      </button>
                    </div>
                  )}

                  {/* Parse results preview window */}
                  {parsingError && (
                    <div className="p-2.5 bg-rose-50 border border-rose-100 rounded text-[10px] text-rose-700 font-bold flex items-start gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{parsingError}</span>
                    </div>
                  )}

                  {importStats && (
                    <div className="p-3 bg-emerald-50 border border-emerald-100 rounded text-xs text-emerald-800 space-y-1 animate-fade-in">
                      <p className="font-bold flex items-center gap-1.5 text-emerald-900 border-b border-emerald-200/50 pb-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Bulk Import Completed!
                      </p>
                      <div className="grid grid-cols-3 gap-1 text-[10px] font-semibold text-center pt-1">
                        <div className="bg-emerald-100/50 p-1.5 rounded">
                          <p className="text-emerald-900 font-extrabold text-xs">{importStats.imported}</p>
                          <p className="text-zinc-500 scale-90">Added</p>
                        </div>
                        <div className="bg-amber-100/50 p-1.5 rounded">
                          <p className="text-amber-900 font-extrabold text-xs">{importStats.duplicates}</p>
                          <p className="text-zinc-500 scale-90">Duplicates</p>
                        </div>
                        <div className="bg-rose-100/50 p-1.5 rounded">
                          <p className="text-rose-900 font-extrabold text-xs">{importStats.invalid}</p>
                          <p className="text-zinc-500 scale-90">Skipped</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {parsedContacts.length > 0 && (
                    <div className="space-y-2 animate-fade-in">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-emerald-700 font-extrabold bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
                          <Check className="w-3 h-3" /> Ready: {parsedContacts.length} Contacts Mapped
                        </span>
                        <button
                          type="button"
                          onClick={() => setParsedContacts([])}
                          className="text-[10px] text-orange-600 hover:underline"
                        >
                          Clear
                        </button>
                      </div>

                      {/* Display scroll wrapper card of matched emails */}
                      <div className="border border-zinc-200 rounded bg-white max-h-[145px] overflow-y-auto divide-y divide-zinc-50 select-none">
                        {parsedContacts.map((c, i) => (
                          <div key={i} className="p-2 flex justify-between items-center text-[10px] hover:bg-zinc-50">
                            <div className="truncate pr-2">
                              <p className="font-bold text-zinc-800 leading-none truncate">{c.email}</p>
                              <p className="text-[9px] text-zinc-400 mt-0.5 leading-none">Name: {c.name}</p>
                            </div>
                            <span className="text-[8px] bg-indigo-50 border border-indigo-150 text-indigo-700 px-1 py-0.5 rounded font-extrabold shrink-0">
                              Active
                            </span>
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={handleBulkImport}
                        disabled={importing}
                        className="w-full py-2.5 bg-indigo-600 border border-indigo-700 text-white text-xs font-extrabold rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-2xs"
                      >
                        {importing ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Importing Data Stream...
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            Execute Bulk Import
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DELIVERY LOGS TAB */}
      {activeTab === 'logs' && (
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="border-b border-zinc-100 pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="font-bold text-sm text-zinc-900">Email Delivery Logs</h3>
              <p className="text-xs text-zinc-500">Overview of successfully dispatched campaign messages and system tests.</p>
            </div>

            {/* Quick statistics badge */}
            <div className="flex gap-2">
              <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded border border-indigo-100">
                Resend Sync Live
              </span>
            </div>
          </div>

          {/* Quick logger search and status filtering tools */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search logs by email address or subject..."
                value={logSearchQuery}
                onChange={(e) => setLogSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Logger filter by status */}
            <div className="sm:w-48">
              <select
                value={logFilterStatus}
                onChange={(e) => setLogFilterStatus(e.target.value)}
                className="w-full text-xs py-2 px-3 bg-zinc-50 border border-zinc-200 rounded-lg outline-none cursor-pointer focus:ring-1 focus:ring-indigo-500 text-zinc-700"
              >
                <option value="all">All Logger Statuses</option>
                <option value="delivered">Delivered</option>
                <option value="sent">Sent</option>
                <option value="bounced">Bounced Only</option>
                <option value="complaint">Complaints</option>
              </select>
            </div>
          </div>

          <div className="border border-zinc-200 rounded-xl overflow-hidden divide-y divide-zinc-100 bg-white">
            {filteredLogs.length === 0 ? (
              <p className="text-xs text-zinc-400 py-12 text-center bg-zinc-50/50">No logs match selection parameters.</p>
            ) : (
              filteredLogs.map((log, i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 gap-4 hover:bg-zinc-50 transition-all text-xs">
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="text-xs font-bold text-zinc-800 truncate">{log.subject}</p>
                    <div className="flex items-center gap-1.5 text-zinc-500 text-[11px] truncate">
                      <span className="font-medium text-indigo-700">Recipient:</span> {log.to}
                      <span className="text-zinc-350">•</span>
                      <span className="text-zinc-400">Type: <span className="font-mono bg-zinc-100 px-1 py-0.2 rounded text-zinc-650">{log.type}</span></span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
                    <span className="text-[10px] text-zinc-400 font-mono">
                      {log.created_at ? new Date(log.created_at).toLocaleString() : ''}
                    </span>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${
                      log.status === 'sent' || log.status === 'delivered'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-150'
                        : log.status === 'complaint'
                        ? 'bg-amber-50 text-amber-800 border-amber-100'
                        : 'bg-rose-50 text-rose-800 border-rose-100'
                    }`}>
                      {log.status?.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* EMBEDDED LEADS SIGNUP FORM CODE TAB */}
      {activeTab === 'integration' && (
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs space-y-6">
          <div>
            <h3 className="font-bold text-sm text-zinc-900">Connect External Forms via Dynamic Routing</h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Integrate your main storefront (<span className="underline font-bold text-indigo-600">https://cylawtech.com</span>) or educational landing pages to automatically subscribe users and trigger custom welcomes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left sidebar site selector */}
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-600">Dynamic Styling Sandbox Profile</label>
                <div className="space-y-2">
                  {siteConfigs.map((s) => (
                    <button
                      key={s.siteKey}
                      type="button"
                      onClick={() => setSiteKey(s.siteKey)}
                      className={`w-full flex items-center gap-3 p-3 text-align-left rounded-lg border text-xs font-semibold transition-all cursor-pointer text-left ${
                        siteKey === s.siteKey
                          ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950'
                          : 'border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700'
                      }`}
                    >
                      <img src={s.logo} className="w-6 h-6 rounded-full shrink-0 border" />
                      <div>
                        <p className="font-bold text-zinc-800 leading-none">{s.brandName}</p>
                        <p className="text-[10px] text-zinc-400 font-normal mt-1">{s.website}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg text-xs space-y-1.5 leading-relaxed">
                <p className="font-bold text-zinc-800 flex items-center gap-1">🌐 API Key Autodetect</p>
                <p className="text-[11px] text-zinc-500">
                  Requesting endpoint automatically routes entries configured with <code className="bg-zinc-100 font-mono px-1 rounded font-bold">siteKey: "{siteKey}"</code> to appropriate tenants, applying custom styles instantly.
                </p>
              </div>
            </div>

            {/* Form code generator */}
            <div className="md:col-span-2 space-y-5">
              {/* Box 1: Drop-in HTML form code */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-zinc-800">1. Raw HTML Form Code Snippet</h4>
                  <span className="text-[9px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded">Embeddable Widget</span>
                </div>
                <p className="text-[11px] text-zinc-500">
                  Embed this responsive stylesheet and lead trigger markup directly into your external website properties:
                </p>

                <div className="relative">
                  <textarea
                    readOnly
                    rows={8}
                    className="w-full text-[11px] font-mono p-3 bg-zinc-900 text-zinc-300 border border-zinc-950 rounded-lg focus:outline-none resize-none leading-relaxed"
                    value={"<!-- Embed Form Anywhere On Your HTML Website -->\n" +
"<div id=\"cy-newsletter-embed\" style=\"font-family: system-ui, sans-serif; max-width: 400px; padding: 24px; border: 1px solid #e4e4e7; border-radius: 12px; background: #ffffff;\">\n" +
"  <h3 style=\"margin: 0 0 8px 0; font-size: 16px; font-weight: 700; color: #18181b;\">Join our " + siteConfigs.find(s => s.siteKey === siteKey)?.brandName + " updates</h3>\n" +
"  <p style=\"margin: 0 0 16px 0; font-size: 12px; color: #71717a;\">Receive exclusive updates, automated strategy briefings and templates directly.</p>\n" +
"  \n" +
"  <form id=\"cy-subscribe-form\" style=\"display: flex; flex-direction: column; gap: 8px;\">\n" +
"    <input type=\"text\" id=\"cy-name-input\" placeholder=\"Enter your name\" required style=\"padding: 10px 12px; font-size: 13px; border: 1px solid #e4e4e7; border-radius: 6px; outline: none; background: #f4f4f5;\" />\n" +
"    <input type=\"email\" id=\"cy-email-input\" placeholder=\"Enter your email\" required style=\"padding: 10px 12px; font-size: 13px; border: 1px solid #e4e4e7; border-radius: 6px; outline: none; background: #f4f4f5;\" />\n" +
"    <button type=\"submit\" id=\"cy-submit-btn\" style=\"padding: 10px; font-size: 13px; font-weight: 600; color: #ffffff; background: " + (siteConfigs.find(s => s.siteKey === siteKey)?.primaryColor || '#1d4ed8') + "; border: none; border-radius: 6px; cursor: pointer;\">\n" +
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
"      const res = await fetch(\"" + window.location.origin + "/api/external/subscribe\", {\n" +
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
"      msg.textContent = \"❌ Connection with cy-router system failed.\";\n" +
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

              {/* Box 3: curl Request */}
              <div className="space-y-2">
                <h4 className="font-bold text-xs text-zinc-800">2. Backend / Terminal Test (cURL)</h4>
                <div className="relative">
                  <pre className="text-[11px] font-mono p-3 bg-zinc-900 text-zinc-300 border border-zinc-950 rounded-lg overflow-x-auto leading-relaxed select-all">
{"curl -X POST '" + window.location.origin + "/api/external/subscribe' \\\n" +
"  -H 'Content-Type: application/json' \\\n" +
"  -d " + JSON.stringify(JSON.stringify({ siteKey, email: "lead@domain.com", name: "John Doe" }))}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TEST API TAB */}
      {activeTab === 'test' && (
        <TestEmailTab />
      )}

      {/* DEBUG ATTEMPT LOGS */}
      {activeTab === 'debug' && (
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <div>
              <h3 className="font-bold text-sm text-zinc-900">Subscription Attempt Logs</h3>
              <p className="text-xs text-zinc-500">Monitoring internal raw database transactions.</p>
            </div>
            <button 
              onClick={async () => {
                try {
                  const res = await fetch('/api/health-check');
                  const data = await res.json();
                  alert(res.ok ? "Database status: Verified! " + JSON.stringify(data) : "Database Error: " + data.message);
                  fetchData();
                } catch(e) { alert('Check connection failed.'); }
              }}
              className="text-xs px-3.5 py-2.5 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 font-bold flex shrink-0"
            >
              Verify DB Integrity Link
            </button>
          </div>

          {!debugLogs || debugLogs.length === 0 ? (
            <p className="text-xs text-zinc-400 py-6 text-center">No debug records generated yet.</p>
          ) : (
            <div className="divide-y divide-zinc-100 max-h-[400px] overflow-y-auto">
              {debugLogs.map((log, i) => (
                <div key={i} className="flex items-center justify-between py-3 gap-4">
                  <div className="min-w-0 flex-1">
                    <p className={"text-xs font-semibold truncate " + (log.type === 'ERROR' ? 'text-rose-700' : 'text-indigo-900')}>{log.type}</p>
                    <p className="text-[11px] text-zinc-500 mt-0.5 break-words font-mono bg-zinc-50 p-2 border border-zinc-150 rounded">{log.message}</p>
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
      setResult({ ok: false, msg: 'All key fields are required.' });
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
        setResult({ ok: true, msg: 'Direct test email dispatched successfully via SMTP tunnel!' });
      } else {
        setResult({ ok: false, msg: data.error || 'SMTP gateway rejected transaction.' });
      }
    } catch (e: any) {
      setResult({ ok: false, msg: e.message || 'Fatal communication error.' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs space-y-5 max-w-2xl">
      <div>
        <h3 className="font-bold text-sm text-zinc-900">Direct Send Bypass API</h3>
        <p className="text-xs text-zinc-500">Test transactional server parameters bypass restrictions for fast debugging.</p>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-bold text-zinc-700">To (Target Mailbox)</label>
        <input type="email" placeholder="e.g. administrator@domain.com" value={to} onChange={(e) => setTo(e.target.value)} className="w-full text-xs py-2.5 px-3 bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500" />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-bold text-zinc-700">Subject</label>
        <input type="text" placeholder="e.g. SMTP Connectivity Test" value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full text-xs py-2.5 px-3 bg-zinc-50 border border-zinc-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500" />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-bold text-zinc-700">Message Plaintext Body</label>
        <textarea rows={5} placeholder="Type test variables here..." value={message} onChange={(e) => setMessage(e.target.value)} className="w-full text-xs py-2.5 px-3 bg-zinc-50 border border-zinc-200 rounded-lg outline-none resize-y focus:ring-1 focus:ring-indigo-500" />
      </div>
      <button onClick={handleTestSend} disabled={sending} className="py-2.5 bg-zinc-900 text-white hover:bg-zinc-800 transition-colors rounded-lg w-full text-xs font-bold shadow-xs cursor-pointer">
        {sending ? 'Sending...' : 'Dispatch Test Request Gate'}
      </button>
      {result && (
        <div className={"p-3 rounded-lg text-xs font-semibold border " + (result.ok ? 'bg-emerald-50 text-emerald-850 border-emerald-100' : 'bg-rose-50 text-rose-850 border-rose-100')}>
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
            
            <div className="mt-3 space-y-1.5 font-mono text-[11px] text-zinc-650 bg-zinc-50 p-2.5 rounded-lg border border-zinc-100">
              <div className="flex justify-between">
                <span className="text-zinc-400">Sender:</span>
                <span className="text-zinc-900 font-semibold text-right">hello@cylawtech.com</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Reply-To:</span>
                <span className="text-zinc-900 text-right">support@cylawtech.com</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Env Override:</span>
                <span className="text-indigo-600 font-semibold text-right">Active</span>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-zinc-400 leading-relaxed mt-3">
            Your customized dynamic routing prefixes titles using custom user labels on SMTP transactions.
          </p>
        </div>

        {/* Key Metrics Counters */}
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs space-y-4">
          <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Delivery Counters</p>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-2 bg-emerald-50/50 border border-emerald-100/40 rounded-lg">
              <span className="text-[10px] text-zinc-500 font-semibold">Delivered</span>
              <p className="text-base font-bold text-emerald-700">{validDeliveredCount}</p>
            </div>
            <div className="p-2 bg-rose-50/50 border border-rose-100/40 rounded-lg">
              <span className="text-[10px] text-zinc-500 font-semibold">Bounced</span>
              <p className="text-base font-bold text-rose-700">{bouncedCount}</p>
            </div>
            <div className="p-2 bg-amber-50/50 border border-amber-100/40 rounded-lg">
              <span className="text-[10px] text-zinc-500 font-semibold">Complaints</span>
              <p className="text-base font-bold text-amber-700">{complaintsCount}</p>
            </div>
            <div className="p-2 bg-zinc-50 border border-zinc-100 rounded-lg">
              <span className="text-[10px] text-zinc-500 font-semibold">Total Despatched</span>
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
              className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-md transition-all border border-indigo-200/50"
            >
              {dnsValidating ? 'Checking...' : 'Check Records'}
            </button>
          </div>

          <div className="space-y-2.5">
            {/* SPF Check */}
            <div className="flex items-center justify-between p-3 bg-zinc-50 border border-zinc-100 rounded-lg text-xs">
              <div className="space-y-0.5 min-w-0 pr-2">
                <span className="font-bold text-zinc-750 block truncate">SPF (Sender Policy Framework)</span>
                <p className="text-[10px] text-zinc-400 font-mono truncate">v=spf1 include:resend.com ~all</p>
              </div>
              {dnsResults?.spfStatus ? (
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 shrink-0">
                  <Check className="w-3 h-3" /> VERIFIED
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100 shrink-0">
                  <AlertCircle className="w-3 h-3" /> UNCONFIGURED
                </span>
              )}
            </div>

            {/* DKIM Check */}
            <div className="flex items-center justify-between p-3 bg-zinc-50 border border-zinc-100 rounded-lg text-xs">
              <div className="space-y-0.5 min-w-0 pr-2">
                <span className="font-bold text-zinc-750 block truncate">DKIM (DomainKeys Identified Mail)</span>
                <p className="text-[10px] text-zinc-400 font-mono truncate">resend._domainkey.cylawtech.com</p>
              </div>
              {dnsResults?.dkimStatus ? (
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 shrink-0">
                  <Check className="w-3 h-3" /> VERIFIED
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100 shrink-0">
                  <AlertCircle className="w-3 h-3" /> UNCONFIGURED
                </span>
              )}
            </div>

            {/* DMARC Check */}
            <div className="flex items-center justify-between p-3 bg-zinc-50 border border-zinc-100 rounded-lg text-xs">
              <div className="space-y-0.5 min-w-0 pr-2">
                <span className="font-bold text-zinc-750 block truncate">DMARC policy (Domain Message Authentication)</span>
                <p className="text-[10px] text-zinc-400 font-mono truncate">_dmarc.cylawtech.com = v=DMARC1; p=none</p>
              </div>
              {dnsResults?.dmarcStatus ? (
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 shrink-0">
                  <Check className="w-3 h-3" /> VERIFIED
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100 shrink-0">
                  <AlertCircle className="w-3 h-3" /> UNCONFIGURED
                </span>
              )}
            </div>
          </div>

          <p className="text-[10px] text-zinc-400 leading-normal bg-zinc-50/50 p-2.5 rounded-md border border-zinc-100/60 font-mono">
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
                    className="text-xs bg-zinc-100 border border-zinc-200 py-1.5 px-2 rounded-lg text-zinc-700 animate-none cursor-pointer focus:ring-1 focus:ring-indigo-500 outline-none"
                  >
                    <option value="">Choose Existing Lead...</option>
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
              className="w-full py-2.5 bg-zinc-900 text-white rounded-lg text-xs font-bold shadow-xs hover:bg-zinc-850 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              {simulating ? 'Processing webhook trigger...' : 'Trigger Webhook Callback'}
            </button>

            {simResult && (
              <div className={`p-2.5 rounded-lg text-xs font-medium ${simResult.ok ? 'bg-emerald-50 text-emerald-750 border border-emerald-100' : 'bg-rose-50 text-rose-750 border border-rose-100'}`}>
                {simResult.msg}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
