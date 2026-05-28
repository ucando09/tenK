/**
 * DownloadPage — landing page friends visit to grab the desktop apps.
 *
 * Pulls the latest desktop installers from GitHub Releases at page
 * load. When you push a new tag, this page auto-updates within an hour
 * (sessionStorage cache TTL). Mobile platforms stay as "coming soon"
 * pointers until those builds exist.
 */
import { Download, Apple, Monitor, Smartphone, ExternalLink, Loader2 } from 'lucide-react';
import { useLatestRelease } from '../lib/hooks/useLatestRelease';
import { GITHUB_REPO } from '../lib/constants';

interface PlatformCard {
  id:           string;
  name:         string;
  subtitle:     string;
  description:  string;
  icon:         React.ReactNode;
  iconBg:       string;
  badge?:       string;
  badgeColor?:  string;
  downloadUrl?: string;
  downloadLabel: string;
  secondaryUrl?:   string;
  secondaryLabel?: string;
}

/* ── Asset matchers for each platform ───────────────────────────────
 * electron-builder produces files like:
 *   tenK-1.0.0-arm64.dmg          (macOS Apple Silicon)
 *   tenK-1.0.0.dmg                (macOS Intel)
 *   tenK Setup 1.0.0.exe          (Windows NSIS)
 *   tenK-1.0.0.AppImage           (Linux)
 * We match by extension + arch hint so the same code keeps working
 * across version bumps. */
const matchMacArm64 = (n: string) => n.endsWith('.dmg') && /arm64/i.test(n);
const matchMacIntel = (n: string) => n.endsWith('.dmg') && !/arm64/i.test(n);
const matchWindows  = (n: string) => n.endsWith('.exe');

export function DownloadPage() {
  const { release, loading } = useLatestRelease();

  const platforms: PlatformCard[] = [
    {
      id:           'macos',
      name:         'macOS',
      subtitle:     'Apple Silicon (M1+)',
      description:
        'The full tenK experience in a native Mac app. Auto-updates when new versions ship.',
      icon:        <Apple size={28} />,
      iconBg:      '#7c6cf0',
      badge:       release ? release.version : 'Beta',
      badgeColor:  '#f0c060',
      downloadUrl: release?.pickAsset(matchMacArm64) ?? undefined,
      downloadLabel: 'Download for Mac (M1+)',
      secondaryUrl:  release?.pickAsset(matchMacIntel) ?? undefined,
      secondaryLabel: release?.pickAsset(matchMacIntel) ? 'Intel Mac' : undefined,
    },
    {
      id:           'windows',
      name:         'Windows',
      subtitle:     'Windows 10 & 11',
      description:
        'Track your practice sessions without opening a browser. Auto-updates baked in.',
      icon:        <Monitor size={28} />,
      iconBg:      '#60b8f0',
      badge:       release ? release.version : 'Beta',
      badgeColor:  '#f0c060',
      downloadUrl: release?.pickAsset(matchWindows) ?? undefined,
      downloadLabel: 'Download for Windows',
    },
    {
      id:           'ios',
      name:         'iOS',
      subtitle:     'iPhone & iPad',
      description:
        'Log sessions on the go, even without a connection. Hours sync when you are back online.',
      icon:        <Smartphone size={24} />,
      iconBg:      '#4cdf90',
      badge:       'Coming Soon',
      badgeColor:  '#7070a0',
      downloadUrl: undefined,
      downloadLabel: 'TestFlight (coming soon)',
    },
    {
      id:           'android',
      name:         'Android',
      subtitle:     'Android 9+',
      description:
        'Full offline support and home-screen widgets for at-a-glance progress.',
      icon:        <Smartphone size={24} />,
      iconBg:      '#f0906c',
      badge:       'Coming Soon',
      badgeColor:  '#7070a0',
      downloadUrl: undefined,
      downloadLabel: 'Google Play (coming soon)',
    },
  ];

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-2xl mx-auto px-8 py-8">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
              <Download size={18} className="text-accent" />
            </div>
            <h1 className="text-text-primary font-bold text-2xl">Get the App</h1>
            {loading && (
              <Loader2 size={14} className="text-text-dim animate-spin ml-1" />
            )}
          </div>
          <p className="text-text-muted text-sm leading-relaxed">
            tenK works in your browser, but native apps let you track offline, stay focused
            without switching tabs, and get auto-updates as we ship new versions.
          </p>
          {release && (
            <p className="text-xs text-text-dim mt-2">
              Latest release:{' '}
              <a
                href={release.htmlUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:text-accent-light"
              >
                {release.version}
              </a>
            </p>
          )}
        </div>

        {/* Platform cards */}
        <div className="space-y-4">
          {platforms.map((p) => (
            <div key={p.id} className="card p-5 flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: p.iconBg + '22', color: p.iconBg }}
              >
                {p.icon}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className="text-text-primary font-semibold text-base">{p.name}</span>
                  <span className="text-text-muted text-xs">{p.subtitle}</span>
                  {p.badge && (
                    <span
                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full border"
                      style={{
                        color:           p.badgeColor,
                        borderColor:     p.badgeColor + '50',
                        backgroundColor: p.badgeColor + '12',
                      }}
                    >
                      {p.badge}
                    </span>
                  )}
                </div>
                <p className="text-text-muted text-xs leading-relaxed mb-3">{p.description}</p>

                <div className="flex items-center gap-2 flex-wrap">
                  <a
                    href={p.downloadUrl ?? '#'}
                    onClick={p.downloadUrl ? undefined : (e) => e.preventDefault()}
                    target={p.downloadUrl ? '_blank' : undefined}
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      p.downloadUrl
                        ? 'bg-accent text-white hover:bg-accent-light'
                        : 'bg-bg-elevated text-text-dim cursor-not-allowed border border-border'
                    }`}
                  >
                    <Download size={12} />
                    {p.downloadLabel}
                    {p.downloadUrl && <ExternalLink size={11} className="opacity-60" />}
                  </a>

                  {p.secondaryUrl && p.secondaryLabel && (
                    <a
                      href={p.secondaryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-text-muted hover:text-accent transition-colors"
                    >
                      {p.secondaryLabel} ↗
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <div className="mt-8 p-4 rounded-xl bg-bg-elevated border border-border">
          <p className="text-text-muted text-xs leading-relaxed text-center">
            All your data syncs through the cloud — switch between web and app anytime
            without losing a single hour.
          </p>
          {!release && !loading && (
            <p className="text-text-dim text-[11px] mt-2 text-center">
              No published release yet at{' '}
              <code className="font-mono">{GITHUB_REPO}</code>. The buttons unlock automatically
              once the first <code>v*</code> tag is pushed.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
