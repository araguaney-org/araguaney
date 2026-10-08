import { describe, expect, it } from "vitest"
import { countryName, eventSeo } from "@/lib/event-seo"

// La gente no busca el nombre interno de una campaña: busca "qué donar a
// Venezuela" o "centros de acopio para Venezuela". El país destino es lo que
// conecta la ficha del evento con esas búsquedas.

describe("countryName", () => {
  it("turns an ISO code into the Spanish country name", () => {
    expect(countryName("VE")).toBe("Venezuela")
    expect(countryName("co")).toBe("Colombia")
  })

  it("works for any country, not only Latin America", () => {
    // La aplicación es global: una campaña puede ir a cualquier país.
    expect(countryName("TR")).toBe("Turquía")
    expect(countryName("PH")).toBe("Filipinas")
    expect(countryName("UA")).toBe("Ucrania")
  })

  it("returns null for a missing or malformed code", () => {
    expect(countryName(null)).toBeNull()
    expect(countryName("")).toBeNull()
    expect(countryName("VEN")).toBeNull()
  })
})

describe("eventSeo", () => {
  it("names the destination country in title and description", () => {
    const seo = eventSeo({ name: "Sismo 2026", description: null, destination_country: "VE" })
    expect(seo.title).toBe("Sismo 2026: qué donar a Venezuela")
    expect(seo.description).toContain("Qué donar a Venezuela")
    expect(seo.country).toBe("Venezuela")
  })

  it("does not repeat the country when the name already has it", () => {
    const seo = eventSeo({ name: "Ayuda a Venezuela", description: null, destination_country: "VE" })
    expect(seo.title).toBe("Ayuda a Venezuela: qué donar y qué falta")
  })

  it("keeps the description the coordination wrote", () => {
    const seo = eventSeo({ name: "Sismo", description: "Texto propio.", destination_country: "VE" })
    expect(seo.description).toBe("Texto propio.")
  })

  it("falls back to the inventory wording without a country", () => {
    const seo = eventSeo({ name: "Campaña", description: null, destination_country: null })
    expect(seo.title).toBe("Qué falta: Campaña")
    expect(seo.country).toBeNull()
  })
})
