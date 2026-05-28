import { View, Text, TouchableOpacity } from 'react-native';
import { MEMBER_COLORS } from '../../lib/constants';
import { displayInitial, type GroupWithDetails } from './types';

interface GroupCardProps {
  group:   GroupWithDetails;
  onPress: () => void;
}

/** One row in the Groups tab list. Tappable; opens the detail modal. */
export function GroupCard({ group, onPress }: GroupCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-bg-card border border-border rounded-xl p-4"
    >
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-white font-semibold">{group.name}</Text>
        <Text className="text-text-muted text-xs">
          {group.members.length} member{group.members.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {group.description ? (
        <Text className="text-text-muted text-sm mb-2" numberOfLines={1}>
          {group.description}
        </Text>
      ) : null}

      <View className="flex-row gap-1.5">
        {group.members.slice(0, 5).map((member, i) => {
          const color = MEMBER_COLORS[i % MEMBER_COLORS.length];
          return (
            <View
              key={member.id}
              className="w-7 h-7 rounded-full items-center justify-center"
              style={{
                backgroundColor: color + '30',
                borderWidth:     1,
                borderColor:     color + '60',
              }}
            >
              <Text className="text-xs font-bold" style={{ color }}>
                {displayInitial(member)}
              </Text>
            </View>
          );
        })}
      </View>
    </TouchableOpacity>
  );
}
