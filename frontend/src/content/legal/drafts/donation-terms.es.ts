import type { LegalDoc } from "../types"

// BORRADOR. No se enlaza ni se publica hasta que lo revise un abogado
// (Fase 20, task 7). Ninguna ruta debe importarlo: lo vigila
// src/lib/__tests__/legal-drafts.test.ts.
//
// Términos de Donación en Especie (Fase 20, task 1). Desarrolla el control que
// quien dona ya acepta en la etiqueta de /donar y en ventanilla (versión 1.0):
// donación irrevocable, sin contraprestación y sin derecho a designar quién
// recibe en destino. Las notas para quien revise viven en
// docs/legal/phase-20-review-notes.md.

export const donationTermsEs: LegalDoc = {
  title: "Términos de Donación en Especie",
  version: "1.1",
  updatedISO: "2026-11-28",
  updatedLabel: "Borrador del 28 de noviembre de 2026, pendiente de revisión legal",
  versionLabel: "Versión",
  updatedPrefix: "Estado:",
  intro:
    "Estos términos aplican a toda donación en especie que se registra en Araguaney, ya sea que la persona donante la registre en línea o que un centro de acopio la capture al recibirla. Quien dona los acepta al registrar su donación. La donación se hace al centro de acopio que la recibe; Araguaney es la herramienta de software que el centro usa para registrarla y no es parte de la donación.",
  sections: [
    {
      heading: "1. Transferencia pura e irrevocable",
      blocks: [
        "La donación transfiere la propiedad de los bienes al centro de acopio que los recibe, de forma pura, simple, incondicional e irrevocable, en los términos que la ley aplicable reconoce a la donación pura.",
        "Una vez recibidos los bienes, la persona donante no conserva derecho a pedir su devolución, a cambiar su destino ni a condicionar su uso.",
      ],
    },
    {
      heading: "2. Sin contraprestación ni beneficio",
      blocks: [
        "La persona donante declara que no recibe ni espera, a cambio de la donación, pago, contraprestación, beneficio comercial ni ventaja de ningún tipo, ni para sí ni para terceros.",
      ],
    },
    {
      heading: "3. Sin designación de destino",
      blocks: [
        "La persona donante no adquiere derecho a designar destinatario, consignatario ni beneficiario de los bienes, ni a que se mantengan agrupados, separados o identificables durante el transporte o en el destino.",
        "Elegir un centro o una campaña al registrar la donación expresa una intención y ayuda a la coordinación, pero no obliga al centro a un destino determinado. El centro consolida las donaciones con otras y decide su envío según las necesidades que atiende.",
        {
          emphasis:
            "Por esta razón el centro no informa a quien dona quién recibe los bienes en destino ni ofrece rastrearlos hasta su entrega final.",
        },
      ],
    },
    {
      heading: "4. Procedencia lícita",
      blocks: [
        "La persona donante declara que los bienes son de su legítima propiedad, que tiene derecho a donarlos y que su procedencia es lícita.",
      ],
    },
    {
      heading: "5. Sin vínculo con quien recibe en destino",
      blocks: [
        "La persona donante declara que no tiene vínculo de propiedad, control ni interés económico con las personas u organizaciones que reciban los bienes en destino, y que no pretende obtener, por medio de la donación, que los bienes lleguen a una de ellas en particular.",
      ],
    },
    {
      heading: "6. Derecho de rechazo del centro",
      blocks: [
        "El centro de acopio puede rechazar cualquier donación, total o parcialmente, sin necesidad de expresar la causa.",
        "Además, la plataforma rechaza de forma automática lo que no cumple las reglas de donación publicadas en los Términos y Condiciones, como medicamentos con vida útil insuficiente o sustancias controladas.",
      ],
    },
    {
      heading: "7. Efectos fiscales",
      blocks: [
        "Araguaney no emite recibos, comprobantes ni constancias con efectos fiscales, y registrar una donación en la plataforma no genera por sí mismo derecho fiscal alguno.",
        "Si el centro que recibe la donación puede emitir un comprobante, depende de su propio régimen, y se trata directamente con ese centro.",
      ],
    },
    {
      heading: "8. Datos de la persona donante",
      blocks: [
        "Donar de forma anónima es posible. Cuando la persona donante se identifica, sus datos se tratan conforme al Aviso de Privacidad, nunca aparecen en una página pública y, si el registro en línea no se confirma, se eliminan en el plazo que ese aviso declara.",
        "Para ciertas donaciones el centro puede pedir que la persona donante se identifique antes de recibirlas. La Política de Aceptación de Donaciones explica en qué casos.",
      ],
    },
    {
      heading: "9. Versión y cambios",
      blocks: [
        "Cada aceptación queda registrada con la versión de estos términos que la persona donante aceptó y la fecha. Un cambio posterior no modifica las donaciones ya hechas, que se rigen por la versión aceptada al hacerlas.",
      ],
    },
  ],
}
