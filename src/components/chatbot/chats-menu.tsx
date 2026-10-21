"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useMemo, useState } from "react"
import { Check, Menu, Pencil, SquarePen, Trash2, X } from "lucide-react"

import { mainOriginFromLocation } from "@/lib/root-domain"
import { cn } from "@/lib/utils"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

import {
  deleteAllChats,
  deleteChat,
  forgetDevice,
  listChats,
  renameChat,
} from "./actions"
import { HeaderButton } from "./header"
import type { ChatbotDictionary, ChatSummary, PromptType } from "./type"

const DAY = 24 * 60 * 60 * 1000

type Group = "today" | "yesterday" | "week" | "older"
const GROUP_KEY: Record<Group, string> = {
  today: "groupToday",
  yesterday: "groupYesterday",
  week: "groupWeek",
  older: "groupOlder",
}

function groupOf(iso: string, now: Date): Group {
  const day = new Date(iso)
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const t = day.getTime()
  if (t >= start.getTime()) return "today"
  if (t >= start.getTime() - DAY) return "yesterday"
  if (t >= start.getTime() - 6 * DAY) return "week"
  return "older"
}

const ROW =
  "hover:bg-accent focus-visible:ring-ring flex w-full min-w-0 items-center gap-2 rounded-lg px-3 py-2 text-start outline-none focus-visible:ring-2"

/**
 * The menu button and the chats sheet it opens: every saved conversation of
 * this bot, newest first, grouped by day. The sheet portals INTO the chat
 * panel (`container`), so it stacks above it, stays inside it, and slides in
 * from the start edge — the right in Arabic. Closing hands focus back to the
 * menu button. Row actions are inline (rename, a delete that asks once): a
 * dropdown or alert dialog would portal to the page body, under the panel.
 */
