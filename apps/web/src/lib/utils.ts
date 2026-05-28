/**
 * Shared utility functions used across the web app.
 */

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
