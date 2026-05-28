/**
 * GoalsMemo — sticky-note style checklist of session goals, designed
 * to live inside a FloatingPanel in focus mode.
 *
 * The drag handle is the parent FloatingPanel's header, so this component
 * just renders the list and handles toggles.
 */
import { useState } from 'react';
import { Check, Plus } from 'lucide-react';
import type { SessionGoal } from '../../lib/store';

interface GoalsMemoProps {
  goals:        SessionGoal[];
  accent:       string;
  onToggleGoal: (id: string) => void;
  onAddGoal:    (text: string) => void;
}

export function GoalsMemo({ goals, accent, onToggleGoal, onAddGoal }: GoalsMemoProps) {
  const [draft, setDraft] = useState('');
  const doneCount = goals.filter((g) => g.done).length;

  const commit = () => {
    const text = draft.trim();
    if (!text) return;
    onAddGoal(text);
    setDraft('');
  };

  return (
    <div>
      {/* Slim progress bar at the top of the body */}
      <div className="h-1 bg-black/40">
        <div
          className="h-full transition-all duration-500"
          style={{
            width:           goals.length ? `${(doneCount / goals.length) * 100}%` : '0%',
            backgroundColor: accent,
          }}
        />
      </div>

      {goals.length === 0 && (
        <p className="px-4 py-3 text-xs" style={{ color: 'rgba(255,255,255,0.40)' }}>
          No goals yet — add one below.
        </p>
      )}

      <div>
        {goals.map((g) => (
          <button
            key={g.id}
            onClick={() => onToggleGoal(g.id)}
            className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors border-b border-white/5 last:border-b-0"
          >
            <span
              className="w-4 h-4 mt-0.5 rounded-full border flex items-center justify-center flex-shrink-0 transition-all"
              style={{
                borderColor:     g.done ? accent : 'rgba(255,200,120,0.35)',
                backgroundColor: g.done ? accent : 'transparent',
              }}
            >
              {g.done && <Check size={9} color="white" strokeWidth={3} />}
            </span>
            <span
              className="text-sm flex-1 leading-snug"
              style={{
                color:           g.done ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.92)',
                textDecoration:  g.done ? 'line-through' : undefined,
              }}
            >
              {g.text}
            </span>
          </button>
        ))}
      </div>

      {/* Add goal input */}
      <div className="flex items-center gap-2 px-3 py-2 border-t border-white/10">
        <input
          type="text"
          placeholder="Add a goal…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && commit()}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/30"
          style={{ color: 'rgba(255,255,255,0.85)' }}
        />
        <button
          onClick={commit}
          disabled={!draft.trim()}
          className="p-1 rounded-md transition-colors disabled:opacity-30"
          style={{ color: accent }}
          title="Add goal"
        >
          <Plus size={15} />
        </button>
      </div>
    </div>
  );
}
