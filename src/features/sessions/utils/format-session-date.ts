/** Long-form localized date, e.g. "Friday, June 12, 2026". */
export function formatSessionDate(scheduledAt: string, locale: string): string {
  return new Date(scheduledAt).toLocaleDateString(locale, {
    weekday: 'long',
    year:    'numeric',
    month:   'long',
    day:     'numeric',
  })
}

/** Localized time, e.g. "7:00 PM". */
export function formatSessionTime(scheduledAt: string, locale: string): string {
  return new Date(scheduledAt).toLocaleTimeString(locale, {
    hour:   'numeric',
    minute: '2-digit',
  })
}

/** Converts a `scheduled_at` ISO timestamp into a `<input type="datetime-local">` value (local time, no seconds/offset). */
export function toDatetimeLocalValue(scheduledAt: string): string {
  const d = new Date(scheduledAt)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
