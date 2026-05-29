/**
 * LandingPage — public marketing + download page.
 *
 * Lives outside the auth wall so non-users (friends, social-media
 * visitors) can land here, immediately understand what tenK is, and
 * grab the right installer for their machine with one click.
 *
 * Heavy lifting:
 *   - detectOS() picks the visitor's platform
 *   - useLatestRelease() pulls the newest desktop installers from GH
 *   - The primary "Download" button maps to the right asset; secondary
 *     downloads (other OSes) hide behind a disclosure for cleanliness.
 */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Apple, Monitor, ExternalLink, Loader2,
  Timer, Users, Flame, BarChart3, Sparkles, ChevronDown,
} from 'lucide-react';
import { useLatestRelease } from '../lib/hooks/useLatestRelease';
import { detectOS, osLabel, type DetectedOS } from '../lib/detectOS';

/* ── Asset matchers (mirror DownloadPage) ──────────────────────────── */
const matchMacArm64 = (n: string) => n.endsWith('.dmg') && /arm64/i.test(n);
const matchMacIntel = (n: string) => n.endsWith('.dmg') && !/arm64/i.test(n);
const matchWindows  = (n: string) => n.endsWith('.exe');

function formatMB(bytes?: number): string {
  if (!bytes) return '';
  return `${(bytes / 1_048_576).toFixed(0)} MB`;
}

