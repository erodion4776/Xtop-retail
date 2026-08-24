import { supabaseAdmin } from './supabase.js';

/**
 * Creates an entry in the email logs database and returns the created row.
 * Returning the created row data is critical so we can retrieve the unique UUID 
 * and inject its tracking pixel image into our outbound HTML message wrapper.
 */
export async function logEmail(to: string, subject: string, message: string, type: string, status: string) {
    try {
        const { data, error } = await supabaseAdmin
            .from('email_logs')
            .insert({
                to,
                subject,
                message,
                type,
                status,
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            throw error;
        }
        return data;
    } catch (error) {
        console.error('Failed to log email to database:', error);
        return null;
    }
}
