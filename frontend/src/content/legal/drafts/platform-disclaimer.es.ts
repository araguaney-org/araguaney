import type { LegalSection } from "../types"

// BORRADOR. No se publica hasta que lo revise un abogado (Fase 20, task 7).
//
// Exención de responsabilidad de la plataforma (Fase 20, task 2). No es un
// documento propio: son secciones que, una vez aprobadas, se insertan en los
// Términos y Condiciones vigentes (src/content/legal/terms.es.ts) justo después
// de "Qué es Araguaney". Insertarlas es un cambio sustancial: sube la versión
// de los términos y vuelve a pedir la aceptación a quien tiene cuenta (ver
// backend/app/legal.py).

export const platformDisclaimerEs: LegalSection[] = [
  {
    heading: "Araguaney no es parte de las donaciones",
    blocks: [
      "Araguaney es un proveedor de software. No es parte de ninguna donación registrada en la plataforma y no es propietario, depositario, transportista, consignatario ni intermediario de los bienes donados.",
      "Las donaciones se hacen a los centros de acopio. La relación con la persona donante, la custodia de los bienes y su despacho corresponden al centro que los recibe.",
    ],
  },
  {
    heading: "Los centros de acopio operan de forma independiente",
    blocks: [
      "Cada centro de acopio que usa la plataforma es un operador independiente. Decide qué donaciones acepta o rechaza, las custodia, las empaca y las despacha, y responde de hacerlo conforme a la ley que le resulta aplicable, incluida la aduanera y la fiscal.",
      "Los datos de identificación del centro que aparecen en manifiestos y declaraciones los captura la administración de la plataforma tal como el centro los entrega. Araguaney los imprime sin validarlos y no asesora sobre el régimen fiscal ni aduanero de ningún país.",
    ],
  },
  {
    heading: "La trazabilidad no es un aval",
    blocks: [
      {
        emphasis:
          "Araguaney no garantiza la licitud, la calidad ni el origen de los bienes que terceros registran. La trazabilidad, las validaciones automáticas y la auditoría que ofrece la plataforma son herramientas para los centros, no una certificación de lo que contiene una caja, una tarima o un envío.",
      },
    ],
  },
]
