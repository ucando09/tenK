import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { useAppStore } from './lib/store';
import { AppLayout } from './components/Layout/AppLayout';
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

/* In the desktop wrapper, preload.ts exposes window.tenkDesktop. Web has
 * no such object — we use this to decide whether `/` should show the
 * marketing landing (web at tenk.kr) or jump straight into the app
 * (Electron — user already installed it; landing would be confusing). */
const isDesktop =
  typeof window !== 'undefined' && !!(window as { tenkDesktop?: { isDesktop: boolean } }).tenkDesktop?.isDesktop;

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { userId } = useAppStore();
  if (!userId) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

export default function App() {
  const [user, setUser]       = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
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

  if (loading) return null;
  return <AppRoutes user={user} />;
}

/* Default "go to the app" URL after sign-in / from auth.
 *   - Desktop:  /          (root is the app)
 *   - Web:      /timer     (root is the marketing page) */
const APP_HOME = isDesktop ? '/' : '/timer';

function AppRoutes({ user }: { user: User | null }) {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Public ────────────────────────────────────────────────── */}
        <Route
          path="/auth"
          element={user ? <Navigate to={APP_HOME} replace /> : <AuthPage />}
        />
        <Route path="/get"        element={<LandingPage />} />
        <Route path="/join/:code" element={<JoinPage />} />

        {/* ── Root: web shows landing page; desktop opens the app ──── */}
        {isDesktop ? (
          <Route
            path="/"
            element={
              <RequireAuth>
                <AppLayout />
              </RequireAuth>
            }
          >
            <Route index           element={<TimerPage />}    />
            <Route path="timer"    element={<TimerPage />}    />
            <Route path="skills"   element={<SkillsPage />}   />
            <Route path="history"  element={<CalendarPage />} />
            <Route path="calendar" element={<Navigate to="/history" replace />} />
            <Route path="groups"   element={<GroupsPage />}   />
            <Route path="profile"  element={<ProfilePage />}  />
            <Route path="download" element={<DownloadPage />} />
          </Route>
        ) : (
          <>
            {/* Marketing landing at the root URL */}
            <Route path="/" element={<LandingPage />} />

            {/* Web app lives under flat routes — Sidebar links target
             * these directly so logged-in users can still bookmark them. */}
            <Route
              element={
                <RequireAuth>
                  <AppLayout />
                </RequireAuth>
              }
            >
              <Route path="/timer"    element={<TimerPage />}    />
              <Route path="/skills"   element={<SkillsPage />}   />
              <Route path="/history"  element={<CalendarPage />} />
              <Route path="/calendar" element={<Navigate to="/history" replace />} />
              <Route path="/groups"   element={<GroupsPage />}   />
              <Route path="/profile"  element={<ProfilePage />}  />
              <Route path="/download" element={<DownloadPage />} />
            </Route>
          </>
        )}

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
