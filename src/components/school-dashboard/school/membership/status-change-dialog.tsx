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
    suspend: t.suspendMember,
    activate: t.activateMember,
    remove: t.removeMember,
  }

  const descriptions: Record<string, string> = {
    suspend: t.suspendDescription,
    activate: t.activateDescription,
    remove: t.removeDescription,
  }

  const successMessages: Record<string, string> = {
    suspend: t.memberSuspended,
    activate: t.memberActivated,
    remove: t.memberRemoved,
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
        ErrorToast(t.actionFailed)
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
              {t.typeToConfirm}:{" "}
              <bdi dir="auto" className="font-medium">
                {member?.name}
              </bdi>
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
            {t.cancel}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isPending || !confirmMatch}
            variant={action === "remove" ? "destructive" : "default"}
          >
            {isPending ? t.processing : t.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
