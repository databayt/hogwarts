"use client"

import { useState, useTransition } from "react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ErrorToast, SuccessToast } from "@/components/atom/toast"

import { userDelete } from "./actions"

interface DeleteUserDialogProps {
  userId: string
  email: string
  role: string
  schoolName: string | null
  children: React.ReactNode
}

export function DeleteUserDialog({
  userId,
  email,
  role,
  schoolName,
  children,
}: DeleteUserDialogProps) {
  const [open, setOpen] = useState(false)
  const [confirmEmail, setConfirmEmail] = useState("")
  const [reason, setReason] = useState("")
  const [isPending, startTransition] = useTransition()

  const emailMatches = confirmEmail === email
  const canSubmit = emailMatches && reason.trim().length > 0 && !isPending

  const handleDelete = () => {
    startTransition(async () => {
      const result = await userDelete({
        userId,
        confirmEmail,
        reason: reason.trim(),
      })

      if (result.success) {
        SuccessToast(`Deleted user "${result.data.deletedEmail}"`)
        setOpen(false)
        setConfirmEmail("")
        setReason("")
      } else {
        ErrorToast(result.error?.message || "Failed to delete user")
      }
    })
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setConfirmEmail("")
      setReason("")
    }
    setOpen(next)
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete User</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete <strong>{email}</strong> and all
            associated data including accounts, sessions, and role records.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3 py-2">
          <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
            <strong>User details:</strong> {email} — Role: {role}
            {schoolName && ` — School: ${schoolName}`}
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

          <div className="space-y-1.5">
            <Label className="text-sm">
              Reason for deletion <span className="text-destructive">*</span>
            </Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why is this user being deleted?"
              rows={2}
              disabled={isPending}
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={!canSubmit}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? "Deleting..." : "Delete User"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
