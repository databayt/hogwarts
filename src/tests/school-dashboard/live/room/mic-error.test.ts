// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { describe, expect, it } from "vitest"

import {
  micErrorMessage,
  micFailureKind,
} from "@/components/school-dashboard/live/room/control-bar"
import { DEFAULT_ROOM_LABELS } from "@/components/school-dashboard/live/room/labels"
import type { RoomLabels } from "@/components/school-dashboard/live/room/labels"

const labels = DEFAULT_ROOM_LABELS as unknown as RoomLabels
const err = (name: string) => Object.assign(new Error(name), { name })
const CHROME = "Mozilla/5.0 (Linux; Android 14) Chrome/131.0 Mobile Safari/537.36"
const WHATSAPP = "Mozilla/5.0 (Linux; Android 14; wv) Chrome/131.0 Mobile Safari/537.36 WhatsApp/2.24"

describe("a microphone that will not start says why (Al-Ibda 11-25)", () => {
  it("names the failure from the browser's error", () => {
    expect(micFailureKind(err("NotAllowedError"))).toBe("denied")
    expect(micFailureKind(err("NotFoundError"))).toBe("missing")
    expect(micFailureKind(err("NotReadableError"))).toBe("in-use")
    expect(micFailureKind(err("TypeError"))).toBe("failed")
  })

  it("a blocked microphone tells the student to allow it", () => {
    const text = micErrorMessage("denied", labels, CHROME)
    expect(text).toContain("microphone")
    expect(text).not.toContain("{device}")
  })

  it("inside WhatsApp's browser it says where to open the class instead", () => {
    expect(micErrorMessage("denied", labels, WHATSAPP)).toBe(labels.micInAppBrowser)
  })
})
