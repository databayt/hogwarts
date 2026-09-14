"use client"

import { useMemo, useState } from "react"

import { cn } from "@/lib/utils"
import type { ConversationDTO } from "@/components/school-dashboard/messaging/types"

import { buildChatRow } from "../ios-chat-list"
import { IosTabPage } from "../ios-tab-page"
import { WaIcon } from "../wa-icon"

/** Rooms shown before the card folds the rest behind "View all". */
const FOLDED_ROOMS = 4

type Props = {
  title: string
  /** The school, which is the one community every room belongs to. */
  schoolName: string
  conversations: ConversationDTO[]
  currentUserId: string
  locale: "ar" | "en"
  onOpen: (conversationId: string) => void
  /** The Announcements row leads to the Updates tab, where they live. */
  onOpenAnnouncements?: () => void
  /** Chat-list labels, for the room previews ("Photo", "Yesterday"…). */
  rowLabels?: Parameters<typeof buildChatRow>[2]
  labels: {
    emptyTitle: string
    emptyBody: string
    members: string
    groupFallback: string
    announcements: string
    announcementsBody: string
    viewAll: string
  }
}

/**
 * WhatsApp's Communities tab (Figma "WhatsApp Screens 2025", node 188:3102).
 *
 * A school already is that community, and its rooms are the conversations that
 * are not 1:1 — the class groups, the department channels, the study groups.
 * So this page needs no data of its own; it is the conversation list the shell
 * already holds, drawn as the reference's community card: a square community
 * avatar, an Announcements row, the rooms, and "View all" once they run long.
 */
export function CommunitiesView({
  title,
  schoolName,
  conversations,
  currentUserId,
  locale,
  onOpen,
  onOpenAnnouncements,
  rowLabels,
  labels,
}: Props) {
  const [expanded, setExpanded] = useState(false)

  const rooms = useMemo(
    () =>
      conversations
        .filter((c) => c.type !== "direct" && !c.isArchived)
        .sort(
          (a, b) =>
            new Date(b.lastMessageAt).getTime() -
            new Date(a.lastMessageAt).getTime()
        ),
    [conversations]
  )

  const rows = useMemo(
    () =>
      rooms.map((room) => ({
        room,
        row: buildChatRow(room, currentUserId, rowLabels, locale),
      })),
    [rooms, currentUserId, rowLabels, locale]
  )

  if (rooms.length === 0) {
    return (
      <IosTabPage title={title}>
        <CommunitiesEmpty title={labels.emptyTitle} body={labels.emptyBody} />
      </IosTabPage>
    )
  }

  const shown = expanded ? rows : rows.slice(0, FOLDED_ROOMS)
  const hidden = rows.length - shown.length

  return (
    <IosTabPage title={title}>
      {/* The reference opens each community on a tinted band, which is also
          what separates one community from the next. */}
      <div className="h-[8px] bg-[color:var(--wa-surface-cta-filters)]" />

      <section className="flex flex-col">
        <div className="flex items-center gap-[12px] px-[16px] py-[12px]">
          <SquareAvatar size="lg" icon="ic-wa-tab-communities-fill-32" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[17px] leading-[22px] font-semibold tracking-[-0.43px] text-[color:var(--wa-text-primary)]">
              {schoolName}
            </p>
            <p className="truncate text-[14px] leading-[19px] tracking-[-0.14px] text-[color:var(--wa-text-secondary)]">
              {labels.members.replace(
                "{count}",
                String(countMembers(rooms, currentUserId))
              )}
            </p>
          </div>
        </div>

        <CardRow
          avatar={<SquareAvatar tone="product" glyph={<MegaphoneGlyph />} />}
          title={labels.announcements}
          subtitle={labels.announcementsBody}
          onClick={onOpenAnnouncements}
        />

        {shown.map(({ room, row }) => (
          <CardRow
            key={room.id}
            avatar={
              <SquareAvatar imageUrl={room.avatar} icon="ic-wa-group-16" />
            }
            title={room.title || labels.groupFallback}
            subtitle={row.preview}
            meta={row.timestamp}
            unread={row.unreadCount}
            onClick={() => onOpen(room.id)}
          />
        ))}

        {hidden > 0 && (
          <CardRow
            avatar={
              <span className="flex size-[40px] items-center justify-center text-[color:var(--wa-text-secondary)]">
                <WaIcon
                  name="ic-wa-chevron-lt-32"
                  className="size-[22px] scale-x-[-1] rtl:scale-x-100"
                />
              </span>
            }
            title={labels.viewAll}
            muted
            last
            onClick={() => setExpanded(true)}
          />
        )}
      </section>

      <div className="h-[8px] bg-[color:var(--wa-surface-cta-filters)]" />
    </IosTabPage>
  )
}

