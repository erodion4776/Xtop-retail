import { Resend } from "resend";
import dotenv from "dotenv";
dotenv.config({ silent: true });

let resendClient: Resend | null = null;

export function getResend() {
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

/**
 * Retries an asynchronous operation with exponential backoff.
 * Useful for handling temporary failures like rate limits or socket timeouts.
 */
export async function retryOperation<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
    try {
        return await fn();
    } catch (error: any) {
        if (retries <= 0) {
            console.error("Operation failed after final retry attempt. Error:", error);
            throw error;
        }
        console.warn(`Temporary error encountered: ${error.message || error}. Retrying in ${delay}ms... (${retries} retries left)`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return retryOperation(fn, retries - 1, delay * 2);
    }
}
