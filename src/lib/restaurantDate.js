/** Calendar date YYYY-MM-DD in a given IANA timezone (e.g. Asia/Kolkata). */
export function getCalendarDateInTimeZone(timeZone = "Asia/Kolkata", date = new Date()) {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}
