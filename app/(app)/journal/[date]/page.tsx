import { db } from "@/lib/db";
import { journalEntries } from "@/lib/db/schema";
import { eq, lte, desc, isNotNull, and, ne } from "drizzle-orm";
import { getToday } from "@/lib/utils";
import { JournalEditor } from "@/components/journal/journal-editor";
import { notFound } from "next/navigation";

async function getStreak(today: string): Promise<number> {
  const entries = await db
    .select({ date: journalEntries.date })
    .from(journalEntries)
    .where(
      and(
        isNotNull(journalEntries.content),
        ne(journalEntries.content, ""),
        lte(journalEntries.date, today)
      )
    )
    .orderBy(desc(journalEntries.date))
    .limit(365);

  const dateSet = new Set(entries.map((e) => e.date));

  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const [y, m, d] = today.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d - i));
    const ds = dt.toISOString().split("T")[0];
    if (dateSet.has(ds)) streak++;
    else break;
  }

  return streak;
}

// Validate YYYY-MM-DD format
function isValidDate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s));
}

export default async function JournalDatePage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;

  if (!isValidDate(date)) notFound();

  const today = getToday();

  // If someone navigates to a future date beyond today, redirect to today's page
  if (date > today) notFound();

  const [entry] = await db
    .select()
    .from(journalEntries)
    .where(eq(journalEntries.date, date))
    .limit(1);

  const streak = await getStreak(today);

  return (
    <JournalEditor
      initialEntry={entry ?? null}
      date={date}
      today={today}
      streak={streak}
    />
  );
}
