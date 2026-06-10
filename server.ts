import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { Resend } from "resend";
import { supabaseAdmin } from "./server/supabase.js";
import { checkDomains } from "./server/dns.js";
import { sendEmail } from "./server/emailService.js";
import { siteConfigs } from "./server/emailConfig.js";
import { logEmail } from "./server/logger.js";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config({ silent: true });

function logEnvironmentDiagnostic() {
    console.log("--- Environment Diagnostic ---");
    console.log(`Node Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Supabase URL: ${process.env.VITE_SUPABASE_URL ? 'Detected' : 'Missing'}`);
    console.log(`Supabase Service Key: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Detected' : 'Missing'}`);
    console.log(`Resend API Key: ${process.env.RESEND_API_KEY ? 'Detected' : 'Missing'}`);
    console.log("------------------------------");
}

let resendClient: Resend | null = null;
const debugLogs: { timestamp: string, message: string, type: string }[] = [];

function addDebugLog(type: string, message: string) {
    debugLogs.push({ timestamp: new Date().toISOString(), type, message });
    console.log(`[DEBUG/${type}] ${message}`);
}

function getResend() {
    if (!resendClient) {
        const key = process.env.RESEND_API_KEY;
        if (!key) {
            console.error("RESEND_API_KEY is not set!");
            throw new Error("RESEND_API_KEY is not set");
        }
        resendClient = new Resend(key);
    }
    return resendClient;
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

  // Email Center APIs
  app.get("/api/subscribers", async (req: any, res: any) => {
    const { data, error } = await supabaseAdmin.from('subscribers').select('*');
    if (error) return res.status(500).json({ error: error.message });
    res.json(data || []);
  });

  app.post("/api/subscribers", async (req: any, res: any) => {
    const { email, name } = req.body;
    const { data, error } = await supabaseAdmin.from('subscribers').insert({ email, name });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data || []);
  });

  // POST /api/send-campaign
  app.post("/api/send-campaign", async (req: any, res: any) => {
      const { siteKey, subject, message, sendTo, emails } = req.body;
      
      try {
          let targets: string[] = [];
          
          if (sendTo === 'all') {
              const { data } = await supabaseAdmin.from('subscribers').select('email');
              targets = data?.map((s: any) => s.email) || [];
          } else if (sendTo === 'single' && emails?.length) {
              targets = emails;
          }

          if (targets.length === 0) return res.status(400).json({ error: 'No recipients found' });                

          for (const to of targets) {
              await sendEmail({ siteKey, to, templateName: 'campaign', variables: {name: 'User', email: to, message: message } });
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
                  .insert({ email, tenant_id: tenant.id, status: 'active' })
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

    const { email, client_id } = req.body;
    
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
      .insert([{ email, client_id, status: 'active' }])
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
