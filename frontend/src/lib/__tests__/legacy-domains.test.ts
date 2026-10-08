import { describe, expect, it } from "vitest"
import { LEGACY_HOST_PATTERN, legacyDomainRedirects } from "@/lib/legacy-domains"

// Segunda capa detrás de la redirección de dominio de Vercel: si una petición
// con host del dominio viejo llega a la aplicación, recibe un 301 y nunca
// contenido. Ver el porqué en src/lib/legacy-domains.ts.

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
