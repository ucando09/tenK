/**
 * Tiny i18n system — no extra dependencies.
 *
 * Usage:
 *   const t = useT();
 *   <h1>{t('mastery.title')}</h1>
 *   <span>{t('history.sessions', { n: 5 })}</span>
 *
 * Anything not in `TRANSLATIONS` falls back to the English text or the
 * raw key, so partial coverage degrades gracefully.
 */
import { useSyncExternalStore } from 'react';
import { TRANSLATIONS, type TranslationKey } from './translations';

export type Language = 'en' | 'ko';

export const SUPPORTED_LANGUAGES: { id: Language; label: string }[] = [
  { id: 'en', label: 'English' },
  { id: 'ko', label: '한국어' },
];

const STORAGE_KEY = 'tenk-language';

/* ── Minimal pub/sub for language changes (kept out of Zustand so the
 *    i18n module has zero project dependencies). ─────────────────── */
const listeners = new Set<() => void>();

function detectInitial(): Language {
  if (typeof window === 'undefined') return 'en';
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'en' || stored === 'ko') return stored;
  /* Fallback to browser language — anything starting with 'ko' counts. */
  if (typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('ko')) {
    return 'ko';
  }
  return 'en';
}

let currentLanguage: Language = detectInitial();

export function getLanguage(): Language {
  return currentLanguage;
}

export function setLanguage(lang: Language): void {
  if (lang === currentLanguage) return;
  currentLanguage = lang;
  try { localStorage.setItem(STORAGE_KEY, lang); } catch { /* private mode */ }
  /* Snapshot to a fixed array so removeListener mid-iteration is safe. */
  Array.from(listeners).forEach((fn) => fn());
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/* ── Translate one key, with optional {placeholder} interpolation. ── */
function translate(
  lang:   Language,
  key:    TranslationKey,
  params?: Record<string, string | number>,
): string {
  const bundle = TRANSLATIONS[lang] as Record<string, string>;
  const raw    = bundle[key] ?? (TRANSLATIONS.en as Record<string, string>)[key] ?? key;
  if (!params) return raw;
  return raw.replace(/\{(\w+)\}/g, (_, name: string) =>
    name in params ? String(params[name]) : `{${name}}`);
}

/** Hook returning a function `t(key, params?)`. Re-renders the calling
 *  component whenever the user changes language. */
export function useT(): (key: TranslationKey, params?: Record<string, string | number>) => string {
  const lang = useSyncExternalStore(subscribe, getLanguage, () => 'en' as Language);
  return (key, params) => translate(lang, key, params);
}

/** Same as useT but also returns the current language (for components
 *  that need to switch on it, e.g. number formatting). */
export function useLanguage(): { lang: Language; t: ReturnType<typeof useT> } {
  const lang = useSyncExternalStore(subscribe, getLanguage, () => 'en' as Language);
  return { lang, t: (key, params) => translate(lang, key, params) };
}
