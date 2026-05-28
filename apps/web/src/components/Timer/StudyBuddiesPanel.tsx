import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CharacterAvatar } from '../Character/CharacterAvatar';
import { getCharacter } from '../../lib/characters';
import { getEvolutionStage } from '../../lib/hooks/useStudyBuddies';
import type { StudyGroup, StudyBuddy } from '../../lib/hooks/useStudyBuddies';

interface StudyBuddiesPanelProps {
  groups:      StudyGroup[];
  initialized: boolean;
}

/* ── Helpers ──────────────────────────────────────────────────────── */

function hoursLabel(hours: number): string {
  if (hours < 1 / 60) return '0m';
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/* ── Evolution avatar ─────────────────────────────────────────────── */

const STAGE_DECAL: Record<1 | 2 | 3, string> = { 1: '', 2: '✨', 3: '🔥' };

function EvoAvatar({ buddy }: { buddy: StudyBuddy }) {
  const stage = getEvolutionStage(buddy);
  const char  = getCharacter(buddy.characterId);
  const size  = 44;

  const ringColor =
    stage === 3 ? '#ff7c40'
    : stage === 2 ? char.color
    : stage === 1 ? char.color
    : 'transparent';

  const ringStyle: React.CSSProperties =
    stage === 0
      ? {}
      : {
          border:     `2px solid ${ringColor}`,
          boxShadow:  stage >= 2
            ? `0 0 ${stage === 3 ? 18 : 10}px ${ringColor}${stage === 3 ? 'cc' : '80'}`
            : `0 0 6px ${ringColor}50`,
          animation:  stage >= 2 ? `evo-pulse ${stage === 3 ? 1.5 : 2}s ease-in-out infinite` : undefined,
        };

  return (
    <div className="relative flex items-center justify-center" style={{ width: size + 8, height: size + 8 }}>
      {/* Decal (✨ / 🔥) above the avatar for stages 2-3 */}
      {stage >= 2 && (
        <span
          className="absolute"
          style={{ top: -8, left: '50%', transform: 'translateX(-50%)', fontSize: 11, lineHeight: 1 }}
        >
          {STAGE_DECAL[stage as 2 | 3]}
        </span>
      )}

      {/* Avatar */}
      <CharacterAvatar
        characterId={buddy.characterId}
        size={size}
        ring={false}
        className="transition-all duration-700"
        // Pass ring styles via a wrapping div below
      />

      {/* Invisible sized div that carries the ring/glow via outline */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={ringStyle}
      />

      {/* Online green dot */}
      {buddy.isStudying && (
        <span
          className="absolute rounded-full"
          style={{
            width:           8,
            height:          8,
            bottom:          2,
            right:           2,
            backgroundColor: '#4cdf90',
            border:          '1.5px solid rgba(0,0,0,0.8)',
            boxShadow:       '0 0 5px #4cdf9080',
          }}
        />
      )}
    </div>
  );
}

/* ── Single buddy card ────────────────────────────────────────────── */

function BuddyCard({ buddy }: { buddy: StudyBuddy }) {
  const stage = getEvolutionStage(buddy);
  return (
    <div
      className="flex flex-col items-center gap-0.5 transition-opacity duration-500"
      style={{ opacity: buddy.isStudying ? 1 : 0.38, minWidth: 0 }}
    >
      <EvoAvatar buddy={buddy} />

      {/* Name */}
      <p
        className="text-[10px] font-medium leading-tight text-center w-full truncate px-0.5"
        style={{ color: buddy.isStudying ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.5)' }}
      >
        {buddy.displayName}
      </p>

      {/* Total hours */}
      <p
        className="text-[9px] leading-tight text-center w-full truncate"
        style={{
          color: stage === 3 ? '#ff9f68'
               : stage === 2 ? 'rgba(255,255,255,0.65)'
               : 'rgba(255,255,255,0.35)',
        }}
      >
        {hoursLabel(buddy.totalHours)}
      </p>
    </div>
  );
}

/* ── Main panel ───────────────────────────────────────────────────── */

export function StudyBuddiesPanel({ groups, initialized }: StudyBuddiesPanelProps) {
  const [idx, setIdx] = useState(0);

  if (!initialized) {
    return (
      <div className="flex items-center justify-center py-7">
        <div
          className="w-4 h-4 rounded-full border-2 animate-spin"
          style={{ borderColor: 'rgba(255,255,255,0.2)', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <p className="px-4 py-6 text-[11px] text-center" style={{ color: 'rgba(255,255,255,0.30)' }}>
        Invite friends to a group to see them here.
      </p>
    );
  }

  const clampedIdx = Math.min(idx, groups.length - 1);
  const group      = groups[clampedIdx];
  const studying   = group.buddies.filter((b) => b.isStudying).length;

  return (
    <div>
      {/* Group navigation header */}
      <div
        className="flex items-center gap-1 px-3 py-2 border-b border-white/10"
        style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
      >
        <button
          onClick={() => setIdx((i) => (i - 1 + groups.length) % groups.length)}
          disabled={groups.length <= 1}
          className="p-0.5 rounded text-white/40 hover:text-white/80 disabled:opacity-20 transition-colors"
        >
          <ChevronLeft size={13} />
        </button>

        <div className="flex-1 min-w-0 text-center">
          <p className="text-[11px] font-semibold text-white/85 truncate">{group.name}</p>
          <p className="text-[9px]" style={{ color: 'rgba(255,255,255,0.40)' }}>
            {studying > 0 ? `${studying}/${group.buddies.length} studying` : `${group.buddies.length} members`}
            {groups.length > 1 && ` · ${clampedIdx + 1}/${groups.length}`}
          </p>
        </div>

        <button
          onClick={() => setIdx((i) => (i + 1) % groups.length)}
          disabled={groups.length <= 1}
          className="p-0.5 rounded text-white/40 hover:text-white/80 disabled:opacity-20 transition-colors"
        >
          <ChevronRight size={13} />
        </button>
      </div>

      {/* Avatar grid — 4 columns */}
      <div className="grid grid-cols-4 gap-x-2 gap-y-3 px-3 py-3">
        {group.buddies.map((buddy) => (
          <BuddyCard key={buddy.userId} buddy={buddy} />
        ))}
      </div>

      <EvolutionStyles />
    </div>
  );
}

function EvolutionStyles() {
  return (
    <style>{`
      @keyframes evo-pulse {
        0%, 100% { opacity: 1;    transform: scale(1);    }
        50%      { opacity: 0.75; transform: scale(1.06); }
      }
    `}</style>
  );
}
