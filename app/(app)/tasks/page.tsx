export default function TasksPage() {
  const dateStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="pt-2 pb-6">
      <header className="py-2 pb-5">
        <h1 className="text-[26px] font-bold tracking-tight text-text leading-tight">
          Tasks
        </h1>
        <p className="text-sm text-text-secondary mt-0.5">{dateStr}</p>
      </header>

      <div className="rounded-xl border border-border bg-surface p-6 text-center">
        <p className="text-text-secondary text-sm">No tasks for today.</p>
        <p className="text-text-muted text-xs mt-1">Add a task to get started.</p>
      </div>
    </div>
  );
}
