import { getSiteConfig } from './emailConfig.js';

export function renderTemplate(template: { html_content: string; text_content: string; subject: string }, siteKey: string, variables: Record<string, string>) {
    const config = getSiteConfig(siteKey);
    if (!config) throw new Error("Tenant not found");

    const wrapperHtml = (content: string) => `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;border: 1px solid #ddd;border-radius: 8px;overflow: hidden;">
        <div style="background-color:${config.primaryColor};padding:20px;text-align:center;">
             <img src="${config.logo}" style="width:50px;height:50px;border-radius:50%;" />
        </div>
        <div style="padding:20px;">
            ${content}
            <p>Best regards,<br/><strong>${config.senderName}</strong></p>
        </div>
        <div style="font-size:12px;color:#888;padding:10px;text-align:center;">
            <a href="${config.website}">${config.brandName}</a>
        </div>
    </div>`;

    const replaceVars = (str: string) => {
        let res = str;
        res = res.replace(/{{name}}/g, variables.name || 'there');
        res = res.replace(/{{email}}/g, variables.email || '');
        res = res.replace(/{{website_name}}/g, config.brandName);
        return res;
    };

    return {
        subject: replaceVars(template.subject),
        html: wrapperHtml(replaceVars(template.html_content)),
        text: replaceVars(template.text_content)
    };
}
