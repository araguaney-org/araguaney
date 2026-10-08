// Redirección del dominio anterior (Fase 29) hecha por la propia aplicación.
//
// Vercel ya redirige araguaney.lat y www.araguaney.lat con 301, pero esa
// redirección no le llega a todas las peticiones: la prueba en vivo de Search
// Console recibió 200 con el sitio completo en www.araguaney.lat, servido por
// la aplicación. Con eso Google seguía viendo .lat como un sitio vivo, el aviso
// de cambio de dirección fallaba y el mismo contenido existía en dos dominios.
// Repetirla aquí hace que ninguna petición al dominio viejo reciba contenido,
// pase por donde pase.
//
// 301 y no 308 (el permanente de Next): el validador del cambio de dirección
// de Search Console no aceptó el 308 (ver Fase 29, tarea 10).
//
// Sin imports a propósito: lo carga next.config.ts.

import { SITE_URL } from "./site-url"

// Expresión del valor `host` de `has`; Next la ancla completa al comparar.
export const LEGACY_HOST_PATTERN = "(www\\.)?araguaney\\.lat"

interface HostRedirect {
  source: string
  has: { type: "host"; value: string }[]
  destination: string
  statusCode: 301
}

export function legacyDomainRedirects(target: string = SITE_URL): HostRedirect[] {
  const targetHost = new URL(target).hostname
  // Si el destino fuera un dominio viejo, la regla se redirigiría a sí misma.
  if (new RegExp(`^${LEGACY_HOST_PATTERN}$`).test(targetHost)) return []

  return [
    {
      source: "/:path*",
      has: [{ type: "host", value: LEGACY_HOST_PATTERN }],
      destination: `${target.replace(/\/$/, "")}/:path*`,
      statusCode: 301,
    },
  ]
}
