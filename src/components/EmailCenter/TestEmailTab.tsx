import React, { useState } from 'react';
import { Send, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export function TestEmailTab() {
  const [to, setTo] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; msg: string } | null>(null);

  const handleTestSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!to || !to.includes('@')) {
      setResult({ success: false, msg: 'Please provide a valid recipient email address.' });
      return;
    }
    setSending(true);
    setResult(null);

    try {
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: to }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setResult({ success: true, msg: 'Outbound test email successfully dispatched via Resend SDK!' });
      } else {
        setResult({ success: false, msg: data.error || 'The mail delivery system rejected the test request.' });
      }
    } catch (err: any) {
      setResult({ success: false, msg: err.message || 'Outbound HTTP dispatch sequence failed.' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs space-y-4 max-w-2xl">
      <div>
        <h4 className="font-bold text-sm text-zinc-900">Direct Delivery Tester</h4>
        <p className="text-xs text-zinc-500 mt-1">Dispatches a secure sandbox newsletter message immediately using the verified mail server host.</p>
      </div>

      <form onSubmit={handleTestSend} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-zinc-500 uppercase">Target Email Address</label>
          <input
            type="email"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="test-recipient@domain.com"
            className="w-full text-xs py-2.5 px-3 bg-zinc-50 focus:bg-white border border-zinc-200 focus:border-indigo-500 rounded-lg text-zinc-800 font-medium transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={sending}
          className="px-4 py-2 bg-zinc-900 hover:bg-zinc-850 text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
        >
          {sending ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Transmitting...
            </>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" /> Dispatch Test Email
            </>
          )}
        </button>
      </form>

      {result && (
        <div className={`p-4 rounded-lg flex items-start gap-2.5 border text-xs leading-relaxed ${result.success ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'}`}>
          {result.success ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
          <div>
            <p className="font-bold">{result.success ? 'Outbound Transmission Successful' : 'Outbound Transmission Failed'}</p>
            <p className="mt-0.5">{result.msg}</p>
          </div>
        </div>
      )}
    </div>
  );
}
