export default function JournalPage() {
  const dateStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="pt-2 pb-6">
      <header className="flex items-baseline justify-between py-2 pb-5">
        <h1 className="text-[26px] font-bold tracking-tight text-text leading-tight">
          Journal
        </h1>
        <span className="text-xs text-text-muted font-mono">0 words</span>
      </header>

      <p className="text-[13px] text-text-secondary mb-5">{dateStr}</p>

      <div className="min-h-[200px]">
        <p className="text-base leading-relaxed text-text-muted font-light">
          Start writing...
          <span className="inline-block w-0.5 h-[18px] bg-accent rounded-sm align-text-bottom animate-pulse ml-0.5" />
        </p>
      </div>
    </div>
  );
}
