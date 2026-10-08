import { describe, expect, it } from "vitest"
import { LEGACY_HOST_PATTERN, legacyDomainRedirects } from "@/lib/legacy-domains"

// La redirección de dominio de Vercel no le llega a todas las peticiones: la
// prueba en vivo de Search Console recibió 200 en www.araguaney.lat, y por eso
// el aviso de cambio de dirección fallaba. La aplicación repite la redirección
// por su cuenta, así que ninguna petición al dominio viejo recibe contenido.

const hostRegex = new RegExp(`^${LEGACY_HOST_PATTERN}$`)

describe("LEGACY_HOST_PATTERN", () => {
  it.each(["araguaney.lat", "www.araguaney.lat"])("matches %s", (host) => {
    expect(hostRegex.test(host)).toBe(true)
  })

  it.each(["www.araguaney.org", "araguaney.org", "araguaney.lat.example.com", "xaraguaney.lat"])(
    "does not match %s",
    (host) => {
      expect(hostRegex.test(host)).toBe(false)
    },
  )
})

describe("legacyDomainRedirects", () => {
  it("sends every path on the old host to the canonical site with a 301", () => {
    const [rule] = legacyDomainRedirects("https://www.araguaney.org")
    expect(rule).toEqual({
      source: "/:path*",
      has: [{ type: "host", value: LEGACY_HOST_PATTERN }],
      destination: "https://www.araguaney.org/:path*",
      statusCode: 301,
    })
  })

  it("emits nothing when the target is itself a legacy host, to avoid a loop", () => {
    expect(legacyDomainRedirects("https://www.araguaney.lat")).toEqual([])
  })
})
