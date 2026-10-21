// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest"
import { axe } from "vitest-axe"

import { Panel } from "@/components/chatbot/panel"
import { encodeEvent } from "@/components/chatbot/sse"
import type { ChatbotDictionary } from "@/components/chatbot/type"
import { useChatbot } from "@/components/chatbot/use-chatbot"
import en from "@/components/internationalization/en.json"

const dict = en.chatbot as unknown as ChatbotDictionary

vi.mock("next/navigation", () => ({
  usePathname: () => "/en/dashboard",
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock("@/components/chatbot/actions", () => ({
  listChats: vi.fn(async () => ({
    threads: [
      {
        id: "t1",
        title: "Fees for grade 5",
        status: "OPEN",
        lastMessageAt: new Date().toISOString(),
      },
      {
        id: "t2",
        title: "Add a teacher",
        status: "RESOLVED",
        lastMessageAt: new Date(Date.now() - 9 * 864e5).toISOString(),
      },
    ],
    nextCursor: null,
    visitor: false,
  })),
  loadChat: vi.fn(async () => ({
    id: "t1",
    title: "Fees for grade 5",
    messages: [
      { id: "m1", role: "user", content: "Fees for grade 5?" },
      { id: "m2", serverId: "m2", role: "assistant", content: "Open **Fees**." },
    ],
  })),
  renameChat: vi.fn(async () => true),
  rateMessage: vi.fn(async () => true),
  markEscalated: vi.fn(async () => true),
  deleteChat: vi.fn(async () => true),
  deleteAllChats: vi.fn(async () => 0),
  forgetDevice: vi.fn(async () => true),
}))

function Harness() {
  const chat = useChatbot({
    promptType: "schoolSupport",
    locale: "en",
    errorText: "ERR",
  })
  return (
    <>
      <button type="button" data-chat-button onClick={chat.openChat}>
        open
      </button>
      <Panel
        open={chat.state.isOpen}
        onOpenChange={chat.setOpen}
        messages={chat.state.messages}
        status={chat.state.status}
        onSend={chat.sendMessage}
        onStop={chat.stop}
        onRetry={chat.retry}
        onNewChat={chat.newChat}
        threadId={chat.state.threadId}
        onOpenThread={chat.openThread}
        onRate={chat.rate}
        onEscalate={chat.escalate}
        locale="en"
        dictionary={dict}
        promptType="schoolSupport"
        supportRole="admin"
      />
    </>
  )
}

const encoder = new TextEncoder()
const meta = encodeEvent({ event: "meta", data: { fallback: "FALLBACK" } })
const delta = (t: string) => encodeEvent({ event: "delta", data: { t } })
const done = (partial = false) =>
  encodeEvent({
    event: "done",
    data: { provider: "groq", partial, fallbackReason: null },
  })

/** A streamed answer; `hold` keeps the stream open until the request aborts. */
function answer(chunks: string[], hold = false) {
  return vi.fn((_url: string, init: RequestInit) => {
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        for (const c of chunks) controller.enqueue(encoder.encode(c))
        if (!hold) controller.close()
        init.signal?.addEventListener("abort", () =>
          controller.error(new DOMException("aborted", "AbortError"))
        )
      },
    })
    return Promise.resolve(
      new Response(body, { headers: { "content-type": "text/event-stream" } })
    )
  })
}

beforeAll(() => {
  window.matchMedia ??= ((query: string) => ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia
  Element.prototype.scrollTo ??= function () {}
})

beforeEach(() => {
  // A saved thread id from one test must not be restored into the next.
  sessionStorage.clear()
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) =>
    setTimeout(() => cb(0), 0)
  )
  vi.stubGlobal("cancelAnimationFrame", (id: number) => clearTimeout(id))
})

afterEach(() => {
  vi.unstubAllGlobals()
})

async function openPanel() {
  render(<Harness />)
  fireEvent.click(screen.getByText("open"))
  return screen.findByRole("dialog", { name: dict.titleSupport })
}

