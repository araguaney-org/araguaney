import type { LegalDoc } from "../types"

// DRAFT. Not linked or published until a lawyer reviews it (Fase 20, task 7).
// No route may import it: src/lib/__tests__/legal-drafts.test.ts enforces
// that. Structure mirrors donation-terms.es.ts section by section.

export const donationTermsEn: LegalDoc = {
  title: "In-Kind Donation Terms",
  version: "1.1",
  updatedISO: "2026-11-28",
  updatedLabel: "Draft of November 28, 2026, pending legal review",
  versionLabel: "Version",
  updatedPrefix: "Status:",
  intro:
    "These terms apply to every in-kind donation recorded in Araguaney, whether the donor registers it online or a collection center records it on receipt. The donor accepts them when recording the donation. The donation is made to the collection center that receives it; Araguaney is the software the center uses to record it and is not a party to the donation.",
  sections: [
    {
      heading: "1. Unconditional and irrevocable transfer",
      blocks: [
        "The donation transfers ownership of the goods to the receiving collection center, purely, simply, unconditionally and irrevocably, as the applicable law provides for an unconditional gift.",
        "Once the goods are received, the donor keeps no right to ask for their return, to change their destination or to place conditions on their use.",
      ],
    },
    {
      heading: "2. No consideration or benefit",
      blocks: [
        "The donor declares that they neither receive nor expect, in exchange for the donation, any payment, consideration, commercial benefit or advantage of any kind, for themselves or for third parties.",
      ],
    },
    {
      heading: "3. No designation of destination",
      blocks: [
        "The donor acquires no right to designate a recipient, consignee or beneficiary of the goods, nor to have them kept together, separate or identifiable during transport or at destination.",
        "Choosing a center or a campaign when recording the donation expresses an intention and helps coordination, but does not bind the center to any particular destination. The center consolidates donations with others and decides how to ship them according to the needs it serves.",
        {
          emphasis:
            "For this reason the center does not tell the donor who receives the goods at destination and does not offer to track them to final delivery.",
        },
      ],
    },
    {
      heading: "4. Lawful origin",
      blocks: [
        "The donor declares that the goods are their lawful property, that they are entitled to donate them and that their origin is lawful.",
      ],
    },
    {
      heading: "5. No connection with the recipient at destination",
      blocks: [
        "The donor declares that they have no ownership, control or economic interest in the people or organizations that receive the goods at destination, and that they do not intend, through the donation, to have the goods reach any one of them in particular.",
      ],
    },
    {
      heading: "6. The center's right to refuse",
      blocks: [
        "The collection center may refuse any donation, in whole or in part, without having to state a reason.",
        "In addition, the platform automatically rejects anything that does not meet the donation rules published in the Terms and Conditions, such as medicines with insufficient shelf life or controlled substances.",
      ],
    },
    {
      heading: "7. Tax effects",
      blocks: [
        "Araguaney does not issue receipts, vouchers or certificates with tax effects, and recording a donation on the platform does not by itself create any tax entitlement.",
        "Whether the receiving center can issue a receipt depends on its own tax status, and is handled directly with that center.",
      ],
    },
    {
      heading: "8. Donor data",
      blocks: [
        "Donating anonymously is possible. When the donor identifies themselves, their data is processed under the Privacy Notice, never appears on a public page and, if an online registration is not confirmed, is deleted within the period that notice states.",
        "For certain donations the center may ask the donor to identify themselves before accepting them. The Donation Acceptance Policy explains when.",
      ],
    },
    {
      heading: "9. Version and changes",
      blocks: [
        "Each acceptance is recorded with the version of these terms the donor accepted and the date. A later change does not alter donations already made, which remain governed by the version accepted when they were made.",
      ],
    },
  ],
}
