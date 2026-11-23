// Inicialización de Sentry en el navegador.
//
// El nombre del archivo no es decorativo: @sentry/nextjs 10 carga
// `instrumentation-client.ts` y ya no lee `sentry.client.config.ts`, que era el
// nombre de versiones anteriores. Con el nombre viejo el archivo existe, se ve
// correcto y nadie lo carga, así que ningún error del navegador llega a Sentry
// por más que el DSN esté bien puesto.
import * as Sentry from "@sentry/nextjs"

import { sentryEnvironment } from "@/lib/sentry-environment"
import {
  SENTRY_PRIVACY_OPTIONS,
  hasCredentialInUrl,
  redactRecordingEvent,
  redactReplayEvent,
} from "@/lib/sentry-privacy"
import { SENTRY_TUNNEL_PATH } from "@/lib/sentry-tunnel"

// Session Replay no graba páginas cuya dirección lleva una credencial (ver
// `hasCredentialInUrl`): ni si la página se abre así, ni si se llega a ella
// navegando dentro de la aplicación (ver `onRouterTransitionStart`).
const replayAllowed = typeof window === "undefined" || !hasCredentialInUrl(window.location.href)

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: sentryEnvironment(),
  // Qué datos salen y cuáles nunca (ver src/lib/sentry-privacy.ts).
  ...SENTRY_PRIVACY_OPTIONS,
  // Envía por el túnel del mismo dominio para esquivar los bloqueadores de
  // anuncios (ver src/lib/sentry-tunnel.ts).
  tunnel: { path: SENTRY_TUNNEL_PATH },
  tracesSampleRate: 0.2,
  // Solo se graba la sesión cuando hubo error. Grabar de continuo consumiría la
  // cuota gratuita en días y casi todo lo grabado sería tráfico sano.
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.05,
  integrations: replayAllowed
    ? [
        Sentry.replayIntegration({
          // Ya son los valores por defecto; se fijan para que un cambio de
          // versión no los mueva sin que nadie lo note. El formulario de /donar
          // lleva nombre, correo y teléfono.
          maskAllText: true,
          maskAllInputs: true,
          blockAllMedia: true,
          // Las URL de los spans de rendimiento que guarda la grabación.
          beforeAddRecordingEvent: (event) =>
            redactRecordingEvent(event as Parameters<typeof redactRecordingEvent>[0]) as typeof event,
        }),
      ]
    : [],
})

// `beforeSend` no recibe los `replay_event`: la lista de páginas visitadas se
// limpia aquí.
Sentry.addEventProcessor((event) => redactReplayEvent(event))

// Instrumenta las navegaciones del App Router. Sin esto, una transición de ruta
// no abre traza y el error aparece huérfano de la navegación que lo provocó.
// Antes de entrar a una página con credencial en la dirección, detiene el replay.
export function onRouterTransitionStart(...args: Parameters<typeof Sentry.captureRouterTransitionStart>) {
  const [href] = args
  if (hasCredentialInUrl(href)) {
    void Sentry.getReplay()?.stop()
  }
  return Sentry.captureRouterTransitionStart(...args)
}
