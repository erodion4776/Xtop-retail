import { useState, FormEvent, useEffect } from 'react';
import { ShieldCheck, Mail, Globe, Sparkles, RefreshCw, CheckCircle2, User, HelpCircle, Save, Info, AlertOctagon, Code, Copy, Check } from 'lucide-react';

interface SettingsViewProps {
  clientId: string;
  clientName: string;
  clientEmail: string;
  senderEmail: string;
  senderName: string;
  onSaveSender: (newEmail: string, newName: string) => Promise<boolean>;
}

export default function SettingsView({
  clientId,
  clientName,
  clientEmail,
  senderEmail: propSenderEmail,
  senderName: propSenderName,
  onSaveSender,
}: SettingsViewProps) {
  const [profileName, setProfileName] = useState(clientName || 'Ero Eliza');
  const [profileEmail, setProfileEmail] = useState(clientEmail || 'eroeliza1234@gmail.com');
  const [senderEmail, setSenderEmail] = useState(propSenderEmail || 'newsletters@xtopflow.com');
  const [senderName, setSenderName] = useState(propSenderName || 'XTOPFlow Broadcasts');
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // Embed script string and domain list...
  const embedCode = `<script>
  fetch("https://ais-dev-ttzepvxyoavvowwmj5rcpp-24487513203.europe-west3.run.app/api/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "user@example.com",
      client_id: "${clientId}"
    })
  });
</script>`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  // Domain statuses
  const [domains, setDomains] = useState([
    { Domain: 'emailflow-saas.com', Type: 'Primary', Status: 'Verified' },
    { Domain: 'marketing.customerconnect.io', Type: 'Secondary', Status: 'Pending' },
  ]);

  // Polling for DNS verification
  useEffect(() => {
    const pollDomains = async () => {
      const pendingDomains = domains.filter(d => d.Status === 'Pending');
      for (const dom of pendingDomains) {
        try {
          const res = await fetch(`/api/domain/verify/${dom.Domain}`);
          const data = await res.json();
          if (data.overall) {
            setDomains(prev => prev.map(d => d.Domain === dom.Domain ? {...d, Status: 'Verified'} : d));
          }
        } catch (e) {
          console.error("DNS polling failed", e);
        }
      }
    };
    
    const interval = setInterval(pollDomains, 30000);
    return () => clearInterval(interval);
  }, [domains]);

  const [newDomain, setNewDomain] = useState('');
  const [isAdding, setIsAdding] = useState(false);

    
  const handleAddDomain = (e: FormEvent) => {
    e.preventDefault();
    if (!newDomain) return;
    setDomains([...domains, { Domain: newDomain, Type: 'Secondary', Status: 'Pending' }]);
    setNewDomain('');
  };

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const success = await onSaveSender(senderEmail, senderName);
    setIsSaving(false);
    if (success) {
      alert('Sender credentials and client metadata successfully saved to Supabase!');
    } else {
      alert('Could not synchronize profile records with database.');
    }
  };

  return (
    <div id="settings-view-holder" className="space-y-8 animate-fade-in max-w-4xl">
      {/* Settings Header */}
      <div>
        <h2 className="text-xl font-bold text-zinc-900 tracking-tight">System Settings</h2>
        <p className="text-xs text-zinc-500 mt-1">
          Manage sender identities, integration embeds, and domain authentication records.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Side: Navigation Quick Tabs */}
        <div className="space-y-4">
          <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-xs">
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest pl-2 mb-3">Settings Quicklinks</h4>
            <div className="space-y-1">
              <a href="#integration-settings" className="block text-xs font-semibold px-3 py-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 rounded-lg">
                Connect Website
              </a>
              <a href="#profile-settings" className="block text-xs font-semibold px-3 py-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 rounded-lg">
                Client Profile
              </a>
              <a href="#sender-settings" className="block text-xs font-semibold px-3 py-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 rounded-lg">
                Sender Identities
              </a>
              <a href="#domain-settings" className="block text-xs font-semibold px-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg">
                Domains & DNS
              </a>
            </div>
          </div>
        </div>

        {/* Right Side: Primary Configuration Settings */}
        <div className="md:col-span-2 space-y-6">

          {/* Section: Integration (New) */}
          <section id="integration-settings" className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-zinc-100">
              <Code className="w-4.5 h-4.5 text-zinc-400" />
              <h3 className="font-bold text-sm text-zinc-900">Connect Your Website</h3>
            </div>
            
            <p className="text-xs text-zinc-500">
              Paste this script before the closing <code>&lt;/body&gt;</code> tag on any HTML page to instantly capture email subscriptions.
            </p>

            <div className="bg-zinc-900 rounded-lg p-4 relative group">
              <pre className="text-xs text-indigo-300 font-mono overflow-x-auto">
                {embedCode}
              </pre>
              <button 
                onClick={copyToClipboard}
                className="absolute top-3 right-3 p-1.5 bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-150 text-[11px] text-zinc-500 font-medium">
              Client Unique ID: <span className="font-mono text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded">{clientId}</span>
            </div>
          </section>
          
          {/* Section: Client Profile */}
          <section id="profile-settings" className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-zinc-100">
              <User className="w-4.5 h-4.5 text-zinc-400" />
              <h3 className="font-bold text-sm text-zinc-900">Client Profile</h3>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-zinc-500 uppercase">Administrator Name</label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full text-xs py-2.5 px-3 bg-zinc-50 focus:bg-white border border-zinc-100 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg text-zinc-800 font-medium transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-zinc-500 uppercase">Registered Email</label>
                  <input
                    type="email"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    className="w-full text-xs py-2.5 px-3 bg-zinc-50 focus:bg-white border border-zinc-100 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg text-zinc-800 font-medium transition-all"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-850 text-white text-xs font-semibold rounded-lg shadow-sm hover:shadow-md transition-all inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : <><Save className="w-3.5 h-3.5" /> Save Changes</>}
                </button>
              </div>
            </form>
          </section>

          {/* Section: Domains Section */}
          <section id="domain-settings" className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2.5">
                <Globe className="w-4.5 h-4.5 text-zinc-400" />
                <h3 className="font-bold text-sm text-zinc-900">Authorized Sending Domains</h3>
              </div>
            </div>

            <div className="space-y-3.5">
              <form onSubmit={handleAddDomain} className="flex gap-2">
                <input
                    type="text"
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    placeholder="e.g., example.com"
                    className="flex-1 text-xs py-2 px-3 bg-zinc-50 border border-zinc-100 rounded-lg"
                />
                <button type="submit" className="px-3 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg">Add Domain</button>
              </form>

              {domains.map((dom) => (
                <div key={dom.Domain} className="p-4 border border-zinc-150 bg-zinc-50/30 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-xs text-zinc-900">{dom.Domain}</p>
                      <p className="text-[10px] text-zinc-400 mt-0.5 uppercase tracking-wide">{dom.Type} Domain</p>
                    </div>

                    {dom.Status === 'Verified' ? (
                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-1 rounded inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> VERIFIED
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-1 rounded inline-flex items-center gap-1">
                        <RefreshCw className="w-3 h-3 text-amber-600 animate-spin" /> Checking DNS...
                      </span>
                    )}
                  </div>
                  
                  {dom.Status === 'Pending' && (
                      <div className="text-[10px] bg-white p-3 rounded border border-zinc-150 border-dashed text-zinc-600 space-y-1">
                          <p className="font-bold text-zinc-800">Add these DNS records:</p>
                          <p>SPF (TXT): <code>v=spf1 include:resend.com ~all</code></p>
                          <p>DMARC (TXT): <code>v=DMARC1; p=none</code></p>
                      </div>
                  )}
                </div>
              ))}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
