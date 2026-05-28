import { useState, useRef } from 'react';
import { X, Upload, Check, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { setCarriedGoals } from '../../lib/goalCarryOver';
import { useT } from '../../i18n';
import type { Skill } from '@tenk/shared';
import type { SessionGoal } from '../../lib/store';

interface EvidenceModalProps {
  sessionId:       string;
  durationSeconds: number;
  skill:           Skill;
  goals:           SessionGoal[];
  /** Mutating goals here also mutates the store, so the running-card
   *  checklist stays in sync until the timer state is cleared. */
  onToggleGoal:    (id: string) => void;
  onSubmit:        () => void;
  onSkip:          () => void;
  onClose:         () => void;
}

export function EvidenceModal({
  sessionId, durationSeconds, skill, goals, onToggleGoal, onSubmit, onSkip, onClose,
}: EvidenceModalProps) {
  const t = useT();
  const [notes,      setNotes]      = useState('');
  const [imageUrls,  setImageUrls]  = useState<string[]>([]);
  const [uploading,  setUploading]  = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  /* Unfinished-goals confirmation flow:
   *   'idle'   — first Submit click. If there are unchecked goals,
   *              flips to 'asking' and shows the prompt.
   *   'asking' — user can mark them done OR carry them over.
   *   'resolved' — past the prompt; Submit proceeds normally. */
  const [unfinishedState, setUnfinishedState] = useState<'idle' | 'asking' | 'resolved'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const unfinishedGoals = goals.filter((g) => !g.done);

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m ${s}s`;
  };

  /* Build the memo content: goals checklist (if any) followed by the
   * user's free-form notes. Stored as plain text so it renders nicely
   * back in History without needing a markdown parser. */
  const buildMemoContent = (): string => {
    const parts: string[] = [];
    if (goals.length > 0) {
      parts.push('Goals:');
      for (const g of goals) {
        parts.push(`${g.done ? '☑' : '☐'} ${g.text}`);
      }
    }
    const trimmed = notes.trim();
    if (trimmed) {
      if (parts.length) parts.push(''); // blank line between goals + notes
      parts.push(trimmed);
    }
    return parts.join('\n');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    setError(null);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('Not authenticated');

      const urls: string[] = [];
      for (const file of files) {
        const ext  = file.name.split('.').pop() || 'jpg';
        const path = `${user.id}/${sessionId}/${Date.now()}.${ext}`;

        const { error: uploadErr } = await supabase.storage
          .from('evidence')
          .upload(path, file, { upsert: false });
        if (uploadErr) throw uploadErr;

        const { data: urlData } = supabase.storage.from('evidence').getPublicUrl(path);
        urls.push(urlData.publicUrl);
      }
      setImageUrls((prev) => [...prev, ...urls]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  /** Called by both "Yes I did them" and "No, carry over" buttons. The
   *  Yes path marks all unfinished goals done first; the No path saves
   *  their texts to carry-over storage so the next session for this
   *  mastery can offer to re-load them. */
  const finalizeSubmit = async (markAllDone: boolean) => {
    if (markAllDone) {
      for (const g of unfinishedGoals) onToggleGoal(g.id);
    } else {
      setCarriedGoals(skill.id, unfinishedGoals.map((g) => ({ text: g.text })));
    }
    setUnfinishedState('resolved');
    /* Tiny delay so React commits the toggled-done state before we
     * read goals in buildMemoContent below. */
    await new Promise((r) => setTimeout(r, 0));
    await persistAndSubmit();
  };

  const handleSubmit = async () => {
    /* Gate behind the unfinished-goals prompt the first time. */
    if (unfinishedState === 'idle' && unfinishedGoals.length > 0) {
      setUnfinishedState('asking');
      return;
    }
    await persistAndSubmit();
  };

  const persistAndSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('Not authenticated');

      const today   = new Date().toISOString().split('T')[0];
      const content = buildMemoContent();

      if (content || imageUrls.length > 0) {
        const { data: memo, error: memoErr } = await supabase
          .from('memos')
          .insert({
            skill_id:   skill.id,
            session_id: sessionId,
            user_id:    user.id,
            content:    content || `Session on ${today}`,
            date:       today,
          })
          .select()
          .single();
        if (memoErr) throw memoErr;

        for (const url of imageUrls) {
          const path = url.split('/storage/v1/object/public/evidence/')[1] || url;
          await supabase.from('memo_media').insert({
            memo_id:      memo.id,
            storage_path: path,
            url,
            media_type:   'image',
          });
        }
      }

      await supabase.from('sessions').update({ verified: true }).eq('id', sessionId);
      onSubmit();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = async () => {
    const unfinished = goals.filter((g) => !g.done);
    if (unfinished.length > 0) {
      setCarriedGoals(skill.id, unfinished.map((g) => ({ text: g.text })));
    }
    await supabase.from('sessions').update({ verified: false }).eq('id', sessionId);
    onSkip();
  };

  const doneCount = goals.filter((g) => g.done).length;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-text-primary font-semibold text-lg">Session Complete!</h2>
            <p className="text-text-muted text-sm mt-0.5">
              {skill.name} · {formatDuration(durationSeconds)}
            </p>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <X size={18} />
          </button>
        </div>

        {/* ── Goals review (only if any were set before the session) ── */}
        {goals.length > 0 && (
          <div className="mb-4 rounded-xl border border-border overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 bg-bg-elevated border-b border-border">
              <span className="text-sm font-medium text-text-secondary">Session Goals</span>
              <span className="text-xs text-text-muted tabular-nums">
                {doneCount}/{goals.length} done
              </span>
            </div>
            <div className="divide-y divide-border">
              {goals.map((goal) => (
                <button
                  key={goal.id}
                  type="button"
                  onClick={() => onToggleGoal(goal.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-bg-elevated transition-colors"
                >
                  <span
                    className="w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 transition-all"
                    style={{
                      borderColor:     goal.done ? skill.color : undefined,
                      backgroundColor: goal.done ? skill.color : undefined,
                    }}
                  >
                    {goal.done && <Check size={9} color="white" strokeWidth={3} />}
                  </span>
                  <span
                    className={`text-sm flex-1 leading-snug ${
                      goal.done ? 'text-text-dim line-through' : 'text-text-secondary'
                    }`}
                  >
                    {goal.text}
                  </span>
                </button>
              ))}
            </div>
            <p className="px-3 py-2 text-[11px] text-text-dim bg-bg-elevated/50 border-t border-border">
              Your goals are saved to this session's notes automatically.
            </p>
          </div>
        )}

        {/* Notes */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            {goals.length > 0 ? 'Additional Notes' : 'Session Notes'}
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={
              goals.length > 0
                ? 'Anything else worth remembering?'
                : 'What did you work on? What did you learn?'
            }
            className="input min-h-[100px] resize-none"
          />
        </div>

        {/* Image Upload */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            Evidence Photos
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full border border-dashed border-border rounded-lg p-4 flex items-center justify-center gap-2 text-text-muted hover:border-accent hover:text-accent transition-colors"
          >
            {uploading ? (
              <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            ) : (
              <Upload size={16} />
            )}
            <span className="text-sm">{uploading ? 'Uploading…' : 'Upload photos / videos'}</span>
          </button>

          {imageUrls.length > 0 && (
            <div className="mt-2 flex gap-2 flex-wrap">
              {imageUrls.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={`Evidence ${i + 1}`}
                  className="w-16 h-16 object-cover rounded-lg border border-border"
                />
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm">
            {error}
          </div>
        )}

        {/* Unfinished-goals confirmation — gates Submit until the user
            decides whether to mark them done or carry them to next session. */}
        {unfinishedState === 'asking' && (
          <div className="mb-4 p-3 rounded-lg bg-warning/10 border border-warning/20">
            <div className="flex items-start gap-2 mb-2.5">
              <AlertTriangle size={14} className="text-warning flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-warning">
                  {t('evidence.unfinishedTitle')}
                </p>
                <p className="text-xs text-text-secondary mt-0.5">
                  {t('evidence.unfinishedDesc', {
                    n:      unfinishedGoals.length,
                    plural: unfinishedGoals.length === 1
                      ? t('goalmodal.singularGoal')
                      : t('goalmodal.pluralGoal'),
                  })}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => finalizeSubmit(true)}
                disabled={submitting}
                className="flex-1 py-2 rounded-lg bg-success/10 border border-success/30 text-success text-xs font-semibold hover:bg-success/15 transition-colors"
              >
                {t('evidence.yesFinished')}
              </button>
              <button
                onClick={() => finalizeSubmit(false)}
                disabled={submitting}
                className="flex-1 py-2 rounded-lg bg-bg-elevated border border-border text-text-secondary text-xs font-semibold hover:border-accent hover:text-accent transition-colors"
              >
                {t('evidence.noCarryOver')}
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={handleSkip} className="flex-1 btn-secondary text-sm">
            {t('action.skip')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || unfinishedState === 'asking'}
            className="flex-1 btn-primary text-sm flex items-center justify-center gap-2"
          >
            {submitting && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {t('evidence.submit')}
          </button>
        </div>
      </div>
    </div>
  );
}
