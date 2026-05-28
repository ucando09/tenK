/**
 * useLatestRelease — fetches the most recent GitHub Release for the
 * repo configured in `GITHUB_REPO` (lib/constants) and exposes URLs
 * for each platform asset so the DownloadPage can link straight to
 * the installer file.
 *
 * Anonymous GitHub API access works for public repos, with a 60/h
 * unauthenticated rate limit per IP. We cache the result in
 * sessionStorage so re-visits within a tab session don't hit the limit.
 */
import { useState, useEffect } from 'react';
import { GITHUB_REPO } from '../constants';

interface ReleaseAsset {
  name:                  string;
  browser_download_url:  string;
  size:                  number;
}
interface ReleaseResponse {
  tag_name: string;
  name:     string;
  assets:   ReleaseAsset[];
  html_url: string;
}

export interface LatestRelease {
  version:    string;          // e.g. "v1.2.3"
  htmlUrl:    string;          // GH release page
  /** Direct download URL for an installer matching the predicate. */
  pickAsset:  (matcher: (name: string) => boolean) => string | null;
  /** All assets — for debugging / advanced display. */
  assets:     { name: string; url: string; size: number }[];
}

const CACHE_KEY = 'tenk-latest-release';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export function useLatestRelease(): {
  release: LatestRelease | null;
  loading: boolean;
  error:   string | null;
} {
  const [release, setRelease] = useState<LatestRelease | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    const fromCache = readCache();
    if (fromCache) {
      setRelease(buildRelease(fromCache));
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`,
          { headers: { Accept: 'application/vnd.github+json' } },
        );
        if (!res.ok) throw new Error(`GitHub API: ${res.status}`);
        const data = (await res.json()) as ReleaseResponse;
        if (cancelled) return;
        writeCache(data);
        setRelease(buildRelease(data));
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch release');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  return { release, loading, error };
}

function buildRelease(r: ReleaseResponse): LatestRelease {
  const assets = r.assets.map((a) => ({
    name: a.name,
    url:  a.browser_download_url,
    size: a.size,
  }));
  return {
    version:   r.tag_name,
    htmlUrl:   r.html_url,
    assets,
    pickAsset: (matcher) => assets.find((a) => matcher(a.name))?.url ?? null,
  };
}

function readCache(): ReleaseResponse | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, fetchedAt } = JSON.parse(raw);
    if (Date.now() - fetchedAt > CACHE_TTL_MS) return null;
    return data;
  } catch { return null; }
}

function writeCache(data: ReleaseResponse): void {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, fetchedAt: Date.now() }));
  } catch { /* private mode etc. */ }
}
