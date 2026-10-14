"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { createCenterAction, updateCenterAction, type CenterFormData } from "@/lib/center-actions"
import { CenterTimezoneField } from "@/components/CenterTimezoneField"
import { COUNTRIES, countryName, flagEmoji } from "@/lib/countries"
import type { Center } from "@/types"
import { useDict } from "@/context/DictionaryContext"

import { PageAction } from "@/components/PageAction"

const EMPTY_FORM = {
  name: "",
  address: "",
  legal_name: "",
  tax_id: "",
  contact_name: "",
  contact_email: "",
  contact_phone: "",
  country_code: "",
  state_name: "",
  timezone: "",
}

type CenterForm = typeof EMPTY_FORM

function formFromCenter(c: Center): CenterForm {
  return {
    name: c.name,
    address: c.address ?? "",
    legal_name: c.legal_name ?? "",
    tax_id: c.tax_id ?? "",
    contact_name: c.contact_name ?? "",
    contact_email: c.contact_email ?? "",
    contact_phone: c.contact_phone ?? "",
    country_code: c.country_code ?? "",
    state_name: c.state_name ?? "",
    timezone: c.timezone ?? "",
  }
}

/** Vacíos fuera: el backend no acepta un país o una zona en blanco. */
function payloadFromForm(form: CenterForm): CenterFormData {
  return {
    name: form.name.trim(),
    address: form.address || undefined,
    legal_name: form.legal_name || undefined,
    tax_id: form.tax_id || undefined,
    contact_name: form.contact_name || undefined,
    contact_email: form.contact_email || undefined,
    contact_phone: form.contact_phone || undefined,
    country_code: form.country_code || undefined,
    state_name: form.state_name || undefined,
    timezone: form.timezone || undefined,
  }
}

