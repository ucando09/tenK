/**
 * PomodoroActiveView — running-session view on the Timer tab.
 * Phase badge, progress dots, timer ring, transport controls.
 */
import { View, Text, TouchableOpacity } from 'react-native';
import { Play, Pause, SkipForward, X } from 'lucide-react-native';
import { TimerCircle } from '../TimerCircle';
import { useTimerStore } from '../../store/timerStore';
import type { SkillWithDomain } from './SkillTimerCard';

interface PomodoroActiveViewProps {
  skill:    SkillWithDomain | null;
  onEnd:    () => void;
  onPause:  () => void;
  onResume: () => void;
  onSkip:   () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function PomodoroActiveView({
  skill, onEnd, onPause, onResume, onSkip,
}: PomodoroActiveViewProps) {
  const { timer } = useTimerStore();

  if (!skill) return null;

  const phaseProgress = timer.totalSeconds > 0
    ? (timer.totalSeconds - timer.secondsRemaining) / timer.totalSeconds
    : 0;

  return (
    <View className="flex-1 items-center justify-center gap-6 px-8">
      {/* Header */}
      <View className="w-full flex-row items-center justify-between">
        <View>
          <Text className="text-white font-bold text-lg">{skill.name}</Text>
          {skill.domain && (
            <Text className="text-sm" style={{ color: skill.domain.color }}>
              {skill.domain.name}
            </Text>
          )}
        </View>
        <TouchableOpacity
          onPress={onEnd}
          className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-elevated border border-border"
        >
          <X size={14} color="#e05555" />
          <Text className="text-error text-xs font-medium">End</Text>
        </TouchableOpacity>
      </View>

      {/* Phase badge */}
      <View className="flex-row items-center gap-2 px-4 py-2 rounded-full bg-bg-elevated border border-border">
        <Text className="text-base">{timer.phase === 'work' ? '🍅' : '☕'}</Text>
        <Text className="text-text-secondary text-sm font-medium">
          {timer.phase === 'work'
            ? `FOCUS · ${skill.pomodoro_work_minutes} MIN`
            : `BREAK · ${skill.pomodoro_break_minutes} MIN`}
        </Text>
      </View>

      {/* Session dots */}
      <View className="flex-row gap-2 items-center">
        {Array.from({ length: skill.pomodoro_sessions }).map((_, i) => {
          const sNum      = i + 1;
          const isDone    = sNum < timer.currentPomodoroSession;
          const isCurrent = sNum === timer.currentPomodoroSession && timer.phase === 'work';
          return (
            <View
              key={i}
              style={{
                width:           isCurrent ? 20 : 12,
                height:          12,
                borderRadius:    6,
                backgroundColor: isDone ? '#28c840' : isCurrent ? skill.color : '#1e1e3a',
              }}
            />
          );
        })}
      </View>

      {/* Timer ring */}
      <TimerCircle
        progress={(skill.logged_hours ?? 0) / skill.goal_hours}
        size={240}
        color={skill.color}
        phaseProgress={phaseProgress}
      >
        <View className="items-center">
          <Text className="text-white text-4xl font-bold font-mono">
            {formatTime(timer.secondsRemaining)}
          </Text>
          <Text className="text-text-muted text-xs uppercase tracking-widest mt-1">
            {timer.phase === 'work' ? 'Focus' : 'Break'}
          </Text>
        </View>
      </TimerCircle>

      <Text className="text-text-muted text-sm">
        Session {timer.currentPomodoroSession} of {skill.pomodoro_sessions}
      </Text>

      {/* Controls */}
      <View className="flex-row gap-4 items-center">
        <TouchableOpacity
          onPress={timer.isPaused ? onResume : onPause}
          className="flex-row items-center gap-2 px-6 py-3 rounded-xl"
          style={{ backgroundColor: skill.color }}
        >
          {timer.isPaused
            ? <Play size={16} color="white" fill="white" />
            : <Pause size={16} color="white" />}
          <Text className="text-white font-semibold">
            {timer.isPaused ? 'Resume' : 'Pause'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onSkip}
          className="flex-row items-center gap-2 px-4 py-3 rounded-xl bg-bg-elevated border border-border"
        >
          <SkipForward size={16} color="#cccccc" />
          <Text className="text-text-secondary">Skip</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
