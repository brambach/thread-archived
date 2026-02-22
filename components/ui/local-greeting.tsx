"use client";

// Renders the time-of-day greeting using the browser's local timezone.
// Must be a client component — server runs in UTC on Vercel.

export function LocalGreeting({ name, className }: { name: string; className?: string }) {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return <h1 className={className}>{greeting}, {name}.</h1>;
}
