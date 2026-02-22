"use client";

// Renders the current date using the browser's local timezone.
// Must be a client component — server components run in UTC on Vercel
// and will show the wrong date for users behind UTC.

export function LocalDate({ className }: { className?: string }) {
  const dateStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return <p className={className}>{dateStr}</p>;
}
