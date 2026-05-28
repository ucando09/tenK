import { X } from 'lucide-react';

interface Step1NameProps {
  name:    string;
  onName:  (next: string) => void;
  onNext:  () => void;
  onClose: () => void;
}

/** First wizard step — just name the skill. */
export function Step1Name({ name, onName, onNext, onClose }: Step1NameProps) {
  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <span className="text-xs text-text-muted font-medium uppercase tracking-widest">
          Step 1 of 2
        </span>
        <button onClick={onClose} className="btn-ghost p-1.5">
          <X size={18} />
        </button>
      </div>

      <div className="mb-8">
        <h2 className="text-text-primary font-bold text-2xl mb-2">
          What will you master?
        </h2>
        <p className="text-text-muted text-sm">
          Name what you want to master.
        </p>
      </div>

      <input
        type="text"
        value={name}
        onChange={(e) => onName(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && name.trim()) onNext(); }}
        placeholder="e.g. Guitar, TypeScript, Oil Painting"
        className="input text-base mb-6"
        autoFocus
      />

      <button
        onClick={onNext}
        disabled={!name.trim()}
        className="w-full btn-primary py-3 text-base disabled:opacity-40"
      >
        Next →
      </button>
    </>
  );
}
