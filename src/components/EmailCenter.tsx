import { useState, useEffect } from 'react';
import { Mail, Users, History, Send, Loader2 } from 'lucide-react';

export default function EmailCenter() {
  const [subscribers, setSubscribers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sendTo, setSendTo] = useState('all');
  const [singleEmail, setSingleEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    const subRes = await fetch('/api/subscribers');
    const logsRes = await fetch('/api/email-logs');
    setSubscribers(await subRes.json());
    setLogs(await logsRes.json());
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSend = async () => {
    setLoading(true);
    await fetch('/api/send-campaign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, message, sendTo, emails: sendTo === 'single' ? [singleEmail] : [] })
    });
    setLoading(false);
    fetchData();
  };

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold">Email Center</h1>
      
      <section className="bg-white p-6 rounded-xl border border-zinc-200">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Send size={18}/> Send Campaign</h2>
        <div className="space-y-4">
            <input className="w-full p-2 border rounded" placeholder="Subject" value={subject} onChange={e => setSubject(e.target.value)} />
            <textarea className="w-full p-2 border rounded" placeholder="Message" value={message} onChange={e => setMessage(e.target.value)} />
            <select className="p-2 border rounded" value={sendTo} onChange={e => setSendTo(e.target.value)}>
                <option value="all">Send to All</option>
                <option value="single">Send to Single</option>
            </select>
            {sendTo === 'single' && <input className="w-full p-2 border rounded" placeholder="Email" value={singleEmail} onChange={e => setSingleEmail(e.target.value)} />}
            <button className="bg-indigo-600 text-white p-2 rounded w-full" onClick={handleSend} disabled={loading}>{loading ? <Loader2 className="animate-spin"/> : 'Send'}</button>
        </div>
      </section>

      <section className="bg-white p-6 rounded-xl border border-zinc-200">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Users size={18}/> Subscribers ({subscribers.length})</h2>
        <div className="space-y-2">
            {subscribers.map((s: any) => <div key={s.id} className="text-sm border-b pb-1">{s.email}</div>)}
        </div>
      </section>

      <section className="bg-white p-6 rounded-xl border border-zinc-200">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><History size={18}/> Email Logs</h2>
        <div className="space-y-2 text-sm">
            {logs.map((l: any, i) => <div key={i} className="flex justify-between border-b pb-1"><span>{l.to} - {l.subject}</span><span className={l.status === 'sent' ? 'text-emerald-600' : 'text-red-600'}>{l.status}</span></div>)}
        </div>
      </section>
    </div>
  );
}
