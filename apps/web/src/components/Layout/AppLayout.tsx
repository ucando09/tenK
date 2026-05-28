import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useSkills } from '../../lib/hooks/useSkills';
import { useAppStore } from '../../lib/store';
import { applyTheme } from '../../lib/theme';
import { useEffect } from 'react';

export function AppLayout() {
  const { skills, loading } = useSkills();
  const { theme, setSkills, setActiveSkillId, activeSkillId } = useAppStore();

  // Re-apply theme whenever the store value changes (also runs on mount
  // to sync with the stored preference after React hydrates).
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    setSkills(skills);

    // Auto-select first active skill if:
    //   - none is selected, OR
    //   - the currently-selected skill has been shelved/deleted
    //     (otherwise the sidebar highlights a skill that's hidden from its own list)
    if (skills.length === 0) return;
    const selected = skills.find((s) => s.id === activeSkillId);
    const selectedIsActive = selected?.status === 'active';
    if (!selectedIsActive) {
      const firstActive = skills.find((s) => s.status === 'active');
      setActiveSkillId(firstActive?.id ?? null);
    }
  }, [skills, setSkills, setActiveSkillId, activeSkillId]);

  return (
    <div className="flex h-screen bg-bg-deep overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        {loading && skills.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <Outlet />
        )}
      </main>
    </div>
  );
}
