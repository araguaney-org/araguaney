import type { LegalDoc } from "../types"

// DRAFT. Not linked or published until a lawyer reviews it (Fase 20, task 7).
// Mirrors acceptance-policy.es.ts. Describes the volume threshold mechanism,
// never its value.

export const acceptancePolicyEn: LegalDoc = {
  title: "Donation Acceptance Policy",
  version: "1.0",
  updatedISO: "2026-11-28",
  updatedLabel: "Draft of November 28, 2026, pending legal review",
  versionLabel: "Version",
  updatedPrefix: "Status:",
  intro:
    "Collection centers using Araguaney receive in-kind donations from individuals and from companies. This policy explains what is asked of donors in each case. The general rule is that donating should take no effort: requirements grow only where risk grows.",
  sections: [
    {
      heading: "Donations from individuals, at household volume",
      blocks: [
        "An individual donating what fits in a household does not have to identify themselves or fill in anything else. The donation can be anonymous and is recorded on receipt.",
      ],
    },
    {
      heading: "Donations from companies or organizations",
      blocks: [
        "When the donor is a company or organization, the center records who it is and the donation is accepted under the In-Kind Donation Terms, whose acceptance is recorded with its version and date.",
      ],
    },
    {
      heading: "Donations of unusual volume",
      blocks: [
        "Above a certain volume a donation cannot stay anonymous, whoever makes it: the center asks to identify the donating person or company before receiving it.",
        "This is not a cap on what can be donated. A large donation is received just the same; the only change is that it stops being anonymous. If the donor prefers not to identify themselves, the center's coordination decides whether to accept it.",
      ],
    },
    {
      heading: "What no donation includes",
      blocks: [
        "Donating gives no one the right to choose who receives the goods at destination, to ask that they travel together or to track them to final delivery. Centers consolidate donations and decide shipments according to the needs they serve. This rule keeps humanitarian aid from being used to move goods for other purposes.",
      ],
    },
    {
      heading: "Right to refuse",
      blocks: [
        "Any center may refuse a donation, in whole or in part, without stating a reason. The platform also automatically rejects anything that does not meet the published donation rules, such as medicines close to expiry or controlled substances.",
      ],
    },
    {
      heading: "What this policy does not do",
      blocks: [
        "Centers do not investigate donors or check identity documents, and the platform does not screen against sanctions lists. Araguaney does not handle money, and its controls stay proportionate to that risk: identify when needed, escalate when something does not add up and refuse when appropriate.",
      ],
    },
  ],
}
