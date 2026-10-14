/**
 * Qué zona dejar elegida en el formulario del centro (Fase 27).
 *
 * La zona del navegador es una **sugerencia**, no la fuente de verdad: sirve
 * para que nadie busque `America/New_York` entre seiscientas. Solo se sugiere
 * si pertenece al país elegido; si no, una administración en Monterrey que da
 * de alta un centro en Tampa dejaría Monterrey sin darse cuenta.
 */
export function pickTimezone(
  options: readonly string[],
  current: string,
  browserZone: string | null,
): string {
  if (current && options.includes(current)) return current
  if (browserZone && options.includes(browserZone)) return browserZone
  if (options.length === 1) return options[0]
  return ""
}

/** La zona del navegador, o `null` si el entorno no la expone. */
export function browserTimezone(): string | null {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null
  } catch {
    return null
  }
}
