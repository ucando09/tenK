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

/** Plays a restaurant-style desk bell "ding" using additive synthesis. */
export function playBell() {
  const ctx = getAudioCtx();
  const schedule = () => {
    const t = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);

    // Three inharmonic partials (bell-like ratios, not exact multiples)
    // Higher partials decay faster, giving the characteristic bell envelope
    const partials = [
      { freq: 1200, gain: 0.6,  decay: 1.6 },
      { freq: 2860, gain: 0.35, decay: 0.8 },
      { freq: 4320, gain: 0.15, decay: 0.4 },
    ];
    partials.forEach(({ freq, gain, decay }) => {
      const osc = ctx.createOscillator();
      const g   = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(gain, t + 0.003); // sharp attack
      g.gain.exponentialRampToValueAtTime(0.001, t + decay);
      osc.connect(g);
      g.connect(master);
      osc.start(t);
      osc.stop(t + decay + 0.05);
    });
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
