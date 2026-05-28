/**
 * TimerConfigPicker — inline UI inside GoalModal for choosing this
 * session's timer mode + lengths. Doesn't touch the skill — config
 * lives in the store and applies only to the upcoming session.
 */
import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { SessionTimerConfig, SessionTimerMode } from '../../lib/store';

interface TimerConfigPickerProps {
  value:    SessionTimerConfig;
  onChange: (next: SessionTimerConfig) => void;
}

const MODE_OPTIONS: { value: SessionTimerMode; emoji: string; label: string; hint: string }[] = [
  { value: 'pomodoro',  emoji: '🍅', label: 'Pomodoro',  hint: 'Cycles of focus + break.' },
  { value: 'countdown', emoji: '⏱',  label: 'Countdown', hint: 'One fixed-length block.' },
  { value: 'stopwatch', emoji: '⏲',  label: 'Stopwatch', hint: 'Open-ended, count up.' },
];

export function TimerConfigPicker({ value, onChange }: TimerConfigPickerProps) {
  /* Length fields collapse by default once a mode is chosen — most users
   * stick with the last config; pop open the disclosure to tweak. */
  const [expanded, setExpanded] = useState(false);

  const set = <K extends keyof SessionTimerConfig>(k: K, v: SessionTimerConfig[K]) =>
    onChange({ ...value, [k]: v });

  const summary = (() => {
    switch (value.mode) {
      case 'pomodoro':
        return `🍅 ${value.workMinutes}m work · ${value.breakMinutes}m break × ${value.sessions} sessions`;
      case 'countdown':
        return `⏱ ${value.countdownMinutes}-minute countdown`;
      case 'stopwatch':
        return '⏲ Stopwatch — count up';
    }
  })();

  return (
    <div className="mb-4">
      <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
        Timer for this session
      </label>

      {/* Mode pills */}
      <div className="flex gap-1.5 mb-2.5">
        {MODE_OPTIONS.map((opt) => {
          const selected = opt.value === value.mode;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => set('mode', opt.value)}
              title={opt.hint}
              className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-medium border transition-all ${
                selected
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border bg-bg-elevated text-text-muted hover:text-text-secondary hover:border-text-dim'
              }`}
            >
              <span className="text-sm">{opt.emoji}</span>
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Disclosure summary + chevron */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs text-text-muted hover:text-text-secondary hover:bg-bg-elevated transition-colors"
      >
        <span className="truncate text-left">{summary}</span>
        {expanded
          ? <ChevronUp   size={13} className="flex-shrink-0" />
          : <ChevronDown size={13} className="flex-shrink-0" />}
      </button>

      {expanded && (
        <div className="mt-2 p-3 rounded-lg bg-bg-elevated border border-border">
          {value.mode === 'pomodoro' && (
            <div className="grid grid-cols-3 gap-2">
              <NumberField
                label="Work (min)"  value={value.workMinutes}
                onChange={(v) => set('workMinutes', v)} min={1} max={120}
              />
              <NumberField
                label="Break (min)" value={value.breakMinutes}
                onChange={(v) => set('breakMinutes', v)} min={1} max={60}
              />
              <NumberField
                label="Sessions"    value={value.sessions}
                onChange={(v) => set('sessions', v)} min={1} max={12}
              />
            </div>
          )}

          {value.mode === 'countdown' && (
            <div className="grid grid-cols-1 gap-2">
              <NumberField
                label="Total minutes" value={value.countdownMinutes}
                onChange={(v) => set('countdownMinutes', v)} min={1} max={480}
              />
            </div>
          )}

          {value.mode === 'stopwatch' && (
            <p className="text-[11px] text-text-dim">
              No length to set — the timer counts up until you stop it.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

interface NumberFieldProps {
  label:    string;
  value:    number;
  onChange: (v: number) => void;
  min:      number;
  max:      number;
}

function NumberField({ label, value, onChange, min, max }: NumberFieldProps) {
  return (
    <div>
      <label className="block text-[10px] text-text-muted mb-1">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min}
        max={max}
        className="input text-sm text-center"
      />
    </div>
  );
}
