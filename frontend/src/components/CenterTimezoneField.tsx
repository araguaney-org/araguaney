"use client"

import { useEffect, useState } from "react"
import { listTimezonesAction } from "@/lib/center-actions"
import { browserTimezone, pickTimezone } from "@/lib/center-timezone"
import { useDict } from "@/context/DictionaryContext"

interface CenterTimezoneFieldProps {
  countryCode: string
  value: string
  onChange: (timezone: string) => void
}

/**
 * Zona horaria del centro, acotada por su país (Fase 27).
 *
 * El país no alcanza para deducirla (México tiene cuatro husos, Estados Unidos
 * más), así que se pregunta; el país solo achica la lista.
 */
export function CenterTimezoneField({ countryCode, value, onChange }: CenterTimezoneFieldProps) {
  const t = useDict().dashboard.centers
  const [options, setOptions] = useState<string[]>([])
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    listTimezonesAction(countryCode || undefined)
      .then((res) => {
        if (cancelled) return
        setFailed(false)
        setOptions(res.timezones)
        const next = pickTimezone(res.timezones, value, browserTimezone())
        if (next !== value) onChange(next)
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
    return () => {
      cancelled = true
    }
    // Solo al cambiar de país: `value` y `onChange` cambian en cada tecla.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countryCode])

  return (
    <div>
      <label className="text-xs text-mut">{t.field_timezone}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-cardB px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--gold)]"
      >
        <option value="">{t.select_timezone}</option>
        {options.map((zone) => (
          <option key={zone} value={zone}>
            {zone.replaceAll("_", " ")}
          </option>
        ))}
      </select>
      <p className="mt-1 text-[11px] text-fnt">
        {failed ? t.timezone_load_error : t.field_timezone_hint}
      </p>
    </div>
  )
}
