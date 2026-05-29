/**
 * FocusMode — distraction-free, fullscreen overlay shown over the
 * entire app while a timer session is running.
 *
 * Layout:
 *   - Animated, opaque CSS scene as the background (FocusScene).
 *   - Big timer dead-centered — gets the full spotlight.
 *   - Goals + AI tracker live in FloatingPanels that hover OVER the
 *     timer. User can drag them anywhere and collapse them.
 *   - Vibe/audio controls dock at the bottom.
 *   - "Lights off" fade-in on mount.
 */
import { useState, useEffect } from 'react';
import {
  Play, Pause, SkipForward, Square,
  Minimize2, SkipBack, Music2, MicOff, Volume2, Film, Layers,
} from 'lucide-react';
import { useAppStore } from '../../lib/store';
import { STUDY_VIBES, getVibe, STORAGE_KEYS } from '../../lib/constants';
import { useVibeAudio } from '../../lib/hooks/useVibeAudio';
import { useFocusTracker } from '../../lib/hooks/useFocusTracker';
import { FocusScene, type VisualStyle } from './FocusScene';
import { FocusTrackerPanel } from './FocusTrackerPanel';
import { FloatingPanel } from './FloatingPanel';
import { GoalsMemo } from './GoalsMemo';
import { StudyBuddiesPanel } from './StudyBuddiesPanel';
import type { Skill, TimerState } from '@tenk/shared';
import type { SessionGoal } from '../../lib/store';
import type { StudyGroup } from '../../lib/hooks/useStudyBuddies';

interface FocusModeProps {
  skill:             Skill;
  timer:             TimerState;
  goals:             SessionGoal[];
  studyGroups:       StudyGroup[];
  studyGroupsReady:  boolean;
  hasGroupMembers:   boolean;
  formatTime:        (s: number) => string;
  onToggleGoal:      (id: string) => void;
  onAddGoal:         (text: string) => void;
  onPause:           () => void;
  onResume:          () => void;
  onSkip:            () => void;
  onEnd:             () => Promise<void>;
}

const ENTRANCE_MS = 900;

export function FocusMode({
  skill, timer, goals, studyGroups, studyGroupsReady, hasGroupMembers, formatTime,
  onToggleGoal, onAddGoal, onPause, onResume, onSkip, onEnd,
}: FocusModeProps) {
  const {
    sessionVibeId, setSessionVibeId, setFocusModeActive,
    sessionTimerConfig,
  } = useAppStore();
  const [volume, setVolume] = useState(60);
  const [visualStyle, setVisualStyle] = useState<VisualStyle>(
    () => (localStorage.getItem(STORAGE_KEYS.visualStyle) as VisualStyle | null) ?? 'simple',
  );
  const toggleVisualStyle = () => {
    const next: VisualStyle = visualStyle === 'simple' ? 'realism' : 'simple';
    setVisualStyle(next);
    localStorage.setItem(STORAGE_KEYS.visualStyle, next);
  };

  const isPomodoro = sessionTimerConfig.mode === 'pomodoro';

  const vibe = getVibe(sessionVibeId);

  /* "Lights off" entrance — fade the whole overlay in */
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 50);
    return () => clearTimeout(t);
  }, []);

