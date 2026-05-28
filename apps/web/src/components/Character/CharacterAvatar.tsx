import { getCharacter } from '../../lib/characters';

interface CharacterAvatarProps {
  characterId?: string | null;
  size?:        number;
  ring?:        boolean;
  className?:   string;
}

export function CharacterAvatar({
  characterId,
  size      = 36,
  ring      = true,
  className = '',
}: CharacterAvatarProps) {
  const char = getCharacter(characterId);
  return (
    <div
      className={`rounded-full flex items-center justify-center flex-shrink-0 select-none ${className}`}
      style={{
        width:      size,
        height:     size,
        background: char.bg,
        border:     ring ? `2px solid ${char.color}55` : undefined,
        boxShadow:  ring ? `0 0 8px ${char.color}30` : undefined,
        fontSize:   Math.round(size * 0.5),
        lineHeight: 1,
      }}
    >
      {char.emoji}
    </div>
  );
}
