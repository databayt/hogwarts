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
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DeleteToast, ErrorToast } from "@/components/atom/toast"

import { tenantDelete } from "./actions"

interface DeleteSchoolDialogProps {
  tenantId: string
  name: string
  displayName?: string
  domain: string
  studentCount: number
  teacherCount: number
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted?: () => void
}

export function DeleteSchoolDialog({
  tenantId,
  name,
  displayName,
  domain,
  studentCount,
  teacherCount,
  open,
  onOpenChange,
  onDeleted,
}: DeleteSchoolDialogProps) {
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
        DeleteToast(`Deleted "${result.data.deletedName}"`)
        onOpenChange(false)
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
    onOpenChange(next)
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="sm:max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle className="bg-background">
            Delete Tenant
          </AlertDialogTitle>
          <AlertDialogDescription>
            All data will be permanently removed. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3 py-2">
          {displayName && displayName !== name && (
            <p className="text-muted-foreground text-sm">{displayName}</p>
          )}
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
            className="bg-destructive hover:bg-destructive/90 text-white"
          >
            {isPending ? "Deleting..." : "Delete School"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
