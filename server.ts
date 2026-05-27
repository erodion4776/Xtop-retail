import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { Resend } from "resend";
import { supabaseAdmin } from "./server/supabase.js";
import { checkDomains } from "./server/dns.js";
import dotenv from "dotenv";

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

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
          await resend.emails.send({
              from: 'noreply@xtopflow.com',
              to: email,
              subject: 'XTOPFlow Backend Test Email',
              html: '<p>This is a test email confirming that the XTOPFlow email system is working correctly on Render.</p>'
          });
          return res.json({ success: true, message: 'Test email sent successfully' });
      } catch (error: any) {
          return res.status(500).json({ success: false, error: error.message });
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
        await resend.emails.send({
            from: from,
            to: email,
            subject: 'Welcome!',
            html: '<p>Welcome to our newsletter!</p>'
        });
    } catch (e) {
        console.error("Resend error", e);
    }
    
    res.json({ success: true, subscriber });
  });

  // POST /api/send-campaign
  app.post("/api/send-campaign", async (req: any, res: any) => {
    const { client_id, subject, content, campaign_id } = req.body;
    
    // 1. Fetch Subscribers (Tenant isolated)
    const { data: subscribers, error } = await supabaseAdmin
        .from('subscribers')
        .select('email')
        .eq('client_id', client_id)
        .eq('status', 'active');
        
    if (error) return res.status(500).json({ error: error.message });
    
    // 2. Fetch sender_email
    const { data: client } = await supabaseAdmin
       .from('clients')
       .select('sender_email')
       .eq('id', client_id)
       .single();

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
    
    // 3. Send emails
    for (const sub of subscribers || []) {
        try {
            await resend.emails.send({
                from,
                to: sub.email,
                subject,
                html: content
            });
        } catch (e) {
            console.error("Failed to send email to", sub.email, e);
        }
    }
    
    // 4. Update status
    await supabaseAdmin.from('campaigns').update({ status: 'sent' }).eq('id', campaign_id);
    
    res.json({ success: true });
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
