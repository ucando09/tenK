/**
 * Shared utility functions used across the web app.
 */

// Singleton AudioContext. Must be unlocked from a user gesture before use.
let _audioCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext {
  if (!_audioCtx || _audioCtx.state === 'closed') {
    _audioCtx = new AudioContext();
  }
  return _audioCtx;
}

/**
 * Call this synchronously inside any user-gesture handler (e.g. the Start
 * button click) to unlock the AudioContext for the rest of the session.
 * resume() only succeeds when called within a user gesture on a fresh context.
 */
export function unlockAudio() {
  const ctx = getAudioCtx();
  if (ctx.state === 'suspended') ctx.resume();
}

/** Plays a single soft bell tone using the Web Audio API. */
export function playBell() {
  const ctx = getAudioCtx();
  const schedule = () => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 1.8);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.2);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 2.2);
  };
  if (ctx.state === 'running') {
    schedule();
  } else {
    ctx.resume().then(schedule).catch(() => {});
  }
}

/**
 * Extracts a human-readable message from any thrown value.
 *
 * Supabase returns `PostgrestError` objects (not JS `Error` instances), so
 * `err instanceof Error` is false and `String(err)` produces "[object Object]".
 * This helper handles both cases correctly.
 */
export function extractErrorMessage(err: unknown): string {
  if (!err) return 'Unknown error';
  if (typeof err === 'string') return err;
  if (err instanceof Error) return err.message;
  if (typeof err === 'object') {
    const e = err as Record<string, unknown>;
    if (typeof e.message === 'string' && e.message) return e.message;
  }
  return 'Unknown error';
}

/**
 * Returns true when the error indicates a missing database table
 * (migration not run). Strictly checks the PostgreSQL "undefined_table"
 * error code (42P01) — never matches on message strings, which would
 * misclassify legitimate errors that happen to reference table names.
 */
export function isMissingTableError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const code = (err as { code?: unknown }).code;
  return code === '42P01';
}
