const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Strict calendar-date validation for the app's inclusive ISO date fields. */
export function isValidIsoDate(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const match = ISO_DATE.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1900 || year > 2200 || month < 1 || month > 12 || day < 1) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() + 1 === month && date.getUTCDate() === day;
}

/** Returns whether an inclusive tenancy range overlaps the given calendar year. */
export function overlapsCalendarYear(from: string, to: string | null, year: number): boolean {
  const yearStart = `${year}-01-01`;
  const yearEnd = `${year}-12-31`;
  return from <= yearEnd && (to === null || to >= yearStart);
}
