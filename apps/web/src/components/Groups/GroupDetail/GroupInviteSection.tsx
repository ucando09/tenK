/**
 * GroupInviteSection — invite code + shareable link + QR code.
 * Self-contained; owns its own copy/QR-toggle state.
 */
import { useState } from 'react';
import { Copy, Check, Link, QrCode } from 'lucide-react';

interface GroupInviteSectionProps {
  inviteCode: string;
  groupName:  string;
}

export function GroupInviteSection({ inviteCode, groupName }: GroupInviteSectionProps) {
  const [copied,     setCopied]     = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showQR,     setShowQR]     = useState(false);

  const shareLink = `${window.location.origin}/join/${inviteCode}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  return (
    <div className="mb-5 rounded-xl border border-border bg-bg-elevated overflow-hidden">
      {/* Invite code */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-text-muted mb-0.5">Invite Code</p>
          <p className="text-sm font-mono text-text-primary tracking-wider">{inviteCode}</p>
        </div>
        <button
          onClick={handleCopyCode}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all flex-shrink-0 ${
            copied ? 'bg-success/10 text-success border border-success/20' : 'btn-secondary'
          }`}
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? 'Copied!' : 'Copy code'}
        </button>
      </div>

      {/* Shareable link */}
      <div className="flex items-center gap-3 px-4 py-3">
        <Link size={14} className="text-text-muted flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-text-muted truncate">{shareLink}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleCopyLink}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all ${
              linkCopied
                ? 'bg-success/10 text-success border border-success/20'
                : 'btn-secondary'
            }`}
          >
            {linkCopied ? <Check size={13} /> : <Copy size={13} />}
            {linkCopied ? 'Copied!' : 'Copy link'}
          </button>
          <button
            onClick={() => setShowQR((v) => !v)}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all ${
              showQR
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-border text-text-muted hover:text-accent hover:border-accent'
            }`}
          >
            <QrCode size={13} />
            QR
          </button>
        </div>
      </div>

      {/* QR code */}
      {showQR && (
        <div className="flex flex-col items-center gap-3 px-4 py-4 border-t border-border bg-bg-card">
          <p className="text-xs text-text-muted">
            Scan to join <span className="text-text-secondary font-medium">{groupName}</span>
          </p>
          <div className="p-3 bg-white rounded-xl shadow-sm">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(shareLink)}&format=svg&margin=0`}
              alt={`QR code to join ${groupName}`}
              width={180}
              height={180}
              className="block"
            />
          </div>
          <p className="text-xs text-text-dim text-center max-w-[200px]">
            Valid until the invite code is regenerated
          </p>
        </div>
      )}
    </div>
  );
}
