/**
 * Best-effort client-side OS detection for the public landing page.
 * Used to pre-select the right installer for the visitor's machine
 * so non-technical friends don't have to figure out which file to grab.
 *
 * Apple Silicon vs Intel can't be 100% reliably detected from JS — modern
 * Safari blocks the WebGL renderer trick for privacy. We default to
 * arm64 since the vast majority of Macs sold since late-2020 are M-series,
 * and surface Intel as an explicit fallback link.
 */

export type DetectedOS =
  | 'windows'
  | 'mac-arm'
  | 'mac-intel'
  | 'linux'
  | 'ios'
  | 'android'
  | 'unknown';

export function detectOS(): DetectedOS {
  if (typeof navigator === 'undefined') return 'unknown';

  const ua       = navigator.userAgent;
  const platform = (navigator as { platform?: string }).platform ?? '';

  // iOS — Safari on iPad reports as MacIntel, so check touch points too.
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
  if (platform === 'MacIntel' && navigator.maxTouchPoints > 1) return 'ios';

  if (/Android/.test(ua)) return 'android';

  if (/Win/i.test(platform) || /Windows/i.test(ua)) return 'windows';

  if (/Mac/i.test(platform) || /Mac/i.test(ua)) {
    // Try the WebGL renderer hint — works in some browsers, blocked in others.
    try {
      const canvas = document.createElement('canvas');
      const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as
        | WebGLRenderingContext
        | null;
      const ext = gl?.getExtension('WEBGL_debug_renderer_info');
      const renderer = ext
        ? (gl!.getParameter(ext.UNMASKED_RENDERER_WEBGL) as string | undefined) ?? ''
        : '';
      if (/Apple/i.test(renderer) && !/Intel/i.test(renderer)) return 'mac-arm';
      if (/Intel/i.test(renderer)) return 'mac-intel';
    } catch { /* fall through to default */ }
    // Default — Apple Silicon is the safer bet for new Macs.
    return 'mac-arm';
  }

  if (/Linux/i.test(platform) || /Linux/i.test(ua)) return 'linux';

  return 'unknown';
}

export function osLabel(os: DetectedOS): string {
  switch (os) {
    case 'windows':    return 'Windows';
    case 'mac-arm':    return 'Mac (Apple Silicon)';
    case 'mac-intel':  return 'Mac (Intel)';
    case 'linux':      return 'Linux';
    case 'ios':        return 'iOS';
    case 'android':    return 'Android';
    default:           return 'your device';
  }
}
