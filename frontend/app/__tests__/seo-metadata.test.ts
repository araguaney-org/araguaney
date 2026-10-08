import { describe, expect, it, vi } from "vitest"

// El sitemap pide campañas al backend; en la prueba no hay backend.
vi.mock("@/lib/api", () => ({
  apiFetch: vi.fn().mockResolvedValue([
    { slug: "campana-prueba", name: "Campaña de prueba", destination_country: null },
  ]),
}))

// i18n.ts importa "server-only" y next/headers, que no existen fuera de Next.
// La home solo necesita los diccionarios, así que se sirven los reales.
vi.mock("@/lib/i18n", () => ({
  getDictionary: async (locale: string) =>
    locale === "en"
      ? (await import("@/dictionaries/en.json")).default
      : (await import("@/dictionaries/es.json")).default,
}))
vi.mock("@/components/HomeNav", () => ({ default: () => null }))
vi.mock("@/components/HomeFooter", () => ({ default: () => null }))

import { generateMetadata as homeMetadata } from "../[lang]/page"
import sitemap from "../sitemap"
import { SITE_URL } from "@/lib/seo"

describe("home share card", () => {
  // La tarjeta de app/opengraph-image.tsx no llega al segmento [lang]: una
  // home sin imagen propia se comparte sin vista previa.
  it.each(["es", "en"] as const)("declares its own image in %s", async (lang) => {
    const meta = await homeMetadata({ params: Promise.resolve({ lang }) })
    expect(meta.openGraph?.images).toBeTruthy()
    expect(meta.twitter?.images).toBeTruthy()
  })
})

describe("sitemap", () => {
  it("lists every URL on the canonical host", async () => {
    const entries = await sitemap()
    for (const entry of entries) {
      expect(entry.url.startsWith(SITE_URL)).toBe(true)
    }
  })

  it("does not claim every page changed on every request", async () => {
    // Un lastmod que siempre es "ahora" le enseña al buscador a ignorarlo,
    // justo cuando más importa que vuelva a rastrear el dominio nuevo.
    const entries = await sitemap()
    for (const entry of entries) {
      expect(entry.lastModified).toBeUndefined()
    }
  })
})
