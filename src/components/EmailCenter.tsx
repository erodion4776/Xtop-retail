import React, { useState, useEffect } from 'react';
import { 
  Mail, Send, Loader2, Sparkles, Code, CheckCircle, 
  AlertCircle, Building2, Activity, History, PlayCircle, Eye, 
  RefreshCw, Save, Trash2, FolderOpen, FileText, BookOpen
} from 'lucide-react';
import { siteConfigs } from '../../server/emailConfig';

// Internal Splitted Refactored Modules
import { Subscriber, EmailLog, WelcomeTemplate, ActiveTab, SavedTemplate, SITE_DEFAULTS } from './EmailCenter/types';
import { EmailHealthTab } from './EmailCenter/EmailHealthTab';
import { TestEmailTab } from './EmailCenter/TestEmailTab';

export default function EmailCenter() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('health');
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // --- Send Broadcast Campaign State ---
  const [campaignSiteKey, setCampaignSiteKey] = useState('cyvisahelp');
  const [campaignSubject, setCampaignSubject] = useState('');
  const [campaignHtml, setCampaignHtml] = useState('<h1>Important Announcement</h1><p>Hi {{name}},</p><p>Check out our latest update!</p>');
  const [campaignTarget, setCampaignTarget] = useState<'all' | 'custom'>('all');
  const [campaignCustomEmails, setCampaignCustomEmails] = useState('');
  const [campaignStatus, setCampaignStatus] = useState<{ success?: boolean; msg?: string } | null>(null);

  // --- Welcome Template State ---
  const [welcomeSiteKey, setWelcomeSiteKey] = useState('cyvisahelp');
  const [welcomeSubject, setWelcomeSubject] = useState('');
  const [welcomeBody, setWelcomeBody] = useState('');
  const [welcomeLoading, setWelcomeLoading] = useState(false);
  const [welcomeSaveStatus, setWelcomeSaveStatus] = useState<string | null>(null);

  // --- Gemini AI Mimic Workspace State ---
  const [showAiMimic, setShowAiMimic] = useState(false);
  const [referenceHtml, setReferenceHtml] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [previewTab, setPreviewTab] = useState<'preview' | 'code'>('preview');

  // --- NEW: Text-to-HTML Conversion Panel State ---
  const [showTextToHtml, setShowTextToHtml] = useState(false);
  const [rawTextNotes, setRawTextNotes] = useState('');
  const [textToHtmlSubject, setTextToHtmlSubject] = useState('');
  const [aiConvertingText, setAiConvertingText] = useState(false);
  const [aiTextError, setAiTextError] = useState<string | null>(null);

  // --- NEW: Saved Template Library State ---
  const [libraryTemplates, setLibraryTemplates] = useState<SavedTemplate[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [librarySiteKey, setLibrarySiteKey] = useState('cyvisahelp');
  const [saveTemplateName, setSaveTemplateName] = useState('');
  const [saveTemplateDesc, setSaveTemplateDesc] = useState('');
  const [saveTemplateCategory, setSaveTemplateCategory] = useState<'general' | 'reference'>('general');
  const [saveTemplateStatus, setSaveTemplateStatus] = useState<string | null>(null);

  // Load system stats and logs
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const logsRes = await fetch('/api/email-logs');
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setLogs(logsData);
      }
      
      const subsRes = await fetch('/api/subscribers');
      if (subsRes.ok) {
        const subsData = await subsRes.json();
        setSubscribers(subsData);
      }
    } catch (err) {
      console.error("Failed to fetch logs and subscribers:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch saved templates from library database
  const fetchLibraryTemplates = async (siteKey: string) => {
    setLibraryLoading(true);
    try {
      const res = await fetch(`/api/template-library/${siteKey}`);
      if (res.ok) {
        const data = await res.json();
        setLibraryTemplates(data);
      }
    } catch (err) {
      console.error("Failed to load templates from library:", err);
    } finally {
      setLibraryLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'library') {
      fetchLibraryTemplates(librarySiteKey);
    }
  }, [librarySiteKey, activeTab]);

  // Load specific welcome template
  const fetchWelcomeTemplate = async () => {
    setWelcomeLoading(true);
    setWelcomeSaveStatus(null);
    try {
      const res = await fetch(`/api/welcome-template/${welcomeSiteKey}`);
      if (res.ok) {
        const data = await res.json();
        setWelcomeSubject(data.subject);
        setWelcomeBody(data.body);
      }
    } catch (err) {
      console.error("Failed to load welcome template:", err);
    } finally {
      setWelcomeLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'welcome') {
      fetchWelcomeTemplate();
    }
  }, [welcomeSiteKey, activeTab]);

  // Handle direct campaign broadcasts
  const handleSendCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setCampaignStatus(null);
    setIsLoading(true);

    let targetEmails: string[] = [];
    if (campaignTarget === 'custom') {
      targetEmails = campaignCustomEmails
        .split(',')
        .map(emailStr => emailStr.trim())
        .filter(emailStr => emailStr.includes('@'));
      
      if (targetEmails.length === 0) {
        setCampaignStatus({ success: false, msg: 'Please provide at least one valid email address to target.' });
        setIsLoading(false);
        return;
      }
    }

    try {
      const res = await fetch('/api/send-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteKey: campaignSiteKey,
          subject: campaignSubject,
          message: campaignHtml,
          sendTo: campaignTarget === 'all' ? 'all' : 'selected',
          emails: targetEmails
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCampaignStatus({ success: true, msg: `Broadcast completed to ${data.sent} active target recipient(s)!` });
        setCampaignSubject('');
        setCampaignCustomEmails('');
        fetchData();
      } else {
        setCampaignStatus({ success: false, msg: data.error || 'Outbound broadcast request rejected by server.' });
      }
    } catch (err: any) {
      setCampaignStatus({ success: false, msg: err.message || 'Outbound campaign dispatch failed.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Convert raw text to HTML with Gemini AI
  const handleTextToHtmlConversion = async (targetField: 'welcome' | 'campaign') => {
    if (!rawTextNotes.trim()) {
      setAiTextError('Please paste your plain text notes first.');
      return;
    }
    setAiConvertingText(true);
    setAiTextError(null);

    const siteKey = targetField === 'welcome' ? welcomeSiteKey : campaignSiteKey;
    const subject = textToHtmlSubject || (targetField === 'welcome' ? welcomeSubject : campaignSubject);

    try {
      const res = await fetch('/api/generate-html-from-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteKey,
          rawText: rawTextNotes,
          subject
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (targetField === 'welcome') {
          setWelcomeBody(data.html);
          if (textToHtmlSubject) setWelcomeSubject(textToHtmlSubject);
        } else {
          setCampaignHtml(data.html);
          if (textToHtmlSubject) setCampaignSubject(textToHtmlSubject);
        }
        setRawTextNotes('');
        setTextToHtmlSubject('');
        setShowTextToHtml(false);
      } else {
        setAiTextError(data.error || 'Unable to parse plain text notes into email format.');
      }
    } catch (err: any) {
      setAiTextError(`AI Text conversion failed: ${err.message}`);
    } finally {
      setAiConvertingText(false);
    }
  };

  // Save layout template to Library Database
  const handleSaveToLibrary = async (editorType: 'welcome' | 'campaign') => {
    setSaveTemplateStatus(null);
    const siteKey = editorType === 'welcome' ? welcomeSiteKey : campaignSiteKey;
    const htmlContent = editorType === 'welcome' ? welcomeBody : campaignHtml;
    const fallbackName = `${siteKey.toUpperCase()} - Saved Draft (${new Date().toLocaleDateString()})`;

    if (!saveTemplateName.trim()) {
      alert("Please provide a name for the saved layout template.");
      return;
    }

    try {
      const res = await fetch(`/api/template-library/${siteKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: saveTemplateName,
          description: saveTemplateDesc,
          html_content: htmlContent,
          category: saveTemplateCategory
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSaveTemplateStatus(`Template saved to library successfully!`);
        setSaveTemplateName('');
        setSaveTemplateDesc('');
        setTimeout(() => setSaveTemplateStatus(null), 4000);
      } else {
        alert(data.error || 'Unable to save template layout.');
      }
    } catch (err: any) {
      alert(`Network failure: ${err.message}`);
    }
  };

  // Delete saved template
  const handleDeleteTemplateFromLibrary = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template blueprint from your library?')) return;
    try {
      const res = await fetch(`/api/template-library/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchLibraryTemplates(librarySiteKey);
      } else {
        alert('Failed to delete template layout.');
      }
    } catch (err: any) {
      alert(`Error deleting layout: ${err.message}`);
    }
  };

  // Trigger Gemini AI Template Mimic constructor
  const handleAiMimicGeneration = async () => {
    if (!referenceHtml.trim()) {
      setAiError('Please paste reference HTML layout content to analyze.');
      return;
    }
    setAiGenerating(true);
    setAiError(null);

    try {
      const res = await fetch('/api/generate-template-mimic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteKey: welcomeSiteKey,
          referenceHtml,
          prompt: aiPrompt
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setWelcomeBody(data.html);
        setReferenceHtml('');
        setAiPrompt('');
        setShowAiMimic(false);
      } else {
        setAiError(data.error || 'Failed to capture visual styles. Please check your reference HTML tags.');
      }
    } catch (err: any) {
      setAiError(`AI Mimic connection failed: ${err.message}`);
    } finally {
      setAiGenerating(false);
    }
  };

  // Activate welcome onboarding templates
  const handleSaveWelcomeTemplate = async () => {
    setWelcomeLoading(true);
    setWelcomeSaveStatus(null);
    try {
      const res = await fetch(`/api/welcome-template/${welcomeSiteKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: welcomeSubject,
          body: welcomeBody
        })
      });

      if (res.ok) {
        setWelcomeSaveStatus('Welcome automation layout updated and activated successfully!');
        setTimeout(() => setWelcomeSaveStatus(null), 4500);
      } else {
        const data = await res.json();
        setWelcomeSaveStatus(`Failed: ${data.error || 'Save rejected by server database.'}`);
      }
    } catch (err: any) {
      setWelcomeSaveStatus(`Network connection failed: ${err.message}`);
    } finally {
      setWelcomeLoading(false);
    }
  };

  // Simulate webhook deliveries
  const handleSimulateWebhook = async (email: string, status: 'delivered' | 'bounced' | 'complaint') => {
    try {
      const res = await fetch('/api/test/simulate-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: email, status })
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error("Developer webhook emulation failed:", err);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-bold text-zinc-900 tracking-tight flex items-center gap-2">
          <Mail className="w-5 h-5 text-indigo-600" /> Multi-Brand Email Center
        </h2>
        <p className="text-xs text-zinc-500 mt-1">
          Monitor multi-tenant delivery metrics, construct visual responsive campaigns, and synthesize custom onboarding flows.
        </p>
      </div>

      {/* Navigation Subtabs */}
      <div className="flex border-b border-zinc-200 gap-1 overflow-x-auto">
        {[
          { id: 'health' as ActiveTab, label: 'Outbound Health Score', icon: Activity },
          { id: 'send' as ActiveTab, label: 'Broadcast Campaign', icon: Send },
          { id: 'welcome' as ActiveTab, label: 'Welcome Onboarding & AI Mimic', icon: Sparkles },
          { id: 'library' as ActiveTab, label: 'Template Library', icon: BookOpen },
          { id: 'logs' as ActiveTab, label: 'Delivery logs & webhook test', icon: History },
          { id: 'test' as ActiveTab, label: 'Direct Deliverability Test', icon: PlayCircle },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-700 font-bold bg-indigo-50/25'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Primary Panels Container */}
      <div className="space-y-6">
        {activeTab === 'health' && (
          <EmailHealthTab logs={logs} onRefreshSim={fetchData} subscribers={subscribers} />
        )}

        {activeTab === 'test' && <TestEmailTab />}

        {activeTab === 'send' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl items-start">
            <form onSubmit={handleSendCampaign} className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs space-y-5 lg:col-span-2">
              <div className="flex justify-between items-center pb-3 border-b border-zinc-100">
                <div className="flex gap-3 items-center">
                  <Building2 className="w-4.5 h-4.5 text-zinc-400" />
                  <h3 className="font-bold text-sm text-zinc-900">Broadcast Campaign Setup</h3>
                </div>
                
                <button
                  type="button"
                  onClick={() => setShowTextToHtml(!showTextToHtml)}
                  className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 text-indigo-700 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                >
                  <Sparkles className="w-3 h-3 text-indigo-600 animate-pulse" /> ✨ AI Text Converter
                </button>
              </div>

              {/* Text-to-HTML AI Converter Panel */}
              {showTextToHtml && (
                <div className="p-4 bg-indigo-50/40 border border-indigo-100 rounded-lg space-y-3 animate-slide-down">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
                    <h4 className="font-bold text-xs text-indigo-900">Convert Plain Text → Branded HTML</h4>
                  </div>
                  <p className="text-[11px] text-zinc-650 leading-relaxed">
                    Paste your raw text newsletter draft below. Gemini AI will automatically convert it into a beautiful, cross-platform email layout that inherits the style, buttons, header, and footer of your brand.
                  </p>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-indigo-750 uppercase">Email Subject (Optional Override)</label>
                    <input
                      type="text"
                      placeholder="e.g. Big Immigration Changes Happening This August!"
                      value={textToHtmlSubject}
                      onChange={(e) => setTextToHtmlSubject(e.target.value)}
                      className="w-full text-xs p-2 bg-white border border-indigo-100 rounded focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-indigo-750 uppercase">Raw Newsletter Notes / Plain Text</label>
                    <textarea
                      rows={6}
                      placeholder="1. TPS changes Ukraine October 19. Don't wait to check options.&#10;2. August Visa Bulletin Priority Dates. eligibility check.&#10;3. Tips: Check with lawyers, avoid social media rumours."
                      value={rawTextNotes}
                      onChange={(e) => setRawTextNotes(e.target.value)}
                      className="w-full text-xs p-2.5 bg-white border border-indigo-100 rounded focus:outline-hidden text-zinc-800"
                    />
                  </div>

                  <div className="flex justify-between items-center">
                    <button
                      type="button"
                      onClick={() => setShowTextToHtml(false)}
                      className="text-[10px] font-bold text-indigo-700 hover:underline cursor-pointer"
                    >
                      Dismiss
                    </button>
                    <button
                      type="button"
                      disabled={aiConvertingText}
                      onClick={() => handleTextToHtmlConversion('campaign')}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[11px] rounded-md flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      {aiConvertingText ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" /> Structuring HTML...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3" /> Transform Text with AI
                        </>
                      )}
                    </button>
                  </div>
                  {aiTextError && <p className="text-[11px] text-rose-600 font-semibold">⚠️ {aiTextError}</p>}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-500 uppercase">Brand Sender Profile</label>
                  <select
                    value={campaignSiteKey}
                    onChange={(e) => setCampaignSiteKey(e.target.value)}
                    className="w-full text-xs py-2.5 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 font-medium"
                  >
                    <option value="cyvisahelp">CY Visa Help (hello@cyvisahelp.com)</option>
                    <option value="cybarprep">CY Bar Prep (support@cybarprep.com)</option>
                    <option value="cylawtech">CY Law Tech (hello@cylawtech.com)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-500 uppercase">Target Audience</label>
                  <select
                    value={campaignTarget}
                    onChange={(e) => setCampaignTarget(e.target.value as any)}
                    className="w-full text-xs py-2.5 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 font-medium cursor-pointer"
                  >
                    <option value="all">Active brand property subscribers (automated segmentation)</option>
                    <option value="custom">Manual target list (custom comma-separated addresses)</option>
                  </select>
                </div>
              </div>

              {campaignTarget === 'custom' && (
                <div className="space-y-1.5 animate-fade-in">
                  <label className="text-[11px] font-bold text-zinc-500 uppercase">Target Recipients Addresses</label>
                  <input
                    type="text"
                    placeholder="e.g. testing1@domain.com, testing2@domain.com"
                    value={campaignCustomEmails}
                    onChange={(e) => setCampaignCustomEmails(e.target.value)}
                    className="w-full text-xs py-2.5 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 font-medium"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-500 uppercase">Outbound Subject Line</label>
                <input
                  type="text"
                  placeholder="e.g., Your Free Weekly Training Inside! 🚀"
                  value={campaignSubject}
                  onChange={(e) => setCampaignSubject(e.target.value)}
                  className="w-full text-xs py-2.5 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 font-medium"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-bold text-zinc-500 uppercase">HTML Campaign Content</label>
                  <span className="text-[10px] text-zinc-400 font-medium">Placeholders supported: <code>{"{{name}}"}</code>, <code>{"{{email}}"}</code></span>
                </div>
                <textarea
                  rows={13}
                  value={campaignHtml}
                  onChange={(e) => setCampaignHtml(e.target.value)}
                  className="w-full text-xs p-3 bg-zinc-900 text-indigo-300 font-mono rounded-lg border border-zinc-800 focus:outline-hidden"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-850 text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all active:scale-95 duration-100"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Discharging Broadcast...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" /> Dispatch Campaign
                  </>
                )}
              </button>

              {campaignStatus && (
                <div className={`p-4 rounded-lg flex items-start gap-2.5 border text-xs leading-relaxed animate-fade-in ${campaignStatus.success ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'}`}>
                  {campaignStatus.success ? <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                  <div>
                    <p className="font-bold">{campaignStatus.success ? 'Outbound Dispatch Completed' : 'Transmission Failed'}</p>
                    <p className="mt-0.5">{campaignStatus.msg}</p>
                  </div>
                </div>
              )}
            </form>

            {/* Save Draft Layout to Brand Template Library Panel */}
            <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-2.5 border-b border-zinc-100">
                <Save className="w-4 h-4 text-indigo-650 text-indigo-600" />
                <h4 className="font-bold text-xs text-zinc-850 uppercase">Save Blueprint to Library</h4>
              </div>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Save your constructed email campaign designs into your persistent templates library to quickly reuse them across channels anytime.
              </p>
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase">Layout Template Name</label>
                <input
                  type="text"
                  placeholder="e.g. August Visa Bulletin Update Template"
                  value={saveTemplateName}
                  onChange={(e) => setSaveTemplateName(e.target.value)}
                  className="w-full text-xs p-2 bg-zinc-50 border border-zinc-200 rounded focus:outline-hidden focus:bg-white transition-all font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase">Short Description</label>
                <input
                  type="text"
                  placeholder="e.g. High contrast gold accents and custom CTA links"
                  value={saveTemplateDesc}
                  onChange={(e) => setSaveTemplateDesc(e.target.value)}
                  className="w-full text-xs p-2 bg-zinc-50 border border-zinc-200 rounded focus:outline-hidden focus:bg-white transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase">Aesthetic Profile Category</label>
                <select
                  value={saveTemplateCategory}
                  onChange={(e) => setSaveTemplateCategory(e.target.value as any)}
                  className="w-full text-xs p-2 bg-zinc-50 border border-zinc-200 rounded font-medium cursor-pointer"
                >
                  <option value="general">Standard Newsletter Draft</option>
                  <option value="reference">Brand Reference Profile (Aesthetic Blueprint)</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => handleSaveToLibrary('campaign')}
                className="w-full py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs rounded-lg transition-all cursor-pointer border border-zinc-300 shadow-xs"
              >
                💾 Save Layout Blueprint
              </button>

              {saveTemplateStatus && (
                <p className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-150 p-2.5 rounded text-center">
                  {saveTemplateStatus}
                </p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'welcome' && (
          <div className="space-y-6 max-w-7xl">
            <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-zinc-100">
                <div className="flex gap-2.5 items-center">
                  <Sparkles className="w-4.5 h-4.5 text-indigo-600 animate-pulse" />
                  <div>
                    <h3 className="font-bold text-sm text-zinc-900">Welcome Automation & AI Mimic Workspace</h3>
                    <p className="text-xs text-zinc-500 mt-0.5">Customize default onboarding content triggered when subscribers register.</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setShowTextToHtml(!showTextToHtml)}
                    className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 text-indigo-700 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                  >
                    <Sparkles className="w-3 h-3 text-indigo-600 animate-pulse" /> ✨ Convert Text to HTML with AI
                  </button>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-zinc-500 uppercase whitespace-nowrap">SITE CONTEXT:</span>
                    <select
                      value={welcomeSiteKey}
                      onChange={(e) => setWelcomeSiteKey(e.target.value)}
                      className="text-xs py-1.5 px-2.5 bg-zinc-50 border border-zinc-200 rounded-md text-zinc-850 font-bold cursor-pointer"
                    >
                      <option value="cyvisahelp">CY Visa Help</option>
                      <option value="cybarprep">CY Bar Prep</option>
                      <option value="cylawtech">CY Law Tech</option>
                    </select>
                  </div>
                </div>
              </div>

              {welcomeLoading ? (
                <div className="py-16 flex flex-col items-center justify-center gap-2.5 text-zinc-500 text-xs font-semibold">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                  <span>Loading brand assets...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Edit Column */}
                  <div className="space-y-4">
                    {/* Text-to-HTML AI Converter Panel */}
                    {showTextToHtml && (
                      <div className="p-4 bg-indigo-50/40 border border-indigo-100 rounded-lg space-y-3 animate-slide-down">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
                          <h4 className="font-bold text-xs text-indigo-900">Convert Plain Text → Branded Onboarding HTML</h4>
                        </div>
                        <p className="text-[11px] text-zinc-650 leading-relaxed">
                          Paste your raw onboarding or checklist copy. Gemini AI will wrap it inside the gorgeous layout styling that matches the selected brand property context.
                        </p>
                        
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-indigo-750 uppercase">Subject Line (Welcome Email)</label>
                          <input
                            type="text"
                            placeholder="e.g. Welcome to CyAzor! Your secure guide has arrived."
                            value={textToHtmlSubject}
                            onChange={(e) => setTextToHtmlSubject(e.target.value)}
                            className="w-full text-xs p-2 bg-white border border-indigo-100 rounded focus:outline-hidden"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-indigo-750 uppercase">Raw Text notes</label>
                          <textarea
                            rows={6}
                            placeholder="Onboarding intro. Link to files."
                            value={rawTextNotes}
                            onChange={(e) => setRawTextNotes(e.target.value)}
                            className="w-full text-xs p-2.5 bg-white border border-indigo-100 rounded focus:outline-hidden text-zinc-800"
                          />
                        </div>

                        <div className="flex justify-between items-center">
                          <button
                            type="button"
                            onClick={() => setShowTextToHtml(false)}
                            className="text-[10px] font-bold text-indigo-700 hover:underline cursor-pointer"
                          >
                            Dismiss
                          </button>
                          <button
                            type="button"
                            disabled={aiConvertingText}
                            onClick={() => handleTextToHtmlConversion('welcome')}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[11px] rounded-md flex items-center gap-1 cursor-pointer"
                          >
                            {aiConvertingText ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin" /> Structuring HTML...
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-3 h-3" /> Transform Text with AI
                              </>
                            )}
                          </button>
                        </div>
                        {aiTextError && <p className="text-[11px] text-rose-600 font-semibold">⚠️ {aiTextError}</p>}
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-zinc-500 uppercase">Automation Subject Line</label>
                      <input
                        type="text"
                        value={welcomeSubject}
                        onChange={(e) => setWelcomeSubject(e.target.value)}
                        className="w-full text-xs py-2.5 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 font-medium focus:outline-hidden"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-[11px] font-bold text-zinc-500 uppercase">HTML Layout Source Code</label>
                        <button
                          type="button"
                          onClick={() => setShowAiMimic(!showAiMimic)}
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 text-indigo-700 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                        >
                          <Sparkles className="w-3 h-3 text-indigo-600 animate-pulse" /> ✨ Gemini Layout Style Mimic
                        </button>
                      </div>

                      {/* Expandable Gemini AI Mimic Drawer */}
                      {showAiMimic && (
                        <div className="p-4 bg-indigo-50/40 border border-indigo-100 rounded-lg space-y-3.5 animate-slide-down">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-indigo-600" />
                            <h4 className="font-bold text-xs text-indigo-900">AI-Powered Layout Blueprint Mimic</h4>
                          </div>
                          <p className="text-[11px] text-zinc-650 leading-relaxed">
                            Paste any reference HTML (from templates, competitor emails, or websites). Gemini AI will capture the exact styles, background colors, and margins, and regenerate a beautiful, fully customized, responsive email matching the selected brand identity.
                          </p>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-indigo-750 uppercase">Reference HTML Source Code</label>
                            <textarea
                              rows={5}
                              value={referenceHtml}
                              onChange={(e) => setReferenceHtml(e.target.value)}
                              placeholder="Paste clean raw HTML code here..."
                              className="w-full text-[10px] p-2 bg-white border border-indigo-100 rounded font-mono text-zinc-800 focus:outline-hidden"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-indigo-750 uppercase">Aesthetic Tweaks & Directives (Optional)</label>
                            <input
                              type="text"
                              value={aiPrompt}
                              onChange={(e) => setAiPrompt(e.target.value)}
                              placeholder="e.g., Change accent colors to gold, add a footer signature block..."
                              className="w-full text-xs p-2 bg-white border border-indigo-100 rounded focus:outline-hidden"
                            />
                          </div>

                          <div className="flex justify-between items-center pt-1.5">
                            <button
                              type="button"
                              onClick={() => setShowAiMimic(false)}
                              className="text-[10px] font-bold text-indigo-700 hover:underline cursor-pointer"
                            >
                              Dismiss Drawer
                            </button>
                            <button
                              type="button"
                              disabled={aiGenerating}
                              onClick={handleAiMimicGeneration}
                              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[11px] rounded-md flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            >
                              {aiGenerating ? (
                                <>
                                  <Loader2 className="w-3 h-3 animate-spin" /> Analyzing Styles...
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-3 h-3" /> Recreate Template with AI
                                </>
                              )}
                            </button>
                          </div>

                          {aiError && (
                            <p className="text-[11px] text-rose-600 font-semibold bg-white p-2.5 rounded border border-rose-100">
                              ⚠️ {aiError}
                            </p>
                          )}
                        </div>
                      )}

                      <textarea
                        rows={13}
                        value={welcomeBody}
                        onChange={(e) => setWelcomeBody(e.target.value)}
                        className="w-full text-xs p-3 bg-zinc-900 text-indigo-300 font-mono rounded-lg border border-zinc-800 focus:outline-hidden"
                      />
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <span className="text-[11px] text-zinc-500">
                        Activation applies custom layouts across signup endpoints instantly.
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleSaveWelcomeTemplate()}
                          className="px-4 py-2 bg-zinc-900 hover:bg-zinc-850 text-white font-semibold text-xs rounded-lg cursor-pointer transition-all shadow-xs"
                        >
                          Activate Onboarding flow
                        </button>
                      </div>
                    </div>

                    {welcomeSaveStatus && (
                      <p className="text-xs font-bold text-indigo-700 bg-indigo-50/50 p-3 border border-indigo-150 rounded-lg animate-fade-in">
                        {welcomeSaveStatus}
                      </p>
                    )}
                  </div>

                  {/* Sandbox Preview Column */}
                  <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 flex flex-col space-y-3 min-h-[500px]">
                    <div className="flex justify-between items-center border-b border-zinc-250 pb-2">
                      <div className="flex items-center gap-1.5">
                        <Eye className="w-4 h-4 text-zinc-400" />
                        <h4 className="font-bold text-xs text-zinc-700">Responsive Email Sandbox Render</h4>
                      </div>

                      <div className="flex bg-zinc-200 p-0.5 rounded-lg text-[10px] font-bold">
                        <button
                          onClick={() => setPreviewTab('preview')}
                          className={`px-3 py-1 rounded-md cursor-pointer ${previewTab === 'preview' ? 'bg-white text-zinc-800 shadow-xs' : 'text-zinc-500'}`}
                        >
                          Layout Render
                        </button>
                        <button
                          onClick={() => setPreviewTab('code')}
                          className={`px-3 py-1 rounded-md cursor-pointer ${previewTab === 'code' ? 'bg-white text-zinc-800 shadow-xs' : 'text-zinc-500'}`}
                        >
                          Source HTML
                        </button>
                      </div>
                    </div>

                    {previewTab === 'preview' ? (
                      <div className="flex-1 bg-white border border-zinc-200 rounded-lg overflow-hidden relative flex flex-col min-h-[480px]">
                        <iframe
                          title="Interactive Render Sandbox Preview"
                          className="w-full flex-1 border-0"
                          srcDoc={welcomeBody
                            .replace(/{{name}}/g, 'Sarah Connor')
                            .replace(/{{email}}/g, 'sarah.connor@cyberdyne.io')
                            .replace(/{{website_name}}/g, siteConfigs.find(s => s.siteKey === welcomeSiteKey)?.brandName || 'CY Visa Help')
                          }
                        />
                      </div>
                    ) : (
                      <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg p-3 overflow-auto max-h-[500px] min-h-[480px]">
                        <pre className="text-[10px] text-indigo-300 font-mono whitespace-pre-wrap leading-relaxed">
                          {welcomeBody}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Saved Templates Library Tab Component UI */}
        {activeTab === 'library' && (
          <div className="space-y-6 max-w-7xl animate-fade-in">
            <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-zinc-150">
                <div className="flex gap-2.5 items-center">
                  <FolderOpen className="w-5 h-5 text-indigo-600" />
                  <div>
                    <h3 className="font-bold text-sm text-zinc-900">Branded Templates Library Repository</h3>
                    <p className="text-xs text-zinc-500 mt-0.5">Explore, manage, load, and test reusable email layouts and custom structures.</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-zinc-500 uppercase">FILTER BRAND:</span>
                  <select
                    value={librarySiteKey}
                    onChange={(e) => setLibrarySiteKey(e.target.value)}
                    className="text-xs py-1.5 px-3 bg-zinc-50 border border-zinc-200 rounded-md text-zinc-850 font-bold cursor-pointer focus:outline-hidden"
                  >
                    <option value="cyvisahelp">CY Visa Help</option>
                    <option value="cybarprep">CY Bar Prep</option>
                    <option value="cylawtech">CY Law Tech</option>
                  </select>
                </div>
              </div>

              {libraryLoading ? (
                <div className="py-16 text-center text-zinc-400 text-xs flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                  <span>Fetching library elements...</span>
                </div>
              ) : libraryTemplates.length === 0 ? (
                <div className="py-16 text-center text-zinc-400 space-y-3.5 max-w-md mx-auto">
                  <FileText className="w-10 h-10 text-zinc-300 mx-auto" />
                  <div>
                    <p className="font-bold text-zinc-700">Your Templates Library is Empty</p>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                      Save drafts directly from your Onboarding Workspace or Campaign Send panels to view reusable layout cards here.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {libraryTemplates.map((tpl) => (
                    <div key={tpl.id} className="border border-zinc-200 rounded-xl bg-zinc-50/30 overflow-hidden flex flex-col justify-between hover:shadow-md transition-all group">
                      <div className="p-4 space-y-2">
                        <div className="flex items-start justify-between">
                          <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded ${tpl.category === 'reference' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-zinc-100 text-zinc-700'}`}>
                            {tpl.category === 'reference' ? 'Aesthetic Profile' : 'Newsletter Sample'}
                          </span>
                          
                          <button
                            onClick={() => handleDeleteTemplateFromLibrary(tpl.id)}
                            className="p-1 hover:bg-rose-50 rounded text-zinc-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Delete template"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <h4 className="font-bold text-xs text-zinc-900 group-hover:text-indigo-600 transition-colors truncate">{tpl.name}</h4>
                        <p className="text-[11px] text-zinc-400 leading-relaxed line-clamp-2 h-8">{tpl.description || 'No description provided.'}</p>
                        <p className="text-[9px] text-zinc-400 font-mono">Saved: {new Date(tpl.created_at).toLocaleString()}</p>
                      </div>

                      {/* Side Actions Drawer */}
                      <div className="p-3 bg-zinc-50 border-t border-zinc-150 grid grid-cols-2 gap-2 text-center">
                        <button
                          onClick={() => {
                            setCampaignHtml(tpl.html_content);
                            setActiveTab('send');
                            alert('Template blueprint successfully loaded into the Campaign Editor!');
                          }}
                          className="py-1.5 bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-700 font-bold text-[10px] rounded transition-all cursor-pointer shadow-xs"
                        >
                          Load to Campaign
                        </button>
                        <button
                          onClick={() => {
                            setWelcomeBody(tpl.html_content);
                            setActiveTab('welcome');
                            alert('Template blueprint successfully loaded into the Welcome Automation Panel!');
                          }}
                          className="py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-[10px] rounded transition-all cursor-pointer shadow-xs"
                        >
                          Load to Onboarding
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="bg-white border border-zinc-200 rounded-xl shadow-xs overflow-hidden max-w-7xl animate-fade-in">
            <div className="p-5 border-b border-zinc-150 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h4 className="font-bold text-sm text-zinc-900">System Logs & Delivery History</h4>
                <p className="text-xs text-zinc-500 mt-1">Audit statuses of logs dispatched via Resend. Trigger simulated developer webhook feedback instantly.</p>
              </div>
              <button
                onClick={fetchData}
                disabled={isLoading}
                className="px-3.5 py-2 bg-zinc-550/15 hover:bg-zinc-100 border border-zinc-200 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer text-zinc-700"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Synchronize Records
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-150 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    <th className="py-3 px-5">To Recipient</th>
                    <th className="py-3 px-5">Subject Line</th>
                    <th className="py-3 px-5">Type</th>
                    <th className="py-3 px-5 text-center">Status</th>
                    <th className="py-3 px-5 text-right">Developer Webhook Simulators</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-xs font-medium text-zinc-700">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-zinc-400">
                        <History className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                        <p className="font-semibold text-zinc-500">No logs found</p>
                        <p className="text-[10px] text-zinc-400 mt-1">Sent newsletters and onboarding guide metrics will display here.</p>
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="py-3.5 px-5 font-bold text-zinc-900">{log.to}</td>
                        <td className="py-3.5 px-5 text-zinc-500 truncate max-w-xs">{log.subject}</td>
                        <td className="py-3.5 px-5">
                          <span className="px-2 py-0.5 bg-zinc-100 text-zinc-600 text-[10px] font-semibold uppercase tracking-wider rounded">
                            {log.type}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                            log.status === 'sent' || log.status === 'delivered'
                              ? 'bg-emerald-50 text-emerald-700'
                              : log.status === 'bounced'
                              ? 'bg-rose-50 text-rose-700 animate-pulse'
                              : 'bg-amber-50 text-amber-700'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            onClick={() => handleSimulateWebhook(log.to, 'delivered')}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold cursor-pointer transition-colors"
                          >
                            Delivered
                          </button>
                          <button
                            onClick={() => handleSimulateWebhook(log.to, 'bounced')}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded text-[10px] font-bold cursor-pointer transition-colors"
                          >
                            Bounce
                          </button>
                          <button
                            onClick={() => handleSimulateWebhook(log.to, 'complaint')}
                            className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded text-[10px] font-bold cursor-pointer transition-colors"
                          >
                            Complaint
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
