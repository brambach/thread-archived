export default function CalendarPage() {
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <div className="pt-2 pb-6">
      <header className="flex items-center justify-between py-2 pb-4">
        <h1 className="text-lg font-bold text-text tracking-tight">
          {dateStr} — Today
        </h1>
        <div className="flex gap-2">
          <button className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center text-text-secondary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center text-text-secondary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </header>

      <div className="rounded-xl border border-border bg-surface p-6 text-center">
        <p className="text-text-secondary text-sm">No time blocks scheduled.</p>
        <p className="text-text-muted text-xs mt-1">Drag tasks onto the calendar to plan your day.</p>
      </div>
    </div>
  );
}
