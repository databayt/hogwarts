// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * "Turn on class alerts" — the push switch, offered where people join.
 *
 * It existed only as a card in notification preferences, and a school went
 * online with nobody subscribed. What matters here: it offers the switch only
 * to someone it can help, it says why when it cannot (an iPhone outside the
 * installed app, a blocked permission), and "Later" stays later.
 */
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { resolveClassAlertsLabels } from "@/components/school-dashboard/notifications/class-alerts-labels"
import { ClassAlertsPrompt } from "@/components/school-dashboard/notifications/class-alerts-prompt"
import {
  isWebPushSubscribed,
  subscribeWebPush,
} from "@/components/school-dashboard/notifications/push-actions"

vi.mock("@/components/school-dashboard/notifications/push-actions", () => ({
  isWebPushSubscribed: vi.fn(async () => false),
  subscribeWebPush: vi.fn(async () => ({ success: true })),
  unsubscribeWebPush: vi.fn(async () => ({ success: true })),
}))

const labels = resolveClassAlertsLabels()

type Sub = { endpoint: string; toJSON: () => unknown; unsubscribe: () => void }
const subscription: Sub = {
  endpoint: "https://push.example/abc",
  toJSON: () => ({ keys: { p256dh: "p", auth: "a" } }),
  unsubscribe: vi.fn(),
}

/** A browser that has Push, with `existing` already subscribed or not. */
function supportPush({
  permission = "default",
  grant = "granted",
  existing = null as Sub | null,
}: {
  permission?: NotificationPermission
  grant?: NotificationPermission
  existing?: Sub | null
} = {}) {
  const pushManager = {
    getSubscription: vi.fn(async () => existing),
    subscribe: vi.fn(async () => subscription),
  }
  const registration = { pushManager }
  Object.defineProperty(navigator, "serviceWorker", {
    configurable: true,
    value: {
      getRegistration: vi.fn(async () => registration),
      register: vi.fn(async () => registration),
      ready: Promise.resolve(registration),
    },
  })
  ;(window as unknown as { PushManager: unknown }).PushManager = function () {}
  ;(window as unknown as { Notification: unknown }).Notification = {
    permission,
    requestPermission: vi.fn(async () => grant),
  }
  return pushManager
}

function removePush() {
  delete (navigator as unknown as { serviceWorker?: unknown }).serviceWorker
  delete (window as unknown as { PushManager?: unknown }).PushManager
  delete (window as unknown as { Notification?: unknown }).Notification
}

// The runner's own `localStorage` is not a usable Storage; give the prompt a
// real one to keep "Later" in.
const stored = new Map<string, string>()
vi.stubGlobal("localStorage", {
  getItem: (k: string) => stored.get(k) ?? null,
  setItem: (k: string, v: string) => void stored.set(k, String(v)),
  removeItem: (k: string) => void stored.delete(k),
  clear: () => stored.clear(),
})

beforeEach(() => {
  vi.clearAllMocks()
  stored.clear()
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = "BEl62iUYgUivxIkv69yViEuiBIa"
  window.matchMedia =
    window.matchMedia ??
    ((q: string) => ({ matches: false, media: q }) as unknown as MediaQueryList)
})

afterEach(() => {
  removePush()
})

describe("ClassAlertsPrompt", () => {
  it("renders nothing on a browser with no Push at all", async () => {
    removePush()
    const { container } = render(<ClassAlertsPrompt labels={labels} />)
    await act(async () => {})
    expect(container).toBeEmptyDOMElement()
  })

  it("offers the switch to someone not subscribed, and confirms once it is on", async () => {
    const pushManager = supportPush()
    render(<ClassAlertsPrompt labels={labels} />)

    const enable = await screen.findByRole("button", { name: labels.enable })
    expect(screen.getByText(labels.title)).toBeInTheDocument()

    fireEvent.click(enable)

    await screen.findByText(labels.done)
    expect(pushManager.subscribe).toHaveBeenCalledWith(
      expect.objectContaining({ userVisibleOnly: true })
    )
    expect(subscribeWebPush).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: subscription.endpoint,
        keys: { p256dh: "p", auth: "a" },
      })
    )
    expect(
      screen.queryByRole("button", { name: labels.enable })
    ).not.toBeInTheDocument()
  })

  it("renders nothing when this device already receives alerts", async () => {
    supportPush({ existing: subscription })
    vi.mocked(isWebPushSubscribed).mockResolvedValueOnce(true)
    const { container } = render(<ClassAlertsPrompt labels={labels} />)
    await waitFor(() => expect(isWebPushSubscribed).toHaveBeenCalled())
    await act(async () => {})
    expect(container).toBeEmptyDOMElement()
  })

  it("says the permission is blocked instead of offering a button that cannot work", async () => {
    supportPush({ permission: "denied" })
    render(<ClassAlertsPrompt labels={labels} />)
    await screen.findByText(labels.denied)
    expect(
      screen.queryByRole("button", { name: labels.enable })
    ).not.toBeInTheDocument()
  })

  it("moves to the blocked sentence when the person says no at the browser's prompt", async () => {
    supportPush({ grant: "denied" })
    render(<ClassAlertsPrompt labels={labels} />)
    fireEvent.click(await screen.findByRole("button", { name: labels.enable }))
    await screen.findByText(labels.denied)
    expect(subscribeWebPush).not.toHaveBeenCalled()
  })

  it("keeps the button and says so when subscribing fails", async () => {
    supportPush()
    vi.mocked(subscribeWebPush).mockResolvedValueOnce({
      success: false,
      error: "nope",
    })
    const quiet = vi.spyOn(console, "error").mockImplementation(() => {})
    render(<ClassAlertsPrompt labels={labels} />)
    fireEvent.click(await screen.findByRole("button", { name: labels.enable }))
    await screen.findByText(labels.failed)
    expect(
      screen.getByRole("button", { name: labels.enable })
    ).toBeInTheDocument()
    quiet.mockRestore()
  })

  it("tells an iPhone outside the installed app to add it to the Home Screen first", async () => {
    removePush()
    const ua = vi
      .spyOn(navigator, "userAgent", "get")
      .mockReturnValue(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15"
      )
    render(<ClassAlertsPrompt labels={labels} />)
    await screen.findByText(labels.iosInstallFirst)
    expect(
      screen.queryByRole("button", { name: labels.enable })
    ).not.toBeInTheDocument()
    ua.mockRestore()
  })

  it("Later hides it, and it stays hidden for the next render", async () => {
    supportPush()
    const first = render(<ClassAlertsPrompt labels={labels} />)
    fireEvent.click(await screen.findByRole("button", { name: labels.later }))
    await waitFor(() => expect(first.container).toBeEmptyDOMElement())
    expect(Number(stored.get("class-alerts-dismissed-at"))).toBeGreaterThan(0)
    first.unmount()

    const second = render(<ClassAlertsPrompt labels={labels} />)
    await act(async () => {})
    expect(second.container).toBeEmptyDOMElement()
  })
})