export function ChatsMenu({
  container,
  dir,
  locale,
  mode,
  dictionary,
  currentThreadId,
  onSelect,
  onNewChat,
  onCurrentGone,
}: {
  container: HTMLElement | null
  dir: "rtl" | "ltr"
  locale: "en" | "ar"
  mode: PromptType
  dictionary: ChatbotDictionary
  currentThreadId: string | null
  onSelect: (threadId: string) => void
  onNewChat: () => void
  /** The chat on screen was deleted (or the device forgotten). */
  onCurrentGone: () => void
}) {
  const [open, onOpenChange] = useState(false)
  const [threads, setThreads] = useState<ChatSummary[]>([])
  const [cursor, setCursor] = useState<string | null>(null)
  const [visitor, setVisitor] = useState(false)
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)
  const [query, setQuery] = useState("")
  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState("")
  const [confirming, setConfirming] = useState<string | null>(null)

  const load = useCallback(
    async (after?: string) => {
      setLoading(true)
      setFailed(false)
      try {
        const page = await listChats({ mode, cursor: after })
        setThreads((prev) =>
          after ? [...prev, ...page.threads] : page.threads
        )
        setCursor(page.nextCursor)
        setVisitor(page.visitor)
      } catch {
        setFailed(true)
      } finally {
        setLoading(false)
      }
    },
    [mode]
  )

  // Every open starts fresh: the list is re-read, nothing half-edited.
  const reopen = () => {
    setQuery("")
    setEditing(null)
    setConfirming(null)
    void load()
  }

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q
      ? threads.filter((t) => t.title.toLowerCase().includes(q))
      : threads
  }, [threads, query])

  const groups = useMemo(() => {
    const now = new Date()
    const out = new Map<Group, ChatSummary[]>()
    for (const t of shown) {
      const g = groupOf(t.lastMessageAt, now)
      out.set(g, [...(out.get(g) ?? []), t])
    }
    return [...out.entries()]
  }, [shown])

  const time = useMemo(
    () =>
      new Intl.DateTimeFormat(locale === "ar" ? "ar-u-nu-latn" : "en", {
        hour: "numeric",
        minute: "2-digit",
        day: "numeric",
        month: "short",
      }),
    [locale]
  )

  const remove = async (id: string) => {
    const before = threads
    setThreads((prev) => prev.filter((t) => t.id !== id))
    setConfirming(null)
    if (!(await deleteChat({ threadId: id }))) setThreads(before)
    else if (id === currentThreadId) onCurrentGone()
  }

  const rename = async (id: string) => {
    const title = draft.trim()
    setEditing(null)
    if (!title) return
    const before = threads
    setThreads((prev) => prev.map((t) => (t.id === id ? { ...t, title } : t)))
    if (!(await renameChat({ threadId: id, title }))) setThreads(before)
  }

  const removeAll = async () => {
    setConfirming(null)
    await deleteAllChats({ mode })
    setThreads([])
    setCursor(null)
    onCurrentGone()
  }

  const forget = async () => {
    setConfirming(null)
    await forgetDevice()
    setThreads([])
    setCursor(null)
    onCurrentGone()
  }

  const privacyHref = `${mainOriginFromLocation()}/${locale}/docs/support/assistant`

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <button
          type="button"
          onClick={reopen}
          aria-label={dictionary.menuChats}
          title={dictionary.menuChats}
          className="hover:bg-accent focus-visible:ring-ring flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors outline-none focus-visible:ring-2"
        >
          <Menu className="h-4 w-4" aria-hidden />
        </button>
      </SheetTrigger>
      <SheetContent
        side="left"
        container={container}
        dir={dir}
        // The built-in close button is English-only; the header has ours.
        className="w-[85%] max-w-80 gap-0 p-0 [&>button]:hidden"
      >
        <div className="flex h-12 shrink-0 items-center gap-1 border-b px-2">
          <SheetTitle className="min-w-0 flex-1 truncate px-2 text-sm font-semibold">
            {dictionary.menuChats}
          </SheetTitle>
          <HeaderButton
            label={dictionary.newChat}
            onClick={() => {
              onNewChat()
              onOpenChange(false)
            }}
          >
            <SquarePen className="h-4 w-4" aria-hidden />
          </HeaderButton>
          <HeaderButton
            label={dictionary.closeMenu}
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" aria-hidden />
          </HeaderButton>
        </div>
        <SheetDescription className="sr-only">
          {dictionary.searchChats}
        </SheetDescription>

        <div className="shrink-0 px-3 pt-3">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={dictionary.searchChats}
            aria-label={dictionary.searchChats}
            className="bg-muted placeholder:text-muted-foreground/70 h-9 w-full rounded-lg px-3 text-sm outline-none"
          />
        </div>

        <nav
          aria-label={dictionary.menuChats}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-2"
        >
          {loading && !threads.length ? (
            <div className="space-y-2 px-1" aria-hidden>
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-muted h-9 animate-pulse rounded-lg"
                />
              ))}
            </div>
          ) : failed ? (
            <p className="text-muted-foreground px-3 py-6 text-center text-sm">
              {dictionary.chatsLoadFailed}
            </p>
          ) : !shown.length ? (
            <p className="text-muted-foreground px-3 py-6 text-center text-sm">
              {query ? dictionary.noMatches : dictionary.noChats}
            </p>
          ) : (
            groups.map(([group, rows]) => (
              <section key={group} className="mb-3">
                <h3 className="text-muted-foreground px-3 pb-1 text-xs font-medium">
                  {dictionary[GROUP_KEY[group]]}
                </h3>
                <ul className="space-y-0.5">
                  {rows.map((t) => (
                    <li key={t.id}>
                      {editing === t.id ? (
                        <form
                          className="flex items-center gap-1 px-1"
                          onSubmit={(e) => {
                            e.preventDefault()
                            void rename(t.id)
                          }}
                        >
                          <input
                            autoFocus
                            value={draft}
                            maxLength={80}
                            onChange={(e) => setDraft(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Escape") {
                                // Cancel the rename, not close the sheet.
                                e.stopPropagation()
                                setEditing(null)
                              }
                            }}
                            aria-label={dictionary.renameChat}
                            className="bg-muted h-8 min-w-0 flex-1 rounded-md px-2 text-sm outline-none"
                          />
                          <HeaderButton
                            label={dictionary.save}
                            onClick={() => void rename(t.id)}
                          >
                            <Check className="h-4 w-4" aria-hidden />
                          </HeaderButton>
                        </form>
                      ) : confirming === t.id ? (
                        <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm">
                          <span className="min-w-0 flex-1 truncate">
                            {dictionary.confirmDelete}
                          </span>
                          <button
                            type="button"
                            onClick={() => void remove(t.id)}
                            className="text-destructive font-medium hover:underline"
                          >
                            {dictionary.deleteChat}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirming(null)}
                            className="text-muted-foreground hover:underline"
                          >
                            {dictionary.cancel}
                          </button>
                        </div>
                      ) : (
                        <div className="group flex items-center">
                          <button
                            type="button"
                            aria-current={
                              t.id === currentThreadId ? "page" : undefined
                            }
                            onClick={() => {
                              onSelect(t.id)
                              onOpenChange(false)
                            }}
                            className={cn(
                              ROW,
                              t.id === currentThreadId && "bg-accent"
                            )}
                          >
                            <span className="min-w-0 flex-1 truncate text-sm">
                              {t.title}
                            </span>
                            <span className="text-muted-foreground shrink-0 text-xs">
                              {time.format(new Date(t.lastMessageAt))}
                            </span>
                          </button>
                          <div className="flex shrink-0 opacity-100 sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
                            <HeaderButton
                              label={dictionary.renameChat}
                              onClick={() => {
                                setDraft(t.title)
                                setEditing(t.id)
                              }}
                            >
                              <Pencil className="h-3.5 w-3.5" aria-hidden />
                            </HeaderButton>
                            <HeaderButton
                              label={dictionary.deleteChat}
                              onClick={() => setConfirming(t.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" aria-hidden />
                            </HeaderButton>
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            ))
          )}
          {cursor && !query && (
            <button
              type="button"
              disabled={loading}
              onClick={() => void load(cursor)}
              className="text-primary w-full py-2 text-center text-sm hover:underline disabled:opacity-50"
            >
              {dictionary.loadMore}
            </button>
          )}
        </nav>

        <div className="shrink-0 space-y-1 border-t px-3 py-3 text-xs">
          {confirming === "all" || confirming === "device" ? (
            <div className="flex items-center gap-2">
              <span className="min-w-0 flex-1">
                {confirming === "all"
                  ? dictionary.confirmDeleteAll
                  : dictionary.confirmForget}
              </span>
              <button
                type="button"
                onClick={() =>
                  void (confirming === "all" ? removeAll() : forget())
                }
                className="text-destructive font-medium hover:underline"
              >
                {dictionary.deleteChat}
              </button>
              <button
                type="button"
                onClick={() => setConfirming(null)}
                className="text-muted-foreground hover:underline"
              >
                {dictionary.cancel}
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              {threads.length > 0 && (
                <button
                  type="button"
                  onClick={() => setConfirming("all")}
                  className="text-muted-foreground hover:text-destructive hover:underline"
                >
                  {dictionary.deleteAllChats}
                </button>
              )}
              {visitor && (
                <button
                  type="button"
                  onClick={() => setConfirming("device")}
                  className="text-muted-foreground hover:text-destructive hover:underline"
                >
                  {dictionary.forgetDevice}
                </button>
              )}
              <a
                href={privacyHref}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:underline"
              >
                {dictionary.privacyLink}
              </a>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
