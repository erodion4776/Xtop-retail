import { getSiteConfig } from './emailConfig.js';

export function renderTemplate(template: { html_content: string; text_content: string; subject: string }, siteKey: string, variables: Record<string, string>) {
    const config = getSiteConfig(siteKey);
    if (!config) throw new Error("Tenant not found");

    // Professional HTML template wrapper ensuring deliverability, proper meta, style, and footers.
    const wrapperHtml = (content: string) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${replaceVars(template.subject)}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      width: 100% !important;
      background-color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #334155;
    }
    table {
      border-collapse: collapse;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      overflow: hidden;
      margin-top: 40px;
      margin-bottom: 40px;
    }
    .header {
      background-color: ${config.primaryColor};
      padding: 30px;
      text-align: center;
    }
    .logo {
      width: 52px;
      height: 52px;
      border-radius: 50%;
      border: 2px solid rgba(255, 255, 255, 0.2);
    }
    .content {
      padding: 40px 35px;
      font-size: 15px;
      line-height: 1.6;
      color: #334155;
    }
    .footer {
      background-color: #f1f5f9;
      border-top: 1px solid #e2e8f0;
      padding: 24px 35px;
      text-align: center;
      font-size: 12px;
      color: #64748b;
    }
    .footer a {
      color: ${config.primaryColor};
      text-decoration: none;
      font-weight: 500;
    }
    .btn {
      display: inline-block;
      padding: 11px 24px;
      background-color: ${config.primaryColor};
      color: #ffffff !important;
      text-decoration: none !important;
      border-radius: 6px;
      font-weight: 600;
      font-size: 14px;
      margin: 18px 0;
    }
    .preheader {
      display: none;
      font-size: 1px;
      color: #f8fafc;
      line-height: 1px;
      max-height: 0px;
      max-width: 0px;
      opacity: 0;
      overflow: hidden;
    }
  </style>
</head>
<body>
  <!-- Preheader for email clients -->
  <div class="preheader">
    Important update regarding your account with ${config.brandName}.
  </div>
  <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f8fafc">
    <tr>
      <td align="center">
        <table class="container" cellpadding="0" cellspacing="0" border="0" width="100%">
          <!-- Header -->
          <tr>
            <td class="header" align="center">
              <img src="${config.logo}" alt="${config.brandName} Logo" class="logo" />
              <div style="color: #ffffff; font-size: 18px; font-weight: 700; margin-top: 10px; letter-spacing: 0.5px;">${config.brandName}</div>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td class="content">
              ${content}
              <p style="margin-top:25px; border-top:1px solid #f1f5f9; padding-top:20px;">
                Best regards,<br/>
                <strong>The ${config.senderName}</strong>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td class="footer">
              <p style="margin: 0 0 10px 0; font-weight: 600; color: #475569;">${config.brandName}</p>
              <p style="margin: 0 0 12px 0; line-height: 1.5;">
                Website: <a href="${config.website}">${config.website.replace('https://', '')}</a><br/>
                Contact: <a href="mailto:support@cylawtech.com">support@cylawtech.com</a>
              </p>
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                You are receiving this communication because you subscribed to our service updates.<br/>
                <a href="${config.website}/unsubscribe" style="color: #94a3b8; text-decoration: underline;">Unsubscribe</a> from these mailings at any time.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    function replaceVars(str: string) {
        let res = str;
        res = res.replace(/{{name}}/g, variables.name || 'there');
        res = res.replace(/{{email}}/g, variables.email || '');
        res = res.replace(/{{website_name}}/g, config.brandName);
        
        // Ensure all links point to cylawtech.com when the siteKey is cylawtech
        if (siteKey === 'cylawtech') {
            res = res.replace(/https:\/\/[a-zA-Z0-9.\-_]+/g, (match) => {
                if (match.includes('unsplash.com') || match.includes('ibb.co')) return match; // keep image sources
                return 'https://cylawtech.com';
            });
        }
        return res;
    }

    const isFullHtml = (str: string) => {
        const trimmed = str.trim().toLowerCase();
        return trimmed.startsWith('<!doctype') || trimmed.indexOf('<html') !== -1 || trimmed.indexOf('<body') !== -1;
    };

    const rawHtml = replaceVars(template.html_content);
    const finalHtml = isFullHtml(rawHtml) ? rawHtml : wrapperHtml(rawHtml);
    
    // Create text version with proper company signature and links
    let textBody = replaceVars(template.text_content);
    if (siteKey === 'cylawtech' && !textBody.includes('cylawtech')) {
        textBody += `\n\n---\n${config.brandName}\nWebsite: https://cylawtech.com\nContact: support@cylawtech.com\nUnsubscribe: https://cylawtech.com/unsubscribe`;
    }

    return {
        subject: replaceVars(template.subject),
        html: finalHtml,
        text: textBody
    };
}
