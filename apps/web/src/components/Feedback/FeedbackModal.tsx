/**
 * FeedbackModal — lightweight bug-report / feedback form.
 *
 * Submissions land in the public.feedback table in Supabase. RLS lets
 * anyone insert but nobody read except the project owner via the
 * dashboard (service_role bypasses RLS). No third-party email service
 * needed — check the table in Supabase periodically.
 */
import { useState } from 'react';
import { X, Bug, Lightbulb, MessageSquare, Send, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAppStore } from '../../lib/store';

type Category = 'bug' | 'feature' | 'general';

const CATEGORIES: { value: Category; label: string; icon: React.ReactNode; hint: string }[] = [
  { value: 'bug',     label: 'Bug',     icon: <Bug       size={14} />, hint: 'Something is broken' },
  { value: 'feature', label: 'Feature', icon: <Lightbulb size={14} />, hint: 'I wish tenK could…' },
  { value: 'general', label: 'General', icon: <MessageSquare size={14} />, hint: 'Anything else' },
];

interface FeedbackModalProps {
  onClose: () => void;
}

export function FeedbackModal({ onClose }: FeedbackModalProps) {
  const { userId } = useAppStore();

  const [category, setCategory] = useState<Category>('bug');
  const [message,  setMessage]  = useState('');
  const [email,    setEmail]    = useState('');
  const [sending,  setSending]  = useState(false);
  const [sent,     setSent]     = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const submit = async () => {
    if (!message.trim()) {
      setError('Please write a message before sending.');
      return;
    }
    setSending(true);
    setError(null);

    const { error: insertError } = await supabase.from('feedback').insert({
      user_id:     userId ?? null,
      email:       email.trim() || null,
      category,
      message:     message.trim(),
      url:         typeof window !== 'undefined' ? window.location.href : null,
      user_agent:  typeof navigator !== 'undefined' ? navigator.userAgent : null,
      app_version: import.meta.env.VITE_APP_VERSION ?? null,
    });

    setSending(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }
    setSent(true);
    // Auto-close after the confirmation lingers a moment
    setTimeout(onClose, 1800);
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center px-4 py-6"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: '#7c6cf022', color: '#7c6cf0' }}
            >
              <MessageSquare size={16} />
            </div>
            <div>
              <p className="text-text-primary font-semibold text-sm">
                Send feedback
              </p>
              <p className="text-[11px] text-text-dim mt-0.5">
                Help me make tenK better.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-text-muted hover:text-text-secondary hover:bg-bg-elevated transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {sent ? (
          /* ── Confirmation ── */
          <div className="px-5 py-8 text-center">
            <div
              className="w-14 h-14 mx-auto mb-3 rounded-full flex items-center justify-center"
              style={{ backgroundColor: '#4cdf9022', color: '#4cdf90' }}
            >
              <Check size={26} />
            </div>
            <p className="text-text-primary font-semibold text-base mb-1">
              Thanks — got it!
            </p>
            <p className="text-text-muted text-xs">
              Your feedback has been recorded.
            </p>
          </div>
        ) : (
          <>
            {/* Body */}
            <div className="px-5 py-4 space-y-4">

              {/* Category */}
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">
                  What is this about?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setCategory(c.value)}
                      type="button"
                      title={c.hint}
                      className={`py-2 rounded-lg text-xs font-medium border flex flex-col items-center gap-1 transition-all ${
                        category === c.value
                          ? 'border-accent bg-accent/10 text-accent'
                          : 'border-border bg-bg-card text-text-muted hover:text-text-secondary'
                      }`}
                    >
                      {c.icon}
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">
                  Tell me more
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  maxLength={5000}
                  placeholder={
                    category === 'bug'
                      ? 'What did you try, what happened, what did you expect?'
                      : category === 'feature'
                      ? 'What would you like tenK to do?'
                      : "What's on your mind?"
                  }
                  className="input text-sm resize-none"
                />
                <p className="text-[10px] text-text-dim mt-1 text-right tabular-nums">
                  {message.length} / 5000
                </p>
              </div>

              {/* Email — only ask if not signed in */}
              {!userId && (
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">
                    Your email <span className="text-text-dim font-normal">(optional, if you'd like a reply)</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="input text-sm"
                  />
                </div>
              )}

              {error && (
                <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-md px-3 py-2">
                  {error}
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 bg-bg-elevated border-t border-border flex items-center justify-end gap-2">
              <button
                onClick={onClose}
                className="px-3 py-2 rounded-lg text-xs font-medium text-text-muted hover:text-text-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={sending || !message.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white transition-all disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #7c6cf0, #5d4dc7)' }}
              >
                <Send size={12} />
                {sending ? 'Sending…' : 'Send'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
