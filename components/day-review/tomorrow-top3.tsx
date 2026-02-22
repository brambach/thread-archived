interface TomorrowTop3Props {
  items: string[];
}

export function TomorrowTop3({ items }: TomorrowTop3Props) {
  if (!items || items.length === 0) return null;

  return (
    <div className="mb-5 rounded-xl bg-surface border border-border overflow-hidden">
      <div className="px-4 pt-3.5 pb-2">
        <span className="text-[10px] font-semibold tracking-wider uppercase text-text-muted">
          Today&apos;s priorities
        </span>
      </div>
      <div className="px-4 pb-3.5 flex flex-col gap-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <span className="text-[11px] font-semibold text-text-muted mt-0.5 w-3.5 shrink-0">
              {i + 1}
            </span>
            <span className="text-sm text-text leading-snug">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
