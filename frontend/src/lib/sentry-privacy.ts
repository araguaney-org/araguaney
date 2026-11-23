/** Qué sale hacia Sentry desde el frontend, y qué nunca.
 *
 * `@sentry/nextjs` 11 decide qué recolecta con `dataCollection`, y sus valores
 * por defecto recolectan casi todo: IP, cookies, todos los encabezados, cuerpos
 * de petición (los de un server action incluidos, que es como viaja el
 * formulario de `/donar`), query params y variables locales. Lo midió una
 * prueba con un receptor local: los spans del servidor de Next llevaban la IP
 * del visitante y el `referer` completo.
 *
 * `dataCollection` no alcanza los tokens que van en la **ruta**: el enlace para
 * gestionar una donación es `/donacion/{token}`, y quien lo tiene puede
 * modificarla o cancelarla. Por eso, además, cada URL pasa por `redactUrl`
 * antes de salir: en eventos, spans, breadcrumbs y la grabación de Session
 * Replay. Los tokens de restablecer contraseña y de confirmación viajan en la
 * query, que se descarta entera.
 *
 * Lo usan las tres configuraciones: navegador (`instrumentation-client.ts`),
 * servidor (`sentry.server.config.ts`) y edge (`sentry.edge.config.ts`).
 */
import type * as Sentry from "@sentry/nextjs"

type SentryOptions = NonNullable<Parameters<typeof Sentry.init>[0]>
type DataCollection = NonNullable<SentryOptions["dataCollection"]>
type StreamedSpan = Parameters<NonNullable<SentryOptions["beforeSendSpan"]>>[0]
type Breadcrumb = Sentry.Breadcrumb
type ErrorEvent = Sentry.ErrorEvent

/** Encabezados que describen la petición sin identificar a nadie. Fuera quedan
 * `referer` y `next-url` (llevan la ruta, con token), `cookie`, `authorization`
 * y los de IP (`x-forwarded-for`, `x-real-ip`, `cf-connecting-ip`). */
const SAFE_REQUEST_HEADERS = ["user-agent", "content-type", "content-length", "accept", "accept-language"]

export const SENTRY_DATA_COLLECTION: DataCollection = {
  userInfo: false,
  cookies: false,
  httpHeaders: { request: { allow: SAFE_REQUEST_HEADERS }, response: false },
  httpBodies: [],
  urlQueryParams: false,
  graphQL: { document: false, variables: false },
  genAI: { inputs: false, outputs: false },
  mcp: { inputs: false, outputs: false },
  databaseQueryData: false,
  queues: false,
  stackFrameVariables: false,
}

/** Rutas cuyo segmento siguiente es una credencial y no un identificador
 * público. `/d/{code}` y `/qr/{code}` no entran: son códigos impresos en
 * etiquetas, públicos por diseño. */
const SECRET_PATH_SEGMENTS = ["donacion"]
const SECRET_SEGMENT = new RegExp(`(/(?:${SECRET_PATH_SEGMENTS.join("|")})/)[^/?#]+`, "g")

