import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { Resend } from "resend";
import { supabaseAdmin } from "./server/supabase.js";
import { checkDomains } from "./server/dns.js";
import { logEmail } from "./server/logger.js";
import dotenv from "dotenv";

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

async function startServer() {
  logEnvironmentDiagnostic();
  const app = express();
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
      const { subject, message, sendTo, emails } = req.body;
      console.log('Send campaign hit:', { subject, sendTo, emails });
      if (!subject || !message) {
          return res.status(400).json({ error: 'Subject and message are required' });
      }
      try {
          let targets: string[] = [];
          if (sendTo === 'all') {
              const { data } = await supabaseAdmin.from('subscribers').select('email');
              targets = data?.map((s: any) => s.email) || [];
          } else if (sendTo === 'single' && emails?.length) {
              targets = emails;
          }
  
          console.log('Targets:', targets);
          if (targets.length === 0) {
              return res.status(400).json({ error: 'No recipients found' });
          }
  
          for (const email of targets) {
              const result = await getResend().emails.send({
                  from: 'onboarding@resend.dev', // Use test sender
                  to: email,
                  subject,
                  html: `<p>${message}</p>`
              });
              console.log('Resend result:', result);
              await logEmail(email, subject, message, 'campaign', 'sent');
          }
          res.json({ success: true, sent: targets.length });
      } catch (e: any) {
          console.error('Send campaign error:', e.message);
          res.status(500).json({ error: e.message });
      }
  });

  // POST /api/welcome-template
  app.post("/api/welcome-template", async (req: any, res: any) => {
      const { subject, body, enabled } = req.body;
      (global as any).welcomeTemplate = { subject, body, enabled };
      res.json({ success: true });
  });

  app.get("/api/email-logs", async (req: any, res: any) => {
    const { data, error } = await supabaseAdmin.from('email_logs').select('*').order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data || []);
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
