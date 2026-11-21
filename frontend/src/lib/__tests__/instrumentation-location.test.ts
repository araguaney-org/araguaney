import { existsSync } from "node:fs"
import { resolve } from "node:path"

import { describe, expect, it } from "vitest"

const frontendRoot = resolve(__dirname, "../../..")

/** Next busca `instrumentation.ts` en la raíz del proyecto y, si no lo
 * encuentra, en `src/`. Una copia en `src/` no rompe nada mientras exista la de
 * la raíz, y por eso nadie la nota: queda escrita, se ve correcta y no corre.
 *
 * El día que alguien mueve o borra la de la raíz, Next carga la otra sin avisar
 * y el build sigue en verde. Esa copia ya pasó por aquí, sin `X-Origin-Auth` ni
 * `onRequestError`: con ella, las llamadas del servidor al backend rebotarían en
 * `CLOUDFLARE_ONLY` y los errores de render dejarían de llegar a Sentry.
 */
describe("instrumentation file location", () => {
  it("lives at the project root", () => {
    expect(existsSync(resolve(frontendRoot, "instrumentation.ts"))).toBe(true)
  })

  it("has no shadow copy in src/ for Next to fall back to", () => {
    expect(existsSync(resolve(frontendRoot, "src/instrumentation.ts"))).toBe(false)
  })
})
