const FORMATS: Record<'short' | 'long' | 'monthYear', Intl.DateTimeFormatOptions> = {
  short: { month: 'short', day: 'numeric', year: 'numeric' },
  long: { month: 'long', day: 'numeric', year: 'numeric' },
  monthYear: { month: 'long', year: 'numeric' },
};

/**
 * Format a stored timestamp for display.
 *
 * Pinned to UTC so the server-rendered HTML and the browser's hydration render
 * the same text; formatting in the viewer's local zone could move a date across
 * midnight and cause a hydration mismatch.
 */
export function formatDate(iso: string, format: keyof typeof FORMATS): string {
  return new Date(iso).toLocaleDateString('en-US', { ...FORMATS[format], timeZone: 'UTC' });
}
