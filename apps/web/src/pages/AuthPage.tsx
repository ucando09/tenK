import { useState } from 'react';
import { supabase } from '../lib/supabase';

type Mode = 'signin' | 'signup';

export function AuthPage() {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        // When email confirmation is disabled Supabase returns a session immediately
        // and onAuthStateChange handles the redirect — no message needed.
        if (!data.session) {
          setSuccess('Check your email to confirm your account!');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-deep flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex mb-4">
            <img src="/favicon.svg" alt="tenK" className="w-16 h-16 rounded-2xl" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">tenK</h1>
          <p className="text-text-muted mt-1.5 text-sm">
            Track your journey to 10,000 hours
          </p>
        </div>

        <div className="card p-6 shadow-card">
          {/* Mode toggle */}
          <div className="flex bg-bg-elevated rounded-lg p-1 mb-6">
            <button
              onClick={() => setMode('signin')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                mode === 'signin'
                  ? 'bg-bg-card text-text-primary shadow-sm'
                  : 'text-text-muted'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                mode === 'signup'
                  ? 'bg-bg-card text-text-primary shadow-sm'
                  : 'text-text-muted'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input"
                required
                minLength={6}
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 rounded-lg bg-success/10 border border-success/20 text-success text-sm">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-2.5 flex items-center justify-center gap-2"
            >
              {loading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {mode === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-bg-card px-2 text-text-muted">or</span>
            </div>
          </div>

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-2.5 rounded-lg border border-border bg-bg-elevated hover:bg-border transition-colors text-text-secondary text-sm font-medium"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>
        </div>

        <p className="text-center text-text-dim text-xs mt-6">
          Your data is private and secure. Self-hosted on Supabase.
        </p>
      </div>
    </div>
  );
}
