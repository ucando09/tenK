import { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, Save, User as UserIcon, Mail, FileText, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../lib/store';
import { extractErrorMessage, isMissingTableError } from '../lib/utils';
import { getProfile, upsertProfile, uploadAvatar } from '../lib/api/profiles';
import { ProfileSettings } from '../components/Profile/ProfileSettings';
import { CharacterPicker } from '../components/Character/CharacterPicker';
import { useCharacter } from '../lib/hooks/useCharacter';
import { useT } from '../i18n';
import type { Profile } from '@tenk/shared';

const MIGRATION_HINT =
  'Run migration 003_profiles.sql in Supabase SQL Editor first, then try again.';

export function ProfilePage() {
  const t = useT();
  const { userId } = useAppStore();
  const { characterId, setCharacter } = useCharacter({ userId });
  const [profile,     setProfile]     = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [bio,         setBio]         = useState('');
  const [avatarUrl,   setAvatarUrl]   = useState<string | null>(null);
  const [email,       setEmail]       = useState('');
  const [saving,      setSaving]      = useState(false);
  const [uploading,   setUploading]   = useState(false);
  const [saved,       setSaved]       = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  /* ── Fetch profile & email ── */
  const fetchProfile = useCallback(async () => {
    if (!userId) return;
    const [profileData, { data: userData }] = await Promise.all([
      getProfile(userId).catch(() => null),
      supabase.auth.getUser(),
    ]);

    if (profileData) {
      setProfile(profileData);
      setDisplayName(profileData.display_name ?? '');
      setBio(profileData.bio ?? '');
      setAvatarUrl(profileData.avatar_url ?? null);
    }
    if (userData?.user?.email) setEmail(userData.user.email);
  }, [userId]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  /* Map errors to a user-facing message. Centralised so save + upload agree. */
  const surfaceError = (err: unknown, fallback: string) => {
    console.error('[ProfilePage]', fallback, err);
    setError(isMissingTableError(err) ? MIGRATION_HINT : (extractErrorMessage(err) || fallback));
  };

  /* ── Avatar upload ── */
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    setAvatarUrl(URL.createObjectURL(file)); // optimistic preview
    setUploading(true);
    setError(null);

    try {
      setAvatarUrl(await uploadAvatar(userId, file));
    } catch (err) {
      surfaceError(err, 'Upload failed');
      setAvatarUrl(profile?.avatar_url ?? null);
    } finally {
      setUploading(false);
    }
  };

  /* ── Save profile ── */
  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    setError(null);

    try {
      await upsertProfile(userId, {
        display_name: displayName.trim() || null,
        bio:          bio.trim()         || null,
        avatar_url:   avatarUrl,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      surfaceError(err, 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const initials = (displayName || email || '?').slice(0, 2).toUpperCase();

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-xl mx-auto px-8 py-8">

        {/* Header */}
        <h1 className="text-text-primary font-bold text-2xl mb-1">{t('profile.title')}</h1>
        <p className="text-text-muted text-sm mb-8">
          {t('profile.subtitle')}
        </p>

        {/* Avatar */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative group">
            <div
              className="w-28 h-28 rounded-full overflow-hidden border-2 border-border bg-bg-elevated flex items-center justify-center cursor-pointer"
              onClick={() => fileRef.current?.click()}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-text-muted">{initials}</span>
              )}
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {uploading
                  ? <Loader2 size={22} className="text-white animate-spin" />
                  : <Camera size={22} className="text-white" />}
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            className="mt-3 text-xs text-accent hover:text-accent-light transition-colors"
          >
            {uploading ? t('evidence.uploading') : t('profile.changePhoto')}
          </button>
        </div>

        {/* Form */}
        <div className="card p-6 space-y-5">

          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-text-secondary mb-1.5">
              <UserIcon size={14} />
              {t('profile.displayName')}
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={t('profile.displayNamePh')}
              maxLength={40}
              className="input"
            />
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-text-secondary mb-1.5">
              <Mail size={14} />
              {t('profile.email')}
            </label>
            <input
              type="email"
              value={email}
              readOnly
              className="input opacity-60 cursor-not-allowed"
            />
            <p className="text-xs text-text-dim mt-1">
              {t('profile.emailHint')}
            </p>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-text-secondary mb-1.5">
              <FileText size={14} />
              {t('profile.bio')}
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={t('profile.bioPlaceholder')}
              maxLength={200}
              rows={3}
              className="input resize-none"
            />
            <p className="text-xs text-text-dim mt-1 text-right">{bio.length}/200</p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all"
            style={{
              backgroundColor: saved ? '#28c840' : '#7c6cf0',
              color: 'white',
              boxShadow: saved ? '0 0 16px #28c84040' : '0 0 16px #7c6cf040',
            }}
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {saving ? t('profile.saving') : saved ? t('profile.saved') : t('profile.saveProfile')}
          </button>
        </div>

        {/* Character selection */}
        <CharacterPicker selected={characterId} onSelect={setCharacter} />

        {/* Settings (language + theme) */}
        <ProfileSettings />

        <p className="text-text-dim text-xs text-center mt-6">
          {t('profile.footerHint')}
        </p>
      </div>
    </div>
  );
}
