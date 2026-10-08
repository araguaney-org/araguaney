import { describe, expect, it } from "vitest"
import { donationTemplateCsv, TEMPLATE_COLUMNS } from "@/lib/donation-template"

// La plantilla gratuita capta a quien hoy controla donaciones en Excel. Tiene
// que abrirse bien en Excel (acentos incluidos) y reflejar el estándar: una
// fila por caja homogénea, con lote y caducidad.

describe("donationTemplateCsv", () => {
  it.each(["es", "en"] as const)("starts with a UTF-8 BOM so Excel keeps accents (%s)", (lang) => {
    expect(donationTemplateCsv(lang).charCodeAt(0)).toBe(0xfeff)
  })

  it("has a header and an example row with the same number of columns", () => {
    const lines = donationTemplateCsv("es").slice(1).trim().split("\r\n")
    expect(lines).toHaveLength(2)
    for (const line of lines) {
      expect(line.split(",")).toHaveLength(TEMPLATE_COLUMNS.length)
    }
  })

  it("records batch and expiry per box, the homogeneous-box rule", () => {
    expect(donationTemplateCsv("es")).toContain("Lote")
    expect(donationTemplateCsv("es")).toContain("Caducidad (AAAA-MM-DD)")
    expect(donationTemplateCsv("en")).toContain("Expiry (YYYY-MM-DD)")
  })
})
