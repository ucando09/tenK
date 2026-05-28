import { useState } from 'react';
import { X, Link } from 'lucide-react';

interface CreateGroupModalProps {
  mode?: 'create' | 'join';
  onConfirm: (name: string, description: string) => Promise<void>;
  onJoin?: (inviteCode: string) => Promise<void>;
  onClose: () => void;
}

/**
 * Accepts either a raw invite code ("abc123xyz") or a full tenK join link
 * ("https://tenk.app/join/abc123xyz") — the code is extracted automatically.
 */
function extractCode(input: string): string {
  const trimmed = input.trim();
  if (trimmed.startsWith('http')) {
    const parts = trimmed.replace(/\/$/, '').split('/');
    return parts[parts.length - 1] ?? trimmed;
  }
  return trimmed;
}

export function CreateGroupModal({
  onConfirm,
  onClose,
  mode = 'create',
  onJoin,
}: CreateGroupModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mode === 'join') {
        const code = extractCode(codeInput);
        if (!code) throw new Error('Paste an invite link or enter a code');
        await onJoin!(code);
      } else {
        if (!name.trim()) throw new Error('Enter a group name');
        await onConfirm(name.trim(), description.trim());
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-text-primary font-semibold text-lg">
            {mode === 'join' ? 'Join a Group' : 'Create Group'}
          </h2>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'join' ? (
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Invite Code or Link
              </label>
              <div className="relative">
                <Link
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                />
                <input
                  type="text"
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value)}
                  placeholder="Paste a link or enter invite code"
                  className="input pl-9 font-mono"
                  autoFocus
                  autoCapitalize="none"
                  spellCheck={false}
                />
              </div>
              <p className="text-xs text-text-muted mt-1.5">
                Works with both invite codes and full tenK join links.
              </p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Group Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Music Mastery Crew"
                  className="input"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Description{' '}
                  <span className="text-text-dim font-normal">(optional)</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What's this group about?"
                  className="input resize-none"
                  rows={3}
                />
              </div>
            </>
          )}

          {error && <p className="text-error text-sm">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-primary flex items-center justify-center gap-2"
            >
              {loading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {mode === 'join' ? 'Join Group' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
