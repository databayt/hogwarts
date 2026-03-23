"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { memo } from "react"
import { MessageSquare } from "lucide-react"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

import type { ContactDTO } from "./types"

export interface ContactCardProps {
  contact: ContactDTO
  locale?: "ar" | "en"
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

export const ContactCard = memo(function ContactCard({
  contact,
  locale = "en",
  onClick,
  className,
}: ContactCardProps) {
  const initials =
    `${contact.givenName?.[0] ?? ""}${contact.surname?.[0] ?? ""}`.toUpperCase() ||
    "?"
  const roleLabel = ROLE_LABELS[locale]?.[contact.role] ?? contact.role
  const roleColor = ROLE_COLORS[contact.role] ?? ""

  return (
    <div
      onClick={() => onClick?.(contact.id)}
      className={cn(
        "group flex h-[72px] cursor-pointer items-center gap-3 px-3 transition-colors",
        "hover:bg-msg-hover",
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

      {/* Name + context */}
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium">{contact.displayName}</span>
          <Badge
            variant="secondary"
            className={cn("shrink-0 px-1.5 py-0 text-[10px]", roleColor)}
          >
            {roleLabel}
          </Badge>
        </div>
        {contact.contextLabel && (
          <p className="text-muted-foreground truncate text-sm">
            {contact.contextLabel}
          </p>
        )}
      </div>

      {/* Message icon on hover */}
      <div className="text-muted-foreground flex-shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
        <MessageSquare className="h-4 w-4" />
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
