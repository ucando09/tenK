import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useGroups } from '../lib/hooks/useGroups';
import { useAppStore } from '../lib/store';

/**
 * Handles direct join links: /join/:code
 *
 * - If not logged in → saves the code and redirects to /auth.
 *   After login the user can paste the same link again (or we retrieve it
 *   from sessionStorage automatically).
 * - If logged in → shows the group name and a single "Join" button.
 * - After joining → redirects to /groups.
 */
export function JoinPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { userId } = useAppStore();
  const { joinGroup } = useGroups();

  const [groupName, setGroupName] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'joining' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  // Resolve code from URL param or sessionStorage (post-login return)
  const resolvedCode = code ?? sessionStorage.getItem('tenk_join_code') ?? '';

  useEffect(() => {
    if (!userId) {
      // Save code so we can retry after the user signs in
      if (resolvedCode) sessionStorage.setItem('tenk_join_code', resolvedCode);
      navigate('/auth', { replace: true });
      return;
    }

    // Clear saved code once we're authenticated and on this page
    sessionStorage.removeItem('tenk_join_code');

    if (!resolvedCode) {
      navigate('/groups', { replace: true });
      return;
    }

    // Look up the group name so we can show a friendly preview
    supabase
      .from('groups')
      .select('name')
      .eq('invite_code', resolvedCode)
      .maybeSingle()
      .then(({ data }) => {
        setGroupName(data?.name ?? null);
      });
  }, [userId, resolvedCode, navigate]);

  const handleJoin = async () => {
    setStatus('joining');
    setErrorMsg('');
    try {
      await joinGroup(resolvedCode);
      setStatus('done');
      setTimeout(() => navigate('/groups', { replace: true }), 1200);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to join group');
      setStatus('error');
    }
  };

  if (!userId) return null; // redirecting

  return (
    <div className="min-h-screen bg-bg-deep flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="card p-8 text-center shadow-card">
          {status === 'done' ? (
            <>
              <div className="text-4xl mb-4">🎉</div>
              <h2 className="text-text-primary font-bold text-xl mb-2">Joined!</h2>
              <p className="text-text-muted text-sm">Taking you to your groups…</p>
            </>
          ) : (
            <>
              <div className="text-4xl mb-4">👥</div>
              <h2 className="text-text-primary font-bold text-xl mb-1">
                {groupName ? `Join "${groupName}"` : 'Join Group'}
              </h2>
              <p className="text-text-muted text-sm mb-6">
                {groupName
                  ? 'You were invited to join this tenK group.'
                  : 'You have an invite to a tenK group.'}
              </p>

              {status === 'error' && (
                <p className="text-error text-sm mb-4">{errorMsg}</p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => navigate('/groups')}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleJoin}
                  disabled={status === 'joining'}
                  className="flex-1 btn-primary flex items-center justify-center gap-2"
                >
                  {status === 'joining' && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  Join Group
                </button>
              </div>
            </>
          )}
        </div>

        <p className="text-center text-text-dim text-xs mt-5">
          Invite code: <span className="font-mono">{resolvedCode}</span>
        </p>
      </div>
    </div>
  );
}
