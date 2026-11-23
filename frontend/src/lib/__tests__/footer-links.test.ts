import { describe, expect, it } from "vitest"

import { footerResourceLinks } from "../footer-links"

describe("footerResourceLinks", () => {
  it("links every hub page that crawlers could not reach from the footer", () => {
    const hrefs = footerResourceLinks("es").map((link) => link.href)

    expect(hrefs).toEqual([
      "/guias",
      "/necesidades",
      "/ayuda-humanitaria",
      "/centro-de-acopio-mexico",
      "/glosario",
    ])
  })

  it("uses the localized slugs for English", () => {
    const hrefs = footerResourceLinks("en").map((link) => link.href)

    expect(hrefs).toEqual([
      "/en/guides",
      "/en/needs",
      "/en/humanitarian-aid",
      "/en/collection-center-mexico",
      "/en/glossary",
    ])
  })

  it("labels each link in the page language", () => {
    expect(footerResourceLinks("es").map((link) => link.label)).toContain("Guías")
    expect(footerResourceLinks("en").map((link) => link.label)).toContain("Guides")
  })

  it("falls back to Spanish for a segment that is not a language", () => {
    expect(footerResourceLinks("favicon.svg")).toEqual(footerResourceLinks("es"))
  })
})
