/**
 * DomainGroup — collapsible card showing one domain's skills with mini
 * progress bars. Used in the Skills tab.
 */
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react-native';
import type { Domain } from '@tenk/shared';
import type { SkillWithDomain } from './types';

interface DomainGroupProps {
  domain:       Domain;
  skills:       SkillWithDomain[];
  expanded:     boolean;
  onToggle:     () => void;
  onSelectSkill: (skill: SkillWithDomain) => void;
  onAddSkill:   () => void;
}

export function DomainGroup({
  domain, skills, expanded, onToggle, onSelectSkill, onAddSkill,
}: DomainGroupProps) {
  if (skills.length === 0) return null;

  return (
    <View
      className="mb-3 bg-bg-card rounded-xl border border-border overflow-hidden"
      style={{ borderLeftColor: domain.color, borderLeftWidth: 3 }}
    >
      <TouchableOpacity
        onPress={onToggle}
        className="flex-row items-center px-4 py-3.5 gap-2"
      >
        <View className="w-3 h-3 rounded-full" style={{ backgroundColor: domain.color }} />
        <Text className="text-white font-semibold text-sm flex-1">{domain.name}</Text>
        <Text className="text-text-muted text-xs mr-1">{skills.length}</Text>
        {expanded
          ? <ChevronDown size={15} color="#555555" />
          : <ChevronRight size={15} color="#555555" />}
      </TouchableOpacity>

      {expanded && (
        <View className="border-t border-border">
          {skills.map((skill) => {
            const progress = Math.min((skill.logged_hours ?? 0) / skill.goal_hours, 1);
            return (
              <TouchableOpacity
                key={skill.id}
                onPress={() => onSelectSkill(skill)}
                className="flex-row items-center px-4 py-3 border-t border-border gap-2.5"
                style={{ opacity: skill.status === 'shelved' ? 0.5 : 1 }}
              >
                <View
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: skill.color }}
                />
                <View className="flex-1">
                  <Text className="text-white text-sm">{skill.name}</Text>
                  <View className="flex-row items-center gap-2 mt-1">
                    <View className="flex-1 h-1 bg-bg-elevated rounded-full overflow-hidden">
                      <View
                        style={{
                          width:           `${progress * 100}%`,
                          height:          '100%',
                          backgroundColor: skill.color,
                          borderRadius:    999,
                        }}
                      />
                    </View>
                    <Text className="text-text-muted text-xs">
                      {(skill.logged_hours ?? 0).toFixed(1)}h
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            onPress={onAddSkill}
            className="flex-row items-center gap-2 px-4 py-3 border-t border-border"
          >
            <Plus size={13} color="#555555" />
            <Text className="text-text-muted text-sm">Add skill</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
