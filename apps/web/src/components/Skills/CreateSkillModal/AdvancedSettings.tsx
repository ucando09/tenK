import { ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import type { SkillGoalType, WeeklySchedule } from '@tenk/shared';

/**
 * AdvancedSettings — goal configuration for the create-skill wizard.
 *
 * Timer mode + pomodoro lengths are NOT here anymore — they're picked
 * per session in the GoalModal. This component only controls the
 * skill's GOAL (Total-Hours vs Exam-Prep).
 */

export interface AdvancedSettingsValue {
  goalType:        SkillGoalType;
  goalHours:       number;
  examDate:        string;          // YYYY-MM-DD, '' if unset
  weeklySchedule:  WeeklySchedule;
}

interface AdvancedSettingsProps {
  expanded: boolean;
  onToggle: () => void;
  value:    AdvancedSettingsValue;
  onChange: (next: AdvancedSettingsValue) => void;
}

const WEEKDAY_DEFS: { key: keyof WeeklySchedule; label: string }[] = [
  { key: 'mon', label: 'Mon' },
  { key: 'tue', label: 'Tue' },
  { key: 'wed', label: 'Wed' },
  { key: 'thu', label: 'Thu' },
  { key: 'fri', label: 'Fri' },
  { key: 'sat', label: 'Sat' },
  { key: 'sun', label: 'Sun' },
];

function sumWeekly(s: WeeklySchedule): number {
  return WEEKDAY_DEFS.reduce((a, { key }) => a + (s[key] ?? 0), 0);
}

export function AdvancedSettings({ expanded, onToggle, value, onChange }: AdvancedSettingsProps) {
  const set = <K extends keyof AdvancedSettingsValue>(k: K, v: AdvancedSettingsValue[K]) =>
    onChange({ ...value, [k]: v });

  const weeklyTotal = sumWeekly(value.weeklySchedule);

  return (
    <>
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors w-full"
      >
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        Goal settings
        <span className="text-text-dim ml-1">
          ·{' '}
          {value.goalType === 'exam'
            ? `exam prep · ${weeklyTotal}h/wk`
            : `${value.goalHours.toLocaleString()} hr goal`}
        </span>
      </button>

      {expanded && (
        <div className="space-y-4 p-4 rounded-xl bg-bg-elevated border border-border">

          {/* Goal type */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Goal Type
            </label>
            <div className="flex gap-2">
              {([
                { v: 'hours' as const, label: 'Total Hours', hint: 'Open-ended target like 10,000 hr' },
                { v: 'exam'  as const, label: 'Exam Prep',   hint: 'Plan around a fixed exam date' },
              ]).map((opt) => (
                <button
                  key={opt.v}
                  type="button"
                  onClick={() => set('goalType', opt.v)}
                  title={opt.hint}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    value.goalType === opt.v
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-border bg-bg-card text-text-muted hover:text-text-secondary'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {value.goalType === 'hours' && (
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                Goal Hours
              </label>
              <input
                type="number"
                value={value.goalHours}
                onChange={(e) => set('goalHours', Number(e.target.value))}
                min={1}
                max={100000}
                className="input text-sm"
              />
            </div>
          )}

          {value.goalType === 'exam' && (
            <>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5 flex items-center gap-1.5">
                  <Calendar size={11} />
                  Exam Date
                </label>
                <input
                  type="date"
                  value={value.examDate}
                  onChange={(e) => set('examDate', e.target.value)}
                  className="input text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">
                  Hours per Weekday
                  <span className="ml-1.5 text-text-dim font-normal">· {weeklyTotal}h/wk planned</span>
                </label>
                <div className="grid grid-cols-7 gap-1.5">
                  {WEEKDAY_DEFS.map(({ key, label }) => (
                    <div key={key} className="text-center">
                      <div className="text-[10px] text-text-dim mb-1">{label}</div>
                      <input
                        type="number"
                        value={value.weeklySchedule[key] ?? 0}
                        onChange={(e) =>
                          set('weeklySchedule', {
                            ...value.weeklySchedule,
                            [key]: Math.max(0, Number(e.target.value)),
                          })
                        }
                        min={0}
                        max={24}
                        step={0.5}
                        className="input text-xs text-center px-1 py-1.5"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <p className="text-[11px] text-text-dim leading-snug">
            Timer mode (pomodoro / countdown / stopwatch) and length are picked
            each time you press <span className="text-text-muted">Start</span>,
            not stored on the skill.
          </p>
        </div>
      )}
    </>
  );
}
