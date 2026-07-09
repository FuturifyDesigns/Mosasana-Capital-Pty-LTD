export function formatTranslation(
  template: string,
  vars?: Record<string, string | number>,
): string {
  if (!vars) return template
  return Object.entries(vars).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, String(value)),
    template,
  )
}
