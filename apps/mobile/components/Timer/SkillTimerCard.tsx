/**
 * SkillTimerCard — one slide in the swipeable carousel on the Timer tab.
 * Shows the skill's progress ring + a START button. Handles both 'hours'
 * and 'exam' goal types via computeSkillGoal.
 */
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { Play, Calendar } from 'lucide-react-native';
import { format, parseISO } from 'date-fns';
import { TimerCircle } from '../TimerCircle';
import { computeSkillGoal } from '../../lib/skillGoal';
import type { Skill, Domain } from '@tenk/shared';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface SkillWithDomain extends Skill {
  domain?:       Domain;
  logged_hours?: number;
}

interface SkillTimerCardProps {
  skill:   SkillWithDomain;
  onStart: () => void;
}

export function SkillTimerCard({ skill, onStart }: SkillTimerCardProps) {
  const loggedHours = skill.logged_hours ?? 0;
  const goal        = computeSkillGoal(skill);
  const donePct     = goal.goalHours > 0
    ? ((loggedHours / goal.goalHours) * 100).toFixed(1)
    : '0.0';

  const isExam = skill.goal_type === 'exam' && !!skill.exam_date;

  return (
    <View
      style={{ width: SCREEN_WIDTH }}
      className="flex-1 items-center justify-center px-8 gap-6"
    >
      <View className="items-center gap-1">
        <Text className="text-white text-2xl font-bold">{skill.name}</Text>
        {skill.domain && (
          <Text className="text-sm" style={{ color: skill.domain.color }}>
            {skill.domain.name}
          </Text>
        )}
        {isExam && skill.exam_date && (
          <View className="flex-row items-center gap-1.5 mt-1 px-2.5 py-0.5 rounded-full bg-bg-elevated border border-border">
            <Calendar size={10} color="#7070a0" />
            <Text className="text-text-muted text-xs">
              Exam · {format(parseISO(skill.exam_date), 'MMM d, yyyy')}
              {goal.daysToExam !== undefined && goal.daysToExam > 0 && (
                <Text className="text-accent"> · {goal.daysToExam}d left</Text>
              )}
              {goal.examPassed && <Text className="text-error"> · passed</Text>}
            </Text>
          </View>
        )}
      </View>

      <TimerCircle progress={goal.progress} color={skill.color} size={260}>
        <View className="items-center px-4">
          {goal.examIncomplete ? (
            <>
              <Calendar size={28} color="#555555" style={{ marginBottom: 6 }} />
              <Text className="text-white text-sm font-semibold text-center">
                Set up your exam plan
              </Text>
              <Text
                className="text-text-muted text-xs mt-1 text-center"
                style={{ maxWidth: 180 }}
              >
                Open this skill in Skills tab and add an exam date + weekly hours.
              </Text>
              <TouchableOpacity
                onPress={onStart}
                className="mt-3 px-6 py-2 rounded-xl flex-row items-center gap-2"
                style={{ backgroundColor: skill.color }}
              >
                <Play size={12} color="white" fill="white" />
                <Text className="text-white font-bold text-xs">Start anyway</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text className="text-white text-4xl font-bold font-mono">
                {goal.hoursRemaining.toFixed(0)}
              </Text>
              <Text className="text-text-muted text-xs uppercase tracking-widest mt-1">
                {isExam ? 'HRS TO PLAN' : 'HRS REMAINING'}
              </Text>
              <TouchableOpacity
                onPress={onStart}
                className="mt-5 px-8 py-2.5 rounded-xl flex-row items-center gap-2"
                style={{
                  backgroundColor: skill.color,
                  shadowColor:     skill.color,
                  shadowOpacity:   0.4,
                  shadowRadius:    12,
                  elevation:       4,
                }}
              >
                <Play size={14} color="white" fill="white" />
                <Text className="text-white font-bold text-sm">START</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </TimerCircle>

      <View className="flex-row gap-8">
        <View className="items-center">
          <Text className="text-white font-bold text-lg">{loggedHours.toFixed(1)}h</Text>
          <Text className="text-text-muted text-xs">Logged</Text>
        </View>
        <View className="items-center">
          <Text className="text-white font-bold text-lg">{donePct}%</Text>
          <Text className="text-text-muted text-xs">Done</Text>
        </View>
      </View>
    </View>
  );
}
