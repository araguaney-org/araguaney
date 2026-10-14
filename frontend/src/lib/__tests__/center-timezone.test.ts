import { describe, expect, it } from "vitest"
import { pickTimezone } from "@/lib/center-timezone"

const US = ["America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles"]

describe("pickTimezone", () => {
  it("keeps the zone already chosen when it belongs to the country", () => {
    expect(pickTimezone(US, "America/Chicago", "America/New_York")).toBe("America/Chicago")
  })

  it("suggests the browser zone when it belongs to the country", () => {
    expect(pickTimezone(US, "", "America/New_York")).toBe("America/New_York")
  })

  it("does not carry the admin's own zone into another country", () => {
    // An admin in Monterrey registering a center in Tampa.
    expect(pickTimezone(US, "", "America/Monterrey")).toBe("")
  })

  it("drops a zone that no longer matches the chosen country", () => {
    expect(pickTimezone(US, "America/Caracas", null)).toBe("")
  })

  it("picks the only zone of a single-zone country", () => {
    expect(pickTimezone(["America/Caracas"], "", "America/Monterrey")).toBe("America/Caracas")
  })
})
