import { getResend } from '../server.js';
import { logEmail } from './logger.js';
import { renderTemplate } from './templateEngine.js';
import { supabaseAdmin } from './supabase.js';

export async function sendEmail({ siteKey, to, templateName, variables }: { siteKey: string, to: string, templateName: string, variables: Record<string, string> }) {
    // 1. Fetch template from DB
    const { data: tenant } = await supabaseAdmin.from('tenants').select('id').eq('site_key', siteKey).single();
    if (!tenant) throw new Error("Tenant not found");
    
    const { data: template } = await supabaseAdmin
        .from('email_templates')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('name', templateName)
        .single();
        
    if (!template) throw new Error("Template not found");

    // 2. Render Template
    const rendered = renderTemplate(template, siteKey, variables);

    // 3. Send via Resend
    await getResend().emails.send({
        from: `notifications@yourdomain.com`, // Domain needs to be configured in Resend
        to,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text
    });

    await logEmail(to, rendered.subject, rendered.text, templateName, 'sent');
}
