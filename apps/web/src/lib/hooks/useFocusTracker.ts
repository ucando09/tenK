/**
 * useFocusTracker — mock Cluely-style screen-watching AI.
 *
 * In the real version this would:
 *   1. Capture the screen via `navigator.mediaDevices.getDisplayMedia()`.
 *   2. Sample frames every ~10s, send to Claude/Gemini Vision.
 *   3. Get back a label like { activity: 'studying-physics', focused: true }.
 *
 * Here we simulate that pipeline:
 *   - User toggles "enable tracking" on, which fakes a permission grant.
 *   - Every TICK_MS we pick a plausible "detected" activity.
 *   - Sessions accumulate `focusedSeconds` vs `totalSeconds`.
 *   - When the user drifts into distraction territory we emit a warning.
 *
 * The shape of the events is identical to what the real API would
 * produce, so swapping in real screen capture is just a matter of
 * replacing the random generator inside `simulateActivity()`.
 */
import { useEffect, useRef, useState } from 'react';

export type TrackerActivity =
  | { kind: 'focused';     label: string; at: number }
  | { kind: 'distracted';  label: string; at: number }
  | { kind: 'idle';        label: string; at: number };

interface UseFocusTrackerOptions {
  /** Tracker only runs while this is true (typically `timer.isRunning`). */
  active:  boolean;
  /** Optional skill name to weight the simulated activity labels. */
  skill?:  string | null;
}

interface UseFocusTrackerResult {
  enabled:        boolean;
  setEnabled:     (v: boolean) => void;
  activities:     TrackerActivity[];
  /** Seconds the AI considered the user "focused" this session. */
  focusedSeconds: number;
  /** Total seconds tracked (focused + distracted + idle). */
  totalSeconds:   number;
  /** 0–100. Rolling ratio of focused / total. */
  focusScore:     number;
  /** Most recent warning, if the user has drifted recently. */
  warning:        string | null;
  /** Wipe accumulated state — called when a new session starts. */
  reset:          () => void;
}

const TICK_MS              = 12_000;           // how often the mock samples
const WARNING_THRESHOLD    = 2;                // N distractions in a row trigger a warning
const FOCUSED_ACTIVITIES   = [
  'Reading textbook',
  'Writing notes',
  'Solving problems',
  'Watching lecture',
  'Reviewing flashcards',
  'Coding',
];
const DISTRACTED_ACTIVITIES = [
  'Browsing Instagram',
  'Watching YouTube',
  'Scrolling X / Twitter',
  'Checking messages',
  'Reading reddit',
];
const IDLE_ACTIVITIES = [
  'Screen locked',
  'No active window',
];

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

function simulateActivity(skill: string | null | undefined): TrackerActivity {
  /* Bias toward focused early in a session, then drift. Cheap heuristic:
   * 70% focused, 22% distracted, 8% idle. Real impl swaps this for an
   * LLM call on a captured frame. */
  const roll = Math.random();
  const at   = Date.now();

  if (roll < 0.70) {
    const label = skill
      ? `${pick(FOCUSED_ACTIVITIES)} (${skill})`
      : pick(FOCUSED_ACTIVITIES);
    return { kind: 'focused', label, at };
  }
  if (roll < 0.92) {
    return { kind: 'distracted', label: pick(DISTRACTED_ACTIVITIES), at };
  }
  return { kind: 'idle', label: pick(IDLE_ACTIVITIES), at };
}

export function useFocusTracker({ active, skill }: UseFocusTrackerOptions): UseFocusTrackerResult {
  const [enabled,    setEnabled]    = useState(false);
  const [activities, setActivities] = useState<TrackerActivity[]>([]);
  const [warning,    setWarning]    = useState<string | null>(null);

  const distractedStreak = useRef(0);

  /* Tick: only when both enabled AND active (timer running) */
  useEffect(() => {
    if (!enabled || !active) return;

    const id = setInterval(() => {
      const a = simulateActivity(skill);
      setActivities((prev) => [...prev.slice(-29), a]); // keep last 30

      if (a.kind === 'distracted') {
        distractedStreak.current++;
        if (distractedStreak.current >= WARNING_THRESHOLD) {
          setWarning(`Looks like you've drifted — "${a.label}". This time won't count toward your goal.`);
        }
      } else {
        distractedStreak.current = 0;
        // Auto-clear warning after focused activity
        setWarning(null);
      }
    }, TICK_MS);

    return () => clearInterval(id);
  }, [enabled, active, skill]);

  /* Derive totals & focus score */
  const focusedSeconds = activities.filter((a) => a.kind === 'focused').length * (TICK_MS / 1000);
  const totalSeconds   = activities.length * (TICK_MS / 1000);
  const focusScore     = totalSeconds > 0
    ? Math.round((focusedSeconds / totalSeconds) * 100)
    : 100;

  const reset = () => {
    setActivities([]);
    setWarning(null);
    distractedStreak.current = 0;
  };

  return {
    enabled,
    setEnabled,
    activities,
    focusedSeconds,
    totalSeconds,
    focusScore,
    warning,
    reset,
  };
}
