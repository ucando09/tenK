import { Play, Pause, SkipForward, Square, Check, Maximize2 } from 'lucide-react';
import { TimerCircle } from './TimerCircle';
import { useAppStore } from '../../lib/store';
import { computeSkillGoal } from '../../lib/skillGoal';
import type { Skill, TimerState } from '@tenk/shared';
import type { SessionGoal } from '../../lib/store';

export interface RunningCardProps {
  skill: Skill;
  timer: TimerState;
  phaseProgress: number;
  formatTime: (seconds: number) => string;
  goals: SessionGoal[];
  onToggleGoal: (id: string) => void;
  onPause: () => void;
  onResume: () => void;
  onSkip: () => void;
  onEnd: () => Promise<void>;
}

export function RunningCard({
  skill,
  timer,
  phaseProgress,
  formatTime,
  goals,
  onToggleGoal,
  onPause,
  onResume,
  onSkip,
  onEnd,
}: RunningCardProps) {
  const { setFocusModeActive, sessionTimerConfig } = useAppStore();
  const loggedProgress = computeSkillGoal(skill).progress;
  const doneCount      = goals.filter((g) => g.done).length;
  const isPomodoro     = sessionTimerConfig.mode === 'pomodoro';

  return (
    <div className="h-full flex flex-col items-center justify-center gap-5 p-8">
      {/* Phase / mode badge */}
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-bg-elevated border border-border">
        {isPomodoro ? (
          <>
            <span className="text-base">{timer.phase === 'work' ? '🍅' : '☕'}</span>
            <span className="text-text-secondary text-sm font-semibold tracking-wide">
              {timer.phase === 'work'
                ? `FOCUS · ${sessionTimerConfig.workMinutes} MIN`
                : `BREAK · ${sessionTimerConfig.breakMinutes} MIN`}
            </span>
          </>
        ) : sessionTimerConfig.mode === 'countdown' ? (
          <>
            <span className="text-base">⏱</span>
            <span className="text-text-secondary text-sm font-semibold tracking-wide">
              COUNTDOWN · {sessionTimerConfig.countdownMinutes} MIN
            </span>
          </>
        ) : (
          <>
            <span className="text-base">⏲</span>
            <span className="text-text-secondary text-sm font-semibold tracking-wide">
              STOPWATCH
            </span>
          </>
        )}
      </div>

      {/* Session progress dots — only in pomodoro mode */}
      {isPomodoro && (
        <div className="flex items-center gap-2">
          {Array.from({ length: sessionTimerConfig.sessions }).map((_, i) => {
            const isDone    = i + 1 < timer.currentPomodoroSession;
            const isCurrent = i + 1 === timer.currentPomodoroSession && timer.phase === 'work';
            return (
              <div
                key={i}
                className={`rounded-full transition-all duration-300 ${
                  isDone
                    ? 'w-3 h-3 bg-success'
                    : isCurrent
                    ? 'w-5 h-3'
                    : 'w-3 h-3 bg-bg-elevated border border-border'
                }`}
                style={isCurrent ? { backgroundColor: skill.color } : undefined}
              />
            );
          })}
        </div>
      )}

      {/* Timer circle */}
      <TimerCircle progress={loggedProgress} size={240} color={skill.color} phaseProgress={phaseProgress}>
        <div className="text-center select-none">
          <div className="text-5xl font-mono font-bold text-text-primary tabular-nums">
            {formatTime(timer.secondsRemaining)}
          </div>
          <div className="text-xs text-text-muted mt-1 uppercase tracking-widest">
            {sessionTimerConfig.mode === 'stopwatch'
              ? 'Elapsed'
              : timer.phase === 'work' ? 'Focus' : 'Break'}
          </div>
          {timer.isPaused && (
            <div
              className="text-[10px] mt-2 animate-pulse font-semibold tracking-widest"
              style={{ color: skill.color }}
            >
              PAUSED
            </div>
          )}
        </div>
      </TimerCircle>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={timer.isPaused ? onResume : onPause}
          className="flex items-center gap-2 px-7 py-3 rounded-xl font-semibold text-sm transition-all duration-200"
          style={{
            backgroundColor: skill.color,
            color:           'white',
            boxShadow:       `0 0 20px ${skill.color}45`,
          }}
        >
          {timer.isPaused
            ? <Play size={15} fill="white" />
            : <Pause size={15} />}
          {timer.isPaused ? 'Resume' : 'Pause'}
        </button>

        {/* Skip is only meaningful in pomodoro */}
        {isPomodoro && (
          <button
            onClick={onSkip}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-bg-elevated hover:bg-border border border-border text-text-secondary text-sm transition-colors"
          >
            <SkipForward size={15} />
            Skip
          </button>
        )}

        <button
          onClick={onEnd}
          className="flex items-center gap-2 px-4 py-3 rounded-xl text-text-muted hover:text-error hover:bg-error/10 border border-transparent hover:border-error/20 text-sm transition-all"
        >
          <Square size={15} />
          End
        </button>
      </div>

      {/* Session counter + re-enter focus mode */}
      <div className="flex items-center gap-3">
        {isPomodoro && (
          <p className="text-text-dim text-xs">
            Session {timer.currentPomodoroSession} of {sessionTimerConfig.sessions}
          </p>
        )}
        <button
          onClick={() => setFocusModeActive(true)}
          title="Enter focus mode"
          className="flex items-center gap-1.5 text-xs text-accent hover:text-accent-light transition-colors"
        >
          <Maximize2 size={11} />
          Focus mode
        </button>
      </div>

      {/* ── Goals checklist (only shown when goals were set before the session) ── */}
      {goals.length > 0 && (
        <div className="w-full max-w-xs border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 bg-bg-elevated border-b border-border">
            <span className="text-xs font-semibold text-text-secondary">Goals</span>
            <span className="text-xs text-text-muted tabular-nums">{doneCount}/{goals.length}</span>
          </div>

          {/* Progress bar */}
          <div className="h-0.5 bg-bg-elevated">
            <div
              className="h-full transition-all duration-500"
              style={{
                width:           goals.length ? `${(doneCount / goals.length) * 100}%` : '0%',
                backgroundColor: skill.color,
              }}
            />
          </div>

          <div className="divide-y divide-border">
            {goals.map((goal) => (
              <button
                key={goal.id}
                onClick={() => onToggleGoal(goal.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-bg-elevated transition-colors group"
              >
                <span
                  className="w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 transition-all duration-150"
                  style={{
                    borderColor:     goal.done ? skill.color : undefined,
                    backgroundColor: goal.done ? skill.color : undefined,
                  }}
                >
                  {goal.done && <Check size={9} color="white" strokeWidth={3} />}
                </span>
                <span
                  className={`text-xs flex-1 leading-snug transition-colors ${
                    goal.done
                      ? 'text-text-dim line-through'
                      : 'text-text-secondary group-hover:text-text-primary'
                  }`}
                >
                  {goal.text}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
