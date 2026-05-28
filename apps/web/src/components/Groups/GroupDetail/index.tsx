/**
 * GroupDetail — modal showing one group's invite info, members,
 * leaderboard, and activity heatmaps. Composes sibling sub-components.
 */
import { useState } from 'react';
import { Share2 } from 'lucide-react';
import { useAppStore } from '../../../lib/store';
import { useSkills } from '../../../lib/hooks/useSkills';
import { ShareSkillModal } from '../ShareSkillModal';
import { GroupHeader } from './GroupHeader';
import { GroupInviteSection } from './GroupInviteSection';
import { GroupLeaderboard } from './GroupLeaderboard';
import { GroupHeatmaps } from './GroupHeatmaps';
import { useGroupMemberStats } from './useGroupMemberStats';
import type { GroupWithDetails } from './types';

interface GroupDetailProps {
  group:    GroupWithDetails;
  onShare:  (groupId: string, skillId: string) => Promise<void>;
  onUnshare:(groupId: string, skillId: string) => Promise<void>;
  onLeave:  (groupId: string) => Promise<void>;
  onUpdate: (groupId: string, name: string, description: string) => Promise<void>;
  onClose:  () => void;
}

export function GroupDetail({ group, onShare, onUnshare, onLeave, onUpdate, onClose }: GroupDetailProps) {
  const { userId } = useAppStore();
  const { skills } = useSkills();
  const [showShareModal, setShowShareModal] = useState(false);

  const { stats, loading } = useGroupMemberStats(group.id, group.members);
  const isAdmin = group.members.some((m) => m.user_id === userId && m.role === 'admin');

  const sharedSkillIds = group.my_shares
    .filter((s) => s.share_type === 'skill' && s.skill_id)
    .map((s) => s.skill_id as string);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content max-w-3xl w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <GroupHeader
          group={group}
          isAdmin={isAdmin}
          onLeave={() => onLeave(group.id)}
          onUpdate={(name, desc) => onUpdate(group.id, name, desc)}
          onClose={onClose}
        />

        <GroupInviteSection inviteCode={group.invite_code} groupName={group.name} />

        <div className="flex-1 overflow-y-auto space-y-5 min-h-0">

          {/* Your shared skills */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-text-secondary">Your Shared Mastery</h3>
              <button
                onClick={() => setShowShareModal(true)}
                className="flex items-center gap-1.5 text-xs text-accent hover:text-accent-light transition-colors"
              >
                <Share2 size={12} />
                Manage
              </button>
            </div>
            {sharedSkillIds.length === 0 ? (
              <p className="text-text-muted text-sm">Nothing shared yet.</p>
            ) : (
              <div className="flex gap-2 flex-wrap">
                {sharedSkillIds.map((id) => {
                  const skill = skills.find((s) => s.id === id);
                  if (!skill) return null;
                  return (
                    <div
                      key={id}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border"
                      style={{
                        borderColor:     skill.color + '60',
                        backgroundColor: skill.color + '15',
                        color:           skill.color,
                      }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: skill.color }} />
                      {skill.name}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <GroupLeaderboard stats={stats} loading={loading} currentUserId={userId} />
          <GroupHeatmaps    stats={stats}                   currentUserId={userId} />
        </div>
      </div>

      {showShareModal && (
        <ShareSkillModal
          groupId={group.id}
          groupName={group.name}
          skills={skills}
          sharedSkillIds={sharedSkillIds}
          onShare={(skillId) => onShare(group.id, skillId)}
          onUnshare={(skillId) => onUnshare(group.id, skillId)}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
}
