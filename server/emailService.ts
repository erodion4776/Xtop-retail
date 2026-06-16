import { getResend, retryOperation } from './resend.js';
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
            if (siteKey === 'cyvisahelp') {
                template = {
                    subject: 'Your Free VAWA Strategy Guide is Inside 🔐',
                    html_content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Free VAWA Strategy Guide is Inside 🔐</title>
  <style>
    #outlook a { padding: 0; }
    .ReadMsgBody { width: 100%; }
    .ExternalClass { width: 100%; }
    .ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div { line-height: 100%; }
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #F8F9FA; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
    img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    table { border-collapse: collapse !important; }
    .cta-button:hover {
      background-color: #b08e48 !important;
      transform: translateY(-2px);
    }
  </style>
</head>
<body style="margin: 0 !important; padding: 0 !important; background-color: #F8F9FA;">
  <div style="display: none; font-size: 1px; color: #F8F9FA; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
    Access inside: Your secure, complimentary VAWA Protection Strategy Guide has been prepared.
  </div>
  <table border="0" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td align="center" style="background-color: #F8F9FA; padding: 40px 10px 40px 10px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.03);">
          <tr>
            <td align="center" style="background-color: #0F172A; padding: 40px 40px 40px 40px;">
              <span style="font-family: 'Georgia', serif; font-size: 28px; font-weight: bold; color: #FFFFFF; letter-spacing: 1px; text-transform: uppercase;">
                Cy<span style="color: #C5A059;">Azor</span>
              </span>
              <div style="font-size: 10px; color: #C5A059; text-transform: uppercase; letter-spacing: 5px; margin-top: 8px; font-weight: bold;">
                Digital Law Academy
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 40px 20px 40px;">
              <h1 style="font-family: 'Georgia', serif; font-size: 24px; font-weight: bold; color: #0F172A; margin: 0 0 15px 0; line-height: 1.3; text-align: center;">
                Welcome to the Academy Portal
              </h1>
              <div style="width: 40px; height: 2px; background-color: #C5A059; margin: 0 auto 20px auto;"></div>
              
              <p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0 0 20px 0;">
                Hello {{name}},
              </p>
              
              <p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0 0 20px 0;">
                Thank you for connecting with the <strong>CyAzor Digital Law Academy</strong>. We are an educational LawTech platform operating at the intersection of expertise, strategy, and modern technology. Our mission is to take complex navigation procedures and simplify them into clear, structured, and manageable steps.
              </p>
              
              <p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0 0 30px 0;">
                As requested, your digital access pass to the complimentary entry edition of the <strong>VAWA Protection Guide (Intro Edition)</strong> has been provisioned. 
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 0 40px 40px 40px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F8F9FA; border-radius: 16px; border: 1px dashed #C5A059; padding: 30px 20px;">
                <tr>
                  <td align="center">
                    <img src="https://i.ibb.co/tpVvydGn/1768391419081-019bbc57-559b-7f19-9797-2c39a5070872.png" alt="VAWA Cover" width="140" style="border-radius: 8px; border: 1px solid #E2E8F0; box-shadow: 0 5px 15px rgba(0,0,0,0.1); margin-bottom: 20px;" />
                    <h2 style="font-family: 'Georgia', serif; font-size: 18px; color: #0F172A; margin: 0 0 10px 0; font-weight: bold;">
                      VAWA Protection Guide <br>
                      <span style="font-size: 12px; color: #C5A059; text-transform: uppercase; letter-spacing: 2px;">Intro Edition</span>
                    </h2>
                    <p style="color: #64748B; font-size: 13px; max-width: 360px; margin: 0 0 25px 0; line-height: 1.5;">
                      Understand independent qualification parameters, recognized forms of extreme cruelty, and your secure legal rights.
                    </p>
                    <table border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="border-radius: 50px; background-color: #C5A059;">
                          <a href="https://ais-pre-m7qky7xz3xn5xqxlv426ei-24487513203.europe-west3.run.app/vawa-free-reader" target="_blank" class="cta-button" style="border: 0 solid #C5A059; border-radius: 50px; color: #0F172A; display: inline-block; font-size: 12px; font-weight: bold; line-height: 1; padding: 18px 36px; text-decoration: none; text-transform: uppercase; letter-spacing: 2px; transition: all 0.3s ease;">
                            Open Interactive Reader
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 40px 40px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0F172A; border-radius: 20px; color: #FFFFFF; padding: 30px;">
                <tr>
                  <td>
                    <div style="font-size: 10px; color: #C5A059; text-transform: uppercase; letter-spacing: 3px; font-weight: bold; margin-bottom: 10px;">
                      Strategic Upgrade
                    </div>
                    <h3 style="font-family: 'Georgia', serif; font-size: 18px; color: #FFFFFF; margin: 0 0 10px 0; font-weight: bold;">
                      Ready for the complete blueprint?
                    </h3>
                    <p style="color: #94A3B8; font-size: 13px; line-height: 1.6; margin: 0 0 20px 0;">
                      Transition from general understanding to complete readiness. Access the full 100-Question VAWA Masterpiece Design containing extensive USCIS preparation guidelines.
                    </p>
                    <a href="https://ais-pre-m7qky7xz3xn5xqxlv426ei-24487513203.europe-west3.run.app/shop" target="_blank" style="color: #C5A059; font-weight: bold; font-size: 12px; text-decoration: none; text-transform: uppercase; letter-spacing: 1px;">
                      Explore Full Academy Pack ($59) &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 30px 40px;">
              <p style="font-size: 14px; color: #64748B; margin: 0 0 5px 0;">
                To keeping your timeline, strategy, and freedom aligned,
              </p>
              <p style="font-size: 15px; font-weight: bold; color: #0F172A; margin: 0;">
                The CyAzor Digital Law Team
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 30px 40px 40px 40px; text-align: center;">
              <p style="font-size: 11px; color: #94A3B8; line-height: 1.6; margin: 0 0 20px 0; text-transform: uppercase; letter-spacing: 0.5px;">
                Safety Warning: Always perform browsing and research functions using secure devices. If you need safety resources or support, contact confidential domestic help lines.
              </p>
              <p style="font-size: 10px; color: #94A3B8; line-height: 1.6; margin: 0 0 25px 0;">
                Disclaimer: CyAzor Digital Law is an educational/resources platform operating at the intersection of technology and information. We do not operate as a legal practice, provide legal representation, or offer client representation. Accessing educational guides does not form an attorney-client relationship.
              </p>
              <p style="font-size: 11px; color: #94A3B8; margin: 0;">
                &copy; 2026 CyAzor Digital Law. All Rights Reserved. <br>
                You are receiving this email because you registered on our platform. <br>
                <a href="{{Unsubscribe_Link}}" target="_blank" style="color: #C5A059; text-decoration: underline; margin-top: 10px; display: inline-block;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
                    text_content: 'Welcome to the Academy Portal! Your digital access pass to the VAWA Protection Guide (Intro Edition) has been provisioned. Open your interactive reader here: https://ais-pre-m7qky7xz3xn5xqxlv426ei-24487513203.europe-west3.run.app/vawa-free-reader'
                };
            } else if (siteKey === 'cybarprep') {
                template = {
                    subject: 'Your Free California Bar Exam Study Kit is ready 📝',
                    html_content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Free California Bar Exam Study Kit is ready 📝</title>
  <style>
    body { background-color: #FDFDFD; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 0; }
  </style>
</head>
<body style="background-color: #FDFDFD; margin: 0; padding: 0;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FDFDFD; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
          <tr>
            <td align="center" style="background-color: #B91C1C; padding: 30px;">
              <span style="font-family: 'Georgia', serif; font-size: 24px; font-weight: bold; color: #FFFFFF; letter-spacing: 1px;">CY BAR PREP</span>
              <div style="font-size: 10px; color: #FFD2D2; text-transform: uppercase; letter-spacing: 3px; margin-top: 5px; font-weight: bold;">PASS THE BAR WITH CONFIDENCE</div>
            </td>
          </tr>
          <tr>
            <td style="padding: 45px 40px 30px 40px;">
              <p style="font-size: 15px; color: #334155; line-height: 1.6;">Hello {{name}},</p>
              <p style="font-size: 15px; color: #334155; line-height: 1.6;">Thank you for subscribing to <strong>CY Bar Prep</strong>. Our ultimate goal is to streamline your study timeline and build deep conceptual clarity so you can conquer the Bar Exam.</p>
              <p style="font-size: 15px; color: #334155; line-height: 1.6;">We have prepared your secure legal study toolkit, and it is now ready for you to access.</p>
              <div style="text-align: center; margin: 35px 0;">
                <a href="https://cybarprep.com/free-resources" target="_blank" style="background-color: #B91C1C; color: #FFFFFF; text-decoration: none; padding: 14px 28px; font-size: 13px; font-weight: bold; border-radius: 8px; letter-spacing: 1px; display: inline-block; text-transform: uppercase;">Access Study Kit</a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 30px 40px; text-align: center;">
              <p style="font-size: 11px; color: #64748B; line-height: 1.5; margin: 0;">&copy; 2026 CY Bar Prep. All Rights Reserved. You are receiving this because you registered on our platform.<br/><a href="{{Unsubscribe_Link}}" target="_blank" style="color: #B91C1C; text-decoration: underline; margin-top: 8px; display: inline-block;">Unsubscribe</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
                    text_content: 'Thank you for subscribing to CY Bar Prep. Your legal study kit is ready for you to access: https://cybarprep.com/free-resources'
                };
            } else if (siteKey === 'cylawtech') {
                template = {
                    subject: 'Your Free LawTech Automation Checklist is inside ⚙️',
                    html_content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Free LawTech Automation Checklist is inside ⚙️</title>
  <style>
    body { background-color: #FAFBFD; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 0; }
  </style>
</head>
<body style="background-color: #FAFBFD; margin: 0; padding: 0;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FAFBFD; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
          <tr>
            <td align="center" style="background-color: #1D4ED8; padding: 30px;">
              <span style="font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 24px; font-weight: bold; color: #FFFFFF; letter-spacing: 1px;">CY LAW TECH</span>
              <div style="font-size: 10px; color: #D1E2FF; text-transform: uppercase; letter-spacing: 3px; margin-top: 5px; font-weight: bold;">AUTOMATING THE FUTURE OF LAW</div>
            </td>
          </tr>
          <tr>
            <td style="padding: 45px 40px 30px 40px;">
              <p style="font-size: 15px; color: #334155; line-height: 1.6;">Hello {{name}},</p>
              <p style="font-size: 15px; color: #334155; line-height: 1.6;">Welcome to <strong>CY Law Tech</strong>! We are excited to have you on board with our network of modern legal engineers, software architects, and practitioners.</p>
              <p style="font-size: 15px; color: #334155; line-height: 1.6;">As requested, we have prepared our premium Automation Checklist guiding code/document integration pipelines designed for high scalability.</p>
              <div style="text-align: center; margin: 35px 0;">
                <a href="https://cylawtech.com/checklist" target="_blank" style="background-color: #1D4ED8; color: #FFFFFF; text-decoration: none; padding: 14px 28px; font-size: 13px; font-weight: bold; border-radius: 8px; letter-spacing: 1px; display: inline-block; text-transform: uppercase;">Get Checklist Booklet</a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 30px 40px; text-align: center;">
              <p style="font-size: 11px; color: #64748B; line-height: 1.5; margin: 0;">&copy; 2026 CY Law Tech. All Rights Reserved. You are receiving this because you registered on our platform.<br/><a href="{{Unsubscribe_Link}}" target="_blank" style="color: #1D4ED8; text-decoration: underline; margin-top: 8px; display: inline-block;">Unsubscribe</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
                    text_content: 'Welcome to CY Law Tech! Your free Legal Automation Checklist booklet has been prepared: https://cylawtech.com/checklist'
                };
            } else {
                template = {
                    subject: 'Welcome to our newsletter! 🎉',
                    html_content: '<h3>Welcome aboard!</h3><p>Hi {{name}},</p><p>Thank you for subscribing to our updates. We are excited to have you on board!</p><p>We will keep you updated with the latest news, tutorials, and exclusive highlights.</p>',
                    text_content: 'Welcome! Thank you for subscribing. We will keep you updated with the latest news.'
                };
            }
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

    // 4. Determine Sender Address (Support verified domains with fallback support utilizing one sending domain)
    let baseDomain = 'cylawtech.com'; // Default verified sandbox domain
    const defaultSender = process.env.SENDER_EMAIL || 'hello@cylawtech.com';
    if (defaultSender && defaultSender.includes('@')) {
        baseDomain = defaultSender.split('@')[1];
    }

    let senderName = config.senderName;
    // To guarantee delivery to live mailboxes, use the verified SENDER_EMAIL directly.
    // This supports single-sender verification formats of Resend gracefully.
    let senderEmail = defaultSender;
    let replyTo = `support@${siteKey}.com`;

    // Allow fine-grained override via environment variables if desired
    const customSenderEmail = process.env[`SENDER_EMAIL_${siteKey.toUpperCase()}`];
    const customSenderName = process.env[`SENDER_NAME_${siteKey.toUpperCase()}`];
    const customReplyTo = process.env[`REPLY_TO_EMAIL_${siteKey.toUpperCase()}`];

    if (customSenderEmail) {
        senderEmail = customSenderEmail;
    }
    if (customSenderName) {
        senderName = customSenderName;
    }
    if (customReplyTo) {
        replyTo = customReplyTo;
    }

    const fromAddress = `"${senderName}" <${senderEmail}>`;

    // 5. Send via Resend with auto-retry on temporary rate limits or socket failure
    try {
        await retryOperation(() => getResend().emails.send({
            from: fromAddress,
            to,
            subject: rendered.subject,
            html: rendered.html,
            text: rendered.text,
            replyTo: replyTo,
            headers: {
                'List-Unsubscribe': `<https://${siteKey}.com/unsubscribe?email=${encodeURIComponent(to)}>`,
                'X-Entity-ID': `${siteKey}-${Date.now()}`
            }
        }));
        await logEmail(to, rendered.subject, rendered.text, templateName, 'sent');
    } catch (resendErr: any) {
        console.warn(`Attempting send with ${senderEmail} failed, falling back to onboarding@resend.dev...`, resendErr.message);
        // Fallback for unverified system testing
        try {
            await retryOperation(() => getResend().emails.send({
                from: `onboarding@resend.dev`,
                to,
                subject: rendered.subject,
                html: rendered.html,
                text: rendered.text,
                replyTo: replyTo,
                headers: {
                    'List-Unsubscribe': `<https://${siteKey}.com/unsubscribe?email=${encodeURIComponent(to)}>`
                }
            }));
            await logEmail(to, rendered.subject, rendered.text, templateName, 'sent');
        } catch (fallbackErr: any) {
            console.error("Critical: Fallback email send failed as well:", fallbackErr.message);
            await logEmail(to, rendered.subject, rendered.text, templateName, 'failed');
            throw fallbackErr;
        }
    }
}
