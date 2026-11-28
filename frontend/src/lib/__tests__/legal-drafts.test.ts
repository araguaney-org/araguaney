import { readdirSync, readFileSync, statSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

import { acceptancePolicyEn } from "@/content/legal/drafts/acceptance-policy.en"
import { acceptancePolicyEs } from "@/content/legal/drafts/acceptance-policy.es"
import { donationTermsEn } from "@/content/legal/drafts/donation-terms.en"
import { donationTermsEs } from "@/content/legal/drafts/donation-terms.es"
import { platformDisclaimerEn } from "@/content/legal/drafts/platform-disclaimer.en"
import { platformDisclaimerEs } from "@/content/legal/drafts/platform-disclaimer.es"
import type { LegalBlock, LegalSection } from "@/content/legal/types"

// Fase 20, task 7: los textos legales nuevos no se publican sin revisión de un
// abogado. Mientras tanto viven en src/content/legal/drafts/ y nada que se
// sirva puede importarlos: un import accidental publicaría un borrador.

const FRONTEND = path.resolve(__dirname, "../../..")
const SCANNED = ["app", "src"].map((dir) => path.join(FRONTEND, dir))
const DRAFTS_DIR = path.join(FRONTEND, "src/content/legal/drafts")

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name)
    if (statSync(full).isDirectory()) {
      return name === "node_modules" || name === "__tests__" ? [] : sourceFiles(full)
    }
    return /\.(ts|tsx)$/.test(name) ? [full] : []
  })
}

function shape(block: LegalBlock): string {
  return typeof block === "string" ? "p" : Object.keys(block)[0]
}

function sectionShape(sections: LegalSection[]): string[][] {
  return sections.map((s) => s.blocks.map(shape))
}

describe("legal drafts", () => {
  it("are not imported by anything that gets served", () => {
    const offenders = SCANNED.flatMap(sourceFiles)
      .filter((file) => !file.startsWith(DRAFTS_DIR))
      .filter((file) => /legal\/drafts/.test(readFileSync(file, "utf8")))
    expect(offenders.map((f) => path.relative(FRONTEND, f))).toEqual([])
  })

  it.each([
    ["donation terms", donationTermsEs.sections, donationTermsEn.sections],
    ["acceptance policy", acceptancePolicyEs.sections, acceptancePolicyEn.sections],
    ["platform disclaimer", platformDisclaimerEs, platformDisclaimerEn],
  ])("%s: Spanish and English have the same structure", (_, es, en) => {
    expect(sectionShape(en)).toEqual(sectionShape(es))
  })

  it("the donation terms keep the seven clauses of the spec, in order", () => {
    const headings = donationTermsEs.sections.map((s) => s.heading)
    expect(headings.slice(0, 7)).toEqual([
      "1. Transferencia pura e irrevocable",
      "2. Sin contraprestación ni beneficio",
      "3. Sin designación de destino",
      "4. Procedencia lícita",
      "5. Sin vínculo con quien recibe en destino",
      "6. Derecho de rechazo del centro",
      "7. Efectos fiscales",
    ])
  })

  it("never publish a number next to the volume threshold", () => {
    const text = JSON.stringify([acceptancePolicyEs, acceptancePolicyEn])
    expect(text).not.toMatch(/\d+\s*(cajas|boxes|kg|kilos)/i)
  })
})
