import { useState } from 'react';
import { X } from 'lucide-react';
import { DOMAIN_COLORS } from '@tenk/shared';

interface CreateDomainModalProps {
  onConfirm: (name: string, color: string) => Promise<void>;
  onClose: () => void;
}

export function CreateDomainModal({ onConfirm, onClose }: CreateDomainModalProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState<string>(DOMAIN_COLORS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await onConfirm(name.trim(), color);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create domain');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-text-primary font-semibold text-lg">New Domain</h2>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Domain Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Music, Programming, Art"
              className="input"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Color
            </label>
            <div className="flex gap-3">
              {DOMAIN_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    color === c ? 'border-white scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {error && (
            <p className="text-error text-sm">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex-1 btn-primary flex items-center justify-center gap-2"
            >
              {loading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              Create Domain
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
