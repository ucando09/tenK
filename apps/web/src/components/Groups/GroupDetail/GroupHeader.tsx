/**
 * GroupHeader — title row at the top of the GroupDetail modal.
 * Owns inline-edit state (admin only), leave-confirmation state,
 * and the close button.
 */
import { useState } from 'react';
import { X, LogOut, Edit2, Save } from 'lucide-react';
import { extractErrorMessage } from '../../../lib/utils';
import type { GroupWithDetails } from './types';

interface GroupHeaderProps {
  group:    GroupWithDetails;
  isAdmin:  boolean;
  onLeave:  () => Promise<void>;
  onUpdate: (name: string, description: string) => Promise<void>;
  onClose:  () => void;
}

export function GroupHeader({ group, isAdmin, onLeave, onUpdate, onClose }: GroupHeaderProps) {
  const [editing,      setEditing]      = useState(false);
  const [editName,     setEditName]     = useState(group.name);
  const [editDesc,     setEditDesc]     = useState(group.description ?? '');
  const [saving,       setSaving]       = useState(false);
  const [editError,    setEditError]    = useState<string | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [leaving,      setLeaving]      = useState(false);

  const cancelEdit = () => {
    setEditing(false);
    setEditName(group.name);
    setEditDesc(group.description ?? '');
    setEditError(null);
  };

  const handleSave = async () => {
    if (!editName.trim()) return;
    setSaving(true);
    setEditError(null);
    try {
      await onUpdate(editName, editDesc);
      setEditing(false);
    } catch (err) {
      setEditError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleLeave = async () => {
    setLeaving(true);
    try {
      await onLeave();
    } catch (err) {
      setLeaving(false);
      setConfirmLeave(false);
      alert(extractErrorMessage(err));
    }
  };

  return (
    <div className="flex items-start justify-between mb-4 gap-3">
      <div className="flex-1 min-w-0">
        {editing ? (
          <div className="space-y-2">
            <input
              className="input text-lg font-bold"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Group name"
              maxLength={60}
              autoFocus
            />
            <input
              className="input text-sm"
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              placeholder="Description (optional)"
              maxLength={200}
            />
            {editError && <p className="text-error text-xs">{editError}</p>}
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving || !editName.trim()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-semibold hover:bg-accent-light transition-colors disabled:opacity-50"
              >
                <Save size={12} />
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button
                onClick={cancelEdit}
                className="px-3 py-1.5 rounded-lg text-xs text-text-muted hover:text-text-secondary btn-ghost"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <h2 className="text-text-primary font-bold text-xl truncate">{group.name}</h2>
            {group.description && (
              <p className="text-text-muted text-sm mt-0.5">{group.description}</p>
            )}
          </>
        )}
      </div>

      {!editing && (
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {isAdmin && (
            <button
              onClick={() => setEditing(true)}
              title="Edit group"
              className="p-1.5 rounded-lg text-text-muted hover:text-accent hover:bg-bg-elevated transition-colors"
            >
              <Edit2 size={15} />
            </button>
          )}

          {!confirmLeave ? (
            <button
              onClick={() => setConfirmLeave(true)}
              title="Leave group"
              className="p-1.5 rounded-lg text-text-muted hover:text-error hover:bg-bg-elevated transition-colors"
            >
              <LogOut size={15} />
            </button>
          ) : (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-error/10 border border-error/20">
              <span className="text-error text-xs">Leave?</span>
              <button
                onClick={handleLeave}
                disabled={leaving}
                className="text-xs font-semibold text-error hover:text-error/80 transition-colors"
              >
                {leaving ? '…' : 'Yes'}
              </button>
              <button
                onClick={() => setConfirmLeave(false)}
                className="text-xs text-text-muted hover:text-text-secondary transition-colors"
              >
                No
              </button>
            </div>
          )}

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-secondary hover:bg-bg-elevated transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
