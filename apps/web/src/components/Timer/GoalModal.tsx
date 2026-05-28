import { useState, useRef, useEffect } from 'react';
import { X, Plus, Check } from 'lucide-react';
import type { Skill } from '@tenk/shared';
import type { SessionGoal } from '../../lib/store';
import { useAppStore } from '../../lib/store';
import { STUDY_VIBES } from '../../lib/constants';
import { TimerConfigPicker } from './TimerConfigPicker';
import { getCarriedGoals, clearCarriedGoals } from '../../lib/goalCarryOver';

interface GoalModalProps {
  isOpen: boolean;
  skill: Skill;
  /** Called when user is ready to start — receives the goals they set */
  onStart: (goals: SessionGoal[]) => Promise<void>;
  onClose: () => void;
}

export function GoalModal({ isOpen, skill, onStart, onClose }: GoalModalProps) {
  const {
    sessionVibeId, setSessionVibeId,
    sessionTimerConfig, setSessionTimerConfig,
  } = useAppStore();
  const [goals, setGoals]       = useState<SessionGoal[]>([]);
  const [inputText, setInputText] = useState('');
  const [starting, setStarting]  = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset state every time the modal opens, pre-loading any unfinished
  // goals carried over from the previous session for this skill.
  useEffect(() => {
    if (isOpen) {
      const saved = getCarriedGoals(skill.id);
      setGoals(saved.map((g) => ({ id: crypto.randomUUID(), text: g.text, done: false })));
      setInputText('');
      setStarting(false);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOpen, skill.id]);

  const addGoal = () => {
    const text = inputText.trim();
    if (!text) return;
    setGoals((prev) => [
      ...prev,
      { id: crypto.randomUUID(), text, done: false },
    ]);
    setInputText('');
    inputRef.current?.focus();
  };

  const removeGoal = (id: string) =>
    setGoals((prev) => prev.filter((g) => g.id !== id));

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); addGoal(); }
  };

  const handleStart = async () => {
    setStarting(true);
    clearCarriedGoals(skill.id);
    try {
      await onStart(goals);
    } finally {
      setStarting(false);
    }
  };

  if (!isOpen) return null;

  const doneCount = goals.filter((g) => g.done).length;

  return (
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal-content max-w-md w-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-1">
          <div>
            <h2 className="text-text-primary font-bold text-lg">Session Goals</h2>
            <p className="text-text-muted text-sm mt-0.5">
              What do you want to accomplish?
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-text-muted hover:text-text-secondary hover:bg-bg-elevated transition-colors ml-2 flex-shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Skill badge */}
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mt-4 mb-5"
          style={{
            backgroundColor: skill.color + '20',
            color: skill.color,
            border: `1px solid ${skill.color}40`,
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: skill.color }} />
          {skill.name}
        </div>

        {/* Input row */}
        <div className="flex gap-2 mb-3">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write a goal, press Enter to add…"
            maxLength={120}
            className="input flex-1"
          />
          <button
            onClick={addGoal}
            disabled={!inputText.trim()}
            title="Add goal"
            className="px-3 py-2 rounded-lg bg-bg-elevated border border-border text-text-muted
                       hover:text-accent hover:border-accent transition-colors disabled:opacity-30"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Goals list */}
        {goals.length > 0 ? (
          <div className="space-y-2 mb-5 max-h-56 overflow-y-auto pr-1">
            {goals.map((goal, i) => (
              <div
                key={goal.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-bg-elevated border border-border group"
              >
                {/* Bullet number */}
                <span className="text-text-dim text-xs w-4 text-center flex-shrink-0">
                  {i + 1}
                </span>
                {/* Done check (read-only here — only clickable during session) */}
                <span
                  className="w-4 h-4 rounded-full border flex-shrink-0 flex items-center justify-center"
                  style={{ borderColor: skill.color + '60', backgroundColor: skill.color + '10' }}
                >
                  {goal.done && <Check size={10} style={{ color: skill.color }} />}
                </span>
                <span className="flex-1 text-text-primary text-sm leading-snug">{goal.text}</span>
                <button
                  onClick={() => removeGoal(goal.id)}
                  className="text-text-dim hover:text-error transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-5 mb-3 border border-dashed border-border rounded-xl">
            <p className="text-text-dim text-xs">
              No goals yet — start typing above or skip below
            </p>
          </div>
        )}

        {/* Progress hint when goals are set */}
        {goals.length > 0 && doneCount > 0 && (
          <p className="text-xs text-text-muted mb-3 text-center">
            {doneCount} / {goals.length} completed
          </p>
        )}

        {/* ── Timer config (mode + lengths) ── */}
        <TimerConfigPicker value={sessionTimerConfig} onChange={setSessionTimerConfig} />

        {/* ── Study-with-Me vibe picker ── */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
            Background Vibe
          </label>
          <div className="flex gap-1.5 flex-wrap">
            {STUDY_VIBES.map((vibe) => {
              const selected = vibe.id === sessionVibeId;
              return (
                <button
                  key={vibe.id}
                  type="button"
                  onClick={() => setSessionVibeId(vibe.id)}
                  title={vibe.blurb}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs border transition-all ${
                    selected
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-border bg-bg-elevated text-text-muted hover:text-text-secondary hover:border-text-dim'
                  }`}
                >
                  <span>{vibe.icon}</span>
                  {vibe.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Action buttons */}
        <button
          onClick={handleStart}
          disabled={starting}
          className="w-full py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 mb-2"
          style={{
            backgroundColor: skill.color,
            color: 'white',
            boxShadow: `0 0 20px ${skill.color}40`,
            opacity: starting ? 0.7 : 1,
          }}
        >
          {starting && (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          )}
          {goals.length > 0
            ? `Start with ${goals.length} goal${goals.length !== 1 ? 's' : ''}`
            : 'Start Session'}
        </button>

        {goals.length > 0 && (
          <button
            onClick={async () => { await onStart([]); }}
            disabled={starting}
            className="w-full py-2 text-xs text-text-dim hover:text-text-muted transition-colors"
          >
            Start without goals
          </button>
        )}
      </div>
    </div>
  );
}
