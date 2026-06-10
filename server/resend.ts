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
