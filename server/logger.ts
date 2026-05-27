import { supabaseAdmin } from './supabase.js';

export async function logEmail(to: string, subject: string, message: string, type: string, status: string) {
    try {
        await supabaseAdmin.from('email_logs').insert({
            to,
            subject,
            message,
            type,
            status,
            created_at: new Date().toISOString()
        });
    } catch (error) {
        console.error('Failed to log email:', error);
    }
}
