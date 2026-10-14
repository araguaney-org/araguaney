"use server"

import { auth } from "@/auth"
import { apiFetch } from "@/lib/api"
import { revalidateTag } from "next/cache"
import type { Center } from "@/types"

export interface CenterFormData {
  name: string
  address?: string
  contact_name?: string
  contact_email?: string
  contact_phone?: string
  country_code?: string
  state_name?: string
  // Identidad del centro como emisor de documentos de transporte (Fase 21).
  legal_name?: string
  tax_id?: string
  // Zona IANA donde se corta el día del centro (Fase 27).
  timezone?: string
}

export interface TimezoneOptions {
  country_code: string | null
  timezones: string[]
}

export async function createCenterAction(data: CenterFormData): Promise<Center> {
  const session = await auth()
  const center = await apiFetch<Center>("/v1/centers", {
    method: "POST",
    token: session?.accessToken,
    body: JSON.stringify(data),
  })
  revalidateTag("centers", "max")
  return center
}

export async function updateCenterAction(
  id: string,
  data: Partial<CenterFormData> & { is_active?: boolean }
): Promise<Center> {
  const session = await auth()
  const center = await apiFetch<Center>(`/v1/centers/${id}`, {
    method: "PATCH",
    token: session?.accessToken,
    body: JSON.stringify(data),
  })
  revalidateTag("centers", "max")
  return center
}

/** Zonas IANA de un país (todas, sin país) para el formulario del centro. */
export async function listTimezonesAction(countryCode?: string): Promise<TimezoneOptions> {
  const session = await auth()
  const qs = countryCode ? `?country_code=${encodeURIComponent(countryCode)}` : ""
  return apiFetch<TimezoneOptions>(`/v1/centers/timezones${qs}`, {
    token: session?.accessToken,
  })
}
