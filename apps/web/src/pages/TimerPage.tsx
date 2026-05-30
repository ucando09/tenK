import { useState, useCallback, useEffect } from 'react';
import { Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { HeatmapCalendar } from '../components/Calendar/HeatmapCalendar';
import { EvidenceModal } from '../components/Timer/EvidenceModal';
import { GoalModal } from '../components/Timer/GoalModal';
import { IdleCard } from '../components/Timer/IdleCard';
import { RunningCard } from '../components/Timer/RunningCard';
import { FocusMode } from '../components/Timer/FocusMode';
import { NoSkillsPrompt } from '../components/Timer/NoSkillsPrompt';
import { GroupDetail } from '../components/Groups/GroupDetail';
import { GroupRow } from '../components/Groups/GroupRow';
import { useAppStore } from '../lib/store';
import { useTimer } from '../lib/hooks/useTimer';
import { playBell, unlockAudio } from '../lib/utils';
import { useGroups } from '../lib/hooks/useGroups';
import { useStudyBuddies } from '../lib/hooks/useStudyBuddies';
import type { SessionGoal } from '../lib/store';
import type { Skill, Group, GroupMember, GroupSkillShare } from '@tenk/shared';

type GroupWithDetails = Group & { members: GroupMember[]; my_shares: GroupSkillShare[] };

interface EvidenceState {
  sessionId: string;
  durationSeconds: number;
}

// ─────────────────────────────────────────────────────────────────────────────
export function TimerPage() {
  const {
    userId,
    skills, activeSkillId, setActiveSkillId, timer,
    sessionGoals, setSessionGoals, toggleGoal,
    focusModeActive,
    sessionTimerConfig,
  } = useAppStore();
  const navigate = useNavigate();

  const activeSkills  = skills.filter((s) => s.status === 'active');
  const isTimerActive = timer.isRunning || timer.isPaused;

  // While the timer is running keep showing the skill it started with;
  // otherwise fall back to the user-selected skill (or the first active one).
  const displaySkill: Skill | null = isTimerActive
    ? (skills.find((s) => s.id === timer.skillId) ?? null)
    : (activeSkills.find((s) => s.id === activeSkillId) ?? activeSkills[0] ?? null);

  const [evidence,      setEvidence]      = useState<EvidenceState | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<GroupWithDetails | null>(null);
  const [showGoalModal, setShowGoalModal] = useState(false);

  const { handleStart, handlePause, handleResume, handleSkip, handleStop, formatTime } =
    useTimer(displaySkill);

  const { groups, loading: groupsLoading, shareSkill, unshareSkill, leaveGroup, updateGroup } =
    useGroups();

  const { groups: studyGroups, initialized: studyGroupsReady } = useStudyBuddies(groups, userId);

  const hasGroupMembers = groups.some((g) =>
    g.members.some((m) => m.user_id !== userId),
  );

  // ── Phase-end logic ───────────────────────────────────────────────────────
  // Triggered when the countdown hits 0. Behaviour depends on session mode:
  //   - pomodoro:  cycle work↔break; end session after the last work phase
  //   - countdown: end the session (only one phase)
  //   - stopwatch: never — stopwatch counts UP and is ended manually
  const handlePhaseEnd = useCallback(() => {
    if (!displaySkill) return;
    playBell();

    /* Countdown — one block, then we're done */
    if (sessionTimerConfig.mode === 'countdown') {
      handleStop().then((sessionId) => {
        if (sessionId) {
          const elapsed = timer.startedAt
            ? Math.floor((Date.now() - timer.startedAt) / 1000)
            : sessionTimerConfig.countdownMinutes * 60;
          setEvidence({ sessionId, durationSeconds: elapsed });
        }
      });
      return;
    }

    /* Pomodoro — work / break cycle */
    if (timer.phase === 'work') {
      if (timer.currentPomodoroSession >= sessionTimerConfig.sessions) {
        handleStop().then((sessionId) => {
          if (sessionId) {
            const elapsed = timer.startedAt
              ? Math.floor((Date.now() - timer.startedAt) / 1000)
              : sessionTimerConfig.workMinutes * sessionTimerConfig.sessions * 60;
            setEvidence({ sessionId, durationSeconds: elapsed });
          }
        });
      } else {
        handleSkip();
      }
    } else {
      handleSkip();
    }
  }, [
    timer.phase, timer.currentPomodoroSession, timer.startedAt,
    displaySkill, handleStop, handleSkip, sessionTimerConfig,
  ]);

  useEffect(() => {
    /* Stopwatch counts up — there is no "0" terminal state, so we
     *  never auto-end the session from the timer reaching a value. */
    if (sessionTimerConfig.mode === 'stopwatch') return;
    if (timer.secondsRemaining === 0 && timer.isRunning) handlePhaseEnd();
  }, [timer.secondsRemaining, timer.isRunning, handlePhaseEnd, sessionTimerConfig.mode]);

  const handleEndSession = useCallback(async () => {
    const sessionId = await handleStop();
    if (sessionId && timer.startedAt) {
      setEvidence({ sessionId, durationSeconds: Math.floor((Date.now() - timer.startedAt) / 1000) });
    }
  }, [handleStop, timer.startedAt]);

  // Called by GoalModal — stores goals then starts the timer
  const handleGoalStart = useCallback(async (goals: SessionGoal[]) => {
    unlockAudio(); // must be synchronous, before any await, to stay within the user gesture
    setSessionGoals(goals);
    await handleStart();
    setShowGoalModal(false);
  }, [handleStart, setSessionGoals]);

  // Called by GoalsMemo inside FocusMode — adds a goal mid-session
  const handleAddGoal = useCallback((text: string) => {
    setSessionGoals([...sessionGoals, { id: crypto.randomUUID(), text, done: false }]);
  }, [sessionGoals, setSessionGoals]);

  const phaseProgress =
    timer.totalSeconds > 0
      ? (timer.totalSeconds - timer.secondsRemaining) / timer.totalSeconds
      : 0;

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-5xl mx-auto p-6">
        <div className="grid grid-cols-[285px_1fr] gap-5">

          {/* ════ LEFT COLUMN ════ */}
          <aside className="flex flex-col gap-4">

            {/* Monthly activity heatmap */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-text-primary">Activity</h2>
                <span className="text-[10px] text-text-dim uppercase tracking-wider">Monthly</span>
              </div>
              <HeatmapCalendar mode="all" compact />
            </div>

            {/* Study groups */}
            <div className="card p-5 flex-1">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-text-primary flex items-center gap-1.5">
                  <Users size={13} className="text-text-muted" />
                  Study Groups
                </h2>
                <button
                  onClick={() => navigate('/groups')}
                  className="text-xs text-accent hover:text-accent-light transition-colors"
                >
                  Manage →
                </button>
              </div>

              {groupsLoading ? (
                <div className="flex justify-center py-6">
                  <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                </div>
              ) : groups.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-text-muted text-xs mb-3">No groups yet</p>
                  <button
                    onClick={() => navigate('/groups')}
                    className="text-xs text-accent hover:text-accent-light transition-colors"
                  >
                    + Join or create a group
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {groups.map((group) => (
                    <GroupRow key={group.id} group={group} onClick={() => setSelectedGroup(group)} />
                  ))}
                </div>
              )}
            </div>
          </aside>

          {/* ════ RIGHT COLUMN ════ */}
          <main className="flex flex-col gap-4">

            {/* Main timer card */}
            <div className="card overflow-hidden" style={{ minHeight: 480 }}>
              {!displaySkill ? (
                <NoSkillsPrompt onNavigate={() => navigate('/skills')} />
              ) : isTimerActive ? (
                <RunningCard
                  skill={displaySkill}
                  timer={timer}
                  phaseProgress={phaseProgress}
                  formatTime={formatTime}
                  goals={sessionGoals}
                  onToggleGoal={toggleGoal}
                  onPause={handlePause}
                  onResume={handleResume}
                  onSkip={handleSkip}
                  onEnd={handleEndSession}
                />
              ) : (
                <IdleCard skill={displaySkill} onRequestStart={() => setShowGoalModal(true)} />
              )}
            </div>

            {/* Mastery selector */}
            {activeSkills.length > 0 && (
              <div className="card p-4">
                <p className="text-[10px] text-text-dim uppercase tracking-widest font-semibold mb-3">
                  {isTimerActive ? 'Timer running — select after session ends' : 'Your Mastery'}
                </p>
                <div className="flex gap-2 flex-wrap">
                  {activeSkills.map((s) => {
                    const isSelected =
                      s.id === (isTimerActive ? timer.skillId : (activeSkillId ?? activeSkills[0]?.id));
                    return (
                      <button
                        key={s.id}
                        onClick={() => !isTimerActive && setActiveSkillId(s.id)}
                        disabled={isTimerActive}
                        className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 disabled:cursor-not-allowed"
                        style={
                          isSelected
                            ? { backgroundColor: s.color, color: 'white', boxShadow: `0 0 14px ${s.color}50` }
                            : { backgroundColor: s.color + '18', color: s.color, border: `1px solid ${s.color}30`, opacity: isTimerActive ? 0.45 : 1 }
                        }
                      >
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: isSelected ? 'rgba(255,255,255,0.8)' : s.color }}
                        />
                        {s.name}
                        {s.logged_hours !== undefined && (
                          <span className="text-xs opacity-70 tabular-nums">{s.logged_hours.toFixed(0)}h</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Pre-session goal-setting modal */}
      {displaySkill && (
        <GoalModal
          isOpen={showGoalModal}
          skill={displaySkill}
          onStart={handleGoalStart}
          onClose={() => setShowGoalModal(false)}
        />
      )}

      {/* Focus mode — fullscreen overlay while timer is running.
          Suppressed when the evidence modal is open so the user can
          fill it in without the focus background fighting for attention. */}
      {focusModeActive && isTimerActive && displaySkill && !evidence && (
        <FocusMode
          skill={displaySkill}
          timer={timer}
          goals={sessionGoals}
          studyGroups={studyGroups}
          studyGroupsReady={studyGroupsReady}
          hasGroupMembers={hasGroupMembers}
          formatTime={formatTime}
          onToggleGoal={toggleGoal}
          onAddGoal={handleAddGoal}
          onPause={handlePause}
          onResume={handleResume}
          onSkip={handleSkip}
          onEnd={async () => {
            const sessionId = await handleStop();
            if (sessionId && timer.startedAt) {
              setEvidence({
                sessionId,
                durationSeconds: Math.floor((Date.now() - timer.startedAt) / 1000),
              });
            }
          }}
        />
      )}

      {/* Post-session evidence modal */}
      {evidence && displaySkill && (
        <EvidenceModal
          sessionId={evidence.sessionId}
          durationSeconds={evidence.durationSeconds}
          skill={displaySkill}
          goals={sessionGoals}
          onToggleGoal={toggleGoal}
          onSubmit={() => { setEvidence(null); setSessionGoals([]); }}
          onSkip={()   => { setEvidence(null); setSessionGoals([]); }}
          onClose={()  => setEvidence(null)}
        />
      )}

      {/* Group detail modal */}
      {selectedGroup && (
        <GroupDetail
          group={selectedGroup}
          onShare={shareSkill}
          onUnshare={unshareSkill}
          onLeave={async (groupId) => { await leaveGroup(groupId); setSelectedGroup(null); }}
          onUpdate={async (groupId, name, description) => {
            await updateGroup(groupId, name, description);
            setSelectedGroup((g) => g && g.id === groupId ? { ...g, name, description } : g);
          }}
          onClose={() => setSelectedGroup(null)}
        />
      )}
    </div>
  );
}