/** The reference's empty page, around the school illustration it ships. */
function CommunitiesEmpty({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col items-center px-[32px] pt-[40px] text-center">
      <img
        src="/icons/whatsapp/communities-empty.png"
        alt=""
        width={162}
        height={151}
        className="h-[151px] w-[162px] select-none"
        draggable={false}
      />
      <p className="mt-[28px] text-[22px] leading-[28px] font-bold tracking-[-0.26px] text-[color:var(--wa-text-primary)]">
        {title}
      </p>
      <p className="mt-[10px] text-[15px] leading-[20px] tracking-[-0.23px] text-[color:var(--wa-text-secondary)]">
        {body}
      </p>
    </div>
  )
}

function CardRow({
  avatar,
  title,
  subtitle,
  meta,
  unread,
  muted = false,
  last = false,
  onClick,
}: {
  avatar: React.ReactNode
  title: string
  subtitle?: string
  meta?: string
  unread?: number
  muted?: boolean
  last?: boolean
  onClick?: () => void
}) {
  const hasUnread = (unread ?? 0) > 0
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-[12px] ps-[20px] text-start active:bg-black/5"
    >
      <span className="shrink-0">{avatar}</span>
      <span
        className={cn(
          "flex min-h-[60px] min-w-0 flex-1 items-center gap-[8px] pe-[16px]",
          !last &&
            "border-b-[0.33px] border-[color:var(--wa-border-separator)]"
        )}
      >
        <span className="flex min-w-0 flex-1 flex-col">
          {/* `bdi` isolates an Arabic room name inside an English page (and
              the reverse) without flipping the line's alignment, which
              `dir="auto"` on the block itself did. */}
          <span
            className={cn(
              "truncate text-[16px] leading-[21px] tracking-[-0.32px]",
              muted
                ? "text-[color:var(--wa-text-secondary)]"
                : "font-semibold text-[color:var(--wa-text-primary)]"
            )}
          >
            <bdi>{title}</bdi>
          </span>
          {subtitle ? (
            <span className="truncate text-[14px] leading-[19px] tracking-[-0.14px] text-[color:var(--wa-text-secondary)]">
              <bdi>{subtitle}</bdi>
            </span>
          ) : null}
        </span>
        {(meta || hasUnread) && (
          <span className="flex shrink-0 flex-col items-end gap-[3px] self-start pt-[10px]">
            {meta ? (
              <time
                suppressHydrationWarning
                className={cn(
                  "text-[14px] leading-[19px] tracking-[-0.14px] whitespace-nowrap",
                  hasUnread
                    ? "text-[color:var(--wa-text-product)]"
                    : "text-[color:var(--wa-text-secondary)]"
                )}
              >
                {meta}
              </time>
            ) : null}
            {hasUnread && (
              <span className="inline-flex min-w-[16px] items-center justify-center rounded-full bg-[color:var(--wa-surface-product)] px-[6px] py-px text-[12px] leading-none text-[color:var(--wa-text-invert)]">
                {unread}
              </span>
            )}
          </span>
        )}
      </span>
    </button>
  )
}

/**
 * Communities draw every avatar as a rounded square, never a circle — it is
 * how the reference tells a community and its rooms apart from people.
 */
function SquareAvatar({
  size = "md",
  tone = "group",
  imageUrl,
  icon,
  glyph,
}: {
  size?: "md" | "lg"
  tone?: "group" | "product"
  imageUrl?: string | null
  icon?: "ic-wa-group-16" | "ic-wa-tab-communities-fill-32"
  glyph?: React.ReactNode
}) {
  return (
    <span
      className={cn(
        "flex items-center justify-center overflow-hidden border-[0.33px] border-[color:var(--wa-border-avatar)]",
        size === "lg"
          ? "size-[52px] rounded-[14px]"
          : "size-[40px] rounded-[10px]",
        tone === "product"
          ? "bg-[color:var(--wa-surface-cta-filters-active)] text-[color:var(--wa-text-product)]"
          : "bg-[color:var(--wa-surface-avatar-group)] text-[color:var(--wa-text-avatar-group)]"
      )}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          className="size-full object-cover"
          draggable={false}
        />
      ) : glyph ? (
        glyph
      ) : icon ? (
        <WaIcon
          name={icon}
          className={size === "lg" ? "size-[30px]" : "size-[22px]"}
        />
      ) : null}
    </span>
  )
}

function MegaphoneGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-[22px] rtl:scale-x-[-1]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4.5 9.25H8l10-4.5v14.5l-10-4.5H4.5a1 1 0 0 1-1-1v-3.5a1 1 0 0 1 1-1Z" />
      <path d="m8 14.75 1.6 4.75" />
    </svg>
  )
}

/** Everyone the reader shares a room with, counted once. */
function countMembers(rooms: ConversationDTO[], currentUserId: string): number {
  const ids = new Set<string>([currentUserId])
  for (const room of rooms) {
    for (const p of room.participants ?? []) ids.add(p.userId)
  }
  return ids.size
}
