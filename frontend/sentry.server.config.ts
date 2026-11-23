import * as Sentry from "@sentry/nextjs"

import { sentryEnvironment } from "@/lib/sentry-environment"
import { SENTRY_PRIVACY_OPTIONS } from "@/lib/sentry-privacy"
import { SENTRY_TUNNEL_PATH, tunnelAllowedDsns } from "@/lib/sentry-tunnel"

Sentry.init({
  // El del servidor puede ser distinto al del navegador; si no se define,
  // se usa el público, que es el caso normal de un solo proyecto en Sentry.
  dsn: process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: sentryEnvironment(),
  tracesSampleRate: 0.2,
  // Qué datos salen y cuáles nunca (ver src/lib/sentry-privacy.ts).
  ...SENTRY_PRIVACY_OPTIONS,
  // Atiende el túnel por el que el navegador manda sus eventos (ver
  // src/lib/sentry-tunnel.ts). Solo en Node: el SDK de edge no lo trae, y las
  // peticiones a la ruta del túnel no pasan por el middleware.
  integrations: [
    Sentry.serveTunnelIntegration({
      path: SENTRY_TUNNEL_PATH,
      allowedDsns: tunnelAllowedDsns(),
    }),
  ],
})
