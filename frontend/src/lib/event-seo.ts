// Título y descripción de la ficha pública de una campaña (/eventos/[slug]).
//
// La gente no busca el nombre interno de una campaña: busca "qué donar a
// Turquía" o "centros de acopio para Filipinas". El país destino es lo que
// conecta la ficha con esas búsquedas, y sirve igual para cualquier país: la
// aplicación es global y no está atada al evento que le dio origen.
//
// En español a propósito: los datos de la campaña los captura la coordinación
// en español y la ficha no tiene versión en otro idioma (ver la página).

const ISO_ALPHA2 = /^[A-Za-z]{2}$/

const REGION_NAMES = new Intl.DisplayNames(["es"], { type: "region" })

export interface EventSeoInput {
  name: string
  description: string | null
  destination_country: string | null
}

export interface EventSeo {
  title: string
  description: string
  country: string | null
}

/** Nombre del país en español a partir de su código ISO 3166-1 alfa-2. */
export function countryName(code: string | null): string | null {
  if (!code || !ISO_ALPHA2.test(code)) return null
  const upper = code.toUpperCase()
  const name = REGION_NAMES.of(upper)
  // Un código válido en forma pero sin país asignado vuelve tal cual.
  return name && name !== upper ? name : null
}

export function eventSeo(campaign: EventSeoInput): EventSeo {
  const country = countryName(campaign.destination_country)

  if (!country) {
    return {
      title: `Qué falta: ${campaign.name}`,
      description:
        campaign.description ??
        `Inventario de ayuda humanitaria disponible para ${campaign.name}, actualizado en tiempo real.`,
      country: null,
    }
  }

  const nameHasCountry = campaign.name.toLowerCase().includes(country.toLowerCase())
  return {
    title: nameHasCountry
      ? `${campaign.name}: qué donar y qué falta`
      : `${campaign.name}: qué donar a ${country}`,
    description:
      campaign.description ??
      `Qué donar a ${country} y qué ya tienen los centros de acopio que preparan esta ayuda humanitaria, actualizado en tiempo real.`,
    country,
  }
}
