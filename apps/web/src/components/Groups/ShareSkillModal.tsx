import { useState } from 'react';
import { X, Check } from 'lucide-react';
import type { Skill } from '@tenk/shared';

interface ShareSkillModalProps {
  groupId: string;
  groupName: string;
  skills: Skill[];
  sharedSkillIds: string[];
  onShare: (skillId: string) => Promise<void>;
  onUnshare: (skillId: string) => Promise<void>;
  onClose: () => void;
}

export function ShareSkillModal({
  groupName,
  skills,
  sharedSkillIds,
  onShare,
  onUnshare,
  onClose,
}: ShareSkillModalProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleToggle = async (skillId: string) => {
    setLoading(skillId);
    try {
      if (sharedSkillIds.includes(skillId)) {
        await onUnshare(skillId);
      } else {
        await onShare(skillId);
      }
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-text-primary font-semibold text-lg">Share Mastery</h2>
            <p className="text-text-muted text-sm mt-0.5">with {groupName}</p>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <X size={18} />
          </button>
        </div>

        {skills.length === 0 ? (
          <p className="text-text-muted text-sm text-center py-6">
            No active skills. Create a skill first.
          </p>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {skills.filter(s => s.status === 'active').map((skill) => {
              const isShared = sharedSkillIds.includes(skill.id);
              return (
                <button
                  key={skill.id}
                  onClick={() => handleToggle(skill.id)}
                  disabled={loading === skill.id}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${
                    isShared
                      ? 'border-accent/30 bg-accent/5'
                      : 'border-border bg-bg-elevated hover:border-border'
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: skill.color }}
                  />
                  <div className="flex-1 text-left">
                    <p className="text-sm text-text-primary">{skill.name}</p>
                    <p className="text-xs text-text-muted">{skill.domain?.name}</p>
                  </div>
                  {loading === skill.id ? (
                    <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                  ) : isShared ? (
                    <Check size={16} className="text-accent" />
                  ) : null}
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-5">
          <button onClick={onClose} className="w-full btn-secondary">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