describe("chat panel", () => {
  it("is a named dialog that Escape closes, handing focus back", async () => {
    const dialog = await openPanel()
    fireEvent.keyDown(dialog, { key: "Escape" })
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
    await waitFor(() =>
      expect(document.activeElement).toBe(screen.getByText("open"))
    )
  })

  it("has no accessibility violations", async () => {
    await openPanel()
    expect(await axe(document.body)).toHaveNoViolations()
  })

  it("shows the dots, then the answer with its bold labels, then the chips", async () => {
    vi.stubGlobal(
      "fetch",
      answer([meta, delta("1. Open **Students**"), delta(" now."), done()])
    )
    await openPanel()
    fireEvent.click(screen.getByText(dict.supportAddStudent))
    expect(await screen.findByText("Students")).toBeInTheDocument()
    expect(screen.getByText("Students").tagName).toBe("STRONG")
    await waitFor(() =>
      expect(screen.getByText(dict.ctaHelpCenter)).toBeInTheDocument()
    )
  })

  it("Stop keeps what arrived and offers a retry", async () => {
    vi.stubGlobal("fetch", answer([meta, delta("Partial answer")], true))
    await openPanel()
    fireEvent.click(screen.getByText(dict.supportAddStudent))
    await screen.findByText("Partial answer")
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: dict.stopAnswer }))
    })
    expect(await screen.findByText(dict.retry)).toBeInTheDocument()
    expect(screen.getByText("Partial answer")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: dict.sendMessage })
    ).toBeInTheDocument()
  })

  it("says the answer broke off when the stream does", async () => {
    vi.stubGlobal(
      "fetch",
      answer([
        meta,
        delta("Half"),
        encodeEvent({
          event: "error",
          data: { code: "cut_off", message: "CUT OFF", retryable: true },
        }),
        done(true),
      ])
    )
    await openPanel()
    fireEvent.click(screen.getByText(dict.supportAddStudent))
    expect(await screen.findByText("CUT OFF")).toBeInTheDocument()
    expect(screen.getByText(dict.retry)).toBeInTheDocument()
  })

  it("shows the server's own words for a refusal, and retries", async () => {
    const refusal = vi.fn(() =>
      Promise.resolve(Response.json({ error: "Too many" }, { status: 429 }))
    )
    vi.stubGlobal("fetch", refusal)
    await openPanel()
    fireEvent.click(screen.getByText(dict.supportAddStudent))
    expect(await screen.findByText("Too many")).toBeInTheDocument()
    vi.stubGlobal("fetch", answer([meta, delta("Second try"), done()]))
    fireEvent.click(screen.getByText(dict.retry))
    expect(await screen.findByText("Second try")).toBeInTheDocument()
    expect(screen.queryByText("Too many")).toBeNull()
  })

  it("starts a new chat from the header", async () => {
    vi.stubGlobal("fetch", answer([meta, delta("An answer"), done()]))
    await openPanel()
    fireEvent.click(screen.getByText(dict.supportAddStudent))
    await screen.findByText("An answer")
    fireEvent.click(screen.getByRole("button", { name: dict.newChat }))
    expect(screen.queryByText("An answer")).toBeNull()
    expect(screen.getByText(dict.welcomeSupport)).toBeInTheDocument()
  })

  it("opens the chats sheet inside the panel and switches to a saved chat", async () => {
    const dialog = await openPanel()
    fireEvent.click(screen.getByRole("button", { name: dict.menuChats }))
    const sheet = await screen.findByRole("dialog", { name: dict.menuChats })
    expect(dialog.contains(sheet)).toBe(true)
    expect(await screen.findByText("Fees for grade 5")).toBeInTheDocument()
    expect(screen.getByText(dict.groupToday)).toBeInTheDocument()
    expect(screen.getByText(dict.groupOlder)).toBeInTheDocument()
    fireEvent.click(screen.getByText("Fees for grade 5"))
    await waitFor(() =>
      expect(screen.getByText("Fees for grade 5?")).toBeInTheDocument()
    )
    expect(screen.getByText("Fees").tagName).toBe("STRONG")
  })

  it("turns 'not helpful' into one-tap next steps; a report carries only the question", async () => {
    const savedMeta = encodeEvent({
      event: "meta",
      data: { fallback: "F", threadId: "t9", userMessageId: "u9", assistantMessageId: "a9" },
    })
    vi.stubGlobal("fetch", answer([savedMeta, delta("Try this."), done()]))
    const opened = vi.fn()
    window.addEventListener("open-report-issue", (e) =>
      opened((e as CustomEvent).detail)
    )
    await openPanel()
    fireEvent.click(screen.getByText(dict.supportAddStudent))
    await screen.findByText("Try this.")
    fireEvent.click(screen.getByRole("button", { name: dict.notHelpful }))
    fireEvent.click(await screen.findByText(dict.reportProblem))
    await waitFor(() =>
      expect(opened).toHaveBeenCalledWith({
        description: dict.supportAddStudentQuestion,
      })
    )
  })
})
