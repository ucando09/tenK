import { useState } from 'react';
import { X, Archive, Trash2, Plus, Image, Settings, Save, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { HeatmapCalendar } from '../Calendar/HeatmapCalendar';
import { useSkillMemos } from '../../lib/hooks/useSkills';
import { extractErrorMessage } from '../../lib/utils';
import { computeSkillGoal, sumWeeklySchedule } from '../../lib/skillGoal';
import type { Skill, SkillGoalType, WeeklySchedule } from '@tenk/shared';

interface SkillDetailProps {
  skill: Skill;
  onUpdate: (id: string, updates: Partial<Skill>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onClose: () => void;
}

export function SkillDetail({ skill, onUpdate, onDelete, onClose }: SkillDetailProps) {
  const [showAddMemo, setShowAddMemo] = useState(false);
  const [memoContent, setMemoContent] = useState('');
  const [addingMemo, setAddingMemo] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { memos, addMemo } = useSkillMemos(skill.id);

  const loggedHours = skill.logged_hours ?? 0;
  const goalInfo    = computeSkillGoal(skill);
  const progressPct = goalInfo.progress * 100;

  const handleAddMemo = async () => {
    if (!memoContent.trim()) return;
    setAddingMemo(true);
    try {
      await addMemo(memoContent.trim(), format(new Date(), 'yyyy-MM-dd'));
      setMemoContent('');
      setShowAddMemo(false);
    } finally {
      setAddingMemo(false);
    }
  };

  const handleToggleShelved = async () => {
    await onUpdate(skill.id, {
      status: skill.status === 'active' ? 'shelved' : 'active',
    });
  };

  const handleDelete = async () => {
    await onDelete(skill.id);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content max-w-2xl w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header (pinned) */}
        <div className="flex items-start justify-between mb-4 flex-shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: skill.color }}
              />
              <h2 className="text-text-primary font-semibold text-xl">{skill.name}</h2>
              {skill.status === 'shelved' && (
                <span className="text-xs px-2 py-0.5 rounded bg-bg-elevated border border-border text-text-muted">
                  Shelved
                </span>
              )}
            </div>
            <p className="text-text-muted text-sm" style={{ color: skill.domain?.color }}>
              {skill.domain?.name}
            </p>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body — wraps Stats / Progress / Heatmap / Settings / Memos
            so the inline goal-settings form (which can grow tall in exam mode)
            stays reachable instead of overflowing past the footer. */}
        <div className="flex-1 overflow-y-auto min-h-0 -mr-2 pr-2">

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="bg-bg-elevated rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-text-primary">{loggedHours.toFixed(1)}h</div>
              <div className="text-xs text-text-muted mt-0.5">Logged</div>
            </div>
            <div className="bg-bg-elevated rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-text-primary">{progressPct.toFixed(1)}%</div>
              <div className="text-xs text-text-muted mt-0.5">Complete</div>
            </div>
            <div className="bg-bg-elevated rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-text-primary">
                {goalInfo.hoursRemaining.toFixed(0)}h
              </div>
              <div className="text-xs text-text-muted mt-0.5">
                {skill.goal_type === 'exam' ? 'To plan' : 'Remaining'}
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-2 bg-bg-elevated rounded-full overflow-hidden mb-5">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${progressPct}%`, backgroundColor: skill.color }}
            />
          </div>

          {/* Heatmap */}
          <div className="mb-5">
            <h3 className="text-sm font-medium text-text-secondary mb-2">Activity</h3>
            <HeatmapCalendar mode="skill" skillId={skill.id} compact />
          </div>

          {/* Goal settings (expandable; can grow tall in exam mode) */}
          <SkillTimerSettings skill={skill} onUpdate={onUpdate} />

          {/* Memos */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-text-secondary">Diary Entries</h3>
              <button
                onClick={() => setShowAddMemo((v) => !v)}
                className="flex items-center gap-1.5 text-xs text-accent hover:text-accent-light transition-colors"
              >
                <Plus size={13} />
                Add entry
              </button>
            </div>

            {showAddMemo && (
              <div className="mb-4 p-3 bg-bg-elevated rounded-lg border border-border">
                <textarea
                  value={memoContent}
                  onChange={(e) => setMemoContent(e.target.value)}
                  placeholder="What did you practice today?"
                  className="input min-h-[80px] resize-none text-sm mb-2"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowAddMemo(false)}
                    className="btn-secondary text-xs py-1.5 px-3"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddMemo}
                    disabled={addingMemo || !memoContent.trim()}
                    className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
                  >
                    {addingMemo && (
                      <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                    )}
                    Save
                  </button>
                </div>
              </div>
            )}

            {memos.length === 0 && !showAddMemo && (
              <p className="text-text-dim text-sm text-center py-6">
                No entries yet. Start tracking your practice!
              </p>
            )}

            <div className="space-y-3">
              {memos.map((memo) => (
                <div key={memo.id} className="bg-bg-elevated rounded-lg p-3.5 border border-border">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-text-muted">
                      {format(parseISO(memo.date), 'MMM d, yyyy')}
                    </span>
                  </div>
                  <p className="text-text-secondary text-sm leading-relaxed">{memo.content}</p>
                  {memo.media && memo.media.length > 0 && (
                    <div className="mt-2 flex gap-2 flex-wrap">
                      {memo.media.map((m) => (
                        <div key={m.id} className="relative">
                          {m.media_type === 'image' ? (
                            <img
                              src={m.url}
                              alt="Evidence"
                              className="w-16 h-16 object-cover rounded-lg border border-border"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-lg bg-bg-card border border-border flex items-center justify-center">
                              <Image size={20} className="text-text-muted" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer actions (pinned) */}
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-border flex-shrink-0">
          <div className="flex gap-2">
            <button
              onClick={handleToggleShelved}
              className="flex items-center gap-1.5 text-xs btn-secondary py-1.5 px-3"
            >
              <Archive size={13} />
              {skill.status === 'active' ? 'Shelve' : 'Unshelve'}
            </button>
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1.5 text-xs text-error hover:bg-error/10 border border-error/20 py-1.5 px-3 rounded-lg transition-colors"
              >
                <Trash2 size={13} />
                Delete
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-error">Are you sure?</span>
                <button
                  onClick={handleDelete}
                  className="text-xs text-white bg-error hover:bg-error/90 py-1.5 px-3 rounded-lg transition-colors"
                >
                  Yes, delete
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="text-xs btn-secondary py-1.5 px-3"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
 * SkillTimerSettings — inline editor for the skill's GOAL only.
 *
 * Timer mode / pomodoro length / sessions are NOT on the skill anymore;
 * they're chosen at session start (see TimerConfigPicker). This editor
 * just controls Total-Hours vs Exam-Prep goal mode.
 * ───────────────────────────────────────────────────────────────────── */

interface SkillTimerSettingsProps {
  skill:    Skill;
  onUpdate: (id: string, updates: Partial<Skill>) => Promise<void>;
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

function SkillTimerSettings({ skill, onUpdate }: SkillTimerSettingsProps) {
  const [editing,  setEditing]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const [goalType,  setGoalType]  = useState<SkillGoalType>(skill.goal_type ?? 'hours');
  const [goalHours, setGoalHours] = useState(skill.goal_hours);
  const [examDate,  setExamDate]  = useState<string>(skill.exam_date ?? '');
  const [schedule,  setSchedule]  = useState<WeeklySchedule>(skill.weekly_schedule ?? {});

  const cancel = () => {
    setGoalType(skill.goal_type ?? 'hours');
    setGoalHours(skill.goal_hours);
    setExamDate(skill.exam_date ?? '');
    setSchedule(skill.weekly_schedule ?? {});
    setError(null);
    setEditing(false);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await onUpdate(skill.id, {
        goal_type:       goalType,
        goal_hours:      goalHours,
        exam_date:       goalType === 'exam' ? (examDate || null) : null,
        weekly_schedule: goalType === 'exam' ? schedule : {},
      });
      setEditing(false);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    const isExam = (skill.goal_type ?? 'hours') === 'exam' && skill.exam_date;
    return (
      <button
        onClick={() => setEditing(true)}
        className="w-full mb-5 flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border border-border bg-bg-elevated hover:border-accent transition-colors text-left"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Settings size={14} className="text-text-muted flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-xs text-text-muted">Goal</p>
            <p className="text-sm text-text-secondary truncate">
              {isExam && skill.exam_date ? (
                <>
                  Exam · {format(parseISO(skill.exam_date), 'MMM d, yyyy')}
                  <span className="text-text-dim"> · {sumWeeklySchedule(skill.weekly_schedule)}h/wk planned</span>
                </>
              ) : (
                <>
                  Total hours
                  <span className="text-text-dim"> · {skill.goal_hours.toLocaleString()} hr goal</span>
                </>
              )}
            </p>
          </div>
        </div>
        <span className="text-xs text-accent flex-shrink-0">Edit</span>
      </button>
    );
  }

  const weeklyTotal = sumWeeklySchedule(schedule);

  return (
    <div className="mb-5 p-4 rounded-xl border border-accent/30 bg-bg-elevated space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-text-secondary">Goal Settings</h3>
        <button onClick={cancel} className="text-xs text-text-muted hover:text-text-secondary">
          Cancel
        </button>
      </div>

      {/* Goal type toggle */}
      <div>
        <label className="block text-xs text-text-muted mb-1.5">Goal Type</label>
        <div className="flex gap-2">
          {([
            { v: 'hours' as const, label: 'Total Hours', hint: 'Open-ended target like 10,000 hr' },
            { v: 'exam'  as const, label: 'Exam Prep',   hint: 'Plan around a fixed exam date' },
          ]).map((opt) => (
            <button
              key={opt.v}
              type="button"
              onClick={() => setGoalType(opt.v)}
              title={opt.hint}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                goalType === opt.v
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border bg-bg-card text-text-muted hover:text-text-secondary'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {goalType === 'hours' && (
        <div>
          <label className="block text-xs text-text-muted mb-1">Goal Hours</label>
          <input
            type="number"
            value={goalHours}
            onChange={(e) => setGoalHours(Number(e.target.value))}
            min={1}
            max={100000}
            className="input text-sm"
          />
        </div>
      )}

      {goalType === 'exam' && (
        <>
          <div>
            <label className="block text-xs text-text-muted mb-1 flex items-center gap-1.5">
              <Calendar size={11} />
              Exam Date
            </label>
            <input
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="input text-sm"
            />
          </div>

          <div>
            <label className="block text-xs text-text-muted mb-1.5">
              Hours per Weekday
              <span className="ml-1.5 text-text-dim">· {weeklyTotal}h/wk planned</span>
            </label>
            <div className="grid grid-cols-7 gap-1.5">
              {WEEKDAY_DEFS.map(({ key, label }) => (
                <div key={key} className="text-center">
                  <div className="text-[10px] text-text-dim mb-1">{label}</div>
                  <input
                    type="number"
                    value={schedule[key] ?? 0}
                    onChange={(e) => setSchedule({ ...schedule, [key]: Math.max(0, Number(e.target.value)) })}
                    min={0}
                    max={24}
                    step={0.5}
                    className="input text-xs text-center px-1 py-1.5"
                  />
                </div>
              ))}
            </div>
            {weeklyTotal === 0 && (
              <p className="text-[11px] text-text-dim mt-1.5">
                Set at least one weekday to compute available practice hours.
              </p>
            )}
          </div>
        </>
      )}

      <p className="text-[11px] text-text-dim leading-snug">
        Timer mode (pomodoro / countdown / stopwatch) and length are picked
        each time you press <span className="text-text-muted">Start</span>,
        not stored on the skill.
      </p>

      {error && <p className="text-error text-xs">{error}</p>}

      <button
        onClick={save}
        disabled={saving}
        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-accent hover:bg-accent-light text-white text-xs font-semibold transition-colors disabled:opacity-50"
      >
        <Save size={12} />
        {saving ? 'Saving…' : 'Save settings'}
      </button>
    </div>
  );
}
