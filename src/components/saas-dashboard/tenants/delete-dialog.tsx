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

import { tenantDelete } from "./actions"

interface DeleteSchoolDialogProps {
  tenantId: string
  name: string
  domain: string
  studentCount: number
  teacherCount: number
  children: React.ReactNode
}

export function DeleteSchoolDialog({
  tenantId,
  name,
  domain,
  studentCount,
  teacherCount,
  children,
}: DeleteSchoolDialogProps) {
  const [open, setOpen] = useState(false)
  const [confirmName, setConfirmName] = useState("")
  const [reason, setReason] = useState("")
  const [isPending, startTransition] = useTransition()

  const nameMatches = confirmName === name
  const canSubmit = nameMatches && reason.trim().length > 0 && !isPending

  const handleDelete = () => {
    startTransition(async () => {
      const result = await tenantDelete({
        tenantId,
        confirmName,
        reason: reason.trim(),
      })

      if (result.success) {
        const { stats } = result.data
        SuccessToast(
          `Deleted "${result.data.deletedName}" — ${stats.students} students, ${stats.teachers} teachers, ${stats.classes} classes removed`
        )
        setOpen(false)
        setConfirmName("")
        setReason("")
      } else {
        ErrorToast(result.error?.message || "Failed to delete school")
      }
    })
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setConfirmName("")
      setReason("")
    }
    setOpen(next)
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete School</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete <strong>{name}</strong> ({domain}
            .databayt.org) and all its data including students, teachers,
            classes, attendance, grades, and financial records. Users will be
            detached but not deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3 py-2">
          <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
            <strong>Affected data:</strong> {studentCount.toLocaleString()}{" "}
            students, {teacherCount.toLocaleString()} teachers
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">
              Type <strong>{name}</strong> to confirm
            </Label>
            <Input
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder={name}
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
              placeholder="Why is this school being deleted?"
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
            {isPending ? "Deleting..." : "Delete School"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
