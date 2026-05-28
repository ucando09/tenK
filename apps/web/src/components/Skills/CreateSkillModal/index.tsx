/**
 * CreateSkillModal — two-step wizard to add a new skill.
 *
 * Step 1: name the skill.
 * Step 2: pick a domain (or create one inline), pick a color,
 *         optionally tweak goal hours + timer mode + pomodoro length.
 */
import { useState } from 'react';
import { X, ArrowLeft } from 'lucide-react';
import { DOMAIN_COLORS } from '@tenk/shared';
import type { Domain, TimerMode, SkillGoalType, WeeklySchedule } from '@tenk/shared';
import { POMODORO_DEFAULTS } from '../../../lib/constants';
import { extractErrorMessage } from '../../../lib/utils';
import { Step1Name } from './Step1Name';
import { DomainPicker } from './DomainPicker';
import { AdvancedSettings, type AdvancedSettingsValue } from './AdvancedSettings';

interface CreateSkillModalProps {
  domains:         Domain[];
  initialDomainId?: string;
  onConfirm: (params: {
    domain_id: string;
    name: string;
    color: string;
    goal_hours:             number;
    goal_type:              SkillGoalType;
    exam_date:              string | null;
    weekly_schedule:        WeeklySchedule;
    timer_mode:             TimerMode;
    pomodoro_work_minutes:  number;
    pomodoro_break_minutes: number;
    pomodoro_sessions:      number;
    status: 'active';
  }) => Promise<unknown>;
  onCreateDomain: (name: string, color: string) => Promise<Domain>;
  onClose:        () => void;
}

export function CreateSkillModal({
  domains, initialDomainId, onConfirm, onCreateDomain, onClose,
}: CreateSkillModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState('');

  const [localDomains, setLocalDomains] = useState<Domain[]>(domains);
  const [selectedDomainId, setSelectedDomainId] = useState<string | null>(
    initialDomainId ?? localDomains[0]?.id ?? null,
  );
  const [color, setColor] = useState<string>(
    localDomains.find((d) => d.id === (initialDomainId ?? localDomains[0]?.id))?.color
      ?? DOMAIN_COLORS[0],
  );

  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [advanced, setAdvanced] = useState<AdvancedSettingsValue>({
    goalType:       'hours',
    goalHours:      10_000,
    examDate:       '',
    weeklySchedule: {},
  });

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  /* ── Handlers ── */
  const selectDomain = (d: Domain) => {
    setSelectedDomainId(d.id);
    setColor(d.color);
  };

  const handleDomainCreated = (d: Domain) => {
    setLocalDomains((prev) => [...prev, d]);
    selectDomain(d);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !selectedDomainId) return;
    setLoading(true);
    setError(null);
    try {
      /* Legacy columns (timer_mode + pomodoro_*) still exist on the
       * skills table (NOT NULL) but are no longer surfaced in the UI.
       * Write sensible defaults so the INSERT doesn't fail; nothing
       * reads them at runtime anymore. */
      await onConfirm({
        domain_id:              selectedDomainId,
        name:                   name.trim(),
        color,
        goal_hours:             advanced.goalHours,
        goal_type:              advanced.goalType,
        exam_date:              advanced.goalType === 'exam' ? (advanced.examDate || null) : null,
        weekly_schedule:        advanced.goalType === 'exam' ? advanced.weeklySchedule : {},
        timer_mode:             'pomodoro',
        pomodoro_work_minutes:  POMODORO_DEFAULTS.workMinutes,
        pomodoro_break_minutes: POMODORO_DEFAULTS.breakMinutes,
        pomodoro_sessions:      POMODORO_DEFAULTS.sessions,
        status:                 'active',
      });
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  /* ── Render ── */
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-md w-full" onClick={(e) => e.stopPropagation()}>

        {step === 1 && (
          <Step1Name
            name={name}
            onName={setName}
            onNext={() => setStep(2)}
            onClose={onClose}
          />
        )}

        {step === 2 && (
          <>
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => { setStep(1); setError(null); }}
                className="btn-ghost p-1.5"
              >
                <ArrowLeft size={18} />
              </button>
              <div className="flex-1">
                <p className="text-xs text-text-muted uppercase tracking-widest">Step 2 of 2</p>
                <h2 className="text-text-primary font-bold text-lg truncate">"{name}"</h2>
              </div>
              <button onClick={onClose} className="btn-ghost p-1.5">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-5">
              <DomainPicker
                domains={localDomains}
                selectedId={selectedDomainId}
                onSelect={selectDomain}
                onCreateDomain={onCreateDomain}
                onDomainCreated={handleDomainCreated}
                onError={setError}
              />

              {/* Color */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Color
                </label>
                <div className="flex gap-3">
                  {DOMAIN_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        color === c ? 'border-white scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <AdvancedSettings
                expanded={advancedOpen}
                onToggle={() => setAdvancedOpen((v) => !v)}
                value={advanced}
                onChange={setAdvanced}
              />

              {error && <p className="text-error text-sm">{error}</p>}

              <button
                onClick={handleSubmit}
                disabled={loading || !selectedDomainId || !name.trim()}
                className="w-full btn-primary py-3 text-base flex items-center justify-center gap-2 disabled:opacity-40"
              >
                {loading && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                Add Mastery
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
