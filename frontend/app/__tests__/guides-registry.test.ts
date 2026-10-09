import { describe, expect, it, vi } from "vitest"

// El sitemap pide campañas al backend; en la prueba no hay backend.
vi.mock("@/lib/api", () => ({ apiFetch: vi.fn().mockResolvedValue([]) }))

import sitemap from "../sitemap"
import { ROUTE_KEYS, localizedPath } from "@/lib/routes"
import { CONTENT_DATES } from "@/lib/content-dates"
import { absoluteUrl } from "@/lib/seo"
import { llmsTxt } from "@/content/llms"

// Cada guía vive en cinco sitios que hay que mantener a mano: la ruta, la fecha
// de frescura, el sitemap, el índice de guías y llms.txt. Olvidar uno deja una
// página publicada pero invisible o sin fecha. Esta prueba lo vigila a partir
// de las rutas, sin listar las guías una por una.

const GUIDE_KEYS = ROUTE_KEYS.filter((key) => key.startsWith("guias/"))

describe("guides registry", () => {
  it("finds the guides from the route table", () => {
    expect(GUIDE_KEYS.length).toBeGreaterThanOrEqual(7)
    expect(GUIDE_KEYS).toContain("guias/inventario-de-donaciones-con-codigo-qr")
  })

  it.each(GUIDE_KEYS)("%s has a freshness date", (key) => {
    expect(CONTENT_DATES[key]).toBeDefined()
  })

  it.each(GUIDE_KEYS)("%s is in the sitemap with its English alternate", async (key) => {
    const entries = await sitemap()
    const entry = entries.find((e) => e.url === absoluteUrl(localizedPath(key, "es")))
    expect(entry).toBeDefined()
    expect(entry?.alternates?.languages?.en).toBe(absoluteUrl(localizedPath(key, "en")))
  })

  it.each(GUIDE_KEYS)("%s is listed in llms.txt", (key) => {
    expect(llmsTxt()).toContain(absoluteUrl(localizedPath(key, "es")))
  })

  it("uses a distinct English slug for each guide", () => {
    const english = GUIDE_KEYS.map((key) => localizedPath(key, "en"))
    expect(new Set(english).size).toBe(english.length)
  })
})