export default function CentersPage() {
  const dict = useDict()
  const t = dict.dashboard.centers

  const { data: session, status } = useSession()
  const router = useRouter()

  const [centers, setCenters] = useState<Center[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  // Centro en edición; `null` = alta nueva. El centro de un auto-registro
  // aprobado nace sin razón social ni zona, y aquí es donde se completan.
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === "loading") return
    if (session?.centerRole !== "national_admin") router.replace("/dashboard")
  }, [session, status, router])

  useEffect(() => {
    if (status !== "authenticated") return
    fetch("/api/centers")
      .then((r) => r.json())
      .then(setCenters)
      .catch(() => setCenters([]))
      .finally(() => setLoading(false))
  }, [status])

  const field = (k: keyof typeof EMPTY_FORM) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => setForm((f) => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    setError(null)
    try {
      const payload = payloadFromForm(form)
      if (editingId) {
        const updated = await updateCenterAction(editingId, payload)
        setCenters((cs) => cs.map((c) => (c.id === updated.id ? updated : c)))
      } else {
        const created = await createCenterAction(payload)
        setCenters((cs) => [created, ...cs])
      }
      closeForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : dict.dashboard.common.error_unknown)
    } finally {
      setSaving(false)
    }
  }

  function startEdit(center: Center) {
    setForm(formFromCenter(center))
    setEditingId(center.id)
    setError(null)
    setShowForm(true)
  }

  function closeForm() {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setError(null)
    setShowForm(false)
  }

  async function toggleActive(center: Center) {
    try {
      const updated = await updateCenterAction(center.id, { is_active: !center.is_active })
      setCenters((cs) => cs.map((c) => (c.id === updated.id ? updated : c)))
    } catch {
      // silently ignore
    }
  }

  if (status === "loading" || loading) {
    return <div className="text-sm text-fnt py-8 text-center">{dict.dashboard.common.loading}</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-tx">{t.title_full}</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-mut">
            {centers.length === 1 ? t.count_one : t.count_other.replace("{count}", String(centers.length))}
          </span>
          {!showForm && (
            <PageAction onClick={() => setShowForm(true)} icon="plus" label={t.new} />
          )}
        </div>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 rounded-xl border border-cardB bg-card p-5 space-y-3"
        >
          <p className="text-sm font-medium text-mut">{editingId ? t.form_title_edit : t.form_title}</p>

          {error && (
            <p className="rounded-lg bg-dRejB border border-dRejB px-3 py-2 text-xs text-dRejT">
              {error}
            </p>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs text-mut">{t.field_name_required}</label>
              <input
                required
                value={form.name}
                onChange={field("name")}
                placeholder="Ej. Centro Norte CDMX"
                className="mt-1 w-full rounded-lg border border-cardB px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--gold)]"
              />
            </div>
            <div>
              <label className="text-xs text-mut">{t.field_legal_name}</label>
              <input
                className="w-full rounded-lg border border-inpB bg-inp px-3 py-2 text-sm text-tx"
                value={form.legal_name}
                onChange={(e) => setForm({ ...form, legal_name: e.target.value })}
                placeholder={t.field_legal_name_placeholder}
              />
              <label className="mt-3 block text-xs text-mut">{t.field_tax_id}</label>
              <input
                className="w-full rounded-lg border border-inpB bg-inp px-3 py-2 text-sm text-tx"
                value={form.tax_id}
                onChange={(e) => setForm({ ...form, tax_id: e.target.value })}
                placeholder={t.field_tax_id_placeholder}
              />
              <p className="mt-1 text-[11px] text-fnt">{t.field_tax_id_hint}</p>

              <label className="mt-3 block text-xs text-mut">{t.field_address}</label>
              <input
                value={form.address}
                onChange={field("address")}
                className="mt-1 w-full rounded-lg border border-cardB px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--gold)]"
              />
            </div>
            <div>
              <label className="text-xs text-mut">{t.field_country}</label>
              <select
                value={form.country_code}
                onChange={field("country_code")}
                className="mt-1 w-full rounded-lg border border-cardB px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--gold)]"
              >
                <option value="">{t.select_country}</option>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {flagEmoji(c.code)} {c.name}
                  </option>
                ))}
              </select>
            </div>
            <CenterTimezoneField
              countryCode={form.country_code}
              value={form.timezone}
              onChange={(timezone) => setForm((f) => ({ ...f, timezone }))}
            />
            <div>
              <label className="text-xs text-mut">{t.field_state}</label>
              <input
                value={form.state_name}
                onChange={field("state_name")}
                className="mt-1 w-full rounded-lg border border-cardB px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--gold)]"
              />
            </div>
            <div>
              <label className="text-xs text-mut">{t.field_contact_name}</label>
              <input
                value={form.contact_name}
                onChange={field("contact_name")}
                className="mt-1 w-full rounded-lg border border-cardB px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--gold)]"
              />
            </div>
            <div>
              <label className="text-xs text-mut">{t.field_contact_email}</label>
              <input
                type="email"
                value={form.contact_email}
                onChange={field("contact_email")}
                className="mt-1 w-full rounded-lg border border-cardB px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--gold)]"
              />
            </div>
            <div>
              <label className="text-xs text-mut">{t.field_contact_phone}</label>
              <input
                value={form.contact_phone}
                onChange={field("contact_phone")}
                className="mt-1 w-full rounded-lg border border-cardB px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--gold)]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={closeForm}
              disabled={saving}
              className="rounded-lg border border-cardB px-4 py-2 text-sm font-medium text-mut hover:bg-card2 disabled:opacity-50"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[var(--blue)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {saving ? t.saving : editingId ? t.save : t.create}
            </button>
          </div>
        </form>
      )}

      {centers.length === 0 ? (
        <div className="rounded-xl border border-cardB bg-card p-8 text-center text-sm text-mut">
          {t.empty}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {centers.map((c) => (
            <div key={c.id} className="rounded-xl border border-cardB bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <span className="font-medium text-tx leading-snug">{c.name}</span>
                <button
                  onClick={() => toggleActive(c)}
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium cursor-pointer ${
                    c.is_active
                      ? "bg-dSealB text-dSealT hover:bg-dSealB"
                      : "bg-chip text-mut hover:bg-chip"
                  }`}
                  title={c.is_active ? t.toggle_deactivate : t.toggle_activate}
                >
                  {c.is_active ? t.active : t.inactive}
                </button>
              </div>

              {(c.country_code || c.state_name) && (
                <p className="mt-1.5 text-xs text-mut font-medium">
                  {c.country_code && <>{flagEmoji(c.country_code)} </>}
                  {[
                    c.state_name,
                    c.country_code ? countryName(c.country_code) : null,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              )}

              {c.address && (
                <p className="mt-0.5 text-xs text-mut truncate">{c.address}</p>
              )}
              {c.contact_name && (
                <p className="mt-1 text-xs text-mut">{c.contact_name}</p>
              )}
              {c.contact_email && (
                <p className="mt-0.5 text-xs text-fnt truncate">{c.contact_email}</p>
              )}

              <div className="mt-2 flex items-center justify-between gap-2">
                {c.timezone ? (
                  <span className="text-[11px] text-fnt">{c.timezone.replaceAll("_", " ")}</span>
                ) : (
                  <span className="text-[11px] text-dRejT">{t.timezone_missing}</span>
                )}
                <button
                  onClick={() => startEdit(c)}
                  className="shrink-0 text-xs font-medium text-[var(--blue)] hover:underline"
                >
                  {t.edit}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
