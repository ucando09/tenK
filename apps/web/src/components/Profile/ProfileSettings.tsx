/**
 * ProfileSettings — preferences panel rendered inside ProfilePage.
 *
 * Currently hosts:
 *   - Language switcher (English / 한국어)
 *   - Theme toggle (Light / Dark)
 *
 * Designed so new settings drop into the same `SettingRow` pattern.
 */
import { Globe, Sun, Moon, Settings as SettingsIcon } from 'lucide-react';
import { useAppStore } from '../../lib/store';
import { useLanguage, setLanguage, SUPPORTED_LANGUAGES, type Language } from '../../i18n';

export function ProfileSettings() {
  const { t, lang } = useLanguage();
  const { theme, setTheme } = useAppStore();

  return (
    <div className="card p-6 mt-6">
      <div className="flex items-center gap-2 mb-5">
        <SettingsIcon size={16} className="text-text-muted" />
        <h2 className="text-text-primary font-semibold text-base">{t('settings.title')}</h2>
      </div>

      {/* Language */}
      <SettingRow icon={<Globe size={14} />} label={t('settings.language')}>
        <div className="flex gap-1.5">
          {SUPPORTED_LANGUAGES.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setLanguage(opt.id as Language)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                lang === opt.id
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border bg-bg-elevated text-text-muted hover:text-text-secondary'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </SettingRow>

      {/* Theme */}
      <SettingRow icon={theme === 'dark' ? <Moon size={14} /> : <Sun size={14} />} label={t('settings.theme')}>
        <div className="flex gap-1.5">
          <button
            onClick={() => setTheme('light')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              theme === 'light'
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-border bg-bg-elevated text-text-muted hover:text-text-secondary'
            }`}
          >
            <Sun size={11} />
            {t('settings.themeLight')}
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              theme === 'dark'
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-border bg-bg-elevated text-text-muted hover:text-text-secondary'
            }`}
          >
            <Moon size={11} />
            {t('settings.themeDark')}
          </button>
        </div>
      </SettingRow>
    </div>
  );
}

interface SettingRowProps {
  icon:     React.ReactNode;
  label:    string;
  children: React.ReactNode;
}

function SettingRow({ icon, label, children }: SettingRowProps) {
  return (
    <div className="flex items-center justify-between py-3 border-t border-border first:border-t-0">
      <div className="flex items-center gap-2 text-sm text-text-secondary">
        <span className="text-text-muted">{icon}</span>
        {label}
      </div>
      {children}
    </div>
  );
}
