import { useState } from 'react';
import { Plus, Check } from 'lucide-react';
import type { Domain } from '@tenk/shared';
import { InlineDomainCreator } from './InlineDomainCreator';
import { getDomainIcon } from '../../../lib/domainIcons';

interface DomainPickerProps {
  domains:          Domain[];
  selectedId:       string | null;
  onSelect:         (d: Domain) => void;
  onCreateDomain:   (name: string, color: string, icon?: string) => Promise<Domain>;
  onDomainCreated:  (d: Domain) => void;
  onError:          (msg: string) => void;
}

/** Pill list of existing domains + inline creator for a new one. */
export function DomainPicker({
  domains, selectedId, onSelect, onCreateDomain, onDomainCreated, onError,
}: DomainPickerProps) {
  const [showNewDomain, setShowNewDomain] = useState(domains.length === 0);

  const handleCreated = (d: Domain) => {
    onDomainCreated(d);
    setShowNewDomain(false);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-text-secondary mb-2">
        Domain
        <span className="ml-1.5 text-text-dim font-normal text-xs">
          (organise your skill)
        </span>
      </label>

      <div className="flex flex-wrap gap-2">
        {domains.map((d) => {
          const isSelected = selectedId === d.id;
          const Icon       = getDomainIcon(d.icon);
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => { onSelect(d); setShowNewDomain(false); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-all"
              style={
                isSelected
                  ? { backgroundColor: d.color, borderColor: d.color, color: 'white' }
                  : {
                      backgroundColor: d.color + '15',
                      borderColor:     d.color + '50',
                      color:           d.color,
                    }
              }
            >
              {isSelected ? <Check size={12} /> : <Icon size={12} />}
              {d.name}
            </button>
          );
        })}

        {!showNewDomain && (
          <button
            type="button"
            onClick={() => setShowNewDomain(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border border-dashed border-border text-text-muted hover:text-accent hover:border-accent transition-colors"
          >
            <Plus size={13} />
            New domain
          </button>
        )}
      </div>

      {showNewDomain && (
        <InlineDomainCreator
          canCancel={domains.length > 0}
          onCreate={onCreateDomain}
          onCreated={handleCreated}
          onCancel={() => setShowNewDomain(false)}
          onError={onError}
        />
      )}
    </div>
  );
}
