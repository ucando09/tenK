/**
 * FocusTrackerPanel — body of the AI focus-watch widget. Lives inside
 * a FloatingPanel, so this component intentionally doesn't render its
 * own outer card or header — the FloatingPanel provides those.
 *
 * Real screen capture isn't wired yet; this is the UI scaffolding so
 * we can swap in a Vision API later without touching the layout.
 */
import { Eye, EyeOff, AlertTriangle, BookOpen, Coffee, Monitor } from 'lucide-react';
import type { TrackerActivity } from '../../lib/hooks/useFocusTracker';

interface FocusTrackerPanelProps {
  enabled:        boolean;
  setEnabled:     (v: boolean) => void;
  activities:     TrackerActivity[];
  focusedSeconds: number;
  totalSeconds:   number;
  focusScore:     number;
  warning:        string | null;
}

function fmtMin(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function activityIcon(kind: TrackerActivity['kind']) {
  switch (kind) {
    case 'focused':    return <BookOpen size={11} className="text-success" />;
    case 'distracted': return <Coffee   size={11} className="text-warning" />;
    case 'idle':       return <Monitor  size={11} className="text-text-dim" />;
  }
}

export function FocusTrackerPanel({
  enabled, setEnabled, activities, focusedSeconds, totalSeconds, focusScore, warning,
}: FocusTrackerPanelProps) {
  const scoreColor =
    focusScore >= 80 ? '#28c840'
  : focusScore >= 60 ? '#f0c060'
  : '#e05555';

  return (
    <div>
      {/* On/off toggle row */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5">
        <div className="flex items-center gap-2">
          {enabled
            ? <Eye    size={12} className="text-accent" />
            : <EyeOff size={12} className="text-white/50" />}
          <span className="text-xs text-white/70">
            {enabled ? 'Watching screen' : 'Not watching'}
          </span>
        </div>
        <button
          onClick={() => setEnabled(!enabled)}
          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold transition-all ${
            enabled
              ? 'bg-accent text-white'
              : 'bg-white/10 text-white/70 hover:text-white'
          }`}
        >
          {enabled ? 'ON' : 'OFF'}
        </button>
      </div>

      {!enabled ? (
        <div className="px-4 py-4 text-center">
          <div
            className="mb-3 px-2.5 py-1.5 rounded-md text-[10px] font-semibold tracking-wide inline-flex items-center gap-1"
            style={{ color: '#f0c060', backgroundColor: '#f0c06018', border: '1px solid #f0c06030' }}
          >
            🚧 In development
          </div>
          <p className="text-xs text-white/60 leading-snug">
            When finished, AI will watch your screen and adjust your tracked hours when you drift off-task.
          </p>
          <p className="text-[10px] text-white/30 mt-2">
            Turn on for a UI preview — readings are simulated.
          </p>
        </div>
      ) : (
        <>
          {/* Preview banner */}
          <div
            className="px-3 py-2 text-[10px] font-medium border-b border-white/5 flex items-center gap-1.5"
            style={{ color: '#f0c060', backgroundColor: '#f0c06010' }}
          >
            🚧 Preview — readings are simulated until screen capture lands.
          </div>

          {/* Score */}
          <div className="px-4 py-3 border-b border-white/5">
            <div className="flex items-baseline justify-between mb-1.5">
              <span className="text-[11px] text-white/60">Focus Score</span>
              <span className="text-xl font-bold tabular-nums" style={{ color: scoreColor }}>
                {focusScore}
              </span>
            </div>
            <div className="h-1 bg-black/40 rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-500"
                style={{ width: `${focusScore}%`, backgroundColor: scoreColor }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-white/40 mt-1.5">
              <span>Focused: {fmtMin(focusedSeconds)}</span>
              <span>Total: {fmtMin(totalSeconds)}</span>
            </div>
          </div>

          {/* Warning */}
          {warning && (
            <div className="px-4 py-2.5 bg-warning/15 border-b border-warning/25 flex items-start gap-2">
              <AlertTriangle size={11} className="text-warning flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-warning leading-snug">{warning}</p>
            </div>
          )}

          {/* Activity feed */}
          <div>
            {activities.length === 0 ? (
              <p className="px-4 py-3 text-[11px] text-white/40 text-center">
                Watching… first reading in ~12s.
              </p>
            ) : (
              [...activities].reverse().slice(0, 8).map((a, i) => (
                <div
                  key={a.at}
                  className="flex items-center gap-2 px-4 py-2 border-b border-white/5 last:border-b-0"
                  style={{ opacity: 1 - i * 0.07 }}
                >
                  {activityIcon(a.kind)}
                  <span className="text-[11px] text-white/80 flex-1 truncate">{a.label}</span>
                  <span className="text-[10px] text-white/30 flex-shrink-0">
                    {Math.round((Date.now() - a.at) / 1000)}s ago
                  </span>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
