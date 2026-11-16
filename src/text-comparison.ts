/** Case/whitespace comparison key; preserves punctuation, diacritics and Unicode normalization form. */
export function normalizeComparisonText(value?: string | null): string {
  if (value === undefined || value === null) return ''
  if (typeof value !== 'string') throw new TypeError('comparison_text_must_be_string')
  return value.trim().replace(/\s+/gu, ' ').toUpperCase()
}
