import { supabaseAdmin } from './supabase.js';
import { sendEmail } from './emailService.js';

export async function createCampaign(tenantId: string, name: string, subject: string, html: string, text: string) {
    const { data: campaign, error } = await supabaseAdmin
        .from('campaigns')
        .insert({ tenant_id: tenantId, name, subject, html_content: html, text_content: text })
        .select()
        .single();
    
    if (error) throw error;
    return campaign;
}

export async function getContactsByTenant(tenantId: string) {
    const { data, error } = await supabaseAdmin
        .from('subscribers')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('status', 'active');
    
    if (error) throw error;
    return data;
}

export async function sendCampaignEmails(campaignId: string) {
    // 1. Get campaign and tenant info
    const { data: campaign, error: capError } = await supabaseAdmin
        .from('campaigns')
        .select('*, tenants!inner(site_key)')
        .eq('id', campaignId)
        .single();

    if (capError) throw capError;

    // 2. Get active subscribers for this tenant
    const subscribers = await getContactsByTenant(campaign.tenant_id);

    // 3. Mark as sending
    await supabaseAdmin.from('campaigns').update({ status: 'sending' }).eq('id', campaignId);

    // 4. Batch send emails
    const batchSize = 10;
    for (let i = 0; i < subscribers.length; i += batchSize) {
        const batch = subscribers.slice(i, i + batchSize);
        
        await Promise.all(batch.map(async (sub) => {
            try {
                await sendEmail({
                    siteKey: campaign.tenants.site_key,
                    to: sub.email,
                    templateName: 'campaign', // Special type for campaigns
                    variables: { name: 'Subscriber', email: sub.email, message: campaign.html_content }
                });
                
                await supabaseAdmin.from('campaign_recipients').insert({
                    campaign_id: campaignId,
                    subscriber_id: sub.id,
                    status: 'sent',
                    sent_at: new Date().toISOString()
                });
            } catch (e) {
                console.error(`Failed to send to ${sub.email}`, e);
                await supabaseAdmin.from('campaign_recipients').insert({
                    campaign_id: campaignId,
                    subscriber_id: sub.id,
                    status: 'failed'
                });
            }
        }));

        // Delay between batches
        if (i + batchSize < subscribers.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    // 5. Update campaign status
    await supabaseAdmin.from('campaigns').update({ status: 'sent' }).eq('id', campaignId);
}
