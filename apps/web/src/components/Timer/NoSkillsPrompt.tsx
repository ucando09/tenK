/** Empty-state shown on the Timer page when the user has no skills yet. */
export function NoSkillsPrompt({ onNavigate }: { onNavigate: () => void }) {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="text-5xl">🎯</div>
      <h2 className="text-text-primary text-xl font-semibold">Nothing Tracked Yet</h2>
      <p className="text-text-muted text-sm max-w-xs">
        Add your first mastery to start your 10,000-hour journey.
      </p>
      <button onClick={onNavigate} className="btn-primary mt-2">
        Add Mastery →
      </button>
    </div>
  );
}
