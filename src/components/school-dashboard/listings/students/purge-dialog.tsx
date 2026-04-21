"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useState, useTransition } from "react"

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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DeleteToast, ErrorToast, SuccessToast } from "@/components/atom/toast"
import { downloadBlob } from "@/components/file"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { exportStudentForPurge, purgeStudent } from "./actions"

interface PurgeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  studentId: string | null
  studentName: string
  dictionary?: Dictionary["school"]["students"]
  onSuccess?: (id: string) => void
}

export function PurgeDialog({
  open,
  onOpenChange,
  studentId,
  studentName,
  dictionary,
  onSuccess,
}: PurgeDialogProps) {
  const d = dictionary as Record<string, string> | undefined
  const t = {
    title: d?.permanentlyDelete || "Permanently delete",
    warning:
      d?.purgeWarning ||
      "This will permanently delete the student and all related records (attendance, fees, results, submissions). This cannot be undone.",
    exportFirst:
      d?.exportBeforePurge ||
      "Download a JSON export of this student and all their data first.",
    downloadExport: d?.downloadExport || "Download export",
    downloading: d?.downloading || "Downloading...",
    exportDone: d?.exportDone || "Export downloaded",
    typeNameLabel:
      d?.typeNameToConfirm || "Type the student's full name to confirm",
    confirm: d?.permanentlyDelete || "Permanently delete",
    cancel: d?.cancel || "Cancel",
    deleting: d?.deleting || "Deleting...",
    purgeSuccess: d?.purgeSuccess || "Student permanently deleted",
    purgeFailed: d?.purgeFailed || "Failed to delete student",
    exportFailed: d?.exportFailed || "Failed to download export",
  }

  const [exportToken, setExportToken] = useState<string | null>(null)
  const [confirmName, setConfirmName] = useState("")
  const [isExporting, startExport] = useTransition()
  const [isDeleting, startDelete] = useTransition()

  useEffect(() => {
    if (!open) {
      setExportToken(null)
      setConfirmName("")
    }
  }, [open])

  const nameMatches =
    confirmName.trim().toLowerCase() === studentName.trim().toLowerCase()

  const handleExport = () => {
    if (!studentId) return
    startExport(async () => {
      const result = await exportStudentForPurge({ id: studentId })
      if (!result.success || !result.data) {
        ErrorToast(
          ("error" in result ? result.error : undefined) || t.exportFailed
        )
        return
      }
      const blob = new Blob([JSON.stringify(result.data.payload, null, 2)], {
        type: "application/json",
      })
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
      const slug = studentName.trim().replace(/\s+/g, "-").toLowerCase()
      downloadBlob(blob, `student-${slug}-${timestamp}.json`)
      setExportToken(result.data.token)
      SuccessToast(t.exportDone)
    })
  }

  const handlePurge = () => {
    if (!studentId || !exportToken || !nameMatches) return
    startDelete(async () => {
      const result = await purgeStudent({
        id: studentId,
        token: exportToken,
      })
      if (result.success) {
        DeleteToast(t.purgeSuccess)
        onOpenChange(false)
        onSuccess?.(studentId)
      } else {
        ErrorToast(
          ("error" in result ? result.error : undefined) || t.purgeFailed
        )
      }
    })
  }

  const isPending = isExporting || isDeleting

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t.title} {studentName}
          </AlertDialogTitle>
          <AlertDialogDescription>{t.warning}</AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <p className="text-muted-foreground text-sm">{t.exportFirst}</p>
            <Button
              type="button"
              variant="outline"
              onClick={handleExport}
              disabled={isPending || !!exportToken}
            >
              {isExporting
                ? t.downloading
                : exportToken
                  ? t.exportDone
                  : t.downloadExport}
            </Button>
          </div>

          {exportToken && (
            <div className="space-y-1.5">
              <Label className="text-sm">
                {t.typeNameLabel}: <strong>{studentName}</strong>
              </Label>
              <Input
                value={confirmName}
                onChange={(e) => setConfirmName(e.target.value)}
                placeholder={studentName}
                disabled={isPending}
                autoComplete="off"
              />
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>{t.cancel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handlePurge}
            disabled={!exportToken || !nameMatches || isPending}
            className="bg-destructive hover:bg-destructive/90 text-white"
          >
            {isDeleting ? t.deleting : t.confirm}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
