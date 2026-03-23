"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"

import { cn } from "@/lib/utils"

import { ContactCard } from "./contact-card"
import type { ContactDTO } from "./types"

export interface ContactCategoryProps {
  label: string
  contacts: ContactDTO[]
  locale?: "ar" | "en"
  defaultOpen?: boolean
  onContactClick?: (userId: string) => void
}

export function ContactCategorySection({
  label,
  contacts,
  locale = "en",
  defaultOpen = true,
  onContactClick,
}: ContactCategoryProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  if (contacts.length === 0) return null

  return (
    <div>
      {/* Category header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "text-msg-header-text bg-msg-sidebar-bg/80 sticky top-0 z-10 flex w-full items-center justify-between px-4 py-2 backdrop-blur-sm",
          "hover:bg-msg-hover transition-colors"
        )}
      >
        <span className="text-sm font-semibold tracking-wider uppercase">
          {label}
        </span>
        <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
          {contacts.length}
          {isOpen ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </span>
      </button>

      {/* Contact list */}
      {isOpen && (
        <div>
          {contacts.map((contact) => (
            <ContactCard
              key={contact.id}
              contact={contact}
              locale={locale}
              onClick={onContactClick}
            />
          ))}
        </div>
      )}
    </div>
  )
}
