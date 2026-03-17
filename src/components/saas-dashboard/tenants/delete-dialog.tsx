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

import { tenantDelete } from "./actions"

interface DeleteSchoolDialogProps {
  tenantId: string
  name: string
  domain: string
  studentCount: number
  teacherCount: number
  onDeleted?: () => void
  children: React.ReactNode
}

export function DeleteSchoolDialog({
  tenantId,
  name,
  domain,
  studentCount,
  teacherCount,
  onDeleted,
  children,
}: DeleteSchoolDialogProps) {
  const [open, setOpen] = useState(false)
  const [confirmName, setConfirmName] = useState("")
  const [isPending, startTransition] = useTransition()

  const nameMatches = confirmName === name
  const canSubmit = nameMatches && !isPending

  const handleDelete = () => {
    startTransition(async () => {
      const result = await tenantDelete({
        tenantId,
        confirmName,
      })

      if (result.success) {
        const { stats } = result.data
        SuccessToast(
          `Deleted "${result.data.deletedName}" — ${stats.students} students, ${stats.teachers} teachers, ${stats.classes} classes removed`
        )
        setOpen(false)
        setConfirmName("")
        onDeleted?.()
      } else {
        ErrorToast(result.error?.message || "Failed to delete school")
      }
    })
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setConfirmName("")
    }
    setOpen(next)
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete School</AlertDialogTitle>
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
