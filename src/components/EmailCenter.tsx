import React, { useState, useEffect } from 'react';
import { 
  Mail, Send, Loader2, Sparkles, Code, CheckCircle, 
  AlertCircle, Building2, Activity, History, PlayCircle, Eye, 
  RefreshCw, Save, Trash2, FolderOpen, FileText, BookOpen, Wand2, Type
} from 'lucide-react';
import { siteConfigs } from '../../server/emailConfig';

// Internal Splitted Refactored Modules
import { Subscriber, EmailLog, WelcomeTemplate, ActiveTab, SavedTemplate, SITE_DEFAULTS } from './EmailCenter/types';
import { EmailHealthTab } from './EmailCenter/EmailHealthTab';
import { TestEmailTab } from './EmailCenter/TestEmailTab';

// ===== BRAND STYLE TEMPLATES (LOCAL, INSTANT, NO AI) =====
const BRAND_STYLE_TEMPLATES: Record<string, (rawText: string, subject: string) => string> = {
  cybarprep: (rawText: string, subject: string) => {
    // Parse raw text into structured content sections
    const lines = rawText.trim().split('\n').map(l => l.trim()).filter(Boolean);
    let category = 'NEWSLETTER UPDATE';
    let headline = subject || 'Important Update';
    let intro = '';
    const bulletPoints: { emoji: string; title: string; body: string }[] = [];
    let tipTitle = '🔎 Key Takeaway';
    let tipBody = '';
    
    let currentSection: 'intro' | 'points' | 'tip' = 'intro';
    let introBuffer: string[] = [];
    let tipBuffer: string[] = [];
    const emojis = ['🇺🇸', '📅', '⚠️', '📝', '💡', '🎯', '⚖️', '🔒'];
    let emojiIdx = 0;

    for (const line of lines) {
      // Detect numbered list items (1. or 1) or -)
      const numberedMatch = line.match(/^(\d+)[\.\)]\s*(.+)$/);
      const bulletMatch = line.match(/^[-•*]\s*(.+)$/);
      const tipMatch = line.match(/^(tip|note|important|warning)[:\-]\s*(.+)$/i);

      if (tipMatch) {
        currentSection = 'tip';
        tipTitle = `🔎 ${tipMatch[1].charAt(0).toUpperCase() + tipMatch[1].slice(1)}`;
        tipBuffer.push(tipMatch[2]);
      } else if (numberedMatch || bulletMatch) {
        currentSection = 'points';
        const content = numberedMatch ? numberedMatch[2] : bulletMatch![1];
        // Split title and body by first colon or period
        const titleMatch = content.match(/^([^:.]+)[:.]?\s*(.*)$/);
        const pointTitle = titleMatch ? titleMatch[1].trim() : content;
        const pointBody = titleMatch && titleMatch[2] ? titleMatch[2].trim() : '';
        bulletPoints.push({
          emoji: emojis[emojiIdx % emojis.length],
          title: pointTitle,
          body: pointBody || 'Learn more about this important update.'
        });
        emojiIdx++;
      } else if (currentSection === 'intro') {
        introBuffer.push(line);
      } else if (currentSection === 'tip') {
        tipBuffer.push(line);
      } else {
        // Append to last point body if we're in points section
        if (bulletPoints.length > 0) {
          bulletPoints[bulletPoints.length - 1].body += ' ' + line;
        } else {
          introBuffer.push(line);
        }
      }
    }

    intro = introBuffer.join(' ') || `If you or a loved one is pursuing a U.S. immigration pathway, this update brings several developments worth paying attention to.`;
    tipBody = tipBuffer.join(' ') || 'Early legal review can help you understand what alternatives may be available before critical deadlines.';

    // If we have no points, create one from intro
    if (bulletPoints.length === 0 && intro) {
      bulletPoints.push({
        emoji: '📌',
        title: headline,
        body: intro
      });
      intro = 'Please review the important information below carefully.';
    }

    // Generate strategic updates HTML rows
    const strategicRows = bulletPoints.map((point, idx) => `
                <tr>
                  <td style="padding-bottom: 30px;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td valign="top" width="40" style="font-size: 24px; padding-top: 2px;">${point.emoji}</td>
                        <td align="left" style="padding-left: 10px;">
                          <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 700; color: #0f172a;">
                            ${idx + 1}. ${point.title}
                          </h3>
                          <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #475569;">
                            ${point.body}
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>`).join('');

    return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${headline}</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    table { border-collapse: collapse !important; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f8fafc; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }
    .btn-hover:hover { background-color: #9A7007 !important; }
    .btn-outline-hover:hover { background-color: #1e293b !important; }
    .link-hover:hover { text-decoration: underline !important; color: #9A7007 !important; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td bgcolor="#f8fafc" align="center" style="padding: 40px 10px 40px 10px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05);">
          
          <!-- BRAND HEADER -->
          <tr>
            <td bgcolor="#0f172a" align="center" style="padding: 35px 20px; border-bottom: 4px solid #B8860B;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <span style="font-size: 26px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                      CyAzor <span style="color: #B8860B;">LawTech Solutions</span>
                    </span>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 6px;">
                    <span style="font-size: 11px; font-weight: 600; letter-spacing: 2px; color: #94a3b8; text-transform: uppercase;">
                      Cross-Border Legal Conversations
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- HERO SECTION -->
          <tr>
            <td align="left" style="padding: 40px 40px 25px 40px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="left" style="padding-bottom: 8px;">
                    <span style="font-size: 12px; font-weight: 700; color: #B8860B; letter-spacing: 1.5px; text-transform: uppercase;">
                      ${category}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td align="left" style="padding-bottom: 15px;">
                    <h1 style="margin: 0; font-size: 24px; font-weight: 800; line-height: 1.3; color: #0f172a; letter-spacing: -0.5px; text-transform: uppercase;">
                      ${headline}
                    </h1>
                  </td>
                </tr>
                <tr>
                  <td align="left" style="border-bottom: 1px solid #e2e8f0; padding-bottom: 25px;">
                    <p style="margin: 0; font-size: 14px; color: #64748b; font-weight: 500;">
                      By <strong style="color: #0f172a;">Atty. Cynthia Azor</strong> &bull; US Immigration Lawyer
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- INTRO CARD -->
          <tr>
            <td align="left" style="padding: 0 40px 30px 40px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#f1f5f9" style="border-radius: 8px; border-left: 4px solid #B8860B;">
                <tr>
                  <td style="padding: 22px 25px;">
                    <p style="margin: 0 0 10px 0; font-size: 16px; font-weight: 700; color: #0f172a;">
                      Dear {{name}},
                    </p>
                    <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #334155; font-weight: 500;">
                      ${intro}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- STRATEGIC UPDATES -->
          <tr>
            <td align="left" style="padding: 0 40px 10px 40px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                ${strategicRows}
              </table>
            </td>
          </tr>

          <!-- TIP SECTION -->
          <tr>
            <td align="center" style="padding: 10px 40px 30px 40px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fffbeb; border-radius: 8px; border: 1px solid #fde68a;">
                <tr>
                  <td style="padding: 25px;">
                    <h3 style="margin: 0 0 10px 0; font-size: 16px; font-weight: 800; color: #92400e; text-transform: uppercase; letter-spacing: 1px;">
                      ${tipTitle}
                    </h3>
                    <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #92400e;">
                      ${tipBody}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CALL TO ACTION -->
          <tr>
            <td align="center" style="padding: 10px 40px 30px 40px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0f172a; border-radius: 8px; overflow: hidden; text-align: center;">
                <tr>
                  <td style="padding: 35px 25px;">
                    <h3 style="margin: 0 0 10px 0; font-size: 18px; font-weight: 700; color: #ffffff;">
                      Need Case-Specific Guidance?
                    </h3>
                    <p style="margin: 0 0 25px 0; font-size: 14px; line-height: 1.6; color: #94a3b8;">
                      Stay informed. Stay prepared. Know your options. 🇺🇸⚖️<br />
                      Book a legal consultation today to understand the best immigration pathway for you and your family.
                    </p>
                    <table border="0" cellpadding="0" cellspacing="0" align="center" width="100%">
                      <tr>
                        <td align="center">
                          <a href="http://www.cybarcoach.com" target="_blank" class="btn-outline-hover" style="display: inline-block; padding: 12px 24px; margin: 5px; font-size: 14px; font-weight: 700; color: #ffffff; text-decoration: none; border-radius: 6px; border: 1px solid #475569; transition: background-color 0.2s ease;">
                            Visit Our Website
                          </a>
                          <a href="https://calendly.com/cynobas/bar-prep-strategy-with-cynthia-azor" target="_blank" class="btn-hover" style="display: inline-block; padding: 12px 24px; margin: 5px; font-size: 14px; font-weight: 700; color: #ffffff; background-color: #B8860B; text-decoration: none; border-radius: 6px; border: 1px solid #B8860B; transition: background-color 0.2s ease;">
                            Book a Consultation
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- DISCLAIMER & SIGN-OFF -->
          <tr>
            <td align="left" style="padding: 0 40px 40px 40px; border-bottom: 1px solid #e2e8f0;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="left" style="padding-bottom: 20px;">
                    <p style="margin: 0; font-size: 13px; font-style: italic; color: #64748b; line-height: 1.6;">
                      <strong>Disclaimer:</strong> This newsletter is for general information and does not constitute legal advice. Individual immigration cases require case-specific legal assessment.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td align="left">
                    <p style="margin: 0 0 4px 0; font-size: 16px; font-weight: 800; color: #0f172a;">
                      Atty. Cynthia Azor
                    </p>
                    <p style="margin: 0 0 10px 0; font-size: 14px; font-weight: 600; color: #B8860B;">
                      US Immigration Lawyer
                    </p>
                    <p style="margin: 0 0 2px 0; font-size: 13px; font-weight: 700; color: #334155;">
                      CY AZOR LAW TECH SOLUTIONS
                    </p>
                    <p style="margin: 0; font-size: 12px; color: #64748b;">
                      Immigration &bull; Legal Education &bull; Global Mobility
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td align="center" bgcolor="#f8fafc" style="padding: 30px 20px 30px 20px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 500px; text-align: center;">
                <tr>
                  <td style="padding-bottom: 15px;">
                    <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.5;">
                      You are receiving this update from <a href="http://www.cybarcoach.com" target="_blank" class="link-hover" style="color: #0f172a; text-decoration: none; font-weight: 600;">CyAzor Law Tech Solutions</a>.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 15px;">
                    <p style="margin: 0; font-size: 12px; color: #94a3b8; line-height: 1.5;">
                      &copy; 2026 CyAzor Law Tech Solutions. All rights reserved.<br />
                      Cross-Border Legal Conversations.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td>
                    <table border="0" cellpadding="0" cellspacing="0" align="center">
                      <tr>
                        <td>
                          <a href="http://www.cybarcoach.com" target="_blank" class="link-hover" style="font-size: 12px; color: #B8860B; text-decoration: none; font-weight: 600; padding: 0 8px;">Website</a>
                        </td>
                        <td style="font-size: 12px; color: #cbd5e1;">&bull;</td>
                        <td>
                          <a href="https://calendly.com/cynobas/bar-prep-strategy-with-cynthia-azor" target="_blank" class="link-hover" style="font-size: 12px; color: #B8860B; text-decoration: none; font-weight: 600; padding: 0 8px;">Consultation</a>
                        </td>
                        <td style="font-size: 12px; color: #cbd5e1;">&bull;</td>
                        <td>
                          <a href="#" class="link-hover" style="font-size: 12px; color: #64748b; text-decoration: none; font-weight: 500; padding: 0 8px;">Unsubscribe</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }
};

// Helper function to auto-apply BrandStyle from a rawText input via matching brand siteKey key
function applyBrandStyle(siteKey: string, rawText: string, subject: string): string {
  const styler = BRAND_STYLE_TEMPLATES[siteKey] || BRAND_STYLE_TEMPLATES['cybarprep'];
  return styler(rawText, subject);
}

export default function EmailCenter() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('health');
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // --- Send Broadcast Campaign State ---
  const [campaignSiteKey, setCampaignSiteKey] = useState('cybarprep');
  const [campaignSubject, setCampaignSubject] = useState('');
  const [campaignRawText, setCampaignRawText] = useState('');
  const [campaignHtml, setCampaignHtml] = useState('<h1>Important Announcement</h1><p>Hi {{name}},</p><p>Check out our latest update!</p>');
  const [campaignSendMode, setCampaignSendMode] = useState<'plain' | 'html'>('plain');
  const [campaignTarget, setCampaignTarget] = useState<'all' | 'custom'>('all');
  const [campaignCustomEmails, setCampaignCustomEmails] = useState('');
  const [campaignStatus, setCampaignStatus] = useState<{ success?: boolean; msg?: string } | null>(null);
  const [showCampaignPreview, setShowCampaignPreview] = useState(false);

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

  // --- Text-to-HTML Conversion Panel State (AI-Based, for welcome tab) ---
  const [showTextToHtml, setShowTextToHtml] = useState(false);
  const [rawTextNotes, setRawTextNotes] = useState('');
  const [textToHtmlSubject, setTextToHtmlSubject] = useState('');
  const [aiConvertingText, setAiConvertingText] = useState(false);
  const [aiTextError, setAiTextError] = useState<string | null>(null);

  // --- Saved Template Library State ---
  const [libraryTemplates, setLibraryTemplates] = useState<SavedTemplate[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [librarySiteKey, setLibrarySiteKey] = useState('cyvisahelp');
  const [saveTemplateName, setSaveTemplateName] = useState('');
  const [saveTemplateDesc, setSaveTemplateDesc] = useState('');
  const [saveTemplateCategory, setSaveTemplateCategory] = useState<'general' | 'reference'>('general');
  const [saveTemplateStatus, setSaveTemplateStatus] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const logsRes = await fetch('/api/email-logs');
      if (logsRes.ok) setLogs(await logsRes.json());
      
      const subsRes = await fetch('/api/subscribers');
      if (subsRes.ok) setSubscribers(await subsRes.json());
    } catch (err) {
      console.error("Failed to fetch logs and subscribers:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLibraryTemplates = async (siteKey: string) => {
    setLibraryLoading(true);
    try {
      const res = await fetch(`/api/template-library/${siteKey}`);
      if (res.ok) setLibraryTemplates(await res.json());
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

  // ===== INSTANT LOCAL Text-to-HTML for Broadcast Campaign =====
  const handleApplyBrandStyle = () => {
    if (!campaignRawText.trim()) {
      alert('Please type your raw text content first.');
      return;
    }
    const styledHtml = applyBrandStyle(campaignSiteKey, campaignRawText, campaignSubject);
    setCampaignHtml(styledHtml);
    setCampaignSendMode('html');
    setShowCampaignPreview(true);
  };

  const handleSendCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setCampaignStatus(null);
    setIsLoading(true);

    let targetEmails: string[] = [];
    if (campaignTarget === 'custom') {
      targetEmails = campaignCustomEmails.split(',').map(s => s.trim()).filter(s => s.includes('@'));
      if (targetEmails.length === 0) {
        setCampaignStatus({ success: false, msg: 'Please provide at least one valid email address.' });
        setIsLoading(false);
        return;
      }
    }

    // Determine what to send: styled HTML or plain-wrapped text
    let messageToSend = '';
    if (campaignSendMode === 'html') {
      // If we have raw text AND html hasn't been generated yet, generate it now
      if (campaignRawText.trim() && !campaignHtml.includes('CyAzor')) {
        messageToSend = applyBrandStyle(campaignSiteKey, campaignRawText, campaignSubject);
      } else {
        messageToSend = campaignHtml;
      }
    } else {
      // Plain text: wrap in minimal HTML for email display
      const textContent = campaignRawText.trim() || 'No content provided.';
      messageToSend = `<html><body style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #333; padding: 20px;"><pre style="white-space: pre-wrap; font-family: inherit; margin: 0;">${textContent}</pre></body></html>`;
    }

    try {
      const res = await fetch('/api/send-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteKey: campaignSiteKey,
          subject: campaignSubject,
          message: messageToSend,
          sendTo: campaignTarget === 'all' ? 'all' : 'selected',
          emails: targetEmails
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCampaignStatus({ success: true, msg: `Broadcast completed to ${data.sent} recipient(s)!` });
        setCampaignSubject('');
        setCampaignRawText('');
        setCampaignCustomEmails('');
        fetchData();
      } else {
        setCampaignStatus({ success: false, msg: data.error || 'Server rejected the broadcast.' });
      }
    } catch (err: any) {
      setCampaignStatus({ success: false, msg: err.message });
    } finally {
      setIsLoading(false);
    }
  };

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
        body: JSON.stringify({ siteKey, rawText: rawTextNotes, subject })
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
        setAiTextError(data.error || 'Unable to parse text into email.');
      }
    } catch (err: any) {
      setAiTextError(`AI Text conversion failed: ${err.message}`);
    } finally {
      setAiConvertingText(false);
    }
  };

  const handleSaveToLibrary = async (editorType: 'welcome' | 'campaign') => {
    setSaveTemplateStatus(null);
    const siteKey = editorType === 'welcome' ? welcomeSiteKey : campaignSiteKey;
    const htmlContent = editorType === 'welcome' ? welcomeBody : campaignHtml;

    if (!saveTemplateName.trim()) {
      alert("Please provide a name for the saved template.");
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
        alert(data.error || 'Unable to save template.');
      }
    } catch (err: any) {
      alert(`Network failure: ${err.message}`);
    }
  };

  const handleDeleteTemplateFromLibrary = async (id: string) => {
    if (!confirm('Delete this template from your library?')) return;
    try {
      const res = await fetch(`/api/template-library/${id}`, { method: 'DELETE' });
      if (res.ok) fetchLibraryTemplates(librarySiteKey);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

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
        body: JSON.stringify({ siteKey: welcomeSiteKey, referenceHtml, prompt: aiPrompt })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setWelcomeBody(data.html);
        setReferenceHtml('');
        setAiPrompt('');
        setShowAiMimic(false);
      } else {
        setAiError(data.error || 'Failed to capture visual styles.');
      }
    } catch (err: any) {
      setAiError(`AI Mimic connection failed: ${err.message}`);
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSaveWelcomeTemplate = async () => {
    setWelcomeLoading(true);
    setWelcomeSaveStatus(null);
    try {
      const res = await fetch(`/api/welcome-template/${welcomeSiteKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: welcomeSubject, body: welcomeBody })
      });
      if (res.ok) {
        setWelcomeSaveStatus('Welcome automation layout updated and activated successfully!');
        setTimeout(() => setWelcomeSaveStatus(null), 4500);
      } else {
        const data = await res.json();
        setWelcomeSaveStatus(`Failed: ${data.error || 'Save rejected.'}`);
      }
    } catch (err: any) {
      setWelcomeSaveStatus(`Network failed: ${err.message}`);
    } finally {
      setWelcomeLoading(false);
    }
  };

  const handleSimulateWebhook = async (email: string, status: 'delivered' | 'bounced' | 'complaint') => {
    try {
      const res = await fetch('/api/test/simulate-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: email, status })
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error("Webhook simulation failed:", err);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-zinc-900 tracking-tight flex items-center gap-2">
          <Mail className="w-5 h-5 text-indigo-600" /> Multi-Brand Email Center
        </h2>
        <p className="text-xs text-zinc-500 mt-1">
          Monitor multi-tenant delivery metrics, construct visual responsive campaigns, and synthesize custom onboarding flows.
        </p>
      </div>

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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-500 uppercase">Brand Sender Profile</label>
                  <select
                    value={campaignSiteKey}
                    onChange={(e) => setCampaignSiteKey(e.target.value)}
                    className="w-full text-xs py-2.5 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 font-medium"
                  >
                    <option value="cyvisahelp">CY Visa Help</option>
                    <option value="cybarprep">CY Bar Prep</option>
                    <option value="cylawtech">CY Law Tech</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-500 uppercase">Target Audience</label>
                  <select
                    value={campaignTarget}
                    onChange={(e) => setCampaignTarget(e.target.value as any)}
                    className="w-full text-xs py-2.5 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 font-medium cursor-pointer"
                  >
                    <option value="all">Active brand property subscribers</option>
                    <option value="custom">Manual target list (custom addresses)</option>
                  </select>
                </div>
              </div>

              {campaignTarget === 'custom' && (
                <div className="space-y-1.5 animate-fade-in">
                  <label className="text-[11px] font-bold text-zinc-500 uppercase">Target Recipients</label>
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
                  placeholder="e.g., U.S. Immigration Update: What You Need to Know This Month"
                  value={campaignSubject}
                  onChange={(e) => setCampaignSubject(e.target.value)}
                  className="w-full text-xs py-2.5 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 font-medium"
                  required
                />
              </div>

              {/* ===== SEND MODE TOGGLE ===== */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-zinc-500 uppercase">Send Format Style</label>
                <div className="flex bg-zinc-100 p-1 rounded-lg border border-zinc-200">
                  <button
                    type="button"
                    onClick={() => setCampaignSendMode('plain')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      campaignSendMode === 'plain'
                        ? 'bg-white text-zinc-900 shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-700'
                    }`}
                  >
                    <Type className="w-3.5 h-3.5" /> Plain Text
                  </button>
                  <button
                    type="button"
                    onClick={() => setCampaignSendMode('html')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      campaignSendMode === 'html'
                        ? 'bg-white text-indigo-700 shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-700'
                    }`}
                  >
                    <Wand2 className="w-3.5 h-3.5" /> HTML Style (Branded)
                  </button>
                </div>
                <p className="text-[10px] text-zinc-500 leading-relaxed">
                  {campaignSendMode === 'plain' 
                    ? '📝 Plain text will be sent exactly as you typed it — no styling applied.'
                    : `✨ HTML Style will auto-convert your raw text into the beautiful ${campaignSiteKey === 'cybarprep' ? 'CyBarPrep' : campaignSiteKey.toUpperCase()} branded design (instantly, no AI needed).`
                  }
                </p>
              </div>

              {/* Raw Text Input Area */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-bold text-zinc-500 uppercase">
                    Raw Newsletter Content
                  </label>
                  <span className="text-[10px] text-zinc-400 font-medium">
                    Tip: Use numbered points (1. Something) & Tip: prefix for tips box
                  </span>
                </div>
                <textarea
                  rows={10}
                  value={campaignRawText}
                  onChange={(e) => setCampaignRawText(e.target.value)}
                  placeholder={`If you or a loved one is pursuing a U.S. immigration pathway, this update brings several developments worth paying attention to.

1. TPS Changes Are Happening: The U.S. government has announced that Temporary Protected Status for Ukraine is scheduled to terminate on October 19, 2026.

2. Visa Bulletin Dates Matter: The August 2026 Visa Bulletin provides the current priority-date cutoffs for family-sponsored and employment-based immigrant visas.

3. Don't Rely on Social Media Immigration Advice: Immigration rules can change quickly, and eligibility depends heavily on your individual circumstances.

Tip: If your current status has an expiration date, don't wait until the deadline to explore your options.`}
                  className="w-full text-xs p-3 bg-zinc-50 border border-zinc-200 focus:border-indigo-500 focus:bg-white rounded-lg text-zinc-800 font-medium leading-relaxed focus:outline-hidden transition-all"
                />
              </div>

              {/* HTML Preview Toggle (only for HTML mode) */}
              {campaignSendMode === 'html' && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <button
                      type="button"
                      onClick={handleApplyBrandStyle}
                      className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-xs"
                    >
                      <Wand2 className="w-3.5 h-3.5" /> Apply Brand Styling Now
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCampaignPreview(!showCampaignPreview)}
                      className="px-3 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" /> {showCampaignPreview ? 'Hide' : 'Show'} Preview
                    </button>
                  </div>

                  {showCampaignPreview && campaignHtml && (
                    <div className="border border-zinc-200 rounded-lg overflow-hidden bg-zinc-100 animate-fade-in">
                      <div className="bg-zinc-800 px-3 py-2 flex items-center gap-2">
                        <div className="flex gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                          <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        </div>
                        <span className="text-[10px] font-mono text-zinc-400">Email Preview - {siteConfigs.find(s => s.siteKey === campaignSiteKey)?.brandName}</span>
                      </div>
                      <iframe
                        title="Campaign Email Preview"
                        className="w-full border-0 bg-white"
                        style={{ height: '500px' }}
                        srcDoc={campaignHtml.replace(/{{name}}/g, 'Valued Subscriber')}
                      />
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !campaignRawText.trim()}
                className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-850 text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all active:scale-95 duration-100"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Discharging Broadcast...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" /> Dispatch as {campaignSendMode === 'html' ? 'Branded HTML' : 'Plain Text'}
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

            {/* Save Draft to Library Panel */}
            <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-2.5 border-b border-zinc-100">
                <Save className="w-4 h-4 text-indigo-600" />
                <h4 className="font-bold text-xs text-zinc-850 uppercase">Save to Library</h4>
              </div>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Save this styled HTML layout as a reusable template for future campaigns.
              </p>
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase">Template Name</label>
                <input
                  type="text"
                  placeholder="e.g. August Visa Bulletin Template"
                  value={saveTemplateName}
                  onChange={(e) => setSaveTemplateName(e.target.value)}
                  className="w-full text-xs p-2 bg-zinc-50 border border-zinc-200 rounded focus:outline-hidden focus:bg-white transition-all font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Monthly immigration update format"
                  value={saveTemplateDesc}
                  onChange={(e) => setSaveTemplateDesc(e.target.value)}
                  className="w-full text-xs p-2 bg-zinc-50 border border-zinc-200 rounded focus:outline-hidden focus:bg-white transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase">Category</label>
                <select
                  value={saveTemplateCategory}
                  onChange={(e) => setSaveTemplateCategory(e.target.value as any)}
                  className="w-full text-xs p-2 bg-zinc-50 border border-zinc-200 rounded font-medium cursor-pointer"
                >
                  <option value="general">Standard Newsletter Draft</option>
                  <option value="reference">Brand Reference Profile</option>
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
                    <Sparkles className="w-3 h-3 text-indigo-600 animate-pulse" /> ✨ AI Text to HTML
                  </button>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-zinc-500 uppercase whitespace-nowrap">SITE:</span>
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
                  <div className="space-y-4">
                    {showTextToHtml && (
                      <div className="p-4 bg-indigo-50/40 border border-indigo-100 rounded-lg space-y-3 animate-slide-down">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
                          <h4 className="font-bold text-xs text-indigo-900">Convert Text to Branded HTML (AI)</h4>
                        </div>
                        
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-indigo-750 uppercase">Subject Line</label>
                          <input
                            type="text"
                            placeholder="Subject..."
                            value={textToHtmlSubject}
                            onChange={(e) => setTextToHtmlSubject(e.target.value)}
                            className="w-full text-xs p-2 bg-white border border-indigo-100 rounded"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-indigo-750 uppercase">Raw Text</label>
                          <textarea
                            rows={6}
                            placeholder="Paste plain text notes..."
                            value={rawTextNotes}
                            onChange={(e) => setRawTextNotes(e.target.value)}
                            className="w-full text-xs p-2.5 bg-white border border-indigo-100 rounded text-zinc-800"
                          />
                        </div>

                        <div className="flex justify-between items-center">
                          <button type="button" onClick={() => setShowTextToHtml(false)} className="text-[10px] font-bold text-indigo-700 hover:underline cursor-pointer">
                            Dismiss
                          </button>
                          <button
                            type="button"
                            disabled={aiConvertingText}
                            onClick={() => handleTextToHtmlConversion('welcome')}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[11px] rounded-md flex items-center gap-1 cursor-pointer"
                          >
                            {aiConvertingText ? (<><Loader2 className="w-3 h-3 animate-spin" /> Processing...</>) : (<><Sparkles className="w-3 h-3" /> Transform with AI</>)}
                          </button>
                        </div>
                        {aiTextError && <p className="text-[11px] text-rose-600 font-semibold">⚠️ {aiTextError}</p>}
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-zinc-500 uppercase">Subject Line</label>
                      <input
                        type="text"
                        value={welcomeSubject}
                        onChange={(e) => setWelcomeSubject(e.target.value)}
                        className="w-full text-xs py-2.5 px-3 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 font-medium"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-[11px] font-bold text-zinc-500 uppercase">HTML Source</label>
                        <button
                          type="button"
                          onClick={() => setShowAiMimic(!showAiMimic)}
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 text-indigo-700 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                        >
                          <Sparkles className="w-3 h-3 text-indigo-600 animate-pulse" /> ✨ Gemini Layout Mimic
                        </button>
                      </div>

                      {showAiMimic && (
                        <div className="p-4 bg-indigo-50/40 border border-indigo-100 rounded-lg space-y-3.5 animate-slide-down">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-indigo-600" />
                            <h4 className="font-bold text-xs text-indigo-900">AI Layout Blueprint Mimic</h4>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-indigo-750 uppercase">Reference HTML</label>
                            <textarea
                              rows={5}
                              value={referenceHtml}
                              onChange={(e) => setReferenceHtml(e.target.value)}
                              placeholder="Paste HTML..."
                              className="w-full text-[10px] p-2 bg-white border border-indigo-100 rounded font-mono text-zinc-800"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-indigo-750 uppercase">Directives</label>
                            <input
                              type="text"
                              value={aiPrompt}
                              onChange={(e) => setAiPrompt(e.target.value)}
                              placeholder="Optional tweaks..."
                              className="w-full text-xs p-2 bg-white border border-indigo-100 rounded"
                            />
                          </div>
                          <div className="flex justify-between items-center pt-1.5">
                            <button type="button" onClick={() => setShowAiMimic(false)} className="text-[10px] font-bold text-indigo-700 hover:underline cursor-pointer">
                              Dismiss
                            </button>
                            <button
                              type="button"
                              disabled={aiGenerating}
                              onClick={handleAiMimicGeneration}
                              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[11px] rounded-md flex items-center gap-1 cursor-pointer"
                            >
                              {aiGenerating ? (<><Loader2 className="w-3 h-3 animate-spin" /> Analyzing...</>) : (<><Sparkles className="w-3 h-3" /> Recreate</>)}
                            </button>
                          </div>
                          {aiError && <p className="text-[11px] text-rose-600 font-semibold bg-white p-2.5 rounded border border-rose-100">⚠️ {aiError}</p>}
                        </div>
                      )}

                      <textarea
                        rows={13}
                        value={welcomeBody}
                        onChange={(e) => setWelcomeBody(e.target.value)}
                        className="w-full text-xs p-3 bg-zinc-900 text-indigo-300 font-mono rounded-lg border border-zinc-800"
                      />
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <span className="text-[11px] text-zinc-500">Activation applies instantly.</span>
                      <button
                        type="button"
                        onClick={handleSaveWelcomeTemplate}
                        className="px-4 py-2 bg-zinc-900 hover:bg-zinc-850 text-white font-semibold text-xs rounded-lg cursor-pointer transition-all shadow-xs"
                      >
                        Activate Onboarding Flow
                      </button>
                    </div>

                    {welcomeSaveStatus && (
                      <p className="text-xs font-bold text-indigo-700 bg-indigo-50/50 p-3 border border-indigo-150 rounded-lg animate-fade-in">
                        {welcomeSaveStatus}
                      </p>
                    )}
                  </div>

                  <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 flex flex-col space-y-3 min-h-[500px]">
                    <div className="flex justify-between items-center border-b border-zinc-250 pb-2">
                      <div className="flex items-center gap-1.5">
                        <Eye className="w-4 h-4 text-zinc-400" />
                        <h4 className="font-bold text-xs text-zinc-700">Email Preview</h4>
                      </div>
                      <div className="flex bg-zinc-200 p-0.5 rounded-lg text-[10px] font-bold">
                        <button onClick={() => setPreviewTab('preview')} className={`px-3 py-1 rounded-md cursor-pointer ${previewTab === 'preview' ? 'bg-white text-zinc-800 shadow-xs' : 'text-zinc-500'}`}>
                          Render
                        </button>
                        <button onClick={() => setPreviewTab('code')} className={`px-3 py-1 rounded-md cursor-pointer ${previewTab === 'code' ? 'bg-white text-zinc-800 shadow-xs' : 'text-zinc-500'}`}>
                          Source
                        </button>
                      </div>
                    </div>

                    {previewTab === 'preview' ? (
                      <div className="flex-1 bg-white border border-zinc-200 rounded-lg overflow-hidden relative flex flex-col min-h-[480px]">
                        <iframe
                          title="Preview"
                          className="w-full flex-1 border-0"
                          srcDoc={welcomeBody
                            .replace(/{{name}}/g, 'Sarah Connor')
                            .replace(/{{email}}/g, 'sarah@example.com')
                            .replace(/{{website_name}}/g, siteConfigs.find(s => s.siteKey === welcomeSiteKey)?.brandName || 'Brand')
                          }
                        />
                      </div>
                    ) : (
                      <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg p-3 overflow-auto max-h-[500px] min-h-[480px]">
                        <pre className="text-[10px] text-indigo-300 font-mono whitespace-pre-wrap leading-relaxed">{welcomeBody}</pre>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'library' && (
          <div className="space-y-6 max-w-7xl animate-fade-in">
            <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-zinc-150">
                <div className="flex gap-2.5 items-center">
                  <FolderOpen className="w-5 h-5 text-indigo-600" />
                  <div>
                    <h3 className="font-bold text-sm text-zinc-900">Branded Templates Library</h3>
                    <p className="text-xs text-zinc-500 mt-0.5">Explore, load, and manage reusable email layouts.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-zinc-500 uppercase">FILTER:</span>
                  <select
                    value={librarySiteKey}
                    onChange={(e) => setLibrarySiteKey(e.target.value)}
                    className="text-xs py-1.5 px-3 bg-zinc-50 border border-zinc-200 rounded-md text-zinc-850 font-bold cursor-pointer"
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
                  <span>Loading library...</span>
                </div>
              ) : libraryTemplates.length === 0 ? (
                <div className="py-16 text-center text-zinc-400 space-y-3.5 max-w-md mx-auto">
                  <FileText className="w-10 h-10 text-zinc-300 mx-auto" />
                  <div>
                    <p className="font-bold text-zinc-700">Library is Empty</p>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">Save drafts from Campaign panel to view them here.</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {libraryTemplates.map((tpl) => (
                    <div key={tpl.id} className="border border-zinc-200 rounded-xl bg-zinc-50/30 overflow-hidden flex flex-col justify-between hover:shadow-md transition-all group">
                      <div className="p-4 space-y-2">
                        <div className="flex items-start justify-between">
                          <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded ${tpl.category === 'reference' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-zinc-100 text-zinc-700'}`}>
                            {tpl.category === 'reference' ? 'Reference' : 'Newsletter'}
                          </span>
                          <button onClick={() => handleDeleteTemplateFromLibrary(tpl.id)} className="p-1 hover:bg-rose-50 rounded text-zinc-400 hover:text-rose-600 cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <h4 className="font-bold text-xs text-zinc-900 group-hover:text-indigo-600 transition-colors truncate">{tpl.name}</h4>
                        <p className="text-[11px] text-zinc-400 leading-relaxed line-clamp-2 h-8">{tpl.description || 'No description.'}</p>
                        <p className="text-[9px] text-zinc-400 font-mono">Saved: {new Date(tpl.created_at).toLocaleString()}</p>
                      </div>
                      <div className="p-3 bg-zinc-50 border-t border-zinc-150 grid grid-cols-2 gap-2 text-center">
                        <button
                          onClick={() => {
                            setCampaignHtml(tpl.html_content);
                            setCampaignSendMode('html');
                            setActiveTab('send');
                          }}
                          className="py-1.5 bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-700 font-bold text-[10px] rounded cursor-pointer shadow-xs"
                        >
                          Load to Campaign
                        </button>
                        <button
                          onClick={() => {
                            setWelcomeBody(tpl.html_content);
                            setActiveTab('welcome');
                          }}
                          className="py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-[10px] rounded cursor-pointer shadow-xs"
                        >
                          Load to Welcome
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
                <p className="text-xs text-zinc-500 mt-1">Audit statuses and simulate webhook feedback.</p>
              </div>
              <button
                onClick={fetchData}
                disabled={isLoading}
                className="px-3.5 py-2 bg-zinc-550/15 hover:bg-zinc-100 border border-zinc-200 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer text-zinc-700"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-150 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    <th className="py-3 px-5">Recipient</th>
                    <th className="py-3 px-5">Subject</th>
                    <th className="py-3 px-5">Type</th>
                    <th className="py-3 px-5 text-center">Status</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-xs font-medium text-zinc-700">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-zinc-400">
                        <History className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                        <p className="font-semibold text-zinc-500">No logs found</p>
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="py-3.5 px-5 font-bold text-zinc-900">{log.to}</td>
                        <td className="py-3.5 px-5 text-zinc-500 truncate max-w-xs">{log.subject}</td>
                        <td className="py-3.5 px-5">
                          <span className="px-2 py-0.5 bg-zinc-100 text-zinc-600 text-[10px] font-semibold uppercase tracking-wider rounded">{log.type}</span>
                        </td>
                        <td className="py-3.5 px-5 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                            log.status === 'sent' || log.status === 'delivered' ? 'bg-emerald-50 text-emerald-700' :
                            log.status === 'bounced' ? 'bg-rose-50 text-rose-700 animate-pulse' :
                            'bg-amber-50 text-amber-700'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-right space-x-1.5 whitespace-nowrap">
                          <button onClick={() => handleSimulateWebhook(log.to, 'delivered')} className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold cursor-pointer">Delivered</button>
                          <button onClick={() => handleSimulateWebhook(log.to, 'bounced')} className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded text-[10px] font-bold cursor-pointer">Bounce</button>
                          <button onClick={() => handleSimulateWebhook(log.to, 'complaint')} className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded text-[10px] font-bold cursor-pointer">Complaint</button>
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
