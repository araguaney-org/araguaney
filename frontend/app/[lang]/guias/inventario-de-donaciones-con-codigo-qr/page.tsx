import Link from "next/link"
import type { Metadata } from "next"
import HomeNav from "@/components/HomeNav"
import HomeFooter from "@/components/HomeFooter"
import { CtaLink } from "@/components/CtaLink"
import { Breadcrumbs } from "@/components/Breadcrumbs"
import { FaqSection } from "@/components/FaqSection"
import { getDictionary } from "@/lib/i18n"
import { ogImageUrl, alternates } from "@/lib/seo"
import { CONTENT_DATES, formatContentDate, updatedLabel, authorByline } from "@/lib/content-dates"
import { type Locale, localizedPath } from "@/lib/routes"
import { TEMPLATE_FILENAME } from "@/lib/donation-template"
import { JsonLd } from "@/components/JsonLd"
import {
  articleSchema,
  howToSchema,
  breadcrumbSchema,
  faqSchema,
  type Faq,
} from "@/lib/structured-data"

const KEY = "guias/inventario-de-donaciones-con-codigo-qr"

// Qué hace el producto con el QR, verificado contra el código antes de escribir:
// el QR de una caja apunta a su ficha pública (/b/{code}), la etiqueta se genera
// al sellar (PDF carta, 10 por hoja, con QR, código escrito, producto, cantidad,
// lote y caducidad), y leer la ficha necesita conexión. Si algo de esto cambia,
// esta página tiene que cambiar con ello.

interface HowToStep {
  name: string
  text: string
}
interface Content {
  metaTitle: string
  description: string
  ogEyebrow: string
  eyebrow: string
  h1: string
  heroP: string
  whatH2: string
  whatP: string
  whatP2: string
  stepsH2: string
  steps: HowToStep[]
  sheetH2: string
  sheetP: string
  sheetLink: string
  limitsH2: string
  limitsP: string
  faqTitle: string
  faq: Faq[]
  ctaBoxTitle: string
  ctaStart: string
  ctaGuide: string
  crumbHome: string
  crumbGuides: string
}

