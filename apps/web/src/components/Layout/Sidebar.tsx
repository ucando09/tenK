import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Timer, BookOpen, History, Users, User,
  LogOut, Sun, Moon, ChevronLeft, ChevronRight, MonitorSmartphone,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAppStore } from '../../lib/store';
import { STORAGE_KEYS } from '../../lib/constants';
import { useT } from '../../i18n';
import type { TranslationKey } from '../../i18n/translations';

interface NavItem {
  to:    string;
  key:   TranslationKey;
  icon:  typeof Timer;
}

/* Web sees marketing page at "/" — point Timer at /timer so logged-in
 * users still land on the app when clicking the sidebar's Timer button.
 * The desktop wrapper has /timer as an alias of "/", so this works in
 * both environments without needing branched config. */
const NAV_ITEMS: NavItem[] = [
  { to: '/timer',   key: 'nav.timer',   icon: Timer    },
  { to: '/skills',  key: 'nav.mastery', icon: BookOpen },
  { to: '/history', key: 'nav.history', icon: History  },
  { to: '/groups',  key: 'nav.groups',  icon: Users    },
  { to: '/profile', key: 'nav.profile', icon: User     },
];

export function Sidebar() {
  const t = useT();
  const navigate = useNavigate();
  const { theme, setTheme, skills, activeSkillId, setActiveSkillId } = useAppStore();
  const activeSkills = skills.filter((s) => s.status === 'active');

  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(STORAGE_KEYS.sidebarCollapsed) === 'true',
  );
  const [showAppHint, setShowAppHint] = useState(
    () => localStorage.getItem(STORAGE_KEYS.appDownloadHintDismissed) !== 'true',
  );

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem(STORAGE_KEYS.sidebarCollapsed, String(next));
  };

  const dismissAppHint = () => {
    setShowAppHint(false);
    localStorage.setItem(STORAGE_KEYS.appDownloadHintDismissed, 'true');
  };

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const btn = (extra = '') =>
    `w-full flex items-center rounded-lg text-sm font-medium transition-all duration-150
     ${collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5'} ${extra}`;

  return (
    <div
      className={`
        ${collapsed ? 'w-14' : 'w-60'}
        h-full bg-bg-card border-r border-border flex flex-col
        transition-[width] duration-200 overflow-hidden flex-shrink-0
      `}
    >
      {/* ── Logo + collapse ── */}
      <div
        className={`border-b border-border flex items-center flex-shrink-0
          ${collapsed ? 'justify-center py-4' : 'px-4 py-5 gap-2'}`}
      >
        {!collapsed && (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <img src="/logo.png" alt="tenK" className="h-7 w-7 flex-shrink-0" />
            <span className="font-bold text-lg text-text-primary tracking-tight">tenK</span>
          </div>
        )}
        <button
          onClick={toggleCollapsed}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="p-1.5 rounded-md text-text-muted hover:text-text-secondary
                     hover:bg-bg-elevated transition-colors flex-shrink-0"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* ── Main nav ── */}
      <nav className={`py-4 space-y-1 flex-shrink-0 ${collapsed ? 'px-1' : 'px-3'}`}>
        {NAV_ITEMS.map(({ to, key, icon: Icon }) => {
          const label = t(key);
          return (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              title={collapsed ? label : undefined}
              className={({ isActive }) =>
                `${btn()} ${
                  isActive
                    ? 'bg-accent/10 text-accent'
                    : 'text-text-muted hover:text-text-secondary hover:bg-bg-elevated'
                }`
              }
            >
              <Icon size={16} />
              {!collapsed && label}
            </NavLink>
          );
        })}
      </nav>

      {/* ── Active skills shortcuts (hidden when collapsed) ── */}
      {collapsed ? (
        <div className="flex-1" />
      ) : (
        activeSkills.length > 0 && (
          <div className="px-3 py-2 flex-1 overflow-y-auto min-h-0">
            <p className="px-3 text-xs font-medium text-text-dim uppercase tracking-wider mb-2">
              {t('nav.activeMastery')}
            </p>
            {activeSkills.map((skill) => (
              <NavLink
                key={skill.id}
                to="/timer"
                onClick={() => setActiveSkillId(skill.id)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm
                  transition-all duration-150 ${
                    activeSkillId === skill.id
                      ? 'bg-bg-elevated text-text-primary'
                      : 'text-text-muted hover:text-text-secondary hover:bg-bg-elevated'
                  }`}
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: skill.color }}
                />
                <span className="truncate">{skill.name}</span>
                {skill.logged_hours !== undefined && (
                  <span className="ml-auto text-xs text-text-dim">
                    {skill.logged_hours.toFixed(0)}h
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        )
      )}

      {/* ── "Get the app" banner (web only, dismissible) ── */}
      {!collapsed && showAppHint && (
        <div className="mx-3 mb-2 rounded-xl bg-accent/8 border border-accent/20 overflow-hidden flex-shrink-0">
          {/* Clickable body → /download */}
          <button
            onClick={() => navigate('/download')}
            className="w-full flex items-start gap-2.5 px-3 py-2.5 text-left hover:bg-accent/10 transition-colors"
          >
            <MonitorSmartphone size={14} className="text-accent mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-accent">{t('nav.getTheApp')}</p>
              <p className="text-[11px] text-text-muted mt-0.5 leading-snug">
                {t('nav.getTheAppDesc')}
              </p>
            </div>
          </button>
          {/* Dismiss button sits below so it doesn't interfere with the nav click */}
          <div className="flex justify-end px-2 pb-1.5">
            <button
              onClick={dismissAppHint}
              className="text-[10px] text-text-dim hover:text-text-muted transition-colors"
              title="Dismiss"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* ── Bottom actions ── */}
      <div className={`mt-auto pb-4 space-y-1 flex-shrink-0 ${collapsed ? 'px-1' : 'px-3'}`}>
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title={collapsed ? (theme === 'dark' ? 'Switch to light' : 'Switch to dark') : undefined}
          className={btn('text-text-muted hover:text-text-secondary hover:bg-bg-elevated')}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          {!collapsed && (theme === 'dark' ? t('nav.lightMode') : t('nav.darkMode'))}
        </button>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          title={collapsed ? t('nav.signOut') : undefined}
          className={btn('text-text-muted hover:text-error hover:bg-bg-elevated')}
        >
          <LogOut size={16} />
          {!collapsed && t('nav.signOut')}
        </button>
      </div>
    </div>
  );
}
