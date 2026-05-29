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
  Apple, Monitor, ExternalLink, Loader2, X, Download, Smartphone,
  Timer, Users, Flame, BarChart3, Sparkles, ChevronDown, Shield,
} from 'lucide-react';
import { useLatestRelease } from '../lib/hooks/useLatestRelease';
import { detectOS, osLabel, type DetectedOS } from '../lib/detectOS';
import { FeedbackModal } from '../components/Feedback/FeedbackModal';

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

  /* When user clicks any download link we still let the browser fetch
   * the file (the <a href> default), but we ALSO open a modal walking
   * them through SmartScreen / Gatekeeper so they don't bail when
   * the OS warning shows up. */
  const [downloadInfo, setDownloadInfo] = useState<{ os: DetectedOS; fileName: string } | null>(null);
  const onDownload = (os: DetectedOS, fileName: string) => setDownloadInfo({ os, fileName });

  const [showFeedback, setShowFeedback] = useState(false);

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
          <img src="/logo.png" alt="tenK" className="w-8 h-8" />
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

        {/* ── Primary download / mobile-warning ── */}
        <div className="flex flex-col items-center gap-3">
          {(detected === 'ios' || detected === 'android') ? (
            /* Mobile visitors can't run the desktop installers, and the
             * web app isn't tuned for small screens yet. Show a clear
             * "use a computer" call-to-action instead of a download button
             * that won't do anything useful. */
            <div
              className="w-full max-w-md rounded-2xl border p-5 text-left"
              style={{ borderColor: '#f0c06040', backgroundColor: '#f0c06012' }}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center mb-3"
                style={{ backgroundColor: '#f0c06022', color: '#f0c060' }}
              >
                <Smartphone size={20} />
              </div>
              <h2 className="text-text-primary font-bold text-lg mb-1.5">
                Mobile app is in development
              </h2>
              <p className="text-text-muted text-sm leading-relaxed mb-4">
                tenK is built for focused study sessions on Mac, Windows, or in your browser.
                The iOS and Android apps aren't ready yet —{' '}
                <strong className="text-text-secondary">please open this page on your computer</strong>{' '}
                to download or use the web version.
              </p>
              <p className="text-xs text-text-dim">
                We'll launch mobile companion apps after the desktop experience stabilizes.
              </p>
            </div>
          ) : loading ? (
            <div className="inline-flex items-center gap-2 px-7 py-4 rounded-2xl bg-bg-elevated text-text-muted">
              <Loader2 size={16} className="animate-spin" />
              Finding latest version…
            </div>
          ) : primary ? (
            <a
              href={primary.asset.url}
              onClick={() => onDownload(primary.os, primary.asset.name)}
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

          {/* Version + size meta (desktop only) */}
          {primary && detected !== 'ios' && detected !== 'android' && (
            <p className="text-[11px] text-text-dim">
              {release?.version} · {formatMB(primary.asset.size)} · Free
            </p>
          )}


          {/* Other platforms disclosure — desktop only */}
          {release && detected !== 'ios' && detected !== 'android' && (
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
                <a
                  href={macArm.url}
                  onClick={() => onDownload('mac-arm', macArm.name)}
                  className="text-text-muted hover:text-accent transition-colors"
                >
                  Mac (Apple Silicon) — {formatMB(macArm.size)}
                </a>
              )}
              {macInt && primary?.os !== 'mac-intel' && (
                <a
                  href={macInt.url}
                  onClick={() => onDownload('mac-intel', macInt.name)}
                  className="text-text-muted hover:text-accent transition-colors"
                >
                  Mac (Intel) — {formatMB(macInt.size)}
                </a>
              )}
              {winExe && primary?.os !== 'windows' && (
                <a
                  href={winExe.url}
                  onClick={() => onDownload('windows', winExe.name)}
                  className="text-text-muted hover:text-accent transition-colors"
                >
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
            <button
              onClick={() => setShowFeedback(true)}
              className="hover:text-accent transition-colors"
            >
              Feedback
            </button>
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

      {/* ── Install-help modal, opens automatically on any download click ── */}
      {downloadInfo && (
        <InstallHelpModal
          os={downloadInfo.os}
          fileName={downloadInfo.fileName}
          onClose={() => setDownloadInfo(null)}
        />
      )}

      {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} />}
    </div>
  );
}

/* ── Install help modal ──────────────────────────────────────────────
 * Pops up the moment user clicks any download link. The file is already
 * downloading via the <a> default; this just tells them what to do once
 * they double-click the installer so they don't bail on the security
 * warning. */
function InstallHelpModal({
  os, fileName, onClose,
}: {
  os:       DetectedOS;
  fileName: string;
  onClose:  () => void;
}) {
  const isWin = os === 'windows';
  const isMac = os === 'mac-arm' || os === 'mac-intel';

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center px-4 py-6 overflow-y-auto"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: '#7c6cf022', color: '#7c6cf0' }}
            >
              <Download size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-text-primary font-semibold text-sm leading-tight">
                Your download is starting…
              </p>
              <p className="text-[11px] text-text-dim truncate font-mono mt-0.5">
                {fileName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-text-muted hover:text-text-secondary hover:bg-bg-elevated transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          <div
            className="rounded-xl px-3 py-2.5 border flex items-start gap-2 mb-4"
            style={{ borderColor: '#f0c06030', backgroundColor: '#f0c06010' }}
          >
            <Shield size={14} className="flex-shrink-0 mt-0.5" style={{ color: '#f0c060' }} />
            <p className="text-xs leading-relaxed" style={{ color: '#f0c060' }}>
              <strong>Heads up:</strong> tenK isn't code-signed yet, so your OS will show a security warning. It's safe — here's how to get past it.
            </p>
          </div>

          {isWin && (
            <ol className="text-xs text-text-secondary space-y-2.5 list-decimal pl-4 leading-relaxed">
              <li>
                <strong>In your browser</strong>, the download bar may say
                <em> "{fileName} isn't commonly downloaded"</em>. Click the
                <strong> ⋯ menu</strong> next to it and choose <strong>"Keep"</strong>.
              </li>
              <li>
                <strong>Open the installer.</strong> Windows SmartScreen may show
                <em> "Windows protected your PC"</em>.
              </li>
              <li>
                Click <strong>"More info"</strong>, then <strong>"Run anyway"</strong>.
              </li>
              <li>
                Follow the installer like any other Windows app.
              </li>
            </ol>
          )}

          {isMac && <MacInstallSteps />}

          <p className="text-[11px] text-text-muted mt-4 leading-relaxed">
            These warnings show up for any new app from an indie developer. tenK is open source —{' '}
            <a
              href="https://github.com/ucando09/tenK"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              inspect the code on GitHub
            </a>{' '}
            anytime.
          </p>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-bg-elevated border-t border-border flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-white transition-all"
            style={{ background: 'linear-gradient(135deg, #7c6cf0, #5d4dc7)' }}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

/* macOS install steps — handles the "tenK is damaged" Gatekeeper error
 * by walking the user through stripping the quarantine attribute via
 * Terminal. We include a copy-to-clipboard button so non-technical
 * users don't have to type it. */
function MacInstallSteps() {
  const CMD = 'xattr -cr /Applications/tenK.app';
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(CMD);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard blocked — user can still select+copy */ }
  };

  return (
    <ol className="text-xs text-text-secondary space-y-2.5 list-decimal pl-4 leading-relaxed">
      <li>
        Open the <code className="font-mono">.dmg</code> and drag <strong>tenK</strong> to Applications.
      </li>
      <li>
        Try double-clicking tenK in Applications.{' '}
        <span className="text-text-muted">If macOS says it's "from an unidentified developer", just click "Open" — you're done.</span>
      </li>
      <li>
        <strong>If you see "tenK is damaged and can't be opened"</strong>, that's a misleading macOS error for unsigned apps. The app is fine — you just need to remove the quarantine flag:
        <ol className="list-[lower-alpha] pl-5 mt-2 space-y-1.5 text-text-muted">
          <li>Open <strong>Terminal</strong> (press <kbd className="px-1 py-0.5 rounded bg-bg-elevated border border-border text-[10px] font-mono">⌘ Space</kbd>, type "Terminal", press Enter).</li>
          <li>
            Paste this command and press Enter:
            <div className="mt-1.5 flex items-stretch gap-1.5">
              <code className="flex-1 font-mono text-[11px] px-2.5 py-1.5 rounded-md bg-bg-elevated border border-border break-all">
                {CMD}
              </code>
              <button
                onClick={copy}
                type="button"
                className="px-2.5 rounded-md text-[10px] font-semibold border transition-colors"
                style={
                  copied
                    ? { color: '#4cdf90', borderColor: '#4cdf9050', backgroundColor: '#4cdf9012' }
                    : { color: '#7c6cf0', borderColor: '#7c6cf050', backgroundColor: '#7c6cf012' }
                }
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          </li>
          <li>Double-click <strong>tenK</strong> in Applications again — it opens normally.</li>
        </ol>
      </li>
    </ol>
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

