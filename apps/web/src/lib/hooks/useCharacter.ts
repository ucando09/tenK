import { useState, useEffect, useCallback } from 'react';
import { DEFAULT_CHARACTER_ID } from '../characters';
import { getProfile, upsertProfile } from '../api/profiles';

const LS_KEY = 'tenk-character-id';

interface UseCharacterOptions {
  userId: string | null;
}

interface UseCharacterResult {
  characterId:  string;
  setCharacter: (id: string) => Promise<void>;
}

export function useCharacter({ userId }: UseCharacterOptions): UseCharacterResult {
  const [characterId, setCharacterId] = useState<string>(
    () => localStorage.getItem(LS_KEY) ?? DEFAULT_CHARACTER_ID,
  );

  useEffect(() => {
    if (!userId) return;
    getProfile(userId)
      .then((profile) => {
        const cid = (profile as Record<string, unknown> | null)?.character_id as string | null;
        if (cid) {
          setCharacterId(cid);
          localStorage.setItem(LS_KEY, cid);
        }
      })
      .catch(() => { /* profiles table may not have character_id yet */ });
  }, [userId]);

  const setCharacter = useCallback(async (id: string) => {
    setCharacterId(id);
    localStorage.setItem(LS_KEY, id);
    if (userId) {
      try {
        await upsertProfile(userId, { character_id: id });
      } catch {
        /* Silently ignore until the migration is applied */
      }
    }
  }, [userId]);

  return { characterId, setCharacter };
}
