import type { LegalSection } from "../types"

// DRAFT. Not published until a lawyer reviews it (Fase 20, task 7). Sections
// to insert into terms.en.ts after "What Araguaney is" once approved; mirrors
// platform-disclaimer.es.ts.

export const platformDisclaimerEn: LegalSection[] = [
  {
    heading: "Araguaney is not a party to donations",
    blocks: [
      "Araguaney is a software provider. It is not a party to any donation recorded on the platform and is not the owner, custodian, carrier, consignee or intermediary of the donated goods.",
      "Donations are made to collection centers. The relationship with the donor, the custody of the goods and their dispatch belong to the center that receives them.",
    ],
  },
  {
    heading: "Collection centers operate independently",
    blocks: [
      "Each collection center using the platform is an independent operator. It decides which donations to accept or refuse, holds, packs and ships them, and is responsible for doing so under the law that applies to it, including customs and tax law.",
      "The center's identification details shown on manifests and declarations are entered by the platform's administration exactly as the center provides them. Araguaney prints them without validating them and gives no advice on the tax or customs regime of any country.",
    ],
  },
  {
    heading: "Traceability is not an endorsement",
    blocks: [
      {
        emphasis:
          "Araguaney does not guarantee the lawfulness, quality or origin of goods recorded by third parties. The traceability, automatic checks and audit trail the platform offers are tools for centers, not a certification of what a box, pallet or shipment contains.",
      },
    ],
  },
]
