import { localizedPath, resolveLocale, type Locale, type RouteKey } from "@/lib/routes"

/** Enlaces de contenido del pie de página.
 *
 * El pie aparece en todas las páginas públicas, así que lo que enlaza es lo
 * que un buscador encuentra desde cualquier punto del sitio. Antes solo llevaba
 * a páginas institucionales y legales, y las páginas centrales de contenido
 * quedaban a uno o dos saltos de casi todo: en Search Console aparecían como
 * "descubiertas, sin indexar", sin una sola página que las refiriera, aunque
 * estuvieran en el sitemap.
 *
 * Cada entrada es una página central que a su vez enlaza a sus hijas: las guías,
 * las necesidades por categoría y, desde ayuda humanitaria, los escenarios. No
 * hace falta enlazar cada hija desde aquí; basta con que ninguna quede lejos.
 */
const RESOURCE_KEYS: readonly { key: RouteKey; label: Record<Locale, string> }[] = [
  { key: "guias", label: { es: "Guías", en: "Guides" } },
  { key: "necesidades", label: { es: "Necesidades", en: "Needs" } },
  { key: "ayuda-humanitaria", label: { es: "Ayuda humanitaria", en: "Humanitarian aid" } },
  {
    key: "centro-de-acopio-mexico",
    label: { es: "Centros de acopio en México", en: "Collection centers in Mexico" },
  },
  { key: "glosario", label: { es: "Glosario", en: "Glossary" } },
]

export interface FooterLink {
  href: string
  label: string
}

export function footerResourceLinks(locale: string): FooterLink[] {
  const safe = resolveLocale(locale)
  return RESOURCE_KEYS.map(({ key, label }) => ({
    href: localizedPath(key, safe),
    label: label[safe],
  }))
}
