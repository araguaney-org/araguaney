/** Túnel de Sentry: los eventos del navegador salen por una ruta de este
 * dominio en vez de ir directo a sentry.io.
 *
 * Las listas de los bloqueadores de anuncios incluyen el dominio de ingesta, así
 * que sin túnel se pierden los errores de quien navega con bloqueador. Y no se
 * pierden al azar: desaparece justo ese segmento, dejando una foto sesgada que
 * parece completa.
 *
 * Desde @sentry/nextjs 11 el túnel ya no se declara en `withSentryConfig`
 * (`tunnelRoute`, deprecado): el navegador lo activa con `tunnel` y el servidor
 * lo atiende con `serveTunnelIntegration`. Las dos mitades tienen que nombrar la
 * misma ruta, por eso vive aquí y no escrita dos veces.
 */

/** Ruta fija y no la que el SDK deriva del DSN: es la que ya pasa los
 * bloqueadores, y cambiarla no gana nada. */
export const SENTRY_TUNNEL_PATH = "/monitoring"

/** DSN que el túnel del servidor acepta además del suyo.
 *
 * El servidor solo reenvía eventos para su propio DSN y responde 403 al resto.
 * Si `SENTRY_DSN` apunta a un proyecto distinto del de `NEXT_PUBLIC_SENTRY_DSN`,
 * sin esta lista todo error del navegador moriría en el túnel sin aviso.
 */
export function tunnelAllowedDsns(): string[] {
  const browserDsn = process.env.NEXT_PUBLIC_SENTRY_DSN
  const serverDsn = process.env.SENTRY_DSN || browserDsn
  return browserDsn && browserDsn !== serverDsn ? [browserDsn] : []
}