/** Quita la query y el fragmento, y reemplaza los tokens de ruta. */
export function redactUrl(url: string): string {
  const withoutQuery = url.split(/[?#]/, 1)[0]
  return withoutQuery.replace(SECRET_SEGMENT, "$1[token]")
}

/** Aplica `redactUrl` a cualquier URL que aparezca dentro de un texto
 * (nombres de span como `GET /donacion/abc`, descripciones). */
function redactText(text: string): string {
  return text
    .replace(SECRET_SEGMENT, "$1[token]")
    .replace(/(\S)\?[^\s"']*/g, (match, first: string) => (match.includes("=") ? first : match))
}

function redactValue(value: unknown): unknown {
  if (typeof value === "string") return redactText(value)
  if (Array.isArray(value)) return value.map(redactValue)
  return value
}

/** Atributos que contienen la query sin su `?` (`url.query`, `http.query`):
 * no hay forma de distinguir en ellos qué es token, así que salen enteros. */
const QUERY_KEY = /query/i

function redactRecord<T extends Record<string, unknown> | undefined>(record: T): T {
  if (!record) return record
  return Object.fromEntries(
    Object.entries(record)
      .filter(([k]) => !QUERY_KEY.test(k))
      .map(([k, v]) => [k, redactValue(v)]),
  ) as T
}

export function redactSpan(span: StreamedSpan): StreamedSpan {
  return {
    ...span,
    name: redactText(span.name),
    attributes: redactRecord(span.attributes as Record<string, unknown>) as StreamedSpan["attributes"],
  }
}

export function redactBreadcrumb(breadcrumb: Breadcrumb): Breadcrumb | null {
  return {
    ...breadcrumb,
    message: breadcrumb.message ? redactText(breadcrumb.message) : breadcrumb.message,
    data: redactRecord(breadcrumb.data),
  }
}

export function redactEvent(event: ErrorEvent): ErrorEvent {
  const request = event.request
    ? {
        ...event.request,
        url: event.request.url ? redactUrl(event.request.url) : event.request.url,
        query_string: undefined,
        headers: redactRecord(event.request.headers),
      }
    : event.request
  return {
    ...event,
    request,
    transaction: event.transaction ? redactText(event.transaction) : event.transaction,
    breadcrumbs: event.breadcrumbs?.map((b) => redactBreadcrumb(b) ?? b),
  }
}

/** Un evento de la grabación de rrweb. Solo interesan dos formas: el `meta`
 * (tipo 4, con `href`) y los spans de rendimiento (tipo 5, con descripción). */
interface RecordingEvent {
  type: number
  data: Record<string, unknown>
}

export function redactRecordingEvent<T extends RecordingEvent>(event: T): T {
  if (event.type === 4 && typeof event.data.href === "string") {
    return { ...event, data: { ...event.data, href: redactUrl(event.data.href) } }
  }
  if (event.type === 5 && event.data.payload && typeof event.data.payload === "object") {
    const payload = event.data.payload as Record<string, unknown>
    return {
      ...event,
      data: {
        ...event.data,
        payload: {
          ...payload,
          description: typeof payload.description === "string" ? redactText(payload.description) : payload.description,
          data: redactRecord(payload.data as Record<string, unknown> | undefined),
        },
      },
    }
  }
  return event
}

/** Si la dirección lleva una credencial: el token de gestionar una donación en
 * la ruta, o cualquier `token=` en la query (restablecer contraseña, confirmar
 * una donación o un centro).
 *
 * Session Replay no se graba en esas páginas. La grabación guarda la dirección
 * completa en su evento `meta`, y `beforeAddRecordingEvent` solo recibe eventos
 * personalizados, así que no hay hook que la limpie. Se llega a ellas casi
 * siempre desde un correo, y perder el replay ahí cuesta poco. */
export function hasCredentialInUrl(url: string): boolean {
  const [path, query = ""] = url.split("?", 2)
  return new RegExp(`/(?:${SECRET_PATH_SEGMENTS.join("|")})/[^/?#]+`).test(path) || /(?:^|&)token=/i.test(query)
}

/** Limpia la lista de páginas visitadas que acompaña a cada replay. Corre como
 * procesador de eventos porque `beforeSend` no recibe los `replay_event`. */
export function redactReplayEvent<T extends { type?: string; urls?: string[] }>(event: T): T {
  if (event.type !== "replay_event" || !Array.isArray(event.urls)) return event
  return { ...event, urls: event.urls.map(redactUrl) }
}

/** Opciones comunes a las tres configuraciones. */
export const SENTRY_PRIVACY_OPTIONS = {
  dataCollection: SENTRY_DATA_COLLECTION,
  beforeSend: redactEvent,
  beforeSendSpan: redactSpan,
  beforeBreadcrumb: redactBreadcrumb,
} satisfies Partial<SentryOptions>
