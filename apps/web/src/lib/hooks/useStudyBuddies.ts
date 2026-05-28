import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase';
import { DEFAULT_CHARACTER_ID } from '../characters';
import type { GroupWithDetails } from '../api/groups';

export interface StudyBuddy {
  userId:       string;
  displayName:  string;
  characterId:  string;
  isStudying:   boolean;
  skillName:    string | null;
  skillColor:   string | null;
  startedAt:    string | null;
  /** Elapsed hours of the current session only. Resets to 0 when session ends. */
  sessionHours: number;
  /** All-time completed study hours. */
  totalHours:   number;
}

export interface StudyGroup {
  id:      string;
  name:    string;
  buddies: StudyBuddy[];
}

/** 0 = idle, 1 = <1 h, 2 = 1–3 h, 3 = 3 h+ */
export function getEvolutionStage(buddy: StudyBuddy): 0 | 1 | 2 | 3 {
  if (!buddy.isStudying) return 0;
  if (buddy.sessionHours >= 3) return 3;
  if (buddy.sessionHours >= 1) return 2;
  return 1;
}

type RawSession = {
  user_id:    string;
  started_at: string;
  skill:      { name: string; color: string } | null;
};

const POLL_MS = 30_000;

export function useStudyBuddies(
  groups:        GroupWithDetails[],
  currentUserId: string | null,
): { groups: StudyGroup[]; initialized: boolean } {
  const [result,      setResult]      = useState<StudyGroup[]>([]);
  const [initialized, setInitialized] = useState(false);
  const groupsRef       = useRef(groups);
  const currentUserRef  = useRef(currentUserId);
  groupsRef.current     = groups;
  currentUserRef.current = currentUserId;

  useEffect(() => {
    const run = async () => {
      const grps   = groupsRef.current;
      const selfId = currentUserRef.current;

      // Collect unique member IDs across all groups (excluding self)
      const memberIds = Array.from(
        new Set(grps.flatMap((g) => g.members.map((m) => m.user_id))),
      ).filter((id) => id !== selfId);

      if (!memberIds.length) {
        setResult([]);
        setInitialized(true);
        return;
      }

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const [
        { data: profiles },
        { data: rawActive },
        { data: rawCompleted },
      ] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, display_name, character_id')
          .in('id', memberIds),
        supabase
          .from('sessions')
          .select('user_id, started_at, skill:skills(name, color)')
          .in('user_id', memberIds)
          .is('ended_at', null)
          .gte('started_at', todayStart.toISOString()),
        supabase
          .from('sessions')
          .select('user_id, duration_seconds')
          .in('user_id', memberIds)
          .not('ended_at', 'is', null)
          .not('duration_seconds', 'is', null),
      ]);

      const activeSessions = (rawActive ?? []) as unknown as RawSession[];

      const latestActive = new Map<string, RawSession>();
      for (const s of activeSessions) {
        const ex = latestActive.get(s.user_id);
        if (!ex || s.started_at > ex.started_at) latestActive.set(s.user_id, s);
      }

      const completedHours = new Map<string, number>();
      for (const s of rawCompleted ?? []) {
        completedHours.set(
          s.user_id,
          (completedHours.get(s.user_id) ?? 0) + (s.duration_seconds ?? 0) / 3600,
        );
      }

      const pMap = new Map((profiles ?? []).map((p) => [p.id, p]));

      // Build a buddy record for every unique member
      const buddyMap = new Map<string, StudyBuddy>();
      for (const uid of memberIds) {
        const p       = pMap.get(uid);
        const session = latestActive.get(uid);
        const sessionHours = session
          ? (Date.now() - new Date(session.started_at).getTime()) / 3_600_000
          : 0;
        buddyMap.set(uid, {
          userId:       uid,
          displayName:  (p as { display_name?: string | null } | undefined)?.display_name ?? 'Member',
          characterId:  (p as { character_id?: string | null } | undefined)?.character_id ?? DEFAULT_CHARACTER_ID,
          isStudying:   !!session,
          skillName:    session?.skill?.name  ?? null,
          skillColor:   session?.skill?.color ?? null,
          startedAt:    session?.started_at   ?? null,
          sessionHours,
          totalHours:   (completedHours.get(uid) ?? 0) + sessionHours,
        });
      }

      // Assign buddies per group; a user can be in multiple groups
      const grouped: StudyGroup[] = grps
        .map((g) => {
          const buddies = g.members
            .map((m) => buddyMap.get(m.user_id))
            .filter((b): b is StudyBuddy => !!b && b.userId !== selfId);

          buddies.sort((a, b) => {
            if (a.isStudying !== b.isStudying) return a.isStudying ? -1 : 1;
            return b.totalHours - a.totalHours;
          });

          return { id: g.id, name: g.name, buddies };
        })
        .filter((g) => g.buddies.length > 0);

      setResult(grouped);
      setInitialized(true);
    };

    run();
    const id = setInterval(run, POLL_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups.length, currentUserId]);

  return { groups: result, initialized };
}
