"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { useVisualViewportHeight } from "./hooks/use-visual-viewport"
import { IosMobileShell, MessagesView } from "./mobile"
import type { ConversationDTO } from "./types"

type ShellProps = React.ComponentProps<typeof IosMobileShell>
type ThreadProps = React.ComponentProps<typeof MessagesView>

export type MobileViewProps = {
  activeConversation: ConversationDTO | null
  shell: ShellProps
  /** The open thread's props; ignored while the list is showing. */
  thread: Omit<ThreadProps, "className"> | null
}

/**
 * The phone: the five-tab shell, or the open thread over it. Loaded only at
 * phone widths. While the on-screen keyboard is up the whole view is sized
 * to the visual viewport, so the composer sits on the keys and the thread
 * keeps its bottom edge just above them — see `useVisualViewportHeight`.
 */
export function MobileView({
  activeConversation,
  shell,
  thread,
}: MobileViewProps) {
  const viewportHeight = useVisualViewportHeight(Boolean(activeConversation))

  return (
    <div
      className="relative flex h-full w-full flex-col"
      style={viewportHeight ? { height: viewportHeight } : undefined}
    >
      {activeConversation && thread ? (
        // Remount on conversation switch so the scroll anchor never reads a
        // new thread's messages as older ones prepended to the old.
        <MessagesView key={activeConversation.id} {...thread} />
      ) : (
        <IosMobileShell {...shell} />
      )}
    </div>
  )
}
