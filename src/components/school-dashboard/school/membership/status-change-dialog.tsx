"use client"

import { useState, useTransition } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ErrorToast, SuccessToast } from "@/components/atom/toast"

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
  const [confirmText, setConfirmText] = useState("")

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

  const successMessages: Record<string, string> = {
    suspend: t.memberSuspended || "Member suspended",
    activate: t.memberActivated || "Member activated",
    remove: t.memberRemoved || "Member removed",
  }

  const isRemove = action === "remove"
  const confirmMatch =
    !isRemove ||
    confirmText.toLowerCase() === (member?.name || "").toLowerCase()

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
        SuccessToast(successMessages[action])
        setConfirmText("")
        onOpenChange(false)
        onSuccess()
      } else {
        ErrorToast(result?.error || t.actionFailed || "Action failed")
      }
    })
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) setConfirmText("")
    onOpenChange(open)
  }

  if (!action) return null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{titles[action]}</DialogTitle>
          <DialogDescription>{descriptions[action]}</DialogDescription>
        </DialogHeader>

        {isRemove && (
          <div className="space-y-2 py-2">
            <Label className="text-muted-foreground text-sm">
              {t.typeToConfirm || "Type the member's name to confirm"}:{" "}
              <span className="font-medium">{member?.name}</span>
            </Label>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={member?.name || ""}
            />
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            {t.cancel || "Cancel"}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isPending || !confirmMatch}
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
