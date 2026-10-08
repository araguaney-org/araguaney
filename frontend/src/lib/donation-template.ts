import type { Locale } from "@/lib/routes"

// Plantilla gratuita para controlar donaciones en Excel o Google Sheets.
//
// Existe para quien todavía no puede usar un sistema: es la búsqueda
// "control de donaciones en excel" / "donation tracking spreadsheet template".
// Las columnas siguen el estándar de Araguaney (una fila por caja homogénea:
// un producto, un lote, una caducidad), así que quien empieza con la hoja ya
// registra lo que después exige el manifiesto.
//
// CSV y no .xlsx: abre igual en Excel, Google Sheets y LibreOffice, y no suma
// una dependencia. El BOM hace que Excel lo lea como UTF-8 y respete acentos.

interface Column {
  es: string
  en: string
  exampleEs: string
  exampleEn: string
}

export const TEMPLATE_COLUMNS: readonly Column[] = [
  { es: "Caja", en: "Box", exampleEs: "1", exampleEn: "1" },
  { es: "Categoría", en: "Category", exampleEs: "Medicamentos", exampleEn: "Medicine" },
  { es: "Producto", en: "Product", exampleEs: "Paracetamol tabletas", exampleEn: "Paracetamol tablets" },
  { es: "Nombre genérico (INN)", en: "Generic name (INN)", exampleEs: "Paracetamol", exampleEn: "Paracetamol" },
  { es: "Concentración", en: "Strength", exampleEs: "500 mg", exampleEn: "500 mg" },
  { es: "Forma", en: "Form", exampleEs: "Tableta", exampleEn: "Tablet" },
  { es: "Lote", en: "Batch", exampleEs: "L2407A", exampleEn: "L2407A" },
  { es: "Caducidad (AAAA-MM-DD)", en: "Expiry (YYYY-MM-DD)", exampleEs: "2028-06-30", exampleEn: "2028-06-30" },
  { es: "Cantidad", en: "Quantity", exampleEs: "200", exampleEn: "200" },
  { es: "Unidad", en: "Unit", exampleEs: "caja de 20", exampleEn: "box of 20" },
  { es: "Peso de la caja (kg)", en: "Box weight (kg)", exampleEs: "4.2", exampleEn: "4.2" },
  { es: "Notas", en: "Notes", exampleEs: "", exampleEn: "" },
]

export const TEMPLATE_FILENAME: Record<Locale, string> = {
  es: "plantilla-control-de-donaciones.csv",
  en: "donation-tracking-template.csv",
}

const BOM = "﻿"

export function donationTemplateCsv(locale: Locale): string {
  const header = TEMPLATE_COLUMNS.map((c) => c[locale])
  const example = TEMPLATE_COLUMNS.map((c) => (locale === "es" ? c.exampleEs : c.exampleEn))
  return `${BOM}${header.join(",")}\r\n${example.join(",")}\r\n`
}
