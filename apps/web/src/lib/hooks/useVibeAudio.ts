/**
 * useVibeAudio — single HTML5 <audio> element that plays the current vibe.
 *
 * Supports both single-track vibes (one MP3 looped) and multi-track
 * vibes (a list of MP3s; the player picks a random one each time the
 * previous ends, so the same vibe never sounds stale across long sessions).
 *
 * Implementation notes:
 *  - Module-singleton audio element avoids React tearing down + recreating
 *    the element when FocusMode unmounts.
 *  - Browsers stream MP3 chunk-by-chunk; `preload="metadata"` means a
 *    10-hour file never fully loads into memory.
 *  - For single-track vibes we use the native `loop` attribute.
 *    For multi-track we leave loop OFF and listen for `ended` to swap
 *    in the next random track.
 */
import { useEffect, useRef, useState } from 'react';
import { getVibe } from '../constants';

/* Module-singleton audio element (re-used across mount/unmount cycles) */
let audioEl: HTMLAudioElement | null = null;

/* Per-track playback position cache — keyed by the browser-resolved URL
 * so switching vibes and back resumes from the same spot. */
const savedPositions = new Map<string, number>();

function getAudio(): HTMLAudioElement {
  if (audioEl) return audioEl;
  audioEl = new Audio();
  audioEl.preload = 'metadata'; // don't pre-buffer multi-hour files
  audioEl.volume  = 0.6;
  return audioEl;
}

function normalizeTracks(src: string | string[] | undefined): string[] {
  if (!src) return [];
  return Array.isArray(src) ? src : [src];
}

function pickDifferentIndex(length: number, exclude: number): number {
  if (length <= 1) return 0;
  let n;
  do { n = Math.floor(Math.random() * length); } while (n === exclude);
  return n;
}

interface UseVibeAudioOptions {
  vibeId:  string;
  /** Whether playback is allowed right now (e.g. focus mode is open). */
  enabled: boolean;
  /** 0–100. */
  volume:  number;
}

interface UseVibeAudioResult {
  playing: boolean;
  /** True if at least one configured track failed to load. */
  missing: boolean;
  /** How many tracks the current vibe has configured (0 = silent). */
  trackCount: number;
  /** Pause / resume — independent of `enabled`. */
  toggle:  () => void;
}

export function useVibeAudio({ vibeId, enabled, volume }: UseVibeAudioOptions): UseVibeAudioResult {
  const [playing, setPlaying] = useState(false);
  const [missing, setMissing] = useState(false);

  /* Track list + current index live in refs because they change inside
   * event handlers attached once at mount. */
  const tracksRef    = useRef<string[]>([]);
  const trackIdxRef  = useRef<number>(0);

  const vibe   = getVibe(vibeId);
  const tracks = normalizeTracks(vibe.audioSrc);

  /* ── Sync track list when vibe changes ───────────────────────────── */
  useEffect(() => {
    const audio = getAudio();
    setMissing(false);

    if (tracks.length === 0) {
      if (audio.src) savedPositions.set(audio.src, audio.currentTime);
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      tracksRef.current   = [];
      trackIdxRef.current = 0;
      setPlaying(false);
      return;
    }

    tracksRef.current   = tracks;
    /* Start on a random track so the same vibe doesn't always begin
     * with the same song. */
    trackIdxRef.current = Math.floor(Math.random() * tracks.length);
    const src = tracks[trackIdxRef.current];

    /* Only reset the element if src actually changed — otherwise we'd
     * cut off ongoing playback when other deps (volume) change. */
    if (!audio.src.endsWith(src)) {
      if (audio.src) savedPositions.set(audio.src, audio.currentTime);
      audio.src  = src;
      audio.load();
      /* Restore saved position — audio.src is now the browser-resolved
       * URL so the key matches what we saved on the way out. */
      const saved = savedPositions.get(audio.src);
      if (saved) audio.currentTime = saved;
    }
    audio.loop = tracks.length === 1;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vibeId, tracks.length]); // intentionally not tracking `tracks` array identity

  /* ── Volume sync ─────────────────────────────────────────────────── */
  useEffect(() => {
    getAudio().volume = Math.min(1, Math.max(0, volume / 100));
  }, [volume]);

  /* ── enabled → play / pause + unmount cleanup ────────────────────── */
  useEffect(() => {
    const audio = getAudio();
    if (enabled && tracksRef.current.length > 0) {
      audio.play()
        .then(() => setPlaying(true))
        .catch(() => {
          /* Most common reasons:
           *  - file not deployed yet → show hint
           *  - browser autoplay policy → user has to click play once */
          setPlaying(false);
          setMissing(true);
        });
    } else {
      audio.pause();
      setPlaying(false);
    }
    return () => {
      audio.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, vibeId]);

  /* ── Permanent event listeners (mount once) ──────────────────────── */
  useEffect(() => {
    const audio = getAudio();
    const onPlay  = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onError = () => { setPlaying(false); setMissing(true); };

    /* When a multi-track vibe's current track ends, pick a different
     * track and play it. Single-track vibes use `audio.loop = true`
     * so this handler is effectively a no-op for them. */
    const onEnded = () => {
      const list = tracksRef.current;
      if (list.length <= 1) return;
      const next = pickDifferentIndex(list.length, trackIdxRef.current);
      trackIdxRef.current = next;
      audio.src = list[next];
      audio.load();
      audio.play().catch(() => setMissing(true));
    };

    audio.addEventListener('play',  onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('error', onError);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('play',  onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('error', onError);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  const toggle = () => {
    const audio = getAudio();
    if (audio.paused) {
      audio.play().then(() => setPlaying(true)).catch(() => setMissing(true));
    } else {
      audio.pause();
      setPlaying(false);
    }
  };

  return {
    playing,
    missing,
    trackCount: tracks.length,
    toggle,
  };
}
