export interface Profile {
  id:           string;
  display_name: string | null;
  bio:          string | null;
  avatar_url:   string | null;
  character_id: string | null;
  updated_at?:  string;
  created_at:   string;
}

export interface Domain {
  id: string;
  user_id: string;
  name: string;
  color: string;
  /** Lucide icon name (e.g. 'BookOpen', 'Music'). Null on legacy rows
   *  that pre-date the icons feature; UI falls back to the color dot. */
  icon?: string | null;
  created_at: string;
}

export type TimerMode   = 'pomodoro' | 'countdown' | 'stopwatch';
export type SkillStatus = 'active' | 'shelved';
export type SkillGoalType = 'hours' | 'exam';

/** Hours-per-weekday plan. Missing keys are treated as 0. */
export interface WeeklySchedule {
  mon?: number;
  tue?: number;
  wed?: number;
  thu?: number;
  fri?: number;
  sat?: number;
  sun?: number;
}

export interface Skill {
  id: string;
  domain_id: string;
  user_id: string;
  name: string;
  color: string;
  status: SkillStatus;
  goal_hours: number;
  timer_mode: TimerMode;
  pomodoro_work_minutes: number;
  pomodoro_break_minutes: number;
  pomodoro_sessions: number;
  created_at: string;
  // Goal type extension (migration 004) — defaults to 'hours' for legacy rows
  goal_type?:       SkillGoalType;
  exam_date?:       string | null;       // ISO date 'YYYY-MM-DD'
  weekly_schedule?: WeeklySchedule | null;
  // joined
  domain?: Domain;
  logged_hours?: number;
}

export interface Session {
  id: string;
  skill_id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  verified: boolean;
  created_at: string;
}

export interface Memo {
  id: string;
  skill_id: string;
  session_id: string | null;
  user_id: string;
  content: string;
  date: string;
  created_at: string;
  updated_at: string;
  // joined
  media?: MemoMedia[];
}

export interface MemoMedia {
  id: string;
  memo_id: string;
  storage_path: string;
  url: string;
  media_type: 'image' | 'video';
  created_at: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  created_by: string;
  invite_code: string;
  created_at: string;
  // joined
  member_count?: number;
  members?: GroupMember[];
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  // joined
  profile?: Profile;
}

export interface GroupSkillShare {
  id: string;
  group_id: string;
  user_id: string;
  skill_id: string | null;
  domain_id: string | null;
  share_type: 'skill' | 'domain';
  created_at: string;
}

export interface HeatmapDay {
  date: string;
  hours: number;
  color: string;
  skills: Array<{ name: string; hours: number; color: string }>;
}

export type HeatmapMode = 'all' | 'skill' | 'domain';

export interface TimerState {
  isRunning: boolean;
  isPaused: boolean;
  sessionId: string | null;
  skillId: string | null;
  phase: 'work' | 'break';
  currentPomodoroSession: number;
  /** UI value: seconds remaining for pomodoro/countdown; seconds elapsed for stopwatch.
   *  Computed from wall-clock anchors below — DO NOT mutate directly. */
  secondsRemaining: number;
  /** Phase length in seconds (0 for stopwatch). */
  totalSeconds: number;
  /** Absolute timestamp the session began (used for DB duration). */
  startedAt: number | null;
  /** Absolute timestamp the current phase began (resets on phase change). */
  phaseStartedAt: number | null;
  /** Absolute timestamp of the current pause, or null if not paused. */
  pausedAt: number | null;
  /** Milliseconds spent paused within the current phase. Doesn't count toward elapsed time. */
  pausedAccumulatedMs: number;
}

export interface EvidenceReviewRequest {
  session_duration_seconds: number;
  notes: string;
  image_urls: string[];
  skill_name: string;
  skill_domain: string;
}

export interface EvidenceReviewResponse {
  feedback: string;
  verified: boolean;
}

export const DOMAIN_COLORS = [
  '#7c6cf0',
  '#f0906c',
  '#4cdf90',
  '#60b8f0',
  '#f0c060',
] as const;

export type DomainColor = (typeof DOMAIN_COLORS)[number];
