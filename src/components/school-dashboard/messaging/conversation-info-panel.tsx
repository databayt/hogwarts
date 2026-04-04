// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

"use client"

import { useState } from "react"
import {
  Bell,
  BellOff,
  ChevronRight,
  FileText,
  Image,
  Link2,
  LogOut,
  Shield,
  Star,
  Users,
  X,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { CONVERSATION_TYPE_CONFIG } from "./config"
import type { ConversationDTO, ConversationParticipantDTO } from "./types"

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ConversationInfoPanelProps {
  conversation: ConversationDTO
  currentUserId: string
  locale?: "ar" | "en"
  onClose: () => void
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(name: string | null | undefined): string {
  if (!name) return "?"
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
}

const ROLE_ORDER: Record<string, number> = {
  owner: 0,
  admin: 1,
  member: 2,
  read_only: 3,
  guest: 4,
}

function sortParticipants(
  participants: ConversationParticipantDTO[],
  currentUserId: string
): ConversationParticipantDTO[] {
  return [...participants]
    .filter((p) => p.isActive && !p.leftAt)
    .sort((a, b) => {
      // Current user always first
      if (a.userId === currentUserId) return -1
      if (b.userId === currentUserId) return 1
      // Then sort by role weight
      return (ROLE_ORDER[a.role] ?? 99) - (ROLE_ORDER[b.role] ?? 99)
    })
}

// ---------------------------------------------------------------------------
// Role badge
// ---------------------------------------------------------------------------

function RoleBadge({
  role,
  labels,
}: {
  role: string
  labels: Record<string, string>
}) {
  if (role === "member") return null

  const colorMap: Record<string, string> = {
    owner: "bg-msg-unread-badge/15 text-msg-unread-badge",
    admin: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
    read_only: "bg-muted text-muted-foreground",
    guest: "bg-muted text-muted-foreground",
  }

  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[11px] leading-none font-medium",
        colorMap[role] ?? "bg-muted text-muted-foreground"
      )}
    >
      {labels[role] ?? role}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ConversationInfoPanel({
  conversation,
  currentUserId,
  locale = "en",
  onClose,
}: ConversationInfoPanelProps) {
  const { dictionary } = useDictionary()
  const m = dictionary?.messaging
  // Cast to access info/roles keys that may not exist in the dictionary yet.
  // Falls through to ?? defaults safely.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mx = m as Record<string, any> | undefined

  const isGroup = conversation.type !== "direct"
  const config = CONVERSATION_TYPE_CONFIG[conversation.type]

  // For direct conversations, resolve the other participant
  const otherUser = !isGroup
    ? conversation.participants?.find((p) => p.userId !== currentUserId)?.user
    : null

  const displayName = isGroup
    ? conversation.title || config.label
    : otherUser?.username || otherUser?.email || m?.ui?.user_fallback || "User"

  const avatarUrl = isGroup
    ? conversation.avatar || undefined
    : otherUser?.image || undefined

  const currentParticipant = conversation.participants?.find(
    (p) => p.userId === currentUserId
  )
  const [isMuted, setIsMuted] = useState(currentParticipant?.isMuted ?? false)

  const sortedParticipants = sortParticipants(
    conversation.participants ?? [],
    currentUserId
  )

  // Role labels with i18n fallback
  const roleLabels: Record<string, string> = {
    owner: mx?.roles?.owner ?? "Owner",
    admin: mx?.roles?.admin ?? "Admin",
    member: mx?.roles?.member ?? "Member",
    read_only: mx?.roles?.read_only ?? "Read only",
    guest: mx?.roles?.guest ?? "Guest",
  }

  // Section labels
  const labels = {
    close: mx?.info?.close ?? "Close",
    about: mx?.info?.about ?? "About",
    mediaLinksAndDocs: mx?.info?.media_links_docs ?? "Media, links, and docs",
    media: mx?.info?.media ?? "Media",
    links: mx?.info?.links ?? "Links",
    docs: mx?.info?.docs ?? "Docs",
    muteNotifications: mx?.info?.mute_notifications ?? "Mute notifications",
    starredMessages: mx?.info?.starred_messages ?? "Starred messages",
    participants: mx?.info?.participants ?? "Participants",
    exitGroup: mx?.info?.exit_group ?? "Exit group",
    deleteConversation: mx?.info?.delete_conversation ?? "Delete conversation",
    you: mx?.info?.you ?? "You",
  }

  return (
    <div className="bg-msg-sidebar-bg flex h-full w-full flex-col border-s md:w-[340px]">
      {/* ----------------------------------------------------------------- */}
      {/* Header                                                            */}
      {/* ----------------------------------------------------------------- */}
      <div className="bg-msg-header-bg flex h-[60px] flex-shrink-0 items-center gap-3 ps-4 pe-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-9 w-9 flex-shrink-0"
        >
          <X className="h-5 w-5" />
          <span className="sr-only">{labels.close}</span>
        </Button>
        <span className="text-foreground text-base font-medium">
          {isGroup
            ? (mx?.info?.group_info ?? "Group info")
            : (mx?.info?.contact_info ?? "Contact info")}
        </span>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Scrollable body                                                   */}
      {/* ----------------------------------------------------------------- */}
      <ScrollArea className="flex-1">
        {/* --- Profile hero --- */}
        <div className="flex flex-col items-center px-6 pt-7 pb-4">
          <Avatar className="h-24 w-24">
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback className="bg-muted text-muted-foreground text-2xl">
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>

          <h2 className="text-foreground mt-3 text-center text-xl font-medium">
            {displayName}
          </h2>

          {/* Subtitle: participant count or email */}
          {isGroup ? (
            <p className="text-muted-foreground mt-0.5 flex items-center gap-1.5 text-sm">
              <Users className="h-3.5 w-3.5" />
              {conversation.participantCount}{" "}
              {mx?.info?.participants_count ?? "participants"}
            </p>
          ) : otherUser?.email ? (
            <p className="text-muted-foreground mt-0.5 text-sm">
              {otherUser.email}
            </p>
          ) : null}
        </div>

        <Separator />

        {/* --- About / Description --- */}
        {isGroup && conversation.title && (
          <>
            <div className="px-6 py-4">
              <p className="text-muted-foreground mb-1 text-xs">
                {labels.about}
              </p>
              <p className="text-foreground text-sm">{config.description}</p>
            </div>
            <Separator />
          </>
        )}

        {/* --- Media, Links, and Docs --- */}
        <button
          type="button"
          className="hover:bg-msg-hover flex w-full items-center justify-between px-6 py-4 transition-colors"
        >
          <span className="text-foreground text-sm">
            {labels.mediaLinksAndDocs}
          </span>
          <ChevronRight className="text-muted-foreground h-4 w-4 rtl:rotate-180" />
        </button>

        {/* Horizontal media type tabs */}
        <div className="flex items-center gap-0 px-6 pb-4">
          {[
            { icon: Image, label: labels.media, count: 0 },
            { icon: Link2, label: labels.links, count: 0 },
            { icon: FileText, label: labels.docs, count: 0 },
          ].map((tab) => (
            <button
              key={tab.label}
              type="button"
              className="text-muted-foreground hover:text-foreground flex flex-1 flex-col items-center gap-1 py-2 text-xs transition-colors"
            >
              <tab.icon className="h-5 w-5" />
              <span>{tab.label}</span>
              <span className="text-muted-foreground text-[11px]">
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <Separator />

        {/* --- Mute notifications --- */}
        <button
          type="button"
          onClick={() => setIsMuted((prev) => !prev)}
          className="hover:bg-msg-hover flex w-full items-center justify-between px-6 py-4 transition-colors"
        >
          <div className="flex items-center gap-4">
            {isMuted ? (
              <BellOff className="text-muted-foreground h-5 w-5" />
            ) : (
              <Bell className="text-muted-foreground h-5 w-5" />
            )}
            <span className="text-foreground text-sm">
              {labels.muteNotifications}
            </span>
          </div>
          {/* Toggle indicator */}
          <div
            className={cn(
              "h-5 w-9 rounded-full transition-colors",
              isMuted ? "bg-msg-unread-badge" : "bg-muted"
            )}
          >
            <div
              className={cn(
                "h-5 w-5 rounded-full bg-white shadow transition-transform",
                isMuted ? "translate-x-4 rtl:-translate-x-4" : "translate-x-0"
              )}
            />
          </div>
        </button>

        <Separator />

        {/* --- Starred messages --- */}
        <button
          type="button"
          className="hover:bg-msg-hover flex w-full items-center justify-between px-6 py-4 transition-colors"
        >
          <div className="flex items-center gap-4">
            <Star className="text-muted-foreground h-5 w-5" />
            <span className="text-foreground text-sm">
              {labels.starredMessages}
            </span>
          </div>
          <ChevronRight className="text-muted-foreground h-4 w-4 rtl:rotate-180" />
        </button>

        <Separator />

        {/* --- Participants (group only) --- */}
        {isGroup && sortedParticipants.length > 0 && (
          <>
            <div className="px-6 pt-4 pb-2">
              <p className="text-muted-foreground text-xs">
                {sortedParticipants.length} {labels.participants}
              </p>
            </div>

            <div className="flex flex-col">
              {sortedParticipants.map((participant) => {
                const isCurrentUser = participant.userId === currentUserId
                const name =
                  participant.nickname ||
                  participant.user.username ||
                  participant.user.email ||
                  m?.ui?.user_fallback ||
                  "User"

                return (
                  <div
                    key={participant.id}
                    className="hover:bg-msg-hover flex items-center gap-3 px-6 py-2.5 transition-colors"
                  >
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarImage
                        src={participant.user.image ?? undefined}
                        alt={name}
                      />
                      <AvatarFallback className="bg-muted text-muted-foreground text-sm">
                        {getInitials(name)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-foreground truncate text-sm">
                          {isCurrentUser ? labels.you : name}
                        </span>
                        <RoleBadge
                          role={participant.role}
                          labels={roleLabels}
                        />
                      </div>
                      {participant.user.email && !isCurrentUser && (
                        <p className="text-muted-foreground truncate text-xs">
                          {participant.user.email}
                        </p>
                      )}
                    </div>

                    {/* Admin indicator */}
                    {(participant.role === "owner" ||
                      participant.role === "admin") && (
                      <Shield className="text-muted-foreground h-4 w-4 flex-shrink-0" />
                    )}
                  </div>
                )
              })}
            </div>

            <Separator className="mt-2" />
          </>
        )}

        {/* --- Danger zone --- */}
        <div className="flex flex-col py-2">
          {isGroup && (
            <button
              type="button"
              className="hover:bg-msg-hover flex items-center gap-4 px-6 py-3 transition-colors"
            >
              <LogOut className="h-5 w-5 text-red-500" />
              <span className="text-sm text-red-500">{labels.exitGroup}</span>
            </button>
          )}
          <button
            type="button"
            className="hover:bg-msg-hover flex items-center gap-4 px-6 py-3 transition-colors"
          >
            <LogOut className="h-5 w-5 text-red-500" />
            <span className="text-sm text-red-500">
              {labels.deleteConversation}
            </span>
          </button>
        </div>

        {/* Bottom spacing */}
        <div className="h-6" />
      </ScrollArea>
    </div>
  )
}
