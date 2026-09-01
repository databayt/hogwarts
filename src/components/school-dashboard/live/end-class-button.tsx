"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Square } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ErrorToast } from "@/components/atom/toast"
import { endLiveClass } from "@/components/school-dashboard/live/actions/sessions"

/**
 * "End class" on the session detail page.
 *
 * `endLiveClass` had existed since the block was built with NOTHING calling it:
 * a teacher could start a class and join it, but had no way to finish it. The
 * room only closed when the SFU's empty-room timeout eventually fired
 * `room_finished`, which is minutes of a room nobody is in — and, for a school
 * with attendance sync on, minutes before the register is written.
 *
 * Two clicks, deliberately. Ending is not undoable and it disconnects everyone
 * still in the room, so a misplaced click during a lesson is expensive. The
 * second click is the confirmation; there is no dialog to dismiss on a phone.
 */
export function EndClassButton({
  sessionId,
  label,
  confirmLabel,
  pendingLabel,
  errorLabel,
}: {
  sessionId: string
  label: string
  confirmLabel: string
  pendingLabel: string
  errorLabel: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [armed, setArmed] = useState(false)

  function onClick() {
    if (!armed) {
      setArmed(true)
      return
    }
    startTransition(async () => {
      const res = await endLiveClass({ id: sessionId })
      if ("success" in res && res.success) {
        // The action revalidates; refresh so the page re-renders as `ended`
        // (Join disappears, recordings appear).
        router.refresh()
        setArmed(false)
      } else {
        ErrorToast(errorLabel)
        setArmed(false)
      }
    })
  }

  return (
    <Button
      type="button"
      variant={armed ? "destructive" : "outline"}
      className="gap-2"
      disabled={pending}
      aria-busy={pending}
      onClick={onClick}
      onBlur={() => setArmed(false)}
    >
      <Square className="h-4 w-4" />
      {pending ? pendingLabel : armed ? confirmLabel : label}
    </Button>
  )
}
