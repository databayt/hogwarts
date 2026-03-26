"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { memo } from "react"
import {
  differenceInCalendarDays,
  format,
  isToday,
  isYesterday,
} from "date-fns"
import { ar, enUS } from "date-fns/locale"
import { Pin } from "lucide-react"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

import type { ContactDTO } from "./types"

export interface ContactCardProps {
  contact: ContactDTO
  locale?: "ar" | "en"
  isActive?: boolean
  onClick?: (userId: string) => void
  className?: string
}

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
  TEACHER: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  STUDENT: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
  GUARDIAN:
    "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400",
  STAFF:
    "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400",
  ACCOUNTANT:
    "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  DEVELOPER: "bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-400",
}

const ROLE_LABELS: Record<string, Record<string, string>> = {
  en: {
    ADMIN: "Admin",
    TEACHER: "Teacher",
    STUDENT: "Student",
    GUARDIAN: "Parent",
    STAFF: "Staff",
    ACCOUNTANT: "Accountant",
    DEVELOPER: "Developer",
  },
  ar: {
    ADMIN: "مدير",
    TEACHER: "معلم",
    STUDENT: "طالب",
    GUARDIAN: "ولي أمر",
    STAFF: "موظف",
    ACCOUNTANT: "محاسب",
    DEVELOPER: "مطور",
  },
}

function formatTime(date: Date | string, locale: "ar" | "en"): string {
  const d = new Date(date)
  const dateLocale = locale === "ar" ? ar : enUS
  if (isToday(d)) return format(d, "p", { locale: dateLocale })
  if (isYesterday(d)) return locale === "ar" ? "أمس" : "Yesterday"
  if (differenceInCalendarDays(new Date(), d) < 7)
    return format(d, "EEEE", { locale: dateLocale })
  return format(d, "P", { locale: dateLocale })
}

export const ContactCard = memo(function ContactCard({
  contact,
  locale = "en",
  isActive = false,
  onClick,
  className,
}: ContactCardProps) {
  const initials =
    `${contact.firstName?.[0] ?? ""}${contact.lastName?.[0] ?? ""}`.toUpperCase() ||
    "?"
  const hasConversation = !!contact.conversationId
  const hasUnread = (contact.unreadCount ?? 0) > 0
  const roleLabel = ROLE_LABELS[locale]?.[contact.role] ?? contact.role
  const roleColor = ROLE_COLORS[contact.role] ?? ""

  return (
    <div
      onClick={() => onClick?.(contact.id)}
      className={cn(
        "group flex h-[72px] cursor-pointer items-center gap-3 px-3 transition-colors",
        "hover:bg-msg-hover",
        isActive && "bg-msg-hover",
        className
      )}
    >
      {/* Avatar */}
      <Avatar className="h-[49px] w-[49px] flex-shrink-0">
        <AvatarImage
          src={contact.image ?? undefined}
          alt={contact.displayName}
        />
        <AvatarFallback className="bg-muted text-muted-foreground">
          {initials}
        </AvatarFallback>
      </Avatar>

      {/* Content — with inset bottom border like WhatsApp */}
      <div className="border-border flex min-w-0 flex-1 flex-col justify-center border-b py-3">
        {/* Row 1: Name + time or role badge */}
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn("truncate", hasUnread ? "font-bold" : "font-medium")}
          >
            {contact.displayName}
          </span>
          {hasConversation && contact.lastMessageAt ? (
            <span
              className={cn(
                "flex-shrink-0 text-xs",
                hasUnread
                  ? "text-msg-unread-badge font-medium"
                  : "text-muted-foreground"
              )}
            >
              {formatTime(contact.lastMessageAt, locale)}
            </span>
          ) : (
            <Badge
              variant="secondary"
              className={cn("shrink-0 px-1.5 py-0 text-[10px]", roleColor)}
            >
              {roleLabel}
            </Badge>
          )}
        </div>

        {/* Row 2: Last message or context label */}
        <div className="flex items-center justify-between gap-2">
          <p className="text-muted-foreground truncate text-sm">
            {hasConversation
              ? contact.lastMessage ||
                (locale === "ar" ? "لا توجد رسائل" : "No messages")
              : contact.contextLabel || roleLabel}
          </p>
          <div className="flex flex-shrink-0 items-center gap-1">
            {contact.isPinned && (
              <Pin className="text-muted-foreground h-3.5 w-3.5" />
            )}
            {hasUnread && (
              <span className="bg-msg-unread-badge flex min-w-[20px] items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-medium text-white">
                {(contact.unreadCount ?? 0) > 99 ? "99+" : contact.unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
})

export function ContactCardSkeleton() {
  return (
    <div className="flex h-[72px] items-center gap-3 px-3">
      <div className="bg-muted h-[49px] w-[49px] animate-pulse rounded-full" />
      <div className="flex-1 space-y-2">
        <div className="bg-muted h-4 w-32 animate-pulse rounded" />
        <div className="bg-muted h-3 w-24 animate-pulse rounded" />
      </div>
    </div>
  )
}
