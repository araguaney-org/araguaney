// Canonical host is www: production 308-redirects the apex to www, and the
// Google Search Console property is verified on www. Keep this in sync with
// NEXT_PUBLIC_SITE_URL in Vercel and the redirect at the edge — every
// canonical/sitemap/robots URL derives from here.
//
// Vive en un módulo sin imports para que next.config.ts lo pueda usar sin
// resolver alias (`@/…`): la redirección del dominio viejo apunta aquí.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.araguaney.org"
).replace(/\/$/, "")
