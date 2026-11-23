import { describe, expect, it } from "vitest"

import {
  SENTRY_DATA_COLLECTION,
  hasCredentialInUrl,
  redactBreadcrumb,
  redactEvent,
  redactRecordingEvent,
  redactReplayEvent,
  redactSpan,
  redactUrl,
} from "../sentry-privacy"

const TOKEN = "TESTTOKEN123SECRETO"

describe("redactUrl", () => {
  it("hides the management token in a donation link", () => {
    expect(redactUrl(`https://www.araguaney.org/donacion/${TOKEN}`)).toBe(
      "https://www.araguaney.org/donacion/[token]",
    )
    expect(redactUrl(`/donacion/${TOKEN}/editar`)).toBe("/donacion/[token]/editar")
  })

  it("drops the query string and fragment, where reset and confirmation tokens travel", () => {
    expect(redactUrl("https://www.araguaney.org/reset-password?token=RESET#x")).toBe(
      "https://www.araguaney.org/reset-password",
    )
    expect(redactUrl("/donar/confirmar?token=CONFIRM")).toBe("/donar/confirmar")
  })

  it("leaves ordinary URLs alone", () => {
    expect(redactUrl("https://www.araguaney.org/guias")).toBe("https://www.araguaney.org/guias")
    expect(redactUrl("/qr/BX-0001")).toBe("/qr/BX-0001")
  })
})

describe("redactSpan", () => {
  it("cleans every attribute and the name that may carry a URL", () => {
    const span = redactSpan({
      name: `GET /donacion/${TOKEN}`,
      attributes: {
        "url.full": `https://www.araguaney.org/donacion/${TOKEN}?a=1`,
        "http.request.header.referer": [`https://www.araguaney.org/donacion/${TOKEN}`],
        "url.query": "token=RESET",
        "http.request.method": "GET",
      },
    } as never)

    expect(JSON.stringify(span)).not.toContain(TOKEN)
    expect(JSON.stringify(span)).not.toContain("RESET")
    expect((span as { attributes: Record<string, unknown> }).attributes["http.request.method"]).toBe("GET")
  })
})

describe("redactEvent", () => {
  it("cleans the request URL, its headers and the breadcrumbs", () => {
    const event = redactEvent({
      request: { url: `https://www.araguaney.org/donacion/${TOKEN}`, headers: { Referer: `/donacion/${TOKEN}` } },
      breadcrumbs: [{ category: "navigation", data: { from: `/donacion/${TOKEN}`, to: "/reset-password?token=RESET" } }],
    } as never)

    expect(JSON.stringify(event)).not.toContain(TOKEN)
    expect(JSON.stringify(event)).not.toContain("RESET")
  })
})

describe("redactBreadcrumb", () => {
  it("cleans fetch and navigation URLs", () => {
    const crumb = redactBreadcrumb({
      category: "fetch",
      data: { url: `/donacion/${TOKEN}?x=1`, method: "GET" },
    })
    expect(crumb?.data?.url).toBe("/donacion/[token]")
  })
})

describe("redactRecordingEvent", () => {
  it("cleans the page address that Session Replay records", () => {
    const meta = redactRecordingEvent({ type: 4, data: { href: `https://www.araguaney.org/donacion/${TOKEN}` } } as never)
    expect(JSON.stringify(meta)).not.toContain(TOKEN)
  })

  it("cleans URLs inside recorded performance spans", () => {
    const perf = redactRecordingEvent({
      type: 5,
      data: { tag: "performanceSpan", payload: { description: "/reset-password?token=RESET", data: {} } },
    } as never)
    expect(JSON.stringify(perf)).not.toContain("RESET")
  })
})

describe("hasCredentialInUrl", () => {
  it("spots pages whose address carries a credential", () => {
    expect(hasCredentialInUrl(`https://www.araguaney.org/donacion/${TOKEN}`)).toBe(true)
    expect(hasCredentialInUrl("/reset-password?token=RESET")).toBe(true)
    expect(hasCredentialInUrl("http://localhost:3920/donar/confirmar?token=C")).toBe(true)
  })

  it("lets every other page be recorded", () => {
    expect(hasCredentialInUrl("https://www.araguaney.org/donar")).toBe(false)
    expect(hasCredentialInUrl("/donacion")).toBe(false)
    expect(hasCredentialInUrl("/guias?page=2")).toBe(false)
  })
})

describe("redactReplayEvent", () => {
  it("cleans the list of pages a replay visited", () => {
    const event = redactReplayEvent({
      type: "replay_event",
      urls: [`https://www.araguaney.org/donacion/${TOKEN}`, "/reset-password?token=RESET"],
    } as never)
    expect(JSON.stringify(event)).not.toContain(TOKEN)
    expect(JSON.stringify(event)).not.toContain("RESET")
  })

  it("leaves other events alone", () => {
    const event = { type: undefined, message: "x" }
    expect(redactReplayEvent(event as never)).toBe(event)
  })
})

describe("SENTRY_DATA_COLLECTION", () => {
  it("turns off every category that can carry personal data", () => {
    expect(SENTRY_DATA_COLLECTION.userInfo).toBe(false)
    expect(SENTRY_DATA_COLLECTION.cookies).toBe(false)
    expect(SENTRY_DATA_COLLECTION.httpBodies).toEqual([])
    expect(SENTRY_DATA_COLLECTION.urlQueryParams).toBe(false)
    expect(SENTRY_DATA_COLLECTION.genAI).toEqual({ inputs: false, outputs: false })
    expect(SENTRY_DATA_COLLECTION.databaseQueryData).toBe(false)
    expect(SENTRY_DATA_COLLECTION.stackFrameVariables).toBe(false)
  })

  it("keeps only request headers that describe the request, never the referer", () => {
    const headers = SENTRY_DATA_COLLECTION.httpHeaders as { request: { allow: string[] }; response: boolean }
    expect(headers.request.allow).toContain("user-agent")
    expect(headers.request.allow).not.toContain("referer")
    expect(headers.response).toBe(false)
  })
})
