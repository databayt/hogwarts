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
  AlertDialogTrigger,
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
  onDeleted?: () => void
  children: React.ReactNode
}

export function DeleteUserDialog({
  userId,
  email,
  role,
  schoolName,
  onDeleted,
  children,
}: DeleteUserDialogProps) {
  const [open, setOpen] = useState(false)
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
        setOpen(false)
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
    setOpen(next)
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete User</AlertDialogTitle>
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
