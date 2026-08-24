import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { getResend, retryOperation } from "./server/resend.js";
import { supabaseAdmin } from "./server/supabase.js";
import { checkDomains } from "./server/dns.js";
import { sendEmail } from "./server/emailService.js";
import { siteConfigs } from "./server/emailConfig.js";
import { logEmail } from "./server/logger.js";
import dotenv from "dotenv";
import cors from "cors";
import rateLimit from "express-rate-limit";

dotenv.config();

function logEnvironmentDiagnostic() {
    console.log("--- Environment Diagnostic ---");
    console.log(`Node Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Supabase URL: ${process.env.VITE_SUPABASE_URL ? 'Detected' : 'Missing'}`);
    console.log(`Supabase Service Key: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Detected' : 'Missing'}`);
    console.log(`Resend API Key: ${process.env.RESEND_API_KEY ? 'Detected' : 'Missing'}`);
    console.log(`Gemini API Key: ${process.env.GEMINI_API_KEY ? 'Detected' : 'Missing'}`);
    console.log("------------------------------");
}

const debugLogs: { timestamp: string, message: string, type: string }[] = [];

function addDebugLog(type: string, message: string) {
    debugLogs.push({ timestamp: new Date().toISOString(), type, message });
    console.log(`[DEBUG/${type}] ${message}`);
}

