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
    console.log("------------------------------");
}

const debugLogs: { timestamp: string, message: string, type: string }[] = [];

function addDebugLog(type: string, message: string) {
    debugLogs.push({ timestamp: new Date().toISOString(), type, message });
    console.log(`[DEBUG/${type}] ${message}`);
}

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
      console.error("Failed to check tenants table (it might not be created yet):", error.message);
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
      if (insertError) {
        console.error("Failed to seed tenants:", insertError.message);
      } else {
        console.log("Tenants seeded successfully.");
      }
    }
  } catch (e: any) {
    console.error("Error during tenant seeding:", e.message);
  }
}

async function startServer() {
  logEnvironmentDiagnostic();
  await seedTenantsIfEmpty();
  const app = express();
  app.use(cors()); // Allow anyone to send API requests (HTML embed/External integrations)
  app.use(express.json());
  const PORT = 3000;

  // --- API Routes ---
  
  // GET /api/domain/verify/:domain
  app.get("/api/domain/verify/:domain", async (req: any, res: any) => {
      const results = await checkDomains(req.params.domain);
      res.json(results);
  });
  
  // POST /api/test-email
  app.post("/api/test-email", async (req: any, res: any) => {
      const { email } = req.body;
      if (!email) return res.status(400).json({ success: false, error: 'Email is required' });
      try {
          await getResend().emails.send({
              from: 'noreply@xtopflow.com',
              to: email,
              subject: 'XTOPFlow Backend Test Email',
              html: '<p>This is a test email confirming that the XTOPFlow email system is working correctly on Render.</p>'
          });
          await logEmail(email, 'XTOPFlow Backend Test Email', 'Test body', 'test', 'sent');
          return res.json({ success: true, message: 'Test email sent successfully' });
      } catch (error: any) {
          return res.status(500).json({ success: false, error: error.message });
      }
  });

  // POST /api/send-email (Official Resend SDK Implementation with high deliverability configuration)
  const emailLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 20, // Increase slightly to allow for testing campaigns/test API comfortably
      message: { error: 'Too many requests, please try again later.' }
  });

  app.post("/api/send-email", emailLimiter, async (req: any, res: any) => {
      const { to, subject, message } = req.body;
      if (!to || !subject || !message) {
          return res.status(400).json({ success: false, error: 'Missing required fields: to, subject, message' });
      }
      if (!to.includes('@')) {
          return res.status(400).json({ success: false, error: 'Invalid email address' });
      }
      
      // Load configurable sender credentials with optimal default formatting
      const senderName = process.env.SENDER_NAME || 'CylawTech';
      const senderEmail = process.env.SENDER_EMAIL || 'hello@cylawtech.com';
      const replyTo = process.env.REPLY_TO_EMAIL || 'support@cylawtech.com';
      const fromAddress = `"${senderName}" <${senderEmail}>`;

      try {
          // Send via Resend with automatic retry on temporary outages or rate limits
          let resendResponse;
          try {
              resendResponse = await retryOperation(() => getResend().emails.send({
                  from: fromAddress,
                  to,
                  subject: subject,
                  html: message,
                  replyTo: replyTo,
                  headers: {
                      'List-Unsubscribe': `<https://cylawtech.com/unsubscribe?email=${encodeURIComponent(to)}>`,
                      'X-Entity-ID': 'cylawtech-' + Date.now()
                  }
              }));
          } catch (resendErr: any) {
              addDebugLog('WARNING', `Sending via ${senderEmail} failed, trying system sandbox fallback onboarding@resend.dev...`);
              resendResponse = await retryOperation(() => getResend().emails.send({
                  from: 'onboarding@resend.dev',
                  to,
                  subject: subject,
                  html: message,
                  replyTo: replyTo,
                  headers: {
                      'List-Unsubscribe': `<https://cylawtech.com/unsubscribe?email=${encodeURIComponent(to)}>`
                  }
              }));
          }

          // Log database tracking record
          await logEmail(to, subject, message, 'api_request', 'sent');
          addDebugLog('INFO', `Sent email successfully to ${to} (Subject: "${subject}")`);

          return res.json({ 
              success: true, 
              message: 'Email sent successfully',
              sender: fromAddress,
              replyTo: replyTo
          });
      } catch (error: any) {
          console.error("Resend API error:", error);
          addDebugLog('ERROR', `Send failed to ${to}: ${error.message}`);
          await logEmail(to, subject, message, 'api_request', 'failed');
          return res.status(500).json({ success: false, error: error.message });
      }
  });

  // Email Center APIs
  app.get("/api/subscribers", async (req: any, res: any) => {
    const { data, error } = await supabaseAdmin
        .from('subscribers')
        .select(`
            id,
            email,
            name,
            status,
            created_at,
            tenants (
                id,
                brand_name,
                site_key
            )
        `)
        .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data || []);
  });

  app.post("/api/subscribers", async (req: any, res: any) => {
    const { email, name, siteKey } = req.body;
    const key = siteKey || "cyvisahelp";

    if (!email || !email.includes('@')) {
        return res.status(400).json({ error: "Valid email address is required." });
    }

    try {
        // 1. Resolve tenant
        let { data: tenant } = await supabaseAdmin.from('tenants').select('id, brand_name').eq('site_key', key).single();
        
        if (!tenant) {
            // Self-seed tenant if mismatch occurs
            const config = siteConfigs.find(s => s.siteKey === key);
            if (config) {
                const { data: newTenant, error: insertErr } = await supabaseAdmin.from('tenants').insert({
                    site_key: config.siteKey,
                    brand_name: config.brandName,
                    sender_name: config.senderName,
                    primary_color: config.primaryColor,
                    logo_url: config.logo
                }).select().single();
                
                if (!insertErr && newTenant) {
                    tenant = { id: newTenant.id, brand_name: newTenant.brand_name };
                }
            }
        }

        if (!tenant) {
            return res.status(404).json({ error: `Tenant brand for "${key}" not configured.` });
        }

        // 2. Look for pre-existing subscriber
        const { data: existing } = await supabaseAdmin
            .from('subscribers')
            .select('id')
            .eq('email', email)
            .eq('tenant_id', tenant.id)
            .maybeSingle();

        if (existing) {
            return res.status(400).json({ error: `Already subscribed to ${tenant.brand_name}.` });
        }

        // 3. Insert and subscribe
        const { data: subscriber, error: subErr } = await supabaseAdmin
            .from('subscribers')
            .insert({
                email,
                name: name || 'Subscriber',
                tenant_id: tenant.id,
                status: 'active'
            })
            .select('*')
            .single();

        if (subErr) throw subErr;

        // 4. Fire the instant site welcome email
        try {
            await sendEmail({ 
                siteKey: key, 
                to: email, 
                templateName: 'welcome', 
                variables: { name: name || 'there', email, website_name: tenant.brand_name } 
            });
        } catch (mailErr: any) {
            addDebugLog('ERROR', `Failed to send site welcome email to ${email}: ${mailErr.message}`);
            console.error("Welcome email failed:", mailErr.message);
        }

        res.json(subscriber);
    } catch (err: any) {
        addDebugLog('ERROR', `Failed standard subscribe: ${err.message}`);
        res.status(500).json({ error: err.message });
    }
  });

  // POST /api/send-campaign
  app.post("/api/send-campaign", async (req: any, res: any) => {
      const { siteKey, subject, message, sendTo, emails } = req.body;
      
      try {
          // Fetch corresponding tenant to restrict campaign to subscribers of selected site
          const { data: tenant } = await supabaseAdmin
              .from('tenants')
              .select('id')
              .eq('site_key', siteKey)
              .single();

          if (!tenant) {
              return res.status(400).json({ error: `Invalid siteKey: tenant not found.` });
          }

          let targets: string[] = [];
          
          if (sendTo === 'all') {
              const { data } = await supabaseAdmin
                  .from('subscribers')
                  .select('email')
                  .eq('tenant_id', tenant.id)
                  .eq('status', 'active');
              targets = data?.map((s: any) => s.email) || [];
          } else if (sendTo === 'single' && emails?.length) {
              targets = emails;
          }

          if (targets.length === 0) return res.status(400).json({ error: `No active subscribers found for ${siteKey}` });                

          for (const to of targets) {
              await sendEmail({ siteKey, to, templateName: 'campaign', variables: { name: 'User', email: to, message: message } });
          }
          res.json({ success: true, sent: targets.length });

      } catch (e: any) {
          console.error('Send campaign error:', e.message);
          res.status(500).json({ error: e.message });
      }
  });

  // POST /api/send-welcome-email
  app.post("/api/send-welcome-email", async (req: any, res: any) => {
      const { siteKey, email, name } = req.body;
      try {
          await sendEmail({ 
            siteKey, 
            to: email, 
            templateName: 'welcome', 
            variables: { name, email, website_name: siteKey } 
          });
          res.json({ success: true });
      } catch (e: any) {
          res.status(500).json({ error: e.message });
      }
  });

  // GET /api/welcome-template/:siteKey
  app.get("/api/welcome-template/:siteKey", async (req: any, res: any) => {
      const { siteKey } = req.params;
      try {
          const { data: tenant } = await supabaseAdmin.from('tenants').select('id, brand_name').eq('site_key', siteKey).single();
          
          let existingTemplate = null;
          if (tenant) {
              const { data: dataTemplate } = await supabaseAdmin
                  .from('email_templates')
                  .select('*')
                  .eq('tenant_id', tenant.id)
                  .eq('name', 'welcome')
                  .maybeSingle();
              existingTemplate = dataTemplate;
          }

          if (existingTemplate) {
              return res.json({
                  subject: existingTemplate.subject,
                  body: existingTemplate.html_content,
                  enabled: true
              });
          }

          // Generate site-specific high-contrast beautiful fallbacks matching emailService.ts
          let defaultSubject = 'Welcome! 🎉';
          let defaultBody = '<h1>Welcome!</h1><p>Thank you for subscribing to our updates.</p>';

          if (siteKey === 'cyvisahelp') {
              defaultSubject = 'Your Free VAWA Strategy Guide is Inside 🔐';
              defaultBody = `<!DOCTYPE html>
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
              <h2 style="color: #0F172A; text-align: center;">Welcome to the Academy Portal</h2>
              <p>Hello {email},</p>
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
</html>`;
          } else if (siteKey === 'cybarprep') {
              defaultSubject = 'Your Free California Bar Exam Study Kit is ready 📝';
              defaultBody = `<!DOCTYPE html>
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
              <p>Hello {email},</p>
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
</html>`;
          } else if (siteKey === 'cylawtech') {
              defaultSubject = 'Your Free LawTech Automation Checklist is inside ⚙️';
              defaultBody = `<!DOCTYPE html>
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
              <p>Hello {email},</p>
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
</html>`;
          }

          res.json({
              subject: defaultSubject,
              body: defaultBody,
              enabled: true
          });
      } catch (err: any) {
          res.status(500).json({ error: err.message });
      }
  });

  // POST /api/welcome-template/:siteKey
  app.post("/api/welcome-template/:siteKey", async (req: any, res: any) => {
      const { siteKey } = req.params;
      const { subject, body } = req.body;
      
      if (!subject || !body) {
          return res.status(400).json({ error: "Subject and body are elements required to configure a template." });
      }

      try {
          let { data: tenant } = await supabaseAdmin.from('tenants').select('id, brand_name').eq('site_key', siteKey).single();
          
          if (!tenant) {
              // Self-seed tenant if mismatch occurs
              const config = siteConfigs.find(s => s.siteKey === siteKey);
              if (config) {
                  const { data: newTenant, error: insertErr } = await supabaseAdmin.from('tenants').insert({
                      site_key: config.siteKey,
                      brand_name: config.brandName,
                      sender_name: config.senderName,
                      primary_color: config.primaryColor,
                      logo_url: config.logo
                  }).select().single();
                  
                  if (!insertErr && newTenant) {
                      tenant = { id: newTenant.id, brand_name: newTenant.brand_name };
                  }
              }
          }

          if (!tenant) {
              return res.status(444).json({ error: `Tenant brand for "${siteKey}" is unconfigured.` });
          }

          const { data: existingTemplate } = await supabaseAdmin
              .from('email_templates')
              .select('id')
              .eq('tenant_id', tenant.id)
              .eq('name', 'welcome')
              .maybeSingle();

          if (existingTemplate) {
              const { error: updateErr } = await supabaseAdmin
                  .from('email_templates')
                  .update({
                      subject,
                      html_content: body,
                      text_content: body.replace(/<[^>]*>/g, '') 
                  })
                  .eq('id', existingTemplate.id);
                  
              if (updateErr) throw updateErr;
          } else {
              const { error: insertErr } = await supabaseAdmin
                  .from('email_templates')
                  .insert({
                      tenant_id: tenant.id,
                      name: 'welcome',
                      subject,
                      html_content: body,
                      text_content: body.replace(/<[^>]*>/g, '')
                  });
              if (insertErr) throw insertErr;
          }

          res.json({ success: true, message: `Successfully updated welcome template for ${tenant.brand_name}` });
      } catch (err: any) {
          res.status(500).json({ error: err.message });
      }
  });

  // POST /api/external/subscribe - Public CORS-enabled endpoint for external integration (e.g. https://xtop-retail.onrender.com/)
  app.post("/api/external/subscribe", async (req: any, res: any) => {
      const { siteKey, email, name } = req.body;
      
      if (!email || !email.includes('@')) {
          return res.status(400).json({ success: false, error: "Valid email is required" });
      }
      
      const key = siteKey || "cyvisahelp";
      
      try {
          // 1. Fetch tenant ID
          let { data: tenant } = await supabaseAdmin.from('tenants').select('id, brand_name').eq('site_key', key).single();
          
          if (!tenant) {
              // Try to find local config to auto-seed this tenant
              const config = siteConfigs.find(s => s.siteKey === key);
              if (config) {
                  const { data: newTenant, error: insertErr } = await supabaseAdmin.from('tenants').insert({
                      site_key: config.siteKey,
                      brand_name: config.brandName,
                      sender_name: config.senderName,
                      primary_color: config.primaryColor,
                      logo_url: config.logo
                  }).select().single();
                  
                  if (!insertErr && newTenant) {
                      tenant = { id: newTenant.id, brand_name: newTenant.brand_name };
                  }
              }
          }
          
          if (!tenant) {
              return res.status(400).json({ success: false, error: `Tenant with siteKey "${key}" not found and cannot be initialized.` });
          }
          
          // 2. Check if subscriber already exists
          const { data: existing } = await supabaseAdmin
              .from('subscribers')
              .select('id')
              .eq('email', email)
              .eq('tenant_id', tenant.id)
              .maybeSingle();
              
          let subscriber = existing;
          if (!existing) {
              // 3. Register subscriber
              const { data, error } = await supabaseAdmin
                  .from('subscribers')
                  .insert({ email, name, tenant_id: tenant.id, status: 'active' })
                  .select()
                  .single();
              if (error) throw error;
              subscriber = data;
          }
          
          // 4. Trigger Welcome Automation
          try {
              await sendEmail({ 
                 siteKey: key, 
                 to: email, 
                 templateName: 'welcome', 
                 variables: { name: name || 'there', email, website_name: tenant.brand_name } 
              });
          } catch (mailErr: any) {
              addDebugLog('ERROR', `Failed to dynamically welcome external subscriber: ${mailErr.message}`);
              console.error("Failed to dynamically welcome external subscriber:", mailErr.message);
          }
          
          await logEmail(email, `External Subscription: ${tenant.brand_name}`, `Subscriber: ${email}`, 'subscription_attempt', 'sent');
          res.json({ success: true, message: `Subscribed successfully to ${tenant.brand_name}`, subscriber });
      } catch (e: any) {
          addDebugLog('ERROR', `External subscription integration error: ${e.message}`);
          console.error("External subscription integration error:", e.message);
          await logEmail(email, `Failed Subscription: ${key}`, e.message, 'subscription_attempt', 'failed');
          res.status(500).json({ success: false, error: e.message });
      }
  });

  app.get("/api/email-logs", async (req: any, res: any) => {
    const { data, error } = await supabaseAdmin.from('email_logs').select('*').order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data || []);
  });

  // POST /api/webhooks/resend - Real webhook receiver for bounces, delivered and complaints tracking
  app.post("/api/webhooks/resend", async (req: any, res: any) => {
      const payload = req.body;
      const type = payload.type; // e.g. "email.delivered", "email.bounced", "email.complained"
      const data = payload.data;
      
      if (!type || !data) {
          addDebugLog('WARNING', 'Resend webhook received with invalid payload format.');
          return res.status(400).json({ error: 'Invalid payload' });
      }

      const to = Array.isArray(data.to) ? data.to[0] : data.to;
      if (!to) {
          addDebugLog('WARNING', `Resend webhook ${type} has no recipient address.`);
          return res.status(400).json({ error: 'No recipient in payload' });
      }

      addDebugLog('INFO', `Received Resend webhook of type ${type} for recipient ${to}`);

      // Map event status
      let dbStatus = 'sent';
      if (type === 'email.delivered') dbStatus = 'delivered';
      else if (type === 'email.bounced') dbStatus = 'bounced';
      else if (type === 'email.complained') dbStatus = 'complaint';

      try {
          const { data: matchedLogs, error: fetchErr } = await supabaseAdmin
              .from('email_logs')
              .select('id, subject')
              .eq('to', to)
              .order('created_at', { ascending: false })
              .limit(1);

          if (fetchErr) throw fetchErr;

          if (matchedLogs && matchedLogs.length > 0) {
              const matchedLog = matchedLogs[0];
              const { error: updateErr } = await supabaseAdmin
                  .from('email_logs')
                  .update({ status: dbStatus })
                  .eq('id', matchedLog.id);

              if (updateErr) throw updateErr;
              addDebugLog('INFO', `Updated log ID ${matchedLog.id} for ${to} to status "${dbStatus}" via real Resend webhook.`);
          } else {
              await logEmail(to, data.subject || 'Webhook notification', `Subject: ${data.subject || ''}. ID: ${data.email_id || ''}`, 'webhook', dbStatus);
              addDebugLog('INFO', `Created a new log entry for recipient ${to} with status "${dbStatus}" as no sent record existed.`);
          }

          return res.json({ success: true, processed: true });
      } catch (err: any) {
          console.error("Failed to process Resend webhook:", err.message);
          addDebugLog('ERROR', `Resend webhook processing failed: ${err.message}`);
          return res.status(500).json({ error: err.message });
      }
  });

  // POST /api/test/simulate-webhook - Simulation trigger for frontend logs dashboard
  app.post("/api/test/simulate-webhook", async (req: any, res: any) => {
      const { to, status } = req.body;
      if (!to || !status) {
          return res.status(400).json({ error: "Missing required parameters: to, status" });
      }

      addDebugLog('INFO', `Dashboard Simulation Triggered: Mark ${to} as "${status}"`);

      try {
          const { data: logs, error: fetchErr } = await supabaseAdmin
              .from('email_logs')
              .select('id, subject, message, type')
              .eq('to', to)
              .order('created_at', { ascending: false })
              .limit(1);

          if (fetchErr) throw fetchErr;

          if (logs && logs.length > 0) {
              const matchedLog = logs[0];
              const { error: updateErr } = await supabaseAdmin
                  .from('email_logs')
                  .update({ status })
                  .eq('id', matchedLog.id);

              if (updateErr) throw updateErr;
              addDebugLog('INFO', `Simulated Log ID ${matchedLog.id} status modified successfully to "${status}".`);
              return res.json({ success: true, message: `Updated most recent log ID ${matchedLog.id} for ${to} to status "${status}".` });
          } else {
              const { data: newLog, error: insertErr } = await supabaseAdmin
                  .from('email_logs')
                  .insert({
                      to,
                      subject: `Simulated ${status} Notification`,
                      message: `A simulated body content showing ${status} metrics on the dashboard.`,
                      type: 'test_simulation',
                      status,
                      created_at: new Date().toISOString()
                  })
                  .select()
                  .single();

              if (insertErr) throw insertErr;
              addDebugLog('INFO', `Created fresh simulated log ID ${newLog?.id} with status "${status}".`);
              return res.json({ success: true, message: `Created fresh simulated log entry for ${to} with status "${status}".` });
          }
      } catch (err: any) {
          console.error("Simulation endpoint failed:", err.message);
          addDebugLog('ERROR', `Simulation endpoint error: ${err.message}`);
          return res.status(500).json({ error: err.message });
      }
  });

  app.get("/api/debug-logs", (req: any, res: any) => {
    res.json(debugLogs.slice(-100));
  });

  app.get("/api/health-check", async (req: any, res: any) => {
    try {
      const { count, error } = await supabaseAdmin.from('tenants').select('*', { count: 'exact', head: true });
      if (error) throw error;
      addDebugLog('INFO', 'Supabase connection successful.');
      res.json({ status: 'connected', tenantCount: count });
    } catch (e: any) {
      addDebugLog('ERROR', `Supabase connection failed: ${e.message}`);
      res.status(500).json({ status: 'error', message: e.message });
    }
  });
  
  // Basic in-memory rate limiter per IP (simplistic MVP protection)
  const ipRateLimit = new Map<string, number[]>();

  // POST /api/subscribe
  app.post("/api/subscribe", async (req: any, res: any) => {
    const ip = req.ip || 'unknown';
    const now = Date.now();
    const timestamps = ipRateLimit.get(ip) || [];
    const recent = timestamps.filter(t => now - t < 60000); // 1-minute window
    
    if (recent.length >= 10) return res.status(429).json({ error: 'Too many requests' });
    recent.push(now);
    ipRateLimit.set(ip, recent);

    const { email, name, client_id } = req.body;
    
    // 1. Validation
    if (!email || !email.includes('@') || !client_id) {
        return res.status(400).json({ error: 'Invalid payload' });
    }
    
    // 2. Verify client existence
    const { data: clientExists } = await supabaseAdmin
        .from('clients')
        .select('id')
        .eq('id', client_id)
        .single();
    
    if (!clientExists) return res.status(400).json({ error: 'Invalid client_id' });
    
    // 3. Insert to Supabase with tenant isolation
    const { data: subscriber, error } = await supabaseAdmin
      .from('subscribers')
      .insert([{ email, name, client_id, status: 'active' }])
      .select('*')
      .single();
      
    if (error) return res.status(500).json({ error: error.message });

    // 4. Fetch sender_email from clients
    const { data: client, error: clientError } = await supabaseAdmin
       .from('clients')
       .select('sender_email')
       .eq('id', client_id)
       .single();
    
    if (clientError) {
        console.error("Client fetch error", clientError);
    }
    
    // Check if domain is verified
    let from = 'noreply@yourdomain.com';
    const senderEmail = client?.sender_email;
    if (senderEmail && senderEmail.includes('@')) {
        const domain = senderEmail.split('@')[1];
        const { data: domainCheck } = await supabaseAdmin
            .from('domains')
            .select('status')
            .eq('client_id', client_id)
            .eq('domain_name', domain)
            .eq('status', 'verified')
            .maybeSingle();

        if (domainCheck) {
            from = senderEmail;
        } else {
            console.warn(`Sender domain ${domain} not verified for client ${client_id}, using default.`);
        }
    }

    // 5. Send email via Resend
    try {
        const template = (global as any).welcomeTemplate || {
            subject: 'Welcome!',
            body: '<p>Welcome to our newsletter!</p>',
            enabled: true
        };
        if (template.enabled) {
            await getResend().emails.send({
                from: 'onboarding@resend.dev',
                to: email,
                subject: template.subject,
                html: template.body.replace('{email}', email)
            });
        }
    } catch (e) {
        console.error("Resend error", e);
    }
    
    res.json({ success: true, subscriber });
  });



  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
