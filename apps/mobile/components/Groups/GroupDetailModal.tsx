import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Copy } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { HeatmapCalendar } from '../HeatmapCalendar';
import { MEMBER_COLORS } from '../../lib/constants';
import { displayName, displayInitial, type GroupWithDetails } from './types';

interface GroupDetailModalProps {
  group:   GroupWithDetails;
  onClose: () => void;
}

export function GroupDetailModal({ group, onClose }: GroupDetailModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(group.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal visible animationType="slide">
      <SafeAreaView className="flex-1 bg-bg-deep">
        <ScrollView className="flex-1 px-4 py-4">

          {/* Header */}
          <View className="flex-row items-center justify-between mb-5">
            <Text className="text-white text-xl font-bold">{group.name}</Text>
            <TouchableOpacity onPress={onClose} className="p-2">
              <X size={20} color="#555555" />
            </TouchableOpacity>
          </View>

          {/* Invite code */}
          <View className="flex-row items-center gap-3 bg-bg-elevated rounded-xl p-4 border border-border mb-5">
            <View className="flex-1">
              <Text className="text-text-muted text-xs mb-0.5">Invite Code</Text>
              <Text className="text-white font-mono text-sm">{group.invite_code}</Text>
            </View>
            <TouchableOpacity
              onPress={handleCopy}
              className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-lg ${
                copied ? 'bg-success/10' : 'bg-bg-card border border-border'
              }`}
            >
              <Copy size={13} color={copied ? '#28c840' : '#cccccc'} />
              <Text
                className={`text-xs font-medium ${copied ? 'text-success' : 'text-text-secondary'}`}
              >
                {copied ? 'Copied!' : 'Copy'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Members */}
          <Text className="text-text-secondary text-sm font-semibold mb-3">
            Members ({group.members.length})
          </Text>
          <View className="gap-2 mb-5">
            {group.members.map((member, i) => {
              const color = MEMBER_COLORS[i % MEMBER_COLORS.length];
              return (
                <View
                  key={member.id}
                  className="flex-row items-center gap-3 bg-bg-elevated rounded-xl p-3 border border-border"
                >
                  <View
                    className="w-9 h-9 rounded-full items-center justify-center"
                    style={{
                      backgroundColor: color + '20',
                      borderWidth:     1,
                      borderColor:     color + '40',
                    }}
                  >
                    <Text className="font-bold" style={{ color }}>
                      {displayInitial(member)}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-white text-sm font-medium">{displayName(member)}</Text>
                    <Text className="text-text-muted text-xs capitalize">{member.role}</Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Group activity heatmaps */}
          <Text className="text-text-secondary text-sm font-semibold mb-3">Group Activity</Text>
          {group.members.map((member, i) => {
            const color = MEMBER_COLORS[i % MEMBER_COLORS.length];
            return (
              <View key={member.user_id} className="mb-4">
                <View className="flex-row items-center gap-2 mb-1.5">
                  <View
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <Text className="text-text-muted text-xs">{displayName(member)}</Text>
                </View>
                <HeatmapCalendar userId={member.user_id} accentColor={color} />
              </View>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
