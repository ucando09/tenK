/**
 * FloatingPanel — draggable + collapsible widget that hovers over
 * focus mode. The timer sits centered behind these; each panel can
 * be repositioned by dragging its header and shrunk to just the
 * header by clicking the chevron.
 *
 * Position + collapse state persist to localStorage so the user's
 * arrangement survives reloads.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronDown, ChevronUp, GripVertical } from 'lucide-react';

export type AnchorCorner = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

interface FloatingPanelProps {
  /** Stable key — used as the localStorage namespace for position. */
  id:            string;
  /** Title rendered in the drag handle. */
  title:         string;
  /** Optional emoji / icon shown before the title. */
  icon?:         React.ReactNode;
  /** Where to drop the panel the very first time the user sees it. */
  defaultAnchor: AnchorCorner;
  /** Body width in pixels. Header matches. */
  width?:        number;
  /** Render at most this tall; body scrolls past it. */
  maxBodyHeight?: number;
  /** Whether to start collapsed (header only) the first time. */
  defaultCollapsed?: boolean;
  /** Optional small label shown next to the title when collapsed
   *  (e.g. "2/5" for goals progress, focus score number, etc). */
  collapsedBadge?: React.ReactNode;
  /** Pill/accent color used for the badge background + drag glow. */
  accent?:        string;
  children:       React.ReactNode;
}

interface StoredState {
  x:         number;
  y:         number;
  collapsed: boolean;
}

const MARGIN = 16;

function anchorToPosition(anchor: AnchorCorner, width: number): { x: number; y: number } {
  const vw = typeof window === 'undefined' ? 1280 : window.innerWidth;
  const vh = typeof window === 'undefined' ? 800  : window.innerHeight;
  switch (anchor) {
    case 'top-right':    return { x: vw - width - MARGIN, y: 80 };
    case 'top-left':     return { x: MARGIN,              y: 80 };
    case 'bottom-right': return { x: vw - width - MARGIN, y: vh - 320 };
    case 'bottom-left':  return { x: MARGIN,              y: vh - 320 };
  }
}

function clampToViewport(x: number, y: number, width: number): { x: number; y: number } {
  if (typeof window === 'undefined') return { x, y };
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  return {
    x: Math.max(MARGIN - width + 60, Math.min(x, vw - 60)), // always show ≥60px
    y: Math.max(MARGIN,               Math.min(y, vh - 60)),
  };
}

function loadState(id: string, defaultPos: { x: number; y: number }, defaultCollapsed: boolean): StoredState {
  try {
    const raw = localStorage.getItem(`tenk-panel-${id}`);
    if (!raw) return { ...defaultPos, collapsed: defaultCollapsed };
    const parsed = JSON.parse(raw) as Partial<StoredState>;
    return {
      x:         typeof parsed.x === 'number' ? parsed.x : defaultPos.x,
      y:         typeof parsed.y === 'number' ? parsed.y : defaultPos.y,
      collapsed: typeof parsed.collapsed === 'boolean' ? parsed.collapsed : defaultCollapsed,
    };
  } catch {
    return { ...defaultPos, collapsed: defaultCollapsed };
  }
}

function saveState(id: string, state: StoredState): void {
  try {
    localStorage.setItem(`tenk-panel-${id}`, JSON.stringify(state));
  } catch {
    /* localStorage may be unavailable (private mode etc.) — silently ignore */
  }
}

