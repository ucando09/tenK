/**
 * Groups tab — list of the user's groups + create/join modals.
 *
 * Sub-components live in `components/Groups/`; data loading lives in
 * `hooks/useGroupsData`.
 */
import { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, UserPlus } from 'lucide-react-native';
import { useGroupsData } from '../../hooks/useGroupsData';
import { GroupCard } from '../../components/Groups/GroupCard';
import { GroupDetailModal } from '../../components/Groups/GroupDetailModal';
import { CreateJoinModal } from '../../components/Groups/CreateJoinModal';
import type { GroupWithDetails } from '../../components/Groups/types';

export default function GroupsTab() {
  const { groups, loading, refreshing, refresh } = useGroupsData();

  const [selectedGroup,   setSelectedGroup]   = useState<GroupWithDetails | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal,   setShowJoinModal]   = useState(false);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-bg-deep items-center justify-center">
        <ActivityIndicator color="#7c6cf0" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg-deep">
      <ScrollView
        className="flex-1 px-4 py-4"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#7c6cf0" />
        }
      >
        {/* Header */}
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-white text-xl font-bold">My Groups</Text>
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => setShowJoinModal(true)}
              className="flex-row items-center gap-1 bg-bg-elevated px-3 py-1.5 rounded-lg border border-border"
            >
              <UserPlus size={13} color="#cccccc" />
              <Text className="text-text-secondary text-xs font-medium">Join</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowCreateModal(true)}
              className="flex-row items-center gap-1 bg-accent px-3 py-1.5 rounded-lg"
            >
              <Plus size={13} color="white" />
              <Text className="text-white text-xs font-semibold">Create</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Empty state or list */}
        {groups.length === 0 ? (
          <View className="items-center py-16">
            <Text className="text-5xl mb-3">👥</Text>
            <Text className="text-white font-semibold text-lg mb-2">No Groups Yet</Text>
            <Text className="text-text-muted text-sm text-center mb-6">
              Create or join a group to track progress with friends.
            </Text>
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setShowJoinModal(true)}
                className="bg-bg-elevated px-4 py-2 rounded-lg border border-border"
              >
                <Text className="text-text-secondary font-medium">Join with Code</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowCreateModal(true)}
                className="bg-accent px-4 py-2 rounded-lg"
              >
                <Text className="text-white font-semibold">Create Group</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View className="gap-3">
            {groups.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                onPress={() => setSelectedGroup(group)}
              />
            ))}
          </View>
        )}

        <View className="h-8" />
      </ScrollView>

      {selectedGroup && (
        <GroupDetailModal
          group={selectedGroup}
          onClose={() => setSelectedGroup(null)}
        />
      )}

      {showCreateModal && (
        <CreateJoinModal
          mode="create"
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => { refresh(); setShowCreateModal(false); }}
        />
      )}

      {showJoinModal && (
        <CreateJoinModal
          mode="join"
          onClose={() => setShowJoinModal(false)}
          onSuccess={() => { refresh(); setShowJoinModal(false); }}
        />
      )}
    </SafeAreaView>
  );
}