const CONTENT: Record<Locale, Content> = {
  es: {
    metaTitle: "Inventario de donaciones con código QR",
    description:
      "Cómo llevar un inventario de donaciones con código QR: un código único por caja, la etiqueta que debe llevar y cómo escanearla para ver lote y caducidad. Con una opción gratuita.",
    ogEyebrow: "Guía",
    eyebrow: "Guía",
    h1: "Inventario de donaciones con código QR",
    heroP:
      "Un código QR en cada caja convierte un montón de bultos en un inventario que se consulta con el teléfono: qué es, qué contiene y en qué estado está. Esta guía explica cómo funciona, qué debe llevar la etiqueta y cuándo alcanza con una hoja de cálculo y un generador de QR.",
    whatH2: "Qué guarda realmente un código QR",
    whatP:
      "Casi nunca guarda el inventario: guarda un enlace con un código único. Al escanearlo, el teléfono abre el registro de esa caja y ahí está el detalle. Por eso el QR no se desactualiza cuando cambia el estado de la caja, y por eso lo importante no es el QR sino que el código sea único y que exista un registro detrás.",
    whatP2:
      "En Araguaney el QR de cada caja apunta a su ficha, y los códigos no se pueden enumerar: nadie puede recorrer el inventario probando números.",
    stepsH2: "Cómo montar un inventario con QR",
    steps: [
      { name: "Asigna un código único a cada caja", text: "Una caja, un código. Repetir un código en dos cajas es peor que no tener etiqueta, porque el registro dirá que son el mismo bulto." },
      { name: "Una caja, un producto, un lote, una caducidad", text: "El QR solo sirve si la caja es homogénea: si mezcla productos, la ficha no puede describirla. Divide la donación por producto, lote y caducidad antes de etiquetar." },
      { name: "Genera el QR y la etiqueta", text: "La etiqueta lleva el QR, el código escrito (por si el QR se daña), el producto, la cantidad, el lote y la caducidad. Araguaney la genera al sellar la caja, en un PDF tamaño carta con 10 etiquetas por hoja." },
      { name: "Pega la etiqueta al sellar, no después", text: "En un centro con prisa nadie vuelve a abrir una caja cerrada para etiquetarla: sale con su etiqueta o sale sin ella. Imprime y pega en el momento de sellar." },
      { name: "Etiqueta también la tarima", text: "La tarima lleva su propio QR, visible y plano: si queda arrugado bajo el emplaye o mirando a la pared, alguien tendrá que desarmar para leerlo. La etiqueta de tarima incluye la leyenda de donación humanitaria sin valor comercial." },
      { name: "Escanea para consultar, no para teclear", text: "Cada escaneo abre la ficha de la caja o la tarima: producto, cantidad, lote, caducidad, estado e historial. Cuando el envío se recibe en destino, la ficha pública pasa a decir que fue entregada." },
    ],
    sheetH2: "Cuándo alcanza una hoja de cálculo con QR",
    sheetP:
      "Si son pocas cajas y una sola persona captura, una hoja con una columna de código y un generador de QR funciona. Se queda corta cuando varias personas capturan a la vez, cuando hay caducidades que vigilar o cuando necesitas un packing list para aduana: ahí el registro y las etiquetas tienen que salir del mismo lugar. Si vas a empezar con la hoja, esta plantilla ya sigue el estándar de una fila por caja.",
    sheetLink: "Descargar la plantilla gratis (CSV para Excel)",
    limitsH2: "Lo que el QR no resuelve",
    limitsP:
      "Leer la ficha necesita conexión, porque el detalle vive en el servidor. Lo que sí se puede capturar sin señal es la recepción de donaciones. Y un QR no corrige un registro mal hecho: si el lote o la caducidad se capturaron mal, la etiqueta los repetirá con toda confianza.",
    faqTitle: "Preguntas frecuentes",
    faq: [
      { q: "¿Qué información debe llevar la etiqueta de una caja de donación?", a: "El QR, el código escrito para identificarla aunque el QR se dañe, el producto, la cantidad con su unidad, el lote y la fecha de caducidad. Nada más: el resto del detalle vive en la ficha a la que apunta el QR." },
      { q: "¿Puedo llevar un inventario con QR en Excel o Google Sheets?", a: "Sí, mientras cada caja tenga un código único y la hoja sea la única fuente de verdad. Se complica cuando capturan varias personas a la vez o cuando hay que vigilar caducidades y preparar un manifiesto." },
      { q: "¿Qué app sirve para escanear códigos QR de inventario?", a: "La cámara de cualquier teléfono lee un QR. Lo que importa es lo que abre: en Araguaney se escanea desde el panel y el código lleva a la ficha de la caja o de la tarima." },
      { q: "¿Cuánto cuesta un inventario de donaciones con QR en Araguaney?", a: "Es gratuito para centros de acopio y coordinaciones humanitarias, sin límite de cajas ni costo de licencia." },
    ],
    ctaBoxTitle: "Etiqueta tus cajas con QR desde la primera donación",
    ctaStart: "Empezar gratis",
    ctaGuide: "Cómo organizar un centro de acopio",
    crumbHome: "Inicio",
    crumbGuides: "Guías",
  },
  en: {
    metaTitle: "QR code inventory for donations",
    description:
      "How to run a QR code inventory for donations: a unique code per box, what the label must carry and how to scan it to see batch and expiry. With a free option.",
    ogEyebrow: "Guide",
    eyebrow: "Guide",
    h1: "QR code inventory for donations",
    heroP:
      "A QR code on every box turns a pile of packages into an inventory you can check with a phone: what it is, what it contains and what state it is in. This guide explains how it works, what the label must carry, and when a spreadsheet and a QR generator are enough.",
    whatH2: "What a QR code actually stores",
    whatP:
      "It almost never stores the inventory: it stores a link with a unique code. Scanning it opens that box's record on the phone, and the detail lives there. That is why the QR does not go stale when the box changes state, and why what matters is not the QR but that the code is unique and that a record sits behind it.",
    whatP2:
      "In Araguaney each box's QR points to its record, and the codes cannot be enumerated: nobody can walk through the inventory by trying numbers.",
    stepsH2: "How to set up a QR code inventory",
    steps: [
      { name: "Give every box a unique code", text: "One box, one code. Reusing a code on two boxes is worse than having no label, because the record will say they are the same package." },
      { name: "One box, one product, one batch, one expiry", text: "A QR only helps if the box is homogeneous: if it mixes products, the record cannot describe it. Split the donation by product, batch and expiry before labeling." },
      { name: "Generate the QR and the label", text: "The label carries the QR, the written code (in case the QR gets damaged), the product, the quantity, the batch and the expiry. Araguaney generates it when the box is sealed, as a letter-size PDF with 10 labels per sheet." },
      { name: "Stick the label on at sealing, not later", text: "In a rushed center nobody reopens a closed box to label it: it leaves with its label or without it. Print and stick it at the moment of sealing." },
      { name: "Label the pallet too", text: "The pallet carries its own QR, visible and flat: if it ends up wrinkled under the wrap or facing the wall, someone will have to take the load apart to read it. The pallet label includes the humanitarian-donation, no-commercial-value legend." },
      { name: "Scan to look up, not to type", text: "Each scan opens the box or pallet record: product, quantity, batch, expiry, state and history. Once the shipment is received at destination, the public record shows it as delivered." },
    ],
    sheetH2: "When a spreadsheet with QR codes is enough",
    sheetP:
      "If there are only a few boxes and one person does the entry, a sheet with a code column and a QR generator works. It falls short when several people enter data at once, when expiry dates need watching, or when you need a packing list for customs: there, the record and the labels have to come from the same place. If you are starting with the sheet, this template already follows the one-row-per-box standard.",
    sheetLink: "Download the free template (CSV for Excel)",
    limitsH2: "What the QR does not solve",
    limitsP:
      "Reading the record needs a connection, because the detail lives on the server. What can be captured without a signal is the receipt of donations. And a QR does not fix a bad entry: if the batch or expiry was captured wrong, the label will repeat it with full confidence.",
    faqTitle: "Frequently asked questions",
    faq: [
      { q: "What information should a donation box label carry?", a: "The QR, the written code so the box can be identified even if the QR is damaged, the product, the quantity with its unit, the batch and the expiry date. Nothing more: the rest of the detail lives in the record the QR points to." },
      { q: "Can I run a QR code inventory in Excel or Google Sheets?", a: "Yes, as long as every box has a unique code and the sheet is the single source of truth. It gets complicated when several people enter data at once, or when you need to watch expiry dates and prepare a manifest." },
      { q: "Which app scans QR codes for inventory?", a: "Any phone camera reads a QR code. What matters is what it opens: in Araguaney you scan from the dashboard and the code leads to the box or pallet record." },
      { q: "How much does a QR code inventory for donations cost in Araguaney?", a: "It is free for collection centers and humanitarian coordinations, with no box limit and no license fee." },
    ],
    ctaBoxTitle: "Label your boxes with QR codes from the first donation",
    ctaStart: "Start free",
    ctaGuide: "How to organize a collection center",
    crumbHome: "Home",
    crumbGuides: "Guides",
  },
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Locale }>
}): Promise<Metadata> {
  const { lang } = await params
  const c = CONTENT[lang]
  const ogImage = ogImageUrl(c.metaTitle, c.ogEyebrow)
  return {
    title: c.metaTitle,
    description: c.description,
    alternates: alternates(KEY, lang),
    openGraph: { title: `${c.metaTitle} — Araguaney`, description: c.description, images: [ogImage] },
    twitter: { card: "summary_large_image", title: `${c.metaTitle} — Araguaney`, description: c.description, images: [ogImage] },
  }
}

