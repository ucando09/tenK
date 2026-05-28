import { useState } from 'react';
import { DOMAIN_COLORS } from '@tenk/shared';
import type { Domain } from '@tenk/shared';
import { extractErrorMessage } from '../../../lib/utils';
import { DOMAIN_ICONS } from '../../../lib/domainIcons';

interface InlineDomainCreatorProps {
  canCancel: boolean;
  onCreate:  (name: string, color: string, icon?: string) => Promise<Domain>;
  onCreated: (domain: Domain) => void;
  onCancel:  () => void;
  onError:   (msg: string) => void;
}

/** Inline form for creating a new domain inside the skill wizard.
 *  Lets the user pick a name + color + icon. */
export function InlineDomainCreator({
  canCancel, onCreate, onCreated, onCancel, onError,
}: InlineDomainCreatorProps) {
  const [name,     setName]     = useState('');
  const [color,    setColor]    = useState<string>(DOMAIN_COLORS[0]);
  const [icon,     setIcon]     = useState<string>(DOMAIN_ICONS[0].id);
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      const created = await onCreate(name.trim(), color, icon);
      onCreated(created);
      setName('');
    } catch (err) {
      onError(extractErrorMessage(err));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="mt-3 p-3 rounded-xl bg-bg-elevated border border-border">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Domain name (e.g. Music, Coding)"
        className="input text-sm mb-2.5"
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCreate(); } }}
        autoFocus
      />

      {/* Icon picker — scrollable horizontal row */}
      <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1.5">Icon</p>
      <div className="flex gap-1.5 overflow-x-auto pb-1 mb-2.5">
        {DOMAIN_ICONS.map(({ id, component: Icon, label }) => {
          const selected = icon === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setIcon(id)}
              title={label}
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all border"
              style={{
                backgroundColor: selected ? color + '25' : 'var(--bg-card)',
                borderColor:     selected ? color : 'var(--color-border)',
                color:           selected ? color : 'var(--text-muted)',
              }}
            >
              <Icon size={14} />
            </button>
          );
        })}
      </div>

      {/* Color + action row */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {DOMAIN_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`w-6 h-6 rounded-full border-2 transition-all ${
                color === c ? 'border-white scale-110' : 'border-transparent'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        <div className="flex gap-2 items-center">
          {canCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="text-xs text-text-muted hover:text-text-secondary"
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={handleCreate}
            disabled={creating || !name.trim()}
            className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5"
          >
            {creating && (
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
