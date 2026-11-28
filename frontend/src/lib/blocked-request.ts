/**
 * Avisa cuando una persona real choca con un bloqueo: el WAF de Cloudflare o
 * el límite de tasa de la API (Fase 04, task 21).
 *
 * Los paneles de Cloudflare ya cuentan los bloqueos, pero no distinguen a quien
 * escanea `.env` de quien captura una donación. Que el aviso salga de la web es
 * lo que da esa distinción: lo dispara una sesión de verdad.
 *
 * **Un bloqueo del WAF no se ve igual en el servidor que en el navegador.** La
 * respuesta de Cloudflare es HTML y no trae cabeceras CORS. En el servidor de
 * Next se lee tal cual (403, `text/html`). En el navegador, como la API vive en
 * otro origen, `fetch` ni siquiera entrega el estado: falla igual que sin
 * conexión. Sin distinguirlo, la cola offline reintentaría para siempre una
 * captura que el firewall rechaza cada vez, y nadie se enteraría. Para ese caso
 * se pregunta a `/health`: si responde, la conexión estaba bien y el fallo vino
 * de otra parte.
 */
import * as Sentry from "@sentry/nextjs"
import { redactUrl } from "@/lib/sentry-privacy"

/** En qué capa se cortó la petición.
 * - `edge`: Cloudflare respondió en lugar de la API (se leyó el estado).
 * - `edge-suspected`: el navegador no pudo leer la respuesta, pero la API sí
 *   está alcanzable. Casi siempre es un bloqueo sin CORS.
 * - `api`: la propia API limitó la tasa. */
export type BlockLayer = "edge" | "edge-suspected" | "api"

export interface BlockedRequest {
  layer: BlockLayer
  status: number | null
  method: string
  path: string
}

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi
// Códigos de caja, tarima, envío o donación ("BX-AB12CD", "DN-7K2Q9").
const ENTITY_CODE = /\/[A-Z]{2,3}-[A-Z0-9-]{3,}/g
const LONG_SEGMENT = /\/[A-Za-z0-9_-]{20,}(?=\/|$)/g

/** La ruta como plantilla: sin ids, códigos ni tokens. Agrupa en Sentry todos
 * los bloqueos de la misma operación en un solo aviso, y no manda a un tercero
 * un identificador que no necesita. */
export function pathTemplate(path: string): string {
  return redactUrl(path)
    .replace(UUID, ":id")
    .replace(ENTITY_CODE, "/:code")
    .replace(LONG_SEGMENT, "/:token")
}

/** ¿Respondió Cloudflare en vez de la API? La API siempre contesta JSON y la
 * página de bloqueo de Cloudflare es HTML. Se exige el HTML explícito, no la
 * mera ausencia de JSON: una respuesta sin cabecera no prueba nada. */
export function isEdgeResponse(res: Pick<Response, "status" | "headers">): boolean {
  if (res.status !== 403 && res.status !== 429) return false
  const type = res.headers?.get?.("content-type") ?? ""
  return type.includes("text/html")
}

/** Qué bloqueo vale la pena reportar a partir de una respuesta leída. Un 403
 * de la API es una negación de permisos normal y no se reporta. */
export function classifyResponse(
  res: Pick<Response, "status" | "headers">,
): BlockLayer | null {
  if (isEdgeResponse(res)) return "edge"
  if (res.status === 429) return "api"
  return null
}

// Un aviso por operación y página: quien reintenta o una cola que vuelve a
// pasar por la misma captura no debe convertir un bloqueo en cien eventos.
const reported = new Set<string>()

export function reportBlockedRequest(block: BlockedRequest): void {
  const template = pathTemplate(block.path)
  const key = `${block.layer}:${block.status}:${block.method}:${template}`
  if (reported.has(key)) return
  reported.add(key)

  Sentry.captureMessage(`Petición bloqueada (${block.layer}): ${block.method} ${template}`, {
    level: "warning",
    fingerprint: ["blocked-request", block.layer, String(block.status), block.method, template],
    tags: {
      blocked_request: block.layer,
      blocked_status: String(block.status ?? "unreadable"),
    },
  })
}

/** Solo para pruebas: olvida qué se reportó. */
export function resetBlockedReports(): void {
  reported.clear()
}

/** Tras un `fetch` que falló sin estado: ¿la API estaba alcanzable? Si sí, el
 * fallo no fue de conexión. Sin conexión no se pregunta nada: es el caso
 * normal de la captura offline, no un bloqueo. */
export async function apiReachable(apiUrl: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return false
  try {
    const res = await fetch(`${apiUrl}/health`, { cache: "no-store" })
    return res.ok
  } catch {
    return false
  }
}
