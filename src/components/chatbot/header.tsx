"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import type { ReactNode } from "react"
import { SquarePen, X } from "lucide-react"
import { Dialog as DialogPrimitive } from "radix-ui"

export function HeaderButton({
  label,
  onClick,
  children,
  buttonRef,
}: {
  label: string
  onClick: () => void
  children: ReactNode
  buttonRef?: React.Ref<HTMLButtonElement>
}) {
  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="hover:bg-accent focus-visible:ring-ring flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors outline-none focus-visible:ring-2"
    >
      {children}
    </button>
  )
}

/**
 * The panel's one header, on every screen size: [start slot] title · new
 * chat · close. The desktop panel had no header at all — no close button,
 * no way to start over.
 */
export function ChatHeader({
  title,
  start,
  showNewChat,
  onNewChat,
  onClose,
  newChatLabel,
  closeLabel,
}: {
  title: string
  /** The chats menu button (with persistence). */
  start?: ReactNode
  showNewChat: boolean
  onNewChat: () => void
  onClose: () => void
  newChatLabel: string
  closeLabel: string
}) {
  return (
    <div className="flex h-12 shrink-0 items-center gap-1 border-b px-2">
      {start}
      <DialogPrimitive.Title className="min-w-0 flex-1 truncate px-2 text-sm font-semibold">
        {title}
      </DialogPrimitive.Title>
      {showNewChat && (
        <HeaderButton label={newChatLabel} onClick={onNewChat}>
          <SquarePen className="h-4 w-4" aria-hidden />
        </HeaderButton>
      )}
      <HeaderButton label={closeLabel} onClick={onClose}>
        <X className="h-4 w-4" aria-hidden />
      </HeaderButton>
    </div>
  )
}
