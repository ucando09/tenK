import { CHARACTERS } from '../../lib/characters';

interface CharacterPickerProps {
  selected: string;
  onSelect: (id: string) => void;
}

export function CharacterPicker({ selected, onSelect }: CharacterPickerProps) {
  return (
    <div className="card p-6 mt-6">
      <h2 className="text-text-primary font-semibold text-base mb-1">Your Character</h2>
      <p className="text-text-muted text-sm mb-4">
        This is how your group members see you.
      </p>
      <div className="grid grid-cols-4 gap-3">
        {CHARACTERS.map((char) => {
          const active = char.id === selected;
          return (
            <button
              key={char.id}
              onClick={() => onSelect(char.id)}
              className={`flex flex-col items-center gap-2 py-3 px-2 rounded-xl border transition-all ${
                active
                  ? 'border-accent bg-accent/10'
                  : 'border-border bg-bg-elevated hover:border-accent/40 hover:bg-accent/5'
              }`}
            >
              <span style={{ fontSize: 30, lineHeight: 1 }}>{char.emoji}</span>
              <span
                className="text-xs font-medium"
                style={{ color: active ? '#7c6cf0' : undefined }}
              >
                {char.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
