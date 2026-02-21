export default function WorkPage() {
  return (
    <div className="pt-2 pb-6">
      <header className="flex items-baseline justify-between py-2 pb-4">
        <h1 className="text-[26px] font-bold tracking-tight text-text leading-tight">
          Work
        </h1>
        <button className="text-xs text-accent font-medium">+ New</button>
      </header>

      <div className="flex gap-1.5 mb-5 flex-wrap">
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-accent-dim text-accent">
          0 active
        </span>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-surface-2 text-text-secondary">
          0 done
        </span>
      </div>

      <div className="rounded-xl border border-border bg-surface p-6 text-center">
        <p className="text-text-secondary text-sm">No projects yet.</p>
        <p className="text-text-muted text-xs mt-1">Create a project to track your work.</p>
      </div>
    </div>
  );
}
