"use client";

import { useEffect, useState } from 'react';
import { Loader2, MessagesSquare, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MessagesAPI } from '@/lib/api';

type MessageItem = {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  type?: 'NOTE' | 'ALERT' | 'REMINDER';
  createdAt: string;
  sender?: { firstName?: string; lastName?: string };
  receiver?: { firstName?: string; lastName?: string };
};

export default function UserMessagesPage() {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [receiverId, setReceiverId] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<'NOTE' | 'ALERT' | 'REMINDER'>('NOTE');

  const loadMessages = async () => {
    setLoading(true);
    setError(null);
    try {
      const res: any = await MessagesAPI.list();
      setMessages(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      setMessages([]);
      setError(err.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const sendMessage = async () => {
    if (!receiverId.trim() || !content.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await MessagesAPI.send({
        receiverId: receiverId.trim(),
        content: content.trim(),
        type,
      });
      setContent('');
      await loadMessages();
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight uppercase flex items-center gap-3">
          <MessagesSquare className="w-8 h-8 text-indigo-500" /> Messages
        </h1>
        <p className="text-slate-400 mt-1 text-[10px] font-black uppercase tracking-widest bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20 inline-block">
          Secure doctor communication
        </p>
      </div>

      {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="bg-slate-900 border-slate-800 lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-white text-lg font-black uppercase tracking-tight flex items-center gap-2">
              <Send className="w-5 h-5 text-indigo-400" /> Send Message
            </CardTitle>
            <CardDescription className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
              Real API dispatch
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <input
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
              placeholder="Receiver user ID"
              value={receiverId}
              onChange={(e) => setReceiverId(e.target.value)}
            />
            <select
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
              value={type}
              onChange={(e) => setType(e.target.value as 'NOTE' | 'ALERT' | 'REMINDER')}
            >
              <option value="NOTE">NOTE</option>
              <option value="ALERT">ALERT</option>
              <option value="REMINDER">REMINDER</option>
            </select>
            <textarea
              className="h-28 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
              placeholder="Write message"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <button
              onClick={sendMessage}
              disabled={busy}
              className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-black uppercase tracking-wider text-white hover:bg-indigo-500 disabled:bg-slate-700"
            >
              {busy ? 'Sending...' : 'Send'}
            </button>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-white text-lg font-black uppercase tracking-tight">Conversation Feed</CardTitle>
            <CardDescription className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
              Live messages from backend
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-8 text-center text-slate-500">
                No messages yet.
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((message) => (
                  <div key={message.id} className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">{message.type || 'NOTE'}</span>
                      <span className="text-[10px] text-slate-500">{new Date(message.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-200">{message.content}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
