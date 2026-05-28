import { Play, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { TimerCircle } from './TimerCircle';
import { computeSkillGoal } from '../../lib/skillGoal';
import { useTodayHoursForSkill } from '../../lib/hooks/useTodayHoursForSkill';
import type { Skill } from '@tenk/shared';

interface IdleCardProps {
  skill: Skill;
  /** Opens the GoalModal instead of starting the timer directly. */
  onRequestStart: () => void;
}

export function IdleCard({ skill, onRequestStart }: IdleCardProps) {
  const loggedHours      = skill.logged_hours ?? 0;
  const todayLoggedHours = useTodayHoursForSkill(skill.id);
  const goal             = computeSkillGoal(skill, { todayLoggedHours });
  const donePct          = goal.goalHours > 0
    ? ((loggedHours / goal.goalHours) * 100).toFixed(1)
    : '0.0';

  const isExam = skill.goal_type === 'exam' && skill.exam_date;

  /* Exam mode shows TODAY's quota as the big number. When the user has
   * already done all today's planned hours we fall back to the total
   * "hours till exam" so they still see meaningful progress. */
  const bigNumber = isExam && goal.todayPlannedHours && goal.todayPlannedHours > 0
    ? goal.todayRemainingHours ?? goal.hoursRemaining
    : goal.hoursRemaining;
  const bigLabel  = isExam && goal.todayPlannedHours && goal.todayPlannedHours > 0
    ? (goal.todayRemainingHours === 0 ? 'today done — keep going' : 'hours left today')
    : isExam ? 'hours to plan' : 'hours remaining';

  return (
    <div className="h-full flex flex-col items-center justify-center gap-7 p-8">
      {/* Skill header */}
      <div className="text-center">
        {skill.domain && (
          <span
            className="inline-block text-xs px-2.5 py-0.5 rounded-full border mb-3"
            style={{
              color:           skill.domain.color,
              borderColor:     skill.domain.color + '40',
              backgroundColor: skill.domain.color + '15',
            }}
          >
            {skill.domain.name}
          </span>
        )}
        <h2 className="text-text-primary font-bold text-3xl">{skill.name}</h2>
        {/* Timer mode/length is chosen at session start now, not stored
         *  on the skill — so no static subtitle here. */}
        {isExam && skill.exam_date && (
          <p className="inline-flex items-center gap-1.5 text-xs text-text-muted mt-2 px-2.5 py-0.5 rounded-full bg-bg-elevated border border-border">
            <Calendar size={11} />
            Exam · {format(parseISO(skill.exam_date), 'MMM d, yyyy')}
            {goal.daysToExam !== undefined && goal.daysToExam > 0 && (
              <span className="text-accent">· {goal.daysToExam}d left</span>
            )}
            {goal.examPassed && <span className="text-error">· passed</span>}
          </p>
        )}
      </div>

      {/* Progress circle */}
      <TimerCircle progress={goal.progress} size={260} color={skill.color}>
        <div className="text-center select-none px-4">
          {goal.examIncomplete ? (
            /* Empty state — user picked exam-prep but hasn't finished setup */
            <>
              <Calendar size={28} className="mx-auto mb-2 text-text-muted" />
              <div className="text-sm font-semibold text-text-primary">
                Set up your exam plan
              </div>
              <p className="text-xs text-text-muted mt-1 leading-snug max-w-[180px] mx-auto">
                Open this in <span className="text-text-secondary font-medium">Mastery</span> and add an exam date + weekly hours.
              </p>
              <button
                onClick={onRequestStart}
                className="mt-4 px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 mx-auto"
                style={{
                  backgroundColor: skill.color,
                  color:           'white',
                  boxShadow:       `0 0 20px ${skill.color}45`,
                }}
              >
                <Play size={12} fill="white" />
                Start anyway
              </button>
            </>
          ) : (
            <>
              <div className="text-5xl font-bold text-text-primary font-mono tabular-nums">
                {bigNumber.toFixed(bigNumber < 10 ? 1 : 0)}
              </div>
              <div className="text-xs text-text-muted uppercase tracking-widest mt-1">
                {bigLabel}
              </div>
              {isExam && goal.todayPlannedHours !== undefined && goal.todayPlannedHours > 0 && (
                <p className="text-[10px] text-text-dim mt-1">
                  {goal.todayLoggedHours?.toFixed(1) ?? '0.0'}h / {goal.todayPlannedHours}h today · {goal.hoursRemaining.toFixed(0)}h until exam
                </p>
              )}
              <button
                onClick={onRequestStart}
                className="mt-5 px-10 py-3 rounded-xl text-sm font-bold transition-all duration-200 flex items-center gap-2 mx-auto"
                style={{
                  backgroundColor: skill.color,
                  color:           'white',
                  boxShadow:       `0 0 24px ${skill.color}55`,
                }}
              >
                <Play size={14} fill="white" />
                START
              </button>
            </>
          )}
        </div>
      </TimerCircle>

      {/* Stats row */}
      <div className="flex items-center gap-8 text-center">
        <div>
          <div className="text-xl font-bold text-text-primary">{loggedHours.toFixed(1)}h</div>
          <div className="text-xs text-text-muted mt-0.5">Logged</div>
        </div>
        <div className="h-8 w-px bg-border" />
        <div>
          <div className="text-xl font-bold text-text-primary">{donePct}%</div>
          <div className="text-xs text-text-muted mt-0.5">Complete</div>
        </div>
        <div className="h-8 w-px bg-border" />
        <div>
          <div className="text-xl font-bold text-text-primary">
            {goal.goalHours.toLocaleString(undefined, { maximumFractionDigits: 0 })}h
          </div>
          <div className="text-xs text-text-muted mt-0.5">
            {isExam ? 'Plan' : 'Goal'}
          </div>
        </div>
      </div>
    </div>
  );
}
