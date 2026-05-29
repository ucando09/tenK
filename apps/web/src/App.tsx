import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { useAppStore } from './lib/store';
import { AppLayout } from './components/Layout/AppLayout';
import { SplashScreen } from './components/SplashScreen';
import { AuthPage } from './pages/AuthPage';
import { TimerPage } from './pages/TimerPage';
import { SkillsPage } from './pages/SkillsPage';
import { CalendarPage } from './pages/CalendarPage';
import { GroupsPage } from './pages/GroupsPage';
import { ProfilePage } from './pages/ProfilePage';
import { DownloadPage } from './pages/DownloadPage';
import { LandingPage } from './pages/LandingPage';
import { JoinPage } from './pages/JoinPage';
import type { User } from '@supabase/supabase-js';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { userId } = useAppStore();
  // Send guests to the public landing instead of straight to /auth so
  // first-time visitors at tenk.kr see marketing + download CTA first.
  if (!userId) return <Navigate to="/get" replace />;
  return <>{children}</>;
}

/* ── Splash timing ────────────────────────────────────────────────────
 * MIN_DISPLAY_MS keeps the splash on screen long enough to actually
 * be seen even when Supabase's cached session resolves in <50ms.
 * FADE_MS must match the SplashScreen's transition duration (1s now). */
const MIN_DISPLAY_MS = 2200;
const FADE_MS        = 1000;

export default function App() {
  const [user, setUser]       = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [splashPhase, setSplashPhase] = useState<'showing' | 'fading' | 'hidden'>('showing');
  const { setUserId } = useAppStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setUserId(session?.user?.id ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setUserId(session?.user?.id ?? null);
      },
    );

    return () => subscription.unsubscribe();
  }, [setUserId]);

  /* Drive the splash off-screen once auth is resolved AND the minimum
   * display time has elapsed. The app renders underneath during the
   * fade-out, so it crossfades onto the splash. */
  useEffect(() => {
    if (loading) return;
    const fadeTimer = setTimeout(() => {
      setSplashPhase('fading');
      const removeTimer = setTimeout(() => setSplashPhase('hidden'), FADE_MS);
      return () => clearTimeout(removeTimer);
    }, MIN_DISPLAY_MS);
    return () => clearTimeout(fadeTimer);
  }, [loading]);

  return (
    <>
      {splashPhase !== 'hidden' && <SplashScreen fadeOut={splashPhase === 'fading'} />}
      {!loading && <AppRoutes user={user} />}
    </>
  );
}

function AppRoutes({ user }: { user: User | null }) {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/auth"
          element={user ? <Navigate to="/" replace /> : <AuthPage />}
        />

        <Route
          path="/"
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route index           element={<TimerPage />}    />
          <Route path="skills"   element={<SkillsPage />}   />
          {/* /history is canonical; /calendar redirects for old links */}
          <Route path="history"  element={<CalendarPage />} />
          <Route path="calendar" element={<Navigate to="/history" replace />} />
          <Route path="groups"   element={<GroupsPage />}   />
          <Route path="profile"  element={<ProfilePage />}  />
          <Route path="download" element={<DownloadPage />} />
        </Route>

        {/* Public landing page — share this URL with non-users */}
        <Route path="/get"        element={<LandingPage />} />

        {/* Public invite link — JoinPage handles redirect after auth */}
        <Route path="/join/:code" element={<JoinPage />} />
        <Route path="*"           element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
