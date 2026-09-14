// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { act, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import {
  maskEmail,
  VideoWatermark,
  watermarkCode,
} from "@/components/lumos/shared/video-player/video-watermark"

const USER = "cmtp5d31g042f8osfuasp2ul7"

function visible(container: HTMLElement) {
  return container.querySelector("[data-watermark-visible]")
}

afterEach(() => {
  vi.useRealTimers()
})

describe("watermark identity", () => {
  it("codes the viewer by the tail of the user id", () => {
    expect(watermarkCode(USER)).toBe("osfuasp2ul7".slice(-8))
  })

  it("masks an email and refuses to print a display name as one", () => {
    expect(maskEmail("student@balqalam.com")).toBe("stu***@balqalam.com")
    // The live room used to pass the participant's display NAME here, which
    // masked to "Ahm***d" and identified nobody.
    expect(maskEmail("Ahmed Ali")).toBeNull()
    expect(maskEmail(undefined)).toBeNull()
  })
})

describe("VideoWatermark", () => {
  it("renders nothing without a viewer id", () => {
    const { container } = render(<VideoWatermark userEmail="a@b.co" />)
    expect(container.firstChild).toBeNull()
  })

  it("always carries the forensic code, and hides the visible mark at rest", () => {
    const { container } = render(
      <VideoWatermark userId={USER} userEmail="student@balqalam.com" />
    )
    const forensic = container.querySelector("[data-watermark-forensic]")
    expect(forensic?.textContent).toContain(USER.slice(-8))
    expect(visible(container)?.getAttribute("data-watermark-visible")).toBe("off")
  })

  it("shows the visible mark on the capture chord's modifiers, then lets it go", () => {
    vi.useFakeTimers()
    const { container } = render(
      <VideoWatermark userId={USER} userEmail="student@balqalam.com" />
    )

    act(() => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Shift", metaKey: true, shiftKey: true })
      )
    })
    expect(visible(container)?.getAttribute("data-watermark-visible")).toBe("on")
    expect(screen.getAllByText(/stu\*\*\*@balqalam\.com/).length).toBeGreaterThan(0)

    act(() => {
      vi.advanceTimersByTime(9000)
    })
    expect(visible(container)?.getAttribute("data-watermark-visible")).toBe("off")
  })

  it("shows the visible mark after PrintScreen", () => {
    const { container } = render(<VideoWatermark userId={USER} />)
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keyup", { key: "PrintScreen" }))
    })
    expect(visible(container)?.getAttribute("data-watermark-visible")).toBe("on")
  })

  it("does not treat an ordinary shortcut as a capture", () => {
    const { container } = render(<VideoWatermark userId={USER} />)
    act(() => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "I", ctrlKey: true, shiftKey: true })
      )
    })
    expect(visible(container)?.getAttribute("data-watermark-visible")).toBe("off")
  })
})