export function LandingPage() {
  const { release, loading } = useLatestRelease();
  const detected = useMemo<DetectedOS>(() => detectOS(), []);
  const [showAll, setShowAll] = useState(false);

  /* Resolve installer + size for each platform */
  const macArm = release?.assets.find((a) => matchMacArm64(a.name));
  const macInt = release?.assets.find((a) => matchMacIntel(a.name));
  const winExe = release?.assets.find((a) => matchWindows(a.name));

  /* Primary CTA — what the big button does. Falls back to Windows when
   * we can't detect (most realistic guess for general traffic). */
  const primary = (() => {
    if (detected === 'mac-intel' && macInt) return { os: 'mac-intel' as DetectedOS, asset: macInt, icon: <Apple size={20} /> };
    if ((detected === 'mac-arm' || detected === 'ios') && macArm) return { os: 'mac-arm' as DetectedOS, asset: macArm, icon: <Apple size={20} /> };
    if (winExe) return { os: 'windows' as DetectedOS, asset: winExe, icon: <Monitor size={20} /> };
    if (macArm) return { os: 'mac-arm' as DetectedOS, asset: macArm, icon: <Apple size={20} /> };
    return null;
  })();

  return (
    <div className="min-h-screen bg-bg overflow-x-hidden">
      {/* ── Top bar ── */}
      <header className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #7c6cf0, #4cdf90)' }}
          >
            <Timer size={16} className="text-white" />
          </div>
          <span className="text-text-primary font-bold text-lg tracking-tight">tenK</span>
        </div>
        <Link
          to="/timer"
          className="text-xs text-text-muted hover:text-accent transition-colors"
        >
          Open in browser →
        </Link>
      </header>

      {/* ── Hero ── */}
      <section className="max-w-3xl mx-auto px-6 pt-12 pb-16 text-center">
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold mb-6 border"
          style={{
            color:           '#7c6cf0',
            borderColor:     '#7c6cf040',
            backgroundColor: '#7c6cf012',
          }}
        >
          <Sparkles size={11} />
          The 10,000-hour skill tracker
        </div>
        <h1 className="text-text-primary font-bold text-4xl sm:text-5xl tracking-tight leading-[1.1] mb-5">
          Track every hour <br/>of deliberate practice.
        </h1>
        <p className="text-text-muted text-base sm:text-lg leading-relaxed max-w-xl mx-auto mb-10">
          Pomodoro timer, immersive focus mode, study groups with evolving avatars —
          everything you need to chase mastery, one session at a time.
        </p>

        {/* ── Primary download button ── */}
        <div className="flex flex-col items-center gap-3">
          {loading ? (
            <div className="inline-flex items-center gap-2 px-7 py-4 rounded-2xl bg-bg-elevated text-text-muted">
              <Loader2 size={16} className="animate-spin" />
              Finding latest version…
            </div>
          ) : primary ? (
            <a
              href={primary.asset.url}
              className="inline-flex items-center gap-2.5 px-7 py-4 rounded-2xl text-base font-semibold text-white transition-all hover:scale-[1.02]"
              style={{
                background: 'linear-gradient(135deg, #7c6cf0, #5d4dc7)',
                boxShadow:  '0 8px 24px rgba(124,108,240,0.35)',
              }}
            >
              {primary.icon}
              Download for {osLabel(primary.os)}
            </a>
          ) : (
            <div className="inline-flex items-center gap-2 px-7 py-4 rounded-2xl bg-bg-elevated text-text-muted text-sm">
              No release yet — check back soon.
            </div>
          )}

          {/* Version + size meta */}
          {primary && (
            <p className="text-[11px] text-text-dim">
              {release?.version} · {formatMB(primary.asset.size)} · Free
            </p>
          )}

          {/* Mobile / unsupported note */}
          {(detected === 'ios' || detected === 'android') && (
            <p className="text-xs text-text-muted mt-1 max-w-sm">
              Mobile apps are still cooking — for now, the desktop app or web version is the best way to use tenK.
            </p>
          )}

          {/* Other platforms disclosure */}
          {release && (
            <button
              onClick={() => setShowAll((s) => !s)}
              className="mt-4 flex items-center gap-1 text-xs text-text-muted hover:text-accent transition-colors"
            >
              Other platforms
              <ChevronDown
                size={12}
                className={`transition-transform ${showAll ? 'rotate-180' : ''}`}
              />
            </button>
          )}

          {showAll && release && (
            <div className="mt-3 flex flex-col gap-1.5 text-xs">
              {macArm && primary?.os !== 'mac-arm' && (
                <a href={macArm.url} className="text-text-muted hover:text-accent transition-colors">
                  Mac (Apple Silicon) — {formatMB(macArm.size)}
                </a>
              )}
              {macInt && primary?.os !== 'mac-intel' && (
                <a href={macInt.url} className="text-text-muted hover:text-accent transition-colors">
                  Mac (Intel) — {formatMB(macInt.size)}
                </a>
              )}
              {winExe && primary?.os !== 'windows' && (
                <a href={winExe.url} className="text-text-muted hover:text-accent transition-colors">
                  Windows — {formatMB(winExe.size)}
                </a>
              )}
              <Link to="/timer" className="text-text-muted hover:text-accent transition-colors">
                Use in browser instead →
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FeatureCard
            icon={<Timer size={20} />}
            color="#7c6cf0"
            title="Pomodoro & Stopwatch"
            body="Configurable work/break cycles, or a free-running stopwatch when you're locked in for the long haul."
          />
          <FeatureCard
            icon={<Flame size={20} />}
            color="#f0906c"
            title="Immersive Focus Mode"
            body="Full-screen ambient scenes with lo-fi, rain, fireplace, and more. Background noise that actually helps."
          />
          <FeatureCard
            icon={<Users size={20} />}
            color="#4cdf90"
            title="Study Groups"
            body="Practice alongside friends. Watch their avatars evolve as their session hours climb."
          />
          <FeatureCard
            icon={<BarChart3 size={20} />}
            color="#60b8f0"
            title="Heatmaps & Reports"
            body="See your patterns. Weekly trends, skill distribution, year-long heatmaps — your 10K hours, visualized."
          />
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border">
        <div className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between text-xs text-text-dim">
          <span>© tenK</span>
          <div className="flex items-center gap-4">
            <Link to="/auth" className="hover:text-accent transition-colors">
              Sign in
            </Link>
            {release && (
              <a
                href={release.htmlUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-accent transition-colors inline-flex items-center gap-1"
              >
                Releases <ExternalLink size={10} />
              </a>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ── Helper components ────────────────────────────────────────────── */

function FeatureCard({
  icon, color, title, body,
}: {
  icon:  React.ReactNode;
  color: string;
  title: string;
  body:  string;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: color + '22', color }}
        >
          {icon}
        </div>
        <div>
          <h3 className="text-text-primary font-semibold text-sm mb-1">{title}</h3>
          <p className="text-text-muted text-xs leading-relaxed">{body}</p>
        </div>
      </div>
    </div>
  );
}

