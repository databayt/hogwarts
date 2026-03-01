"use client"

import { useTransition } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ErrorToast } from "@/components/atom/toast"

import { activateMember, removeMember, suspendMember } from "./actions"
import type { MemberRow } from "./columns"

interface StatusChangeDialogProps {
  member: MemberRow | null
  action: "suspend" | "activate" | "remove" | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  t: Record<string, string>
}

export function StatusChangeDialog({
  member,
  action,
  open,
  onOpenChange,
  onSuccess,
  t,
}: StatusChangeDialogProps) {
  const [isPending, startTransition] = useTransition()

  const titles: Record<string, string> = {
    suspend: t.suspendMember || "Suspend Member",
    activate: t.activateMember || "Activate Member",
    remove: t.removeMember || "Remove Member",
  }

  const descriptions: Record<string, string> = {
    suspend:
      t.suspendDescription ||
      `Are you sure you want to suspend ${member?.name}? They will not be able to access the platform.`,
    activate:
      t.activateDescription ||
      `Are you sure you want to activate ${member?.name}? Their access will be restored.`,
    remove:
      t.removeDescription ||
      `Are you sure you want to remove ${member?.name} from this school? This will unlink them from the school.`,
  }

  const handleConfirm = () => {
    if (!member || !action) return

    startTransition(async () => {
      let result
      switch (action) {
        case "suspend":
          result = await suspendMember({ userId: member.id })
          break
        case "activate":
          result = await activateMember({ userId: member.id })
          break
        case "remove":
          result = await removeMember({ userId: member.id })
          break
      }

      if (result?.success) {
        onOpenChange(false)
        onSuccess()
      } else {
        ErrorToast(result?.error || t.actionFailed || "Action failed")
      }
    })
  }

  if (!action) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{titles[action]}</DialogTitle>
          <DialogDescription>{descriptions[action]}</DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t.cancel || "Cancel"}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isPending}
            variant={action === "remove" ? "destructive" : "default"}
          >
            {isPending
              ? t.processing || "Processing..."
              : t.confirm || "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
