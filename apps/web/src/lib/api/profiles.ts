/**
 * Profiles API — all Supabase calls related to user profiles + avatars.
 *
 * Components and hooks should call these instead of `supabase` directly,
 * so the bug-prone DB shape stays in one place.
 */
import { supabase } from '../supabase';
import type { Profile } from '@tenk/shared';

/** Fetch one profile. Returns null if the row doesn't exist. */
export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return (data as Profile | null) ?? null;
}

/** Lightweight name + avatar + character for leaderboards. Swallows errors. */
export async function getProfileLite(
  userId: string,
): Promise<{ displayName: string | null; avatarUrl: string | null; characterId: string | null }> {
  try {
    const { data } = await supabase
      .from('profiles')
      .select('display_name, avatar_url, character_id')
      .eq('id', userId)
      .maybeSingle();
    return {
      displayName: data?.display_name ?? null,
      avatarUrl:   data?.avatar_url   ?? null,
      characterId: (data as { character_id?: string | null } | null)?.character_id ?? null,
    };
  } catch {
    return { displayName: null, avatarUrl: null, characterId: null };
  }
}

/** Upserts a partial profile (always stamps updated_at). */
export async function upsertProfile(
  userId: string,
  patch: {
    display_name?:  string | null;
    bio?:           string | null;
    avatar_url?:    string | null;
    character_id?:  string | null;
  },
): Promise<void> {
  const { error } = await supabase.from('profiles').upsert({
    id:         userId,
    ...patch,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

/**
 * Uploads an avatar to the `avatars` Supabase Storage bucket, returns
 * a cache-busted public URL, and saves it onto the user's profile row.
 */
export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const ext  = file.name.split('.').pop() ?? 'jpg';
  const path = `${userId}/avatar.${ext}`;

  const { error: uploadErr } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, contentType: file.type });
  if (uploadErr) throw uploadErr;

  const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
  const url = `${publicUrl}?t=${Date.now()}`;

  await upsertProfile(userId, { avatar_url: url });
  return url;
}
