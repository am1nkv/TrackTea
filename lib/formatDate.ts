export function formatDate(iso: string, options?: Intl.DateTimeFormatOptions): string {
  const defaults: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  return new Date(iso).toLocaleDateString('en-US', options ?? defaults)
}
