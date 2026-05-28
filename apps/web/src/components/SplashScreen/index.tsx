/**
 * Full-screen branded splash shown while Supabase auth initialises.
 *
 * Owns its own fade-in animation on mount. When the parent flips
 * `fadeOut` to true, the splash fades to opacity 0 over ~500ms —
 * the parent should keep it mounted until that transition completes.
 */
import { useEffect, useState } from 'react';

export function SplashScreen({ fadeOut = false }: { fadeOut?: boolean }) {
  /* Trigger fade-in on the *next* frame so the initial opacity-0
   * paint lands first, then the transition kicks in. */
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const opacity = fadeOut ? 0 : mounted ? 1 : 0;

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-8 bg-bg-deep transition-opacity duration-1000 ease-out"
      style={{ opacity }}
    >
      {/* Glow ring behind icon */}
      <div className="relative">
        <div
          className="absolute inset-[-20px] rounded-full animate-ping opacity-20"
          style={{ background: 'radial-gradient(circle, #7c6cf0 0%, transparent 70%)' }}
        />
        <img
          src="/favicon.svg"
          alt="tenK"
          className="relative w-24 h-24 rounded-3xl shadow-accent-glow"
          style={{ animation: 'float 3s ease-in-out infinite' }}
        />
      </div>

      {/* Wordmark */}
      <div className="text-center">
        <div className="text-5xl font-black tracking-tighter text-gradient select-none">
          tenK
        </div>
        <p className="text-text-muted text-sm mt-2 tracking-wide">
          10,000 hours to mastery
        </p>
      </div>

      {/* Bouncing dots */}
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce"
            style={{ animationDelay: `${i * 0.18}s` }}
          />
        ))}
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
}
