import { afterEach, describe, expect, it, vi } from "vitest"

import { SENTRY_TUNNEL_PATH, tunnelAllowedDsns } from "../sentry-tunnel"

const BROWSER_DSN = "https://public@o1.ingest.sentry.io/1"
const SERVER_DSN = "https://server@o1.ingest.sentry.io/2"

afterEach(() => {
  vi.unstubAllEnvs()
})

describe("SENTRY_TUNNEL_PATH", () => {
  it("keeps the path that ad blockers already let through", () => {
    expect(SENTRY_TUNNEL_PATH).toBe("/monitoring")
  })
})

describe("tunnelAllowedDsns", () => {
  it("allows the browser DSN when the server reports to a different one", () => {
    vi.stubEnv("NEXT_PUBLIC_SENTRY_DSN", BROWSER_DSN)
    vi.stubEnv("SENTRY_DSN", SERVER_DSN)

    expect(tunnelAllowedDsns()).toEqual([BROWSER_DSN])
  })

  it("adds nothing when both sides share one DSN", () => {
    vi.stubEnv("NEXT_PUBLIC_SENTRY_DSN", BROWSER_DSN)
    vi.stubEnv("SENTRY_DSN", BROWSER_DSN)

    expect(tunnelAllowedDsns()).toEqual([])
  })

  it("adds nothing when the server falls back to the browser DSN", () => {
    vi.stubEnv("NEXT_PUBLIC_SENTRY_DSN", BROWSER_DSN)
    vi.stubEnv("SENTRY_DSN", "")

    expect(tunnelAllowedDsns()).toEqual([])
  })

  it("adds nothing without a browser DSN", () => {
    vi.stubEnv("NEXT_PUBLIC_SENTRY_DSN", "")
    vi.stubEnv("SENTRY_DSN", SERVER_DSN)

    expect(tunnelAllowedDsns()).toEqual([])
  })
})
