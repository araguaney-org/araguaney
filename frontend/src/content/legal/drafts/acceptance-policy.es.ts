import type { LegalDoc } from "../types"

// BORRADOR. No se enlaza ni se publica hasta que lo revise un abogado
// (Fase 20, task 7).
//
// Política de Aceptación de Donaciones (Fase 20, task 6). Documento público y
// corto: dice a quien dona qué se le pide y por qué, con controles
// proporcionales al riesgo (FATF R.8). Describe el mecanismo del umbral de
// volumen, nunca su valor: el valor vive en el entorno y publicarlo sería
// publicar cómo rodearlo.

export const acceptancePolicyEs: LegalDoc = {
  title: "Política de Aceptación de Donaciones",
  version: "1.0",
  updatedISO: "2026-11-28",
  updatedLabel: "Borrador del 28 de noviembre de 2026, pendiente de revisión legal",
  versionLabel: "Versión",
  updatedPrefix: "Estado:",
  intro:
    "Los centros de acopio que usan Araguaney reciben donaciones en especie de personas y de empresas. Esta política explica qué se pide a quien dona en cada caso. La regla general es que donar no cueste trabajo: los requisitos crecen solo donde crece el riesgo.",
  sections: [
    {
      heading: "Donaciones de personas, en volumen doméstico",
      blocks: [
        "Una persona que dona lo que cabe en un hogar no tiene que identificarse ni llenar nada más. La donación puede ser anónima y se registra al recibirla.",
      ],
    },
    {
      heading: "Donaciones de empresas u organizaciones",
      blocks: [
        "Cuando quien dona es una empresa u organización, el centro registra quién es y la donación se acepta bajo los Términos de Donación en Especie, cuya aceptación queda registrada con su versión y fecha.",
      ],
    },
    {
      heading: "Donaciones de volumen atípico",
      blocks: [
        "A partir de cierto volumen, una donación no puede quedar anónima, sin importar quién la haga: el centro pide identificar a la persona o empresa donante antes de recibirla.",
        "No es un límite a lo que se puede donar. Una donación grande se recibe igual; lo único que cambia es que deja de ser anónima. Si quien dona prefiere no identificarse, la coordinación del centro decide si la acepta.",
      ],
    },
    {
      heading: "Lo que ninguna donación incluye",
      blocks: [
        "Al donar, nadie adquiere el derecho de elegir quién recibe los bienes en destino, de pedir que viajen juntos o de rastrearlos hasta la entrega final. Los centros consolidan las donaciones y deciden los envíos según las necesidades que atienden. Esta regla protege a la ayuda humanitaria de ser usada para mover mercancía con otros fines.",
      ],
    },
    {
      heading: "Derecho de rechazo",
      blocks: [
        "Cualquier centro puede rechazar una donación, total o parcialmente, sin expresar la causa. La plataforma, además, rechaza de forma automática lo que no cumple las reglas de donación publicadas, como medicamentos próximos a caducar o sustancias controladas.",
      ],
    },
    {
      heading: "Lo que esta política no hace",
      blocks: [
        "Los centros no investigan a quien dona ni verifican documentos de identidad, y la plataforma no consulta listas de sanciones. Araguaney no maneja dinero, y los controles se mantienen proporcionales a ese riesgo: identificar cuando hace falta, escalar cuando algo no cuadra y rechazar cuando corresponde.",
      ],
    },
  ],
}
