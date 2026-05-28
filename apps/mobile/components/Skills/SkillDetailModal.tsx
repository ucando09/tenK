/**
 * SkillDetailModal — fullscreen modal showing a single skill's progress,
 * heatmap, and shelve toggle.
 */
import { View, Text, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Calendar } from 'lucide-react-native';
import { format, parseISO } from 'date-fns';
import { HeatmapCalendar } from '../HeatmapCalendar';
import { supabase } from '../../lib/supabase';
import { computeSkillGoal } from '../../lib/skillGoal';
import type { SkillWithDomain } from './types';

interface SkillDetailModalProps {
  skill:     SkillWithDomain;
  onClose:   () => void;
  onRefresh: () => void;
}

export function SkillDetailModal({ skill, onClose, onRefresh }: SkillDetailModalProps) {
  const loggedHours = skill.logged_hours ?? 0;
  const goal        = computeSkillGoal(skill);
  const isExam      = skill.goal_type === 'exam' && !!skill.exam_date;

  const handleShelve = async () => {
    const newStatus = skill.status === 'active' ? 'shelved' : 'active';
    await supabase.from('skills').update({ status: newStatus }).eq('id', skill.id);
    onRefresh();
    onClose();
  };

  return (
    <Modal visible animationType="slide">
      <SafeAreaView className="flex-1 bg-bg-deep">
        <ScrollView className="flex-1 px-5 py-4">

          {/* Header */}
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-2">
              <View className="w-3 h-3 rounded-full" style={{ backgroundColor: skill.color }} />
              <Text className="text-white text-xl font-bold">{skill.name}</Text>
            </View>
            <TouchableOpacity onPress={onClose} className="p-2">
              <X size={20} color="#555555" />
            </TouchableOpacity>
          </View>

          {/* Exam badge */}
          {isExam && skill.exam_date && (
            <View className="flex-row self-start items-center gap-1.5 px-2.5 py-1 rounded-full bg-bg-elevated border border-border mb-4">
              <Calendar size={11} color="#7070a0" />
              <Text className="text-text-muted text-xs">
                Exam · {format(parseISO(skill.exam_date), 'MMM d, yyyy')}
                {goal.daysToExam !== undefined && goal.daysToExam > 0 && (
                  <Text className="text-accent"> · {goal.daysToExam}d left</Text>
                )}
                {goal.examPassed && <Text className="text-error"> · passed</Text>}
              </Text>
            </View>
          )}

          {/* Stats */}
          <View className="flex-row gap-3 mb-5">
            <StatCard label="Logged" value={`${loggedHours.toFixed(1)}h`} />
            <StatCard label="Complete" value={`${(goal.progress * 100).toFixed(1)}%`} />
            <StatCard
              label={isExam ? 'To plan' : 'Remaining'}
              value={`${goal.hoursRemaining.toFixed(0)}h`}
            />
          </View>

          {/* Progress bar */}
          <View className="h-2 bg-bg-elevated rounded-full overflow-hidden mb-5">
            <View
              style={{
                width:           `${goal.progress * 100}%`,
                height:          '100%',
                backgroundColor: skill.color,
                borderRadius:    999,
              }}
            />
          </View>

          {/* Heatmap */}
          <View className="mb-5">
            <Text className="text-text-secondary text-sm font-medium mb-3">Activity</Text>
            <HeatmapCalendar skillId={skill.id} accentColor={skill.color} />
          </View>

          {/* Shelve toggle */}
          <TouchableOpacity
            onPress={handleShelve}
            className="py-3 rounded-xl bg-bg-elevated border border-border items-center mb-3"
          >
            <Text className="text-text-secondary font-medium">
              {skill.status === 'active' ? 'Shelve Skill' : 'Unshelve Skill'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 bg-bg-elevated rounded-xl p-3 items-center border border-border">
      <Text className="text-white font-bold text-lg">{value}</Text>
      <Text className="text-text-muted text-xs mt-0.5">{label}</Text>
    </View>
  );
}
