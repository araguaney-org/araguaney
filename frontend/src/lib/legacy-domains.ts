// Redirección del dominio anterior (Fase 29) hecha por la propia aplicación.
//
// Es una segunda capa. La primera es la redirección de dominio de Vercel
// (araguaney.lat y www.araguaney.lat → www.araguaney.org con 301), que
// funciona y es la que responde hoy. Esta solo actúa si una petición con host
// del dominio viejo llega a la aplicación, por ejemplo si alguien quita la
// redirección en Vercel y deja el dominio apuntando al proyecto: sin ella, el
// sitio se serviría completo en los dos dominios sin que nada lo avise.
//
// No es la causa de que el aviso de cambio de dirección de Search Console
// fallara. Se creyó que sí porque la prueba en vivo de URL Inspection mostraba
// 200 en www.araguaney.lat, pero esa prueba sigue las redirecciones y enseña la
// página final, no el salto: el 200 era el de www.araguaney.org.
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
