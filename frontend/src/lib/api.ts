import { apiReachable, classifyResponse, reportBlockedRequest } from "@/lib/blocked-request"

// Server-side fetches bypass Cloudflare and call Railway directly (avoids Bot Fight Mode blocking Vercel).
// Browser fetches go through NEXT_PUBLIC_API_URL (Cloudflare proxied).
const API_URL =
  typeof window === "undefined"
    ? (process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000")
    : (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000");

type FetchOptions = RequestInit & {
  token?: string
  next?: { revalidate?: number; tags?: string[] }
}

// Error thrown on any non-2xx response. `message` is always a human-readable
// string (backward compatible with callers that only read `.message`), while
// `code` exposes the backend's machine-readable error code (e.g.
// `ALREADY_REGISTERED`) when the response uses the `{detail:{code,message,field}}`
// envelope, so callers can branch on it.
export class ApiError extends Error {
  readonly status: number
  readonly code?: string
  readonly field?: string

  constructor(message: string, opts: { status: number; code?: string; field?: string }) {
    super(message)
    this.name = "ApiError"
    this.status = opts.status
    this.code = opts.code
    this.field = opts.field
  }
}

/** Mensaje para un 403 que respondió Cloudflare y no la API. Lo ve quien
 * captura, y en la cola offline queda como motivo en pendientes. */
const EDGE_BLOCKED_MESSAGE =
  "El firewall de la API bloqueó esta petición. Avisa a la coordinación nacional."

export async function apiFetch<T>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const { token, ...rest } = options;
  const method = (rest.method ?? "GET").toUpperCase()
  let res: Response
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...rest,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...rest.headers,
      },
    });
  } catch (err: unknown) {
    // En el navegador, un bloqueo del WAF llega sin CORS y se ve como falta de
    // conexión. Se pregunta a la API si está alcanzable solo para avisar; el
    // error sigue su camino igual, y la cola offline lo trata como siempre.
    if (typeof window !== "undefined") {
      void apiReachable(API_URL).then((reachable) => {
        if (reachable) reportBlockedRequest({ layer: "edge-suspected", status: null, method, path })
      })
    }
    throw err
  }

  if (!res.ok) {
    const layer = classifyResponse(res)
    if (layer) reportBlockedRequest({ layer, status: res.status, method, path })
    if (layer === "edge") {
      throw new ApiError(EDGE_BLOCKED_MESSAGE, { status: res.status, code: "EDGE_BLOCKED" })
    }

    const body = await res.json().catch(() => ({}));
    const detail = body.detail;
    let message = "Request failed";
    let code: string | undefined;
    let field: string | undefined;

    if (body.error?.message) {
      message = body.error.message;
      code = body.error.code;
    } else if (detail && typeof detail === "object" && !Array.isArray(detail)) {
      message = typeof detail.message === "string" ? detail.message : message;
      code = typeof detail.code === "string" ? detail.code : undefined;
      field = typeof detail.field === "string" ? detail.field : undefined;
    } else if (typeof detail === "string") {
      message = detail;
    }

    throw new ApiError(message, { status: res.status, code, field });
  }

  return res.json();
}