export function FloatingPanel({
  id, title, icon, defaultAnchor,
  width = 320, maxBodyHeight = 360,
  defaultCollapsed = false,
  collapsedBadge,
  accent = '#7c6cf0',
  children,
}: FloatingPanelProps) {
  /* Initialise from localStorage, falling back to the anchor preset. */
  const [state, setState] = useState<StoredState>(() => {
    const defaultPos = anchorToPosition(defaultAnchor, width);
    const loaded = loadState(id, defaultPos, defaultCollapsed);
    /* Re-clamp on load in case window has shrunk since last visit. */
    const { x, y } = clampToViewport(loaded.x, loaded.y, width);
    return { x, y, collapsed: loaded.collapsed };
  });
  const [dragging, setDragging] = useState(false);

  /* Persist any change */
  useEffect(() => {
    saveState(id, state);
  }, [id, state]);

  /* Re-clamp if the viewport shrinks while the panel is open. */
  useEffect(() => {
    const onResize = () => {
      setState((prev) => {
        const { x, y } = clampToViewport(prev.x, prev.y, width);
        return prev.x === x && prev.y === y ? prev : { ...prev, x, y };
      });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [width]);

  /* ── Pointer drag ────────────────────────────────────────────────
   * The header captures the pointer on down, then onPointerMove fires
   * even if the cursor leaves the element. We track the offset between
   * the click point and the panel origin so dragging feels stable. */
  const dragOffset = useRef<{ dx: number; dy: number } | null>(null);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    /* Only left mouse / primary pointer; ignore right-click etc. */
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    /* Don't initiate drag from interactive children (the chevron). */
    if ((e.target as HTMLElement).closest('[data-no-drag]')) return;

    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragOffset.current = { dx: e.clientX - state.x, dy: e.clientY - state.y };
    setDragging(true);
  };

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragOffset.current) return;
    const { dx, dy } = dragOffset.current;
    const next = clampToViewport(e.clientX - dx, e.clientY - dy, width);
    setState((prev) => ({ ...prev, ...next }));
  }, [width]);

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    dragOffset.current = null;
    setDragging(false);
  };

  const toggleCollapsed = () =>
    setState((prev) => ({ ...prev, collapsed: !prev.collapsed }));

  return (
    <div
      className="absolute select-none"
      style={{
        left:       state.x,
        top:        state.y,
        width,
        zIndex:     30,
        transition: dragging ? 'none' : 'box-shadow 0.2s',
        boxShadow:  dragging
          ? `0 16px 48px rgba(0,0,0,0.6), 0 0 0 1px ${accent}66`
          : '0 8px 24px rgba(0,0,0,0.5)',
      }}
    >
      <div
        className="rounded-xl overflow-hidden"
        style={{
          backgroundColor: 'rgba(15,15,28,0.85)',
          backdropFilter:  'blur(10px)',
          border:          '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {/* Drag handle */}
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="flex items-center gap-2 px-3 py-2.5 border-b border-white/10"
          style={{
            cursor:          dragging ? 'grabbing' : 'grab',
            backgroundColor: 'rgba(255,255,255,0.03)',
          }}
        >
          <GripVertical size={12} className="text-white/30 flex-shrink-0" />
          {icon && <span className="text-sm flex-shrink-0">{icon}</span>}
          <span className="text-sm font-semibold text-white/90 truncate flex-1">{title}</span>

          {collapsedBadge !== undefined && state.collapsed && (
            <span
              className="text-xs tabular-nums px-2 py-0.5 rounded-full flex-shrink-0"
              style={{
                color:           accent,
                backgroundColor: accent + '20',
              }}
            >
              {collapsedBadge}
            </span>
          )}

          <button
            data-no-drag
            onClick={toggleCollapsed}
            title={state.collapsed ? 'Expand' : 'Collapse'}
            className="p-1 rounded text-white/50 hover:text-white/90 hover:bg-white/10 transition-colors flex-shrink-0"
          >
            {state.collapsed
              ? <ChevronDown size={12} />
              : <ChevronUp   size={12} />}
          </button>
        </div>

        {/* Body — slide-collapse via max-height */}
        <div
          style={{
            maxHeight:  state.collapsed ? 0 : maxBodyHeight,
            transition: 'max-height 0.25s ease',
            overflow:   'hidden',
          }}
        >
          <div className="overflow-y-auto" style={{ maxHeight: maxBodyHeight }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
