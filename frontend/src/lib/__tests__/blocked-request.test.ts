import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const captureMessage = vi.fn()
vi.mock("@sentry/nextjs", () => ({ captureMessage: (...args: unknown[]) => captureMessage(...args) }))

import {
  apiReachable,
  classifyResponse,
  pathTemplate,
  reportBlockedRequest,
  resetBlockedReports,
} from "@/lib/blocked-request"

function response(status: number, contentType: string): Pick<Response, "status" | "headers"> {
  return { status, headers: new Headers({ "content-type": contentType }) }
}

describe("classifyResponse", () => {
  it("treats an HTML 403 as Cloudflare answering instead of the API", () => {
    expect(classifyResponse(response(403, "text/html; charset=UTF-8"))).toBe("edge")
  })

  it("does not report a JSON 403: that is the API denying permissions", () => {
    expect(classifyResponse(response(403, "application/json"))).toBeNull()
  })

  it("reports the API's own rate limit", () => {
    expect(classifyResponse(response(429, "application/json"))).toBe("api")
  })

  it("treats an HTML 429 as an edge rate-limit rule", () => {
    expect(classifyResponse(response(429, "text/html"))).toBe("edge")
  })

  it("ignores everything else", () => {
    expect(classifyResponse(response(422, "application/json"))).toBeNull()
    expect(classifyResponse(response(500, "text/html"))).toBeNull()
  })
})

describe("pathTemplate", () => {
  it("drops ids, entity codes, tokens and the query", () => {
    expect(pathTemplate("/v1/shipments/2d38cea1-5028-42cb-a34d-a34df0c55cc8/incidents?x=1")).toBe(
      "/v1/shipments/:id/incidents",
    )
    expect(pathTemplate("/v1/public/boxes/BX-AB12CD")).toBe("/v1/public/boxes/:code")
    expect(pathTemplate("/v1/public/donations/manage/abcdefghijklmnopqrstuvwxyz012345/cancel")).toBe(
      "/v1/public/donations/manage/:token/cancel",
    )
  })
})

describe("reportBlockedRequest", () => {
  beforeEach(() => {
    captureMessage.mockClear()
    resetBlockedReports()
  })

  it("sends one grouped warning per operation, not one per retry", () => {
    const block = { layer: "edge" as const, status: 403, method: "POST", path: "/v1/intakes" }
    reportBlockedRequest(block)
    reportBlockedRequest(block)
    expect(captureMessage).toHaveBeenCalledTimes(1)
    const [, options] = captureMessage.mock.calls[0]
    expect(options.level).toBe("warning")
    expect(options.tags).toEqual({ blocked_request: "edge", blocked_status: "403" })
    expect(options.fingerprint).toEqual(["blocked-request", "edge", "403", "POST", "/v1/intakes"])
  })

  it("never sends the raw id to Sentry", () => {
    reportBlockedRequest({
      layer: "api",
      status: 429,
      method: "GET",
      path: "/v1/requests/2d38cea1-5028-42cb-a34d-a34df0c55cc8",
    })
    expect(JSON.stringify(captureMessage.mock.calls[0])).not.toContain("2d38cea1")
  })
})

describe("apiReachable", () => {
  const originalFetch = globalThis.fetch
  afterEach(() => {
    globalThis.fetch = originalFetch
    vi.unstubAllGlobals()
  })

  it("asks nothing while the device is offline: that is the normal offline case", async () => {
    vi.stubGlobal("navigator", { onLine: false })
    const fetchSpy = vi.fn()
    globalThis.fetch = fetchSpy
    expect(await apiReachable("https://api.example")).toBe(false)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it("is true when /health answers", async () => {
    vi.stubGlobal("navigator", { onLine: true })
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true })
    expect(await apiReachable("https://api.example")).toBe(true)
  })

  it("is false when /health also fails", async () => {
    vi.stubGlobal("navigator", { onLine: true })
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"))
    expect(await apiReachable("https://api.example")).toBe(false)
  })
})
