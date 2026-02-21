export default function TodayPage() {
  const now = new Date();
  const greeting = now.getHours() < 12 ? "Good morning" : now.getHours() < 17 ? "Good afternoon" : "Good evening";
  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="pt-2 pb-6">
      <header className="py-2 pb-5">
        <h1 className="text-[26px] font-bold tracking-tight text-text leading-tight">
          {greeting}, Bryce.
        </h1>
        <p className="text-sm text-text-secondary mt-0.5">{dateStr}</p>
      </header>

      <section>
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[11px] font-semibold tracking-wider uppercase text-text-muted">
            Habits
          </span>
          <span className="text-[11px] font-medium text-text-secondary bg-surface-2 px-2 py-0.5 rounded-full">
            0 of 0
          </span>
        </div>
        <div className="rounded-xl border border-border bg-surface p-6 text-center">
          <p className="text-text-secondary text-sm">No habits yet.</p>
          <p className="text-text-muted text-xs mt-1">Add habits to start your morning routine.</p>
        </div>
      </section>

      <div className="h-px bg-border my-5" />

      <section>
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[11px] font-semibold tracking-wider uppercase text-text-muted">
            Gym
          </span>
        </div>
        <div className="rounded-xl border border-border border-l-[3px] border-l-accent bg-surface p-3.5 px-4">
          <p className="text-[15px] font-semibold text-text">No workout logged today</p>
          <p className="text-[13px] text-text-secondary mt-1">Tap to log a workout</p>
        </div>
      </section>
    </div>
  );
}
