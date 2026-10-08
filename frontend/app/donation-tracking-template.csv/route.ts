import { donationTemplateCsv, TEMPLATE_FILENAME } from "@/lib/donation-template"

// Plantilla gratuita para Excel (ver src/lib/donation-template.ts). Estática:
// no depende de datos ni de sesión.
export const dynamic = "force-static"

export function GET(): Response {
  return new Response(donationTemplateCsv("en"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${TEMPLATE_FILENAME.en}"`,
      "Cache-Control": "public, max-age=86400",
    },
  })
}