// CyBarPrep signature template - the reference DNA for AI generations
const CYBARPREP_REFERENCE_TEMPLATE = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{{subject}}</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    table { border-collapse: collapse !important; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f8fafc; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; }
    .btn-hover:hover { background-color: #9A7007 !important; }
    .btn-outline-hover:hover { background-color: #1e293b !important; }
    .link-hover:hover { text-decoration: underline !important; color: #9A7007 !important; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td bgcolor="#f8fafc" align="center" style="padding: 40px 10px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05);">
          <tr>
            <td bgcolor="#0f172a" align="center" style="padding: 35px 20px; border-bottom: 4px solid #B8860B;">
              <span style="font-size: 26px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff;">CyAzor <span style="color: #B8860B;">LawTech Solutions</span></span>
              <div style="padding-top: 6px;"><span style="font-size: 11px; font-weight: 600; letter-spacing: 2px; color: #94a3b8; text-transform: uppercase;">Cross-Border Legal Conversations</span></div>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 40px 25px 40px;">
              <span style="font-size: 12px; font-weight: 700; color: #B8860B; letter-spacing: 1.5px; text-transform: uppercase;">{{category}}</span>
              <h1 style="margin: 15px 0; font-size: 24px; font-weight: 800; line-height: 1.3; color: #0f172a; letter-spacing: -0.5px; text-transform: uppercase;">{{headline}}</h1>
              <p style="margin: 0; font-size: 14px; color: #64748b; font-weight: 500; border-bottom: 1px solid #e2e8f0; padding-bottom: 25px;">By <strong style="color: #0f172a;">Atty. Cynthia Azor</strong> &bull; US Immigration Lawyer</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 30px 40px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#f1f5f9" style="border-radius: 8px; border-left: 4px solid #B8860B;">
                <tr><td style="padding: 22px 25px;">
                  <p style="margin: 0 0 10px 0; font-size: 16px; font-weight: 700; color: #0f172a;">Dear {{name}},</p>
                  <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #334155; font-weight: 500;">{{intro}}</p>
                </td></tr>
              </table>
            </td>
          </tr>
          <tr><td style="padding: 0 40px 30px 40px;">{{content_blocks}}</td></tr>
          <tr>
            <td align="center" style="padding: 10px 40px 30px 40px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0f172a; border-radius: 8px; overflow: hidden;">
                <tr><td style="padding: 35px 25px; text-align: center;">
                  <h3 style="margin: 0 0 10px 0; font-size: 18px; font-weight: 700; color: #ffffff;">Need Case-Specific Guidance?</h3>
                  <p style="margin: 0 0 25px 0; font-size: 14px; line-height: 1.6; color: #94a3b8;">Stay informed. Stay prepared. Know your options. 🇺🇸⚖️<br />Book a legal consultation today.</p>
                  <a href="http://www.cybarcoach.com" target="_blank" class="btn-outline-hover" style="display: inline-block; padding: 12px 24px; margin: 5px; font-size: 14px; font-weight: 700; color: #ffffff; text-decoration: none; border-radius: 6px; border: 1px solid #475569;">Visit Our Website</a>
                  <a href="https://calendly.com/cynobas/bar-prep-strategy-with-cynthia-azor" target="_blank" class="btn-hover" style="display: inline-block; padding: 12px 24px; margin: 5px; font-size: 14px; font-weight: 700; color: #ffffff; background-color: #B8860B; text-decoration: none; border-radius: 6px; border: 1px solid #B8860B;">Book a Consultation</a>
                </td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 40px 40px; border-bottom: 1px solid #e2e8f0;">
              <p style="margin: 0 0 20px 0; font-size: 13px; font-style: italic; color: #64748b; line-height: 1.6;"><strong>Disclaimer:</strong> This newsletter is for general information and does not constitute legal advice.</p>
              <p style="margin: 0 0 4px 0; font-size: 16px; font-weight: 800; color: #0f172a;">Atty. Cynthia Azor</p>
              <p style="margin: 0 0 10px 0; font-size: 14px; font-weight: 600; color: #B8860B;">US Immigration Lawyer</p>
              <p style="margin: 0 0 2px 0; font-size: 13px; font-weight: 700; color: #334155;">CY AZOR LAW TECH SOLUTIONS</p>
              <p style="margin: 0; font-size: 12px; color: #64748b;">Immigration &bull; Legal Education &bull; Global Mobility</p>
            </td>
          </tr>
          <tr>
            <td align="center" bgcolor="#f8fafc" style="padding: 30px 20px;">
              <p style="margin: 0 0 15px 0; font-size: 12px; color: #64748b;">You are receiving this update from <a href="http://www.cybarcoach.com" class="link-hover" style="color: #0f172a; text-decoration: none; font-weight: 600;">CyAzor Law Tech Solutions</a>.</p>
              <p style="margin: 0 0 15px 0; font-size: 12px; color: #94a3b8;">&copy; 2026 CyAzor Law Tech Solutions. All rights reserved.</p>
              <a href="http://www.cybarcoach.com" class="link-hover" style="font-size: 12px; color: #B8860B; text-decoration: none; font-weight: 600; padding: 0 8px;">Website</a>
              <span style="color: #cbd5e1;">&bull;</span>
              <a href="https://calendly.com/cynobas/bar-prep-strategy-with-cynthia-azor" class="link-hover" style="font-size: 12px; color: #B8860B; text-decoration: none; font-weight: 600; padding: 0 8px;">Consultation</a>
              <span style="color: #cbd5e1;">&bull;</span>
              <a href="#" class="link-hover" style="font-size: 12px; color: #64748b; text-decoration: none; font-weight: 500; padding: 0 8px;">Unsubscribe</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

// Background job scheduler: Check pending domains every 15 minutes
setInterval(async () => {
    const { data: pendingDomains } = await supabaseAdmin
        .from('domains')
        .select('*')
        .eq('status', 'pending');
        
    for (const dom of pendingDomains || []) {
        const results = await checkDomains(dom.domain_name);
        if (results.overall) {
            await supabaseAdmin.from('domains').update({ 
                status: 'verified',
                spf_checked: true,
                dkim_checked: true,
                dmarc_checked: true
            }).eq('id', dom.id);
        }
    }
}, 15 * 60 * 1000);

async function seedTenantsIfEmpty() {
  try {
    const { count, error } = await supabaseAdmin.from('tenants').select('*', { count: 'exact', head: true });
    if (error) {
      console.error("Failed to check tenants table:", error.message);
      return;
    }
    if (count === 0) {
      console.log("Seeding tenants from local siteConfigs...");
      const dbTenants = siteConfigs.map(s => ({
        site_key: s.siteKey,
        brand_name: s.brandName,
        sender_name: s.senderName,
        primary_color: s.primaryColor,
        logo_url: s.logo
      }));
      const { error: insertError } = await supabaseAdmin.from('tenants').insert(dbTenants);
      if (insertError) console.error("Failed to seed tenants:", insertError.message);
      else console.log("Tenants seeded successfully.");
    }
  } catch (e: any) {
    console.error("Error during tenant seeding:", e.message);
  }
}

async function startServer() {
  logEnvironmentDiagnostic();
  await seedTenantsIfEmpty();
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  const PORT = 3000;

  // ===== NEW: Text-to-HTML AI Converter =====
  app.post("/api/generate-html-from-text", async (req: any, res: any) => {
      const { siteKey, rawText, subject } = req.body;
      if (!rawText) return res.status(400).json({ error: "Raw text content is required." });

      const config = siteConfigs.find(s => s.siteKey === siteKey);
      if (!config) return res.status(400).json({ error: `Invalid brand site key: ${siteKey}` });

      const geminiKey = process.env.GEMINI_API_KEY;
      if (!geminiKey || geminiKey === "MY_GEMINI_API_KEY") {
          return res.status(500).json({ error: "Gemini AI API key is not configured." });
      }

      // Fetch saved reference template from library, or use built-in default
      let referenceTemplate = '';
      try {
          const { data: tenant } = await supabaseAdmin.from('tenants').select('id').eq('site_key', siteKey).single();
          if (tenant) {
              const { data: savedTemplate } = await supabaseAdmin
                  .from('template_library')
                  .select('html_content')
                  .eq('tenant_id', tenant.id)
                  .eq('category', 'reference')
                  .order('created_at', { ascending: false })
                  .limit(1)
                  .maybeSingle();
              if (savedTemplate) referenceTemplate = savedTemplate.html_content;
          }
      } catch (e) { /* fallback to built-in */ }

      // Use built-in defaults if no saved template found
      if (!referenceTemplate) {
          if (siteKey === 'cybarprep' || siteKey === 'cyvisahelp') {
              referenceTemplate = CYBARPREP_REFERENCE_TEMPLATE;
          }
      }

      const targetUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;

      const systemPrompt = `
You are an expert email HTML designer for the "${config.brandName}" brand. Convert the raw text below into a beautifully designed responsive HTML email that PRECISELY mimics the visual style, colors, fonts, spacing, and layout patterns of the provided reference template.

===== REFERENCE TEMPLATE (Copy this exact aesthetic) =====
${referenceTemplate}
===== END REFERENCE =====

===== RAW TEXT TO CONVERT =====
Subject: ${subject || 'Newsletter Update'}

${rawText}
===== END RAW TEXT =====

Brand Configuration:
- Brand Name: ${config.brandName}
- Site Key: ${siteKey}
- Primary Color: ${config.primaryColor}
- Website: ${config.website}
- Logo: ${config.logo}

CRITICAL REQUIREMENTS:
1. Return ONLY a complete, self-contained HTML document starting with <!DOCTYPE html> — NO markdown code fences.
2. MIRROR the exact color palette, typography, borders, header style, footer layout, and card patterns from the reference template.
3. Intelligently structure the raw text into logical sections (intro card, numbered points with emojis, tips, CTAs, sign-off) matching the reference layout.
4. Include these placeholder variables directly in text: {{name}}, {{email}}, {{website_name}}
5. Preserve all visual signatures: brand header with gold accent, dark navy footer, gold buttons, italic disclaimers, section cards with left border accents.
6. Add appropriate emojis to section headings (🇺🇸 📅 ⚠️ 🔎 etc.) if the raw text has numbered points or key ideas.
7. Keep the layout mobile-responsive with max-width 600px table structure.
8. Match the "Cross-Border Legal Conversations" tone: professional, authoritative, empathetic.
`;

      try {
          addDebugLog('INFO', `Text→HTML conversion requested for ${siteKey}`);
          const response = await fetch(targetUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                  contents: [{ parts: [{ text: systemPrompt }] }],
                  generationConfig: { temperature: 0.2, maxOutputTokens: 8192 }
              })
          });

          if (!response.ok) {
              const errBody = await response.text();
              throw new Error(`Gemini API Error ${response.status}: ${errBody}`);
          }

          const data: any = await response.json();
          let html = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
          html = html.replace(/^```html\s*/i, "").replace(/^```\s*/, "").replace(/```$/, "").trim();

          addDebugLog('INFO', `Text→HTML successfully generated for ${siteKey}`);
          res.json({ success: true, html });
      } catch (err: any) {
          addDebugLog('ERROR', `Text→HTML failed: ${err.message}`);
          res.status(500).json({ error: err.message });
      }
  });

  // ===== NEW: Template Library CRUD =====
  app.get("/api/template-library/:siteKey", async (req: any, res: any) => {
      const { siteKey } = req.params;
      try {
          const { data: tenant } = await supabaseAdmin.from('tenants').select('id').eq('site_key', siteKey).single();
          if (!tenant) return res.json([]);
          
          const { data, error } = await supabaseAdmin
              .from('template_library')
              .select('*')
              .eq('tenant_id', tenant.id)
              .order('created_at', { ascending: false });
              
          if (error) throw error;
          res.json(data || []);
      } catch (err: any) {
          res.status(500).json({ error: err.message });
      }
  });

  app.post("/api/template-library/:siteKey", async (req: any, res: any) => {
      const { siteKey } = req.params;
      const { name, description, html_content, category } = req.body;
      
      if (!name || !html_content) {
          return res.status(400).json({ error: "Name and HTML content are required." });
      }

      try {
          let { data: tenant } = await supabaseAdmin.from('tenants').select('id').eq('site_key', siteKey).single();
          if (!tenant) {
              const config = siteConfigs.find(s => s.siteKey === siteKey);
              if (config) {
                  const { data: newTenant } = await supabaseAdmin.from('tenants').insert({
                      site_key: config.siteKey,
                      brand_name: config.brandName,
                      sender_name: config.senderName,
                      primary_color: config.primaryColor,
                      logo_url: config.logo
                  }).select().single();
                  tenant = newTenant;
              }
          }
          
          if (!tenant) return res.status(404).json({ error: "Tenant not found" });

          const { data, error } = await supabaseAdmin
              .from('template_library')
              .insert({
                  tenant_id: tenant.id,
                  name,
                  description: description || '',
                  html_content,
                  category: category || 'general'
              })
              .select()
              .single();

          if (error) throw error;
          addDebugLog('INFO', `Template "${name}" saved to library for ${siteKey}`);
          res.json({ success: true, template: data });
      } catch (err: any) {
          res.status(500).json({ error: err.message });
      }
  });

  app.delete("/api/template-library/:id", async (req: any, res: any) => {
      const { id } = req.params;
      try {
          const { error } = await supabaseAdmin.from('template_library').delete().eq('id', id);
          if (error) throw error;
          res.json({ success: true });
      } catch (err: any) {
          res.status(500).json({ error: err.message });
      }
  });

  // ===== EXISTING: Gemini Mimic Endpoint =====
  app.post("/api/generate-template-mimic", async (req: any, res: any) => {
      const { siteKey, referenceHtml, prompt: userPrompt } = req.body;
      if (!referenceHtml) return res.status(400).json({ error: "Reference HTML is required." });

      const config = siteConfigs.find(s => s.siteKey === siteKey);
      if (!config) return res.status(400).json({ error: `Invalid site key: ${siteKey}` });

      const geminiKey = process.env.GEMINI_API_KEY;
      if (!geminiKey || geminiKey === "MY_GEMINI_API_KEY") {
          return res.status(500).json({ error: "Gemini AI API key is not configured." });
      }

      const targetUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;
      const systemPrompt = `You are an expert HTML Email Designer. Mimic the reference HTML below for brand "${config.brandName}".

Reference:
${referenceHtml}

Brand: ${config.brandName} | Color: ${config.primaryColor} | Logo: ${config.logo} | URL: ${config.website}

User directives: ${userPrompt || "Recreate cleanly as responsive newsletter."}

Requirements:
1. Complete HTML doc starting <!DOCTYPE html>, no markdown fences.
2. Inline styles in <style> tag. Responsive.
3. Include {{name}}, {{email}}, {{website_name}} placeholders.
4. Match brand niche (cybarprep=immigration, cyvisahelp=visa, cylawtech=legaltech).`;

      try {
          const response = await fetch(targetUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                  contents: [{ parts: [{ text: systemPrompt }] }],
                  generationConfig: { temperature: 0.15, maxOutputTokens: 8192 }
              })
          });
          if (!response.ok) throw new Error(`Gemini ${response.status}: ${await response.text()}`);
          const data: any = await response.json();
          let html = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
          html = html.replace(/^```html\s*/i, "").replace(/^```\s*/, "").replace(/```$/, "").trim();
          res.json({ success: true, html });
      } catch (err: any) {
          res.status(500).json({ error: err.message });
      }
  });

  // GET /api/domain/verify/:domain
  app.get("/api/domain/verify/:domain", async (req: any, res: any) => {
      const results = await checkDomains(req.params.domain);
      res.json(results);
  });

  app.post("/api/test-email", async (req: any, res: any) => {
      const { email } = req.body;
      if (!email) return res.status(400).json({ success: false, error: 'Email required' });
      try {
          await getResend().emails.send({
              from: 'noreply@xtopflow.com',
              to: email,
              subject: 'XTOPFlow Backend Test Email',
              html: '<p>Test email working.</p>'
          });
          await logEmail(email, 'Test Email', 'Test body', 'test', 'sent');
          return res.json({ success: true });
      } catch (error: any) {
          return res.status(500).json({ success: false, error: error.message });
      }
  });

  const emailLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { error: 'Too many requests' } });

  app.post("/api/send-email", emailLimiter, async (req: any, res: any) => {
      const { to, subject, message } = req.body;
      if (!to || !subject || !message) return res.status(400).json({ success: false, error: 'Missing fields' });
      if (!to.includes('@')) return res.status(400).json({ success: false, error: 'Invalid email' });
      
      const senderName = process.env.SENDER_NAME || 'CylawTech';
      const senderEmail = process.env.SENDER_EMAIL || 'hello@cylawtech.com';
      const replyTo = process.env.REPLY_TO_EMAIL || 'support@cylawtech.com';
      const fromAddress = `"${senderName}" <${senderEmail}>`;

      try {
          try {
              await retryOperation(() => getResend().emails.send({
                  from: fromAddress, to, subject, html: message, replyTo,
                  headers: { 'List-Unsubscribe': `<https://cylawtech.com/unsubscribe?email=${encodeURIComponent(to)}>` }
              }));
          } catch (resendErr: any) {
              await retryOperation(() => getResend().emails.send({
                  from: 'onboarding@resend.dev', to, subject, html: message, replyTo
              }));
          }
          await logEmail(to, subject, message, 'api_request', 'sent');
          return res.json({ success: true, message: 'Sent' });
      } catch (error: any) {
          await logEmail(to, subject, message, 'api_request', 'failed');
          return res.status(500).json({ success: false, error: error.message });
      }
  });

  app.get("/api/subscribers", async (req: any, res: any) => {
    const { data, error } = await supabaseAdmin
        .from('subscribers')
        .select(`id, email, name, status, created_at, tenants (id, brand_name, site_key)`)
        .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data || []);
  });

  app.post("/api/subscribers", async (req: any, res: any) => {
    const { email, name, siteKey } = req.body;
    const key = siteKey || "cyvisahelp";
    if (!email || !email.includes('@')) return res.status(400).json({ error: "Valid email required" });

    try {
        let { data: tenant } = await supabaseAdmin.from('tenants').select('id, brand_name').eq('site_key', key).single();
        if (!tenant) {
            const config = siteConfigs.find(s => s.siteKey === key);
            if (config) {
                const { data: newTenant } = await supabaseAdmin.from('tenants').insert({
                    site_key: config.siteKey, brand_name: config.brandName,
                    sender_name: config.senderName, primary_color: config.primaryColor, logo_url: config.logo
                }).select().single();
                if (newTenant) tenant = { id: newTenant.id, brand_name: newTenant.brand_name };
            }
        }
        if (!tenant) return res.status(404).json({ error: `Tenant "${key}" not configured` });

        const { data: existing } = await supabaseAdmin.from('subscribers').select('id')
            .eq('email', email).eq('tenant_id', tenant.id).maybeSingle();
        if (existing) return res.status(400).json({ error: `Already subscribed to ${tenant.brand_name}` });

        const { data: subscriber, error: subErr } = await supabaseAdmin.from('subscribers')
            .insert({ email, name: name || 'Subscriber', tenant_id: tenant.id, status: 'active' })
            .select('*').single();
        if (subErr) throw subErr;

        try {
            await sendEmail({ siteKey: key, to: email, templateName: 'welcome',
                variables: { name: name || 'there', email, website_name: tenant.brand_name } });
        } catch (mailErr: any) {
            addDebugLog('ERROR', `Welcome email failed to ${email}: ${mailErr.message}`);
        }
        res.json(subscriber);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/subscribers/:id", async (req: any, res: any) => {
    const { id } = req.params;
    const { email, name, status, siteKey } = req.body;
    if (!id) return res.status(400).json({ error: "ID required" });
    try {
        const updateData: any = {};
        if (email !== undefined) updateData.email = email;
        if (name !== undefined) updateData.name = name;
        if (status !== undefined) updateData.status = status;
        if (siteKey !== undefined) {
            const { data: tenant } = await supabaseAdmin.from('tenants').select('id').eq('site_key', siteKey).single();
            if (tenant) updateData.tenant_id = tenant.id;
        }
        const { data, error } = await supabaseAdmin.from('subscribers').update(updateData).eq('id', id)
            .select(`id, email, name, status, created_at, tenants (id, brand_name, site_key)`).single();
        if (error) throw error;
        res.json(data);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/subscribers/:id", async (req: any, res: any) => {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: "ID required" });
    try {
        await supabaseAdmin.from('campaign_recipients').delete().eq('subscriber_id', id);
        const { error } = await supabaseAdmin.from('subscribers').delete().eq('id', id);
        if (error) throw error;
        res.json({ success: true });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/subscribers/bulk", async (req: any, res: any) => {
    const { subscribers: list, siteKey } = req.body;
    const key = siteKey || "cyvisahelp";
    if (!Array.isArray(list) || list.length === 0) return res.status(400).json({ error: "List required" });
    try {
        let { data: tenant } = await supabaseAdmin.from('tenants').select('id, brand_name').eq('site_key', key).single();
        if (!tenant) {
            const config = siteConfigs.find(s => s.siteKey === key);
            if (config) {
                const { data: newTenant } = await supabaseAdmin.from('tenants').insert({
                    site_key: config.siteKey, brand_name: config.brandName,
                    sender_name: config.senderName, primary_color: config.primaryColor, logo_url: config.logo
                }).select().single();
                if (newTenant) tenant = { id: newTenant.id, brand_name: newTenant.brand_name };
            }
        }
        if (!tenant) return res.status(404).json({ error: `Tenant "${key}" not configured` });

        const { data: preExisting } = await supabaseAdmin.from('subscribers').select('email').eq('tenant_id', tenant.id);
        const existingEmails = new Set((preExisting || []).map((s: any) => s.email.toLowerCase().trim()));

        const toInsert: any[] = [];
        let duplicatesCount = 0, invalidCount = 0;
        for (const item of list) {
            const email = (item.email || '').trim().toLowerCase();
            const name = (item.name || '').trim() || 'Subscriber';
            if (!email || !email.includes('@')) { invalidCount++; continue; }
            if (existingEmails.has(email)) { duplicatesCount++; continue; }
            toInsert.push({ email, name, tenant_id: tenant.id, status: 'active' });
            existingEmails.add(email);
        }

        let insertedCount = 0;
        if (toInsert.length > 0) {
            const { data } = await supabaseAdmin.from('subscribers').insert(toInsert).select('*');
            insertedCount = data?.length || toInsert.length;
        }
        res.json({ success: true, imported: insertedCount, duplicates: duplicatesCount, invalid: invalidCount, totalProcessed: list.length });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/send-campaign", async (req: any, res: any) => {
      const { siteKey, subject, message, sendTo, emails } = req.body;
      try {
          const { data: tenant } = await supabaseAdmin.from('tenants').select('id').eq('site_key', siteKey).single();
          if (!tenant) return res.status(400).json({ error: `Invalid siteKey` });

          let targets: string[] = [];
          if (sendTo === 'all') {
              const { data } = await supabaseAdmin.from('subscribers').select('email')
                  .eq('tenant_id', tenant.id).eq('status', 'active');
              targets = data?.map((s: any) => s.email) || [];
          } else if (emails?.length) {
              targets = emails;
          }
          if (targets.length === 0) return res.status(400).json({ error: `No active subscribers for ${siteKey}` });

          for (const to of targets) {
              await sendEmail({ siteKey, to, templateName: 'campaign',
                  variables: { name: 'User', email: to, message } });
          }
          res.json({ success: true, sent: targets.length });
      } catch (e: any) {
          res.status(500).json({ error: e.message });
      }
  });

  app.post("/api/send-welcome-email", async (req: any, res: any) => {
      const { siteKey, email, name } = req.body;
      try {
          await sendEmail({ siteKey, to: email, templateName: 'welcome',
              variables: { name, email, website_name: siteKey } });
          res.json({ success: true });
      } catch (e: any) {
          res.status(500).json({ error: e.message });
      }
  });

  app.get("/api/welcome-template/:siteKey", async (req: any, res: any) => {
      const { siteKey } = req.params;
      try {
          const { data: tenant } = await supabaseAdmin.from('tenants').select('id, brand_name').eq('site_key', siteKey).single();
          let existingTemplate = null;
          if (tenant) {
              const { data } = await supabaseAdmin.from('email_templates').select('*')
                  .eq('tenant_id', tenant.id).eq('name', 'welcome').maybeSingle();
              existingTemplate = data;
          }
          if (existingTemplate) {
              return res.json({ subject: existingTemplate.subject, body: existingTemplate.html_content, enabled: true });
          }

          let defaultSubject = 'Welcome! 🎉';
          let defaultBody = '<h1>Welcome!</h1><p>Thank you for subscribing.</p>';
          if (siteKey === 'cybarprep' || siteKey === 'cyvisahelp') {
              defaultSubject = 'Welcome to CyAzor LawTech Solutions';
              defaultBody = CYBARPREP_REFERENCE_TEMPLATE
                  .replace('{{subject}}', defaultSubject)
                  .replace('{{category}}', 'WELCOME')
                  .replace('{{headline}}', 'Welcome to Cross-Border Legal Conversations')
                  .replace('{{name}}', '{{name}}')
                  .replace('{{intro}}', 'Thank you for joining our community. You will receive timely immigration updates, legal insights, and case-specific guidance to help you navigate your U.S. immigration pathway.')
                  .replace('{{content_blocks}}', '<p style="font-size: 15px; line-height: 1.6; color: #475569;">We are excited to have you as part of our subscriber community.</p>');
          }
          res.json({ subject: defaultSubject, body: defaultBody, enabled: true });
      } catch (err: any) {
          res.status(500).json({ error: err.message });
      }
  });

  app.post("/api/welcome-template/:siteKey", async (req: any, res: any) => {
      const { siteKey } = req.params;
      const { subject, body } = req.body;
      if (!subject || !body) return res.status(400).json({ error: "Subject and body required" });
      try {
          let { data: tenant } = await supabaseAdmin.from('tenants').select('id, brand_name').eq('site_key', siteKey).single();
          if (!tenant) {
              const config = siteConfigs.find(s => s.siteKey === siteKey);
              if (config) {
                  const { data: newTenant } = await supabaseAdmin.from('tenants').insert({
                      site_key: config.siteKey, brand_name: config.brandName,
                      sender_name: config.senderName, primary_color: config.primaryColor, logo_url: config.logo
                  }).select().single();
                  if (newTenant) tenant = { id: newTenant.id, brand_name: newTenant.brand_name };
              }
          }
          if (!tenant) return res.status(444).json({ error: `Tenant "${siteKey}" unconfigured` });

          const { data: existing } = await supabaseAdmin.from('email_templates').select('id')
              .eq('tenant_id', tenant.id).eq('name', 'welcome').maybeSingle();
          if (existing) {
              await supabaseAdmin.from('email_templates').update({
                  subject, html_content: body, text_content: body.replace(/<[^>]*>/g, '')
              }).eq('id', existing.id);
          } else {
              await supabaseAdmin.from('email_templates').insert({
                  tenant_id: tenant.id, name: 'welcome', subject,
                  html_content: body, text_content: body.replace(/<[^>]*>/g, '')
              });
          }
          res.json({ success: true, message: `Welcome template updated for ${tenant.brand_name}` });
      } catch (err: any) {
          res.status(500).json({ error: err.message });
      }
  });

  app.post("/api/external/subscribe", async (req: any, res: any) => {
      const { siteKey, email, name } = req.body;
      if (!email || !email.includes('@')) return res.status(400).json({ success: false, error: "Valid email required" });
      const key = siteKey || "cyvisahelp";
      try {
          let { data: tenant } = await supabaseAdmin.from('tenants').select('id, brand_name').eq('site_key', key).single();
          if (!tenant) {
              const config = siteConfigs.find(s => s.siteKey === key);
              if (config) {
                  const { data: newTenant } = await supabaseAdmin.from('tenants').insert({
                      site_key: config.siteKey, brand_name: config.brandName,
                      sender_name: config.senderName, primary_color: config.primaryColor, logo_url: config.logo
                  }).select().single();
                  if (newTenant) tenant = { id: newTenant.id, brand_name: newTenant.brand_name };
              }
          }
          if (!tenant) return res.status(400).json({ success: false, error: `Tenant "${key}" not found` });

          const { data: existing } = await supabaseAdmin.from('subscribers').select('id')
              .eq('email', email).eq('tenant_id', tenant.id).maybeSingle();
          let subscriber = existing;
          if (!existing) {
              const { data } = await supabaseAdmin.from('subscribers')
                  .insert({ email, name, tenant_id: tenant.id, status: 'active' }).select().single();
              subscriber = data;
          }
          try {
              await sendEmail({ siteKey: key, to: email, templateName: 'welcome',
                  variables: { name: name || 'there', email, website_name: tenant.brand_name } });
          } catch (mailErr: any) {
              addDebugLog('ERROR', `External welcome failed: ${mailErr.message}`);
          }
          await logEmail(email, `External Subscription: ${tenant.brand_name}`, `Subscriber: ${email}`, 'subscription_attempt', 'sent');
          res.json({ success: true, message: `Subscribed to ${tenant.brand_name}`, subscriber });
      } catch (e: any) {
          await logEmail(email, `Failed Subscription: ${key}`, e.message, 'subscription_attempt', 'failed');
          res.status(500).json({ success: false, error: e.message });
      }
  });

  app.get("/api/email-logs", async (req: any, res: any) => {
    const { data, error } = await supabaseAdmin.from('email_logs').select('*').order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data || []);
  });

  app.post("/api/webhooks/resend", async (req: any, res: any) => {
      const payload = req.body;
      const type = payload.type;
      const data = payload.data;
      if (!type || !data) return res.status(400).json({ error: 'Invalid payload' });
      const to = Array.isArray(data.to) ? data.to[0] : data.to;
      if (!to) return res.status(400).json({ error: 'No recipient' });

      let dbStatus = 'sent';
      if (type === 'email.delivered') dbStatus = 'delivered';
      else if (type === 'email.bounced') dbStatus = 'bounced';
      else if (type === 'email.complained') dbStatus = 'complaint';

      try {
          const { data: matchedLogs } = await supabaseAdmin.from('email_logs').select('id, subject')
              .eq('to', to).order('created_at', { ascending: false }).limit(1);
          if (matchedLogs && matchedLogs.length > 0) {
              await supabaseAdmin.from('email_logs').update({ status: dbStatus }).eq('id', matchedLogs[0].id);
          } else {
              await logEmail(to, data.subject || 'Webhook', `ID: ${data.email_id || ''}`, 'webhook', dbStatus);
          }
          res.json({ success: true, processed: true });
      } catch (err: any) {
          res.status(500).json({ error: err.message });
      }
  });

  app.post("/api/test/simulate-webhook", async (req: any, res: any) => {
      const { to, status } = req.body;
      if (!to || !status) return res.status(400).json({ error: "Missing parameters" });
      try {
          const { data: logs } = await supabaseAdmin.from('email_logs').select('id')
              .eq('to', to).order('created_at', { ascending: false }).limit(1);
          if (logs && logs.length > 0) {
              await supabaseAdmin.from('email_logs').update({ status }).eq('id', logs[0].id);
              return res.json({ success: true });
          } else {
              await supabaseAdmin.from('email_logs').insert({
                  to, subject: `Simulated ${status}`, message: `Simulated ${status}`,
                  type: 'test_simulation', status, created_at: new Date().toISOString()
              });
              return res.json({ success: true });
          }
      } catch (err: any) {
          res.status(500).json({ error: err.message });
      }
  });

  app.get("/api/debug-logs", (req: any, res: any) => res.json(debugLogs.slice(-100)));

  app.get("/api/health-check", async (req: any, res: any) => {
    try {
      const { count, error } = await supabaseAdmin.from('tenants').select('*', { count: 'exact', head: true });
      if (error) throw error;
      res.json({ status: 'connected', tenantCount: count });
    } catch (e: any) {
      res.status(500).json({ status: 'error', message: e.message });
    }
  });

  const ipRateLimit = new Map<string, number[]>();
  app.post("/api/subscribe", async (req: any, res: any) => {
    const ip = req.ip || 'unknown';
    const now = Date.now();
    const timestamps = ipRateLimit.get(ip) || [];
    const recent = timestamps.filter(t => now - t < 60000);
    if (recent.length >= 10) return res.status(429).json({ error: 'Too many requests' });
    recent.push(now);
    ipRateLimit.set(ip, recent);

    const { email, name, client_id } = req.body;
    if (!email || !email.includes('@') || !client_id) return res.status(400).json({ error: 'Invalid payload' });
    
    const { data: clientExists } = await supabaseAdmin.from('clients').select('id').eq('id', client_id).single();
    if (!clientExists) return res.status(400).json({ error: 'Invalid client_id' });
    
    const { data: subscriber, error } = await supabaseAdmin.from('subscribers')
      .insert([{ email, name, client_id, status: 'active' }]).select('*').single();
    if (error) return res.status(500).json({ error: error.message });

    res.json({ success: true, subscriber });
  });

  // Vite Middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
