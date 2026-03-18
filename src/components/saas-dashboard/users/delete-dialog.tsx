"use client"

import { useState, useTransition } from "react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ErrorToast, SuccessToast } from "@/components/atom/toast"

import { userDelete } from "./actions"

interface DeleteUserDialogProps {
  userId: string
  email: string
  role: string
  schoolName: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted?: () => void
}

export function DeleteUserDialog({
  userId,
  email,
  role,
  schoolName,
  open,
  onOpenChange,
  onDeleted,
}: DeleteUserDialogProps) {
  const [confirmEmail, setConfirmEmail] = useState("")
  const [isPending, startTransition] = useTransition()

  const emailMatches = confirmEmail === email
  const canSubmit = emailMatches && !isPending

  const handleDelete = () => {
    startTransition(async () => {
      const result = await userDelete({
        userId,
        confirmEmail,
        reason: "",
      })

      if (result.success) {
        SuccessToast(`Deleted user "${result.data.deletedEmail}"`)
        onOpenChange(false)
        setConfirmEmail("")
        onDeleted?.()
      } else {
        ErrorToast(result.error?.message || "Failed to delete user")
      }
    })
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setConfirmEmail("")
    }
    onOpenChange(next)
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete User</AlertDialogTitle>
        </AlertDialogHeader>

        <div className="space-y-3 py-2">
          <div className="text-muted-foreground text-sm">
            {email} · {role.toLowerCase()}
            {schoolName && ` · ${schoolName}`}
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">
              Type <strong>{email}</strong> to confirm
            </Label>
            <Input
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              placeholder={email}
              disabled={isPending}
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={!canSubmit}
            className="bg-destructive hover:bg-destructive/90 text-white"
          >
            {isPending ? "Deleting..." : "Delete User"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
