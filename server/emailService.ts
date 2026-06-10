import { getResend } from '../server.js';
import { logEmail } from './logger.js';
import { renderTemplate } from './templateEngine.js';
import { supabaseAdmin } from './supabase.js';
import { getSiteConfig } from './emailConfig.js';

export async function sendEmail({ siteKey, to, templateName, variables }: { siteKey: string, to: string, templateName: string, variables: Record<string, string> }) {
    // 1. Fetch site configurations
    const config = getSiteConfig(siteKey);
    if (!config) throw new Error(`Invalid siteKey: ${siteKey}`);

    // Fetch tenant from DB
    const { data: tenant } = await supabaseAdmin.from('tenants').select('id').eq('site_key', siteKey).single();
    
    // 2. Fetch template from DB or use elegant fallback
    let template: { subject: string; html_content: string; text_content: string } | null = null;
    
    if (tenant) {
        const { data } = await supabaseAdmin
            .from('email_templates')
            .select('*')
            .eq('tenant_id', tenant.id)
            .eq('name', templateName)
            .maybeSingle();
        template = data;
    }
        
    if (!template) {
        // Fallback templates dynamically rendered
        if (templateName === 'welcome') {
            template = {
                subject: 'Welcome to our newsletter! 🎉',
                html_content: '<h3>Welcome aboard!</h3><p>Hi {{name}},</p><p>Thank you for subscribing to our updates. We are excited to have you on board!</p><p>We will keep you updated with the latest news, tutorials, and exclusive highlights.</p>',
                text_content: 'Welcome! Thank you for subscribing. We will keep you updated with the latest news.'
            };
        } else {
            template = {
                subject: 'Update from {{website_name}}',
                html_content: `<p>Hi {{name}},</p><p>${variables.message || 'Check out our latest news.'}</p>`,
                text_content: `Hi, ${variables.message || 'Check out our latest news.'}`
            };
        }
    }

    // 3. Render Template
    const rendered = renderTemplate(template, siteKey, variables);

    // 4. Determine Sender Address (Support verified cyvisahelp.com)
    // Resend requires verified domains, so we default to cyvisahelp.com, fallback to onboarding@resend.dev
    const fromAddress = `"${config.senderName}" <noreply@cyvisahelp.com>`;

    // 5. Send via Resend
    try {
        await getResend().emails.send({
            from: fromAddress,
            to,
            subject: rendered.subject,
            html: rendered.html,
            text: rendered.text
        });
        await logEmail(to, rendered.subject, rendered.text, templateName, 'sent');
    } catch (resendErr: any) {
        console.warn("Attempting send with cyvisahelp.com failed, falling back to onboarding@resend.dev...", resendErr.message);
        // Fallback for unverified system testing
        await getResend().emails.send({
            from: `onboarding@resend.dev`,
            to,
            subject: rendered.subject,
            html: rendered.html,
            text: rendered.text
        });
        await logEmail(to, rendered.subject, rendered.text, templateName, 'sent');
    }
}