const audio  = useVibeAudio({
    vibeId:  sessionVibeId,
    enabled: !timer.isPaused,
    volume,
  });
  const tracker = useFocusTracker({
    active: timer.isRunning,
    skill:  skill.name,
  });

  const doneCount = goals.filter((g) => g.done).length;

  const vibeIdx   = STUDY_VIBES.findIndex((v) => v.id === sessionVibeId);
  const nextVibe  = () => setSessionVibeId(STUDY_VIBES[(vibeIdx + 1) % STUDY_VIBES.length].id);
  const prevVibe  = () => setSessionVibeId(STUDY_VIBES[(vibeIdx - 1 + STUDY_VIBES.length) % STUDY_VIBES.length].id);
  const exitFocus = () => setFocusModeActive(false);

  return (
    <div
      className="fixed inset-0 z-[150] flex flex-col text-white"
      style={{
        opacity:    entered ? 1 : 0,
        transition: `opacity ${ENTRANCE_MS}ms ease-out`,
      }}
    >
      {/* Animated scene (fully opaque background) */}
      <FocusScene scene={vibe.scene} visualStyle={visualStyle} />

      {/* Main UI layer */}
      <div className="relative z-10 flex flex-col flex-1">

        {/* ── Top bar ── */}
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: skill.color, boxShadow: `0 0 8px ${skill.color}` }}
            />
            <span className="text-sm font-medium" style={{ color: '#fff', opacity: 0.9 }}>
              {skill.name}
            </span>
            {isPomodoro && (
              <span className="text-xs" style={{ color: '#fff', opacity: 0.5 }}>
                · Session {timer.currentPomodoroSession} of {sessionTimerConfig.sessions}
              </span>
            )}
          </div>
          <button
            onClick={exitFocus}
            title="Exit focus mode (timer keeps running)"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors"
            style={{
              color:           'rgba(255,255,255,0.7)',
              backgroundColor: 'rgba(0,0,0,0.3)',
              backdropFilter:  'blur(4px)',
            }}
          >
            <Minimize2 size={13} />
            Exit Focus
          </button>
        </div>

        {/* ── Centered timer (gets the full spotlight) ── */}
        <div className="flex-1 flex items-center justify-center min-h-0 px-6">
          <div className="flex flex-col items-center gap-6">

            {/* Phase / mode badge */}
            <div
              className="flex items-center gap-2 px-4 py-2 rounded-full"
              style={{
                backgroundColor: 'rgba(0,0,0,0.4)',
                backdropFilter:  'blur(6px)',
                border:          '1px solid rgba(255,255,255,0.1)',
              }}
            >
              {isPomodoro ? (
                <>
                  <span className="text-base">{timer.phase === 'work' ? '🍅' : '☕'}</span>
                  <span className="text-sm font-semibold tracking-wide" style={{ color: '#fff' }}>
                    {timer.phase === 'work'
                      ? `FOCUS · ${sessionTimerConfig.workMinutes} MIN`
                      : `BREAK · ${sessionTimerConfig.breakMinutes} MIN`}
                  </span>
                </>
              ) : sessionTimerConfig.mode === 'countdown' ? (
                <>
                  <span className="text-base">⏱</span>
                  <span className="text-sm font-semibold tracking-wide" style={{ color: '#fff' }}>
                    COUNTDOWN · {sessionTimerConfig.countdownMinutes} MIN
                  </span>
                </>
              ) : (
                <>
                  <span className="text-base">⏲</span>
                  <span className="text-sm font-semibold tracking-wide" style={{ color: '#fff' }}>
                    STOPWATCH
                  </span>
                </>
              )}
            </div>

            {/* Big time display */}
            <div className="text-center select-none">
              <div
                className="font-mono font-bold tabular-nums leading-none"
                style={{
                  fontSize:   'clamp(120px, 22vw, 280px)',
                  color:      '#fff',
                  textShadow: '0 4px 32px rgba(0,0,0,0.7)',
                }}
              >
                {formatTime(timer.secondsRemaining)}
              </div>
              <div
                className="text-sm mt-3 uppercase tracking-[0.3em]"
                style={{ color: 'rgba(255,255,255,0.6)' }}
              >
                {sessionTimerConfig.mode === 'stopwatch'
                  ? 'Elapsed'
                  : timer.phase === 'work' ? 'Focus' : 'Break'}
              </div>
              {timer.isPaused && (
                <div
                  className="text-xs mt-2 animate-pulse font-semibold tracking-widest"
                  style={{ color: skill.color }}
                >
                  PAUSED
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3 mt-2">
              <button
                onClick={timer.isPaused ? onResume : onPause}
                className="flex items-center gap-2 px-8 py-3 rounded-xl font-semibold text-sm transition-all"
                style={{
                  backgroundColor: skill.color,
                  color:           'white',
                  boxShadow:       `0 0 36px ${skill.color}80`,
                }}
              >
                {timer.isPaused
                  ? <Play size={15} fill="white" />
                  : <Pause size={15} />}
                {timer.isPaused ? 'Resume' : 'Pause'}
              </button>

              {/* Skip is only meaningful in pomodoro — countdown/stopwatch
                  have no intra-session phases to skip past. */}
              {isPomodoro && (
                <button
                  onClick={onSkip}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm transition-colors"
                  style={{
                    color:           'rgba(255,255,255,0.85)',
                    backgroundColor: 'rgba(0,0,0,0.4)',
                    backdropFilter:  'blur(6px)',
                    border:          '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  <SkipForward size={15} />
                  Skip
                </button>
              )}

              <button
                onClick={onEnd}
                className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm transition-all"
                style={{
                  color:           '#fca5a5',
                  backgroundColor: 'rgba(224,85,85,0.12)',
                  border:          '1px solid rgba(224,85,85,0.25)',
                }}
              >
                <Square size={15} />
                End
              </button>
            </div>
          </div>
        </div>

        {/* ── Bottom: vibe / audio dock ── */}
        <div className="flex flex-col items-center px-6 py-5 flex-shrink-0 gap-2">
          <div
            className="flex items-center gap-3 px-4 py-2.5 rounded-2xl"
            style={{
              backgroundColor: 'rgba(0,0,0,0.5)',
              backdropFilter:  'blur(10px)',
              border:          '1px solid rgba(255,255,255,0.1)',
              boxShadow:       '0 8px 32px rgba(0,0,0,0.4)',
            }}
          >
            <div className="flex items-center gap-2 pr-3 border-r border-white/10 min-w-0">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                style={{ backgroundColor: vibe.swatch + '30' }}
              >
                {vibe.icon}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] leading-none mb-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {audio.playing ? 'Now playing' : vibe.audioSrc ? 'Paused' : 'No audio'}
                </p>
                <p className="text-sm font-medium truncate" style={{ color: '#fff' }}>
                  {vibe.label}
                </p>
              </div>
            </div>

            <button onClick={prevVibe} title="Previous vibe"
              className="p-1.5 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-colors">
              <SkipBack size={14} />
            </button>
            <button
              onClick={audio.toggle}
              title={audio.playing ? 'Pause' : 'Play'}
              disabled={!vibe.audioSrc}
              className="p-2 rounded-full text-white transition-colors disabled:opacity-40"
              style={{ backgroundColor: skill.color }}
            >
              {vibe.audioSrc
                ? (audio.playing ? <Pause size={14} /> : <Music2 size={14} />)
                : <MicOff size={14} />}
            </button>
            <button onClick={nextVibe} title="Next vibe"
              className="p-1.5 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-colors">
              <SkipForward size={14} />
            </button>

            <div className="flex items-center gap-2 pl-3 border-l border-white/10">
              <Volume2 size={14} className="text-white/60" />
              <input
                type="range"
                min={0}
                max={100}
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-20 accent-accent"
                title={`Volume: ${volume}%`}
              />
            </div>

            {/* Visual style toggle */}
            <div className="pl-3 border-l border-white/10">
              <button
                onClick={toggleVisualStyle}
                title={visualStyle === 'simple' ? 'Switch to Realism' : 'Switch to Simple'}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={
                  visualStyle === 'realism'
                    ? { backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff' }
                    : { color: 'rgba(255,255,255,0.45)' }
                }
              >
                {visualStyle === 'realism'
                  ? <Film size={12} />
                  : <Layers size={12} />}
                {visualStyle === 'realism' ? 'Realism' : 'Simple'}
              </button>
            </div>
          </div>

          {audio.missing && vibe.audioSrc && (
            <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Drop <code className="font-mono">{vibe.audioSrc}</code> into your <code>public/</code> folder to play.
            </p>
          )}
        </div>
      </div>

      {/* ── Floating panels (above the main UI, draggable + collapsible) ── */}
      <FloatingPanel
        id="goals"
        title="Session Goals"
        icon="📌"
        defaultAnchor="top-right"
        width={300}
        maxBodyHeight={320}
        accent={skill.color}
        collapsedBadge={goals.length > 0 ? `${doneCount}/${goals.length}` : undefined}
      >
        <GoalsMemo goals={goals} accent={skill.color} onToggleGoal={onToggleGoal} onAddGoal={onAddGoal} />
      </FloatingPanel>

      {hasGroupMembers && (
        <FloatingPanel
          id="buddies"
          title="Study Group"
          icon="👥"
          defaultAnchor="top-left"
          width={268}
          maxBodyHeight={360}
          accent="#4cdf90"
          collapsedBadge={(() => {
            const on = studyGroups.flatMap((g) => g.buddies).filter((b) => b.isStudying).length;
            return on > 0 ? `${on} on` : undefined;
          })()}
        >
          <StudyBuddiesPanel groups={studyGroups} initialized={studyGroupsReady} />
        </FloatingPanel>
      )}

      <FloatingPanel
        id="tracker"
        title="AI Focus Watch · Preview"
        icon="👁"
        defaultAnchor="bottom-right"
        width={300}
        maxBodyHeight={360}
        defaultCollapsed
        accent="#7c6cf0"
        collapsedBadge={tracker.enabled ? `${tracker.focusScore}` : 'soon'}
      >
        <FocusTrackerPanel
          enabled={tracker.enabled}
          setEnabled={tracker.setEnabled}
          activities={tracker.activities}
          focusedSeconds={tracker.focusedSeconds}
          totalSeconds={tracker.totalSeconds}
          focusScore={tracker.focusScore}
          warning={tracker.warning}
        />
      </FloatingPanel>
    </div>
  );
}
