const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']

// These date strings are real research data, not a clean structured field —
// they range from "November 1, 2026" (fully parseable) to "Not yet
// announced", "Varies by term and program", or "July 15" with no year at
// all (ambiguous — could mean this year or next). A generic countdown badge
// on all of them would either crash on the unparseable ones or, worse,
// silently show a wrong/fabricated day count. This only returns a Date for
// strings it can parse with real confidence (an explicit month + day + a
// 4-digit year); a range like "January 1–15, 2027" resolves to the LATER
// date (the actual cutoff), everything else returns null and the caller
// skips the countdown/calendar UI entirely rather than guessing.
export function parseDeadlineDate(dateStr: string): Date | null {
  const yearMatch = dateStr.match(/\b(20\d{2})\b/)
  if (!yearMatch) return null
  const year = Number(yearMatch[1])

  // Grab every "Month D" occurrence in the string and keep the last one —
  // for a range ("January 1–15, 2027" or "June 2 – July 11, 2026") that's
  // the closing date, which is what a countdown/calendar event should
  // target.
  const monthDayRe = /([A-Za-z]+)\s+(\d{1,2})/g
  let lastMatch: RegExpExecArray | null = null
  let m: RegExpExecArray | null
  while ((m = monthDayRe.exec(dateStr)) !== null) {
    const monthIdx = MONTHS.indexOf(m[1].toLowerCase())
    if (monthIdx !== -1) lastMatch = m
  }
  if (!lastMatch) return null

  const monthIdx = MONTHS.indexOf(lastMatch[1].toLowerCase())
  const day = Number(lastMatch[2])
  const date = new Date(year, monthIdx, day, 23, 59, 59)
  return Number.isNaN(date.getTime()) ? null : date
}

export function daysUntil(date: Date): number {
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.ceil((date.getTime() - startOfToday.getTime()) / 86_400_000)
}

export function googleCalendarUrl(title: string, date: Date, details: string): string {
  const ymd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${ymd}/${ymd}`,
    details,
  })
  return `https://www.google.com/calendar/render?${params.toString()}`
}
