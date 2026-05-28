import { useState } from 'react';
import { Plus, UserPlus } from 'lucide-react';
import { GroupCard } from '../components/Groups/GroupCard';
import { GroupDetail } from '../components/Groups/GroupDetail';
import { CreateGroupModal } from '../components/Groups/CreateGroupModal';
import { useGroups } from '../lib/hooks/useGroups';
import type { Group, GroupMember, GroupSkillShare } from '@tenk/shared';

type GroupWithDetails = Group & { members: GroupMember[]; my_shares: GroupSkillShare[] };

export function GroupsPage() {
  const { groups, loading, error, createGroup, joinGroup, shareSkill, unshareSkill, leaveGroup, updateGroup } = useGroups();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupWithDetails | null>(null);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-3xl mx-auto px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-text-primary font-bold text-2xl">My Groups</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowJoinModal(true)}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              <UserPlus size={15} />
              Join Group
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <Plus size={15} />
              Create Group
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm mb-4">
            {error}
          </div>
        )}

        {groups.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">👥</div>
            <h2 className="text-text-primary font-semibold text-lg mb-2">No Groups Yet</h2>
            <p className="text-text-muted text-sm mb-6 max-w-sm mx-auto">
              Create a group or join one with an invite code to track your progress together.
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setShowJoinModal(true)} className="btn-secondary">
                Join with Code
              </button>
              <button onClick={() => setShowCreateModal(true)} className="btn-primary">
                Create Group
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {groups.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                onClick={() => setSelectedGroup(group)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateGroupModal
          mode="create"
          onConfirm={async (name, description) => {
            await createGroup(name, description);
            setShowCreateModal(false);
          }}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {showJoinModal && (
        <CreateGroupModal
          mode="join"
          onConfirm={async () => {}}
          onJoin={async (code) => {
            await joinGroup(code);
            setShowJoinModal(false);
          }}
          onClose={() => setShowJoinModal(false)}
        />
      )}

      {selectedGroup && (
        <GroupDetail
          group={selectedGroup}
          onShare={shareSkill}
          onUnshare={unshareSkill}
          onLeave={async (groupId) => {
            await leaveGroup(groupId);
            setSelectedGroup(null);
          }}
          onUpdate={async (groupId, name, description) => {
            await updateGroup(groupId, name, description);
            // Update local selection so header reflects new name immediately
            setSelectedGroup((g) =>
              g && g.id === groupId ? { ...g, name, description } : g,
            );
          }}
          onClose={() => setSelectedGroup(null)}
        />
      )}
    </div>
  );
}
