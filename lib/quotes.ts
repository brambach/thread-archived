// Daily motivational quotes — rotates by day of year, consistent within a day.
// Morning: direct, action-oriented, get off your phone and do the thing.
// Evening: reflective, honest, acknowledges the work done.

export const MORNING_QUOTES = [
  "Put the phone down. Go outside.",
  "No motivation required. Just start.",
  "Do the hard thing before your brain talks you out of it.",
  "The resistance you feel right now is exactly why you should go.",
  "Discipline is a decision, not a feeling.",
  "Whether you feel like it or not — that's the whole point.",
  "You've never regretted doing the work. Go.",
  "The version of you that didn't want to start is not in charge.",
  "One foot in front of the other. That's the entire plan.",
  "You don't need a perfect morning. You need to move.",
  "The day is already happening. Make it count.",
  "Get up. The rest follows.",
  "Showing up is the hard part. You're already here.",
  "Your future self is watching. Make the call.",
  "Don't negotiate with yourself. Just go.",
] as const;

export const EVENING_QUOTES = [
  "Every day you showed up is a day that compounds.",
  "Discipline is the quiet accumulation of days like this one.",
  "Whether you felt like it or not — you did it. That's everything.",
  "The person you're becoming is built one closed day at a time.",
  "Small days make big lives.",
  "You showed up. Most people don't.",
  "Today mattered. Even the hard parts.",
  "The gap closes one day at a time. You closed it today.",
  "This is how it's done — one day, then another.",
  "You did the thing. Sleep on it.",
  "Rest now. You earned it.",
  "Consistency doesn't announce itself. It just accumulates.",
  "Another day of not making excuses. That's rare.",
  "The work you do when no one's watching is the work that counts.",
  "One more day further than you were yesterday.",
] as const;

function dayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now.getTime() - start.getTime()) / 86_400_000);
}

export function getMorningQuote(): string {
  return MORNING_QUOTES[dayOfYear() % MORNING_QUOTES.length];
}

export function getEveningQuote(): string {
  return EVENING_QUOTES[dayOfYear() % EVENING_QUOTES.length];
}