export default async function QrInventoryGuidePage({
  params,
}: {
  params: Promise<{ lang: Locale }>
}) {
  const { lang: locale } = await params
  const dict = await getDictionary(locale)
  const c = CONTENT[locale]

  const crumbs = [
    { name: c.crumbHome, path: localizedPath("", locale) },
    { name: c.crumbGuides, path: localizedPath("guias", locale) },
    { name: c.metaTitle, path: localizedPath(KEY, locale) },
  ]
  const dates = CONTENT_DATES[KEY]
  const structuredData = [
    articleSchema({
      title: c.metaTitle,
      description: c.description,
      path: localizedPath(KEY, locale),
      locale,
      datePublished: dates?.published,
      dateModified: dates?.modified,
    }),
    howToSchema({
      name: c.metaTitle,
      description: c.description,
      path: localizedPath(KEY, locale),
      steps: c.steps,
      locale,
      datePublished: dates?.published,
      dateModified: dates?.modified,
    }),
    faqSchema(c.faq),
    breadcrumbSchema(crumbs),
  ]

  return (
    <>
      <JsonLd data={structuredData} />
      <div style={{ background: "#FBF7EE", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <HomeNav
          dict={dict.nav}
          locale={locale}
          localeLinks={{ es: localizedPath(KEY, "es"), en: localizedPath(KEY, "en") }}
        />
        <div className="h-[56px] md:hidden" />

        <article className="px-5 md:px-[46px] pt-[26px] md:pt-[56px] pb-16 md:pb-20">
          <div className="max-w-[680px] mx-auto">
            <div className="mb-4">
              <Breadcrumbs items={crumbs} />
            </div>

            <div
              className="text-[10.5px] md:text-[12px] mb-3"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "#946A00",
                fontWeight: 700,
              }}
            >
              <span style={{ width: 18, height: 1.5, background: "#906400", display: "inline-block" }} />
              {c.eyebrow}
            </div>

            <h1
              className="text-[28px] md:text-[38px] mb-5"
              style={{ fontFamily: "var(--font-source-serif)", fontWeight: 600, lineHeight: 1.15, margin: "0 0 20px" }}
            >
              {c.h1}
            </h1>

            {dates && (
              <p className="text-[12.5px] mb-6" style={{ color: "#8A8073" }}>
                <Link href={localizedPath("nosotros", locale)} style={{ color: "#906400", fontWeight: 600 }}>
                  {authorByline(locale)}
                </Link>
                {" · "}
                {updatedLabel(locale)} {formatContentDate(dates.modified, locale)}
              </p>
            )}

            <p className="text-[15px] md:text-[17px] mb-8" style={{ color: "#5C5347", lineHeight: 1.65 }}>
              {c.heroP}
            </p>

            <h2 style={h2Style}>{c.whatH2}</h2>
            <p style={pStyle}>{c.whatP}</p>
            <p style={{ ...pStyle, marginTop: 10 }}>{c.whatP2}</p>

            <h2 style={h2Style}>{c.stepsH2}</h2>
            <ol className="space-y-4 mb-8 mt-3" style={{ listStyle: "none", padding: 0, margin: "12px 0 32px" }}>
              {c.steps.map((step, i) => (
                <li key={step.name} className="p-4" style={{ border: "1px solid #EEE6D4", borderRadius: 12, background: "#fff" }}>
                  <p className="text-[14px] font-semibold mb-1" style={{ color: "#2B2723" }}>
                    {i + 1}. {step.name}
                  </p>
                  <p className="text-[13.5px]" style={{ margin: 0, color: "#6E6557", lineHeight: 1.55 }}>{step.text}</p>
                </li>
              ))}
            </ol>

            <h2 style={h2Style}>{c.sheetH2}</h2>
            <p style={pStyle}>{c.sheetP}</p>
            <a
              href={`/${TEMPLATE_FILENAME[locale]}`}
              download
              className="inline-flex items-center justify-center px-5 py-2.5 mt-4"
              style={{ border: "1.5px solid #E6D4A6", color: "#2B2723", fontWeight: 600, fontSize: 14, borderRadius: 99 }}
            >
              {c.sheetLink}
            </a>

            <h2 style={h2Style}>{c.limitsH2}</h2>
            <p style={pStyle}>{c.limitsP}</p>

            <div className="mt-10">
              <FaqSection items={c.faq} title={c.faqTitle} />
            </div>

            <div
              className="mt-10 p-6 md:p-8 text-center"
              style={{ border: "1px solid #EEE6D4", borderRadius: 14, background: "#fff" }}
            >
              <p className="text-[15px] mb-4" style={{ color: "#2B2723", fontWeight: 600 }}>
                {c.ctaBoxTitle}
              </p>
              <div className="flex flex-col md:flex-row gap-3 justify-center">
                <CtaLink
                  href="/login"
                  ctaLabel="guia_inventario_qr_final"
                  className="inline-flex items-center justify-center px-5 py-2.5"
                  style={{ background: "#1F5E8C", color: "#fff", fontWeight: 600, fontSize: 14, borderRadius: 99 }}
                >
                  {c.ctaStart}
                </CtaLink>
                <Link
                  href={localizedPath("guias/como-organizar-un-centro-de-acopio", locale)}
                  className="inline-flex items-center justify-center px-5 py-2.5"
                  style={{ border: "1.5px solid #E6D4A6", color: "#2B2723", fontWeight: 600, fontSize: 14, borderRadius: 99 }}
                >
                  {c.ctaGuide}
                </Link>
              </div>
            </div>
          </div>
        </article>

        <HomeFooter dict={dict.footer} locale={locale} />
      </div>
    </>
  )
}

const h2Style: React.CSSProperties = {
  fontFamily: "var(--font-source-serif)",
  fontWeight: 600,
  fontSize: 21,
  color: "#2B2723",
  margin: "32px 0 12px",
}

const pStyle: React.CSSProperties = {
  color: "#5C5347",
  lineHeight: 1.65,
  fontSize: 15,
  margin: 0,
}
