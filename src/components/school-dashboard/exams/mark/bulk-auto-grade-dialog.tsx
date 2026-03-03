"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Bulk Auto-Grade Dialog with confirmation and progress
import { useState } from "react"
import { CheckCircle, Loader2, Zap } from "lucide-react"
import { toast } from "sonner"

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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import { bulkAutoGradeAll } from "./actions/bulk-auto-grade-all"

interface BulkAutoGradeDialogProps {
  pendingAutoGradable: number
  totalPending: number
}

export function BulkAutoGradeDialog({
  pendingAutoGradable,
  totalPending,
}: BulkAutoGradeDialogProps) {
  const [isGrading, setIsGrading] = useState(false)
  const [result, setResult] = useState<{
    graded: number
    failed: number
    total: number
  } | null>(null)

  const handleAutoGrade = async () => {
    setIsGrading(true)
    setResult(null)

    try {
      const response = await bulkAutoGradeAll()
      if (response.success) {
        if (response.data) {
          setResult(response.data)
          toast.success(
            `Auto-graded ${response.data.graded} submissions${response.data.failed > 0 ? ` (${response.data.failed} failed)` : ""}`
          )
        }
      } else {
        toast.error(response.error || "Auto-grading failed")
      }
    } catch {
      toast.error("An unexpected error occurred")
    } finally {
      setIsGrading(false)
    }
  }

  if (pendingAutoGradable === 0) return null

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="secondary" size="sm">
          <Zap className="me-2 h-4 w-4" />
          Auto-Grade All
          <Badge variant="outline" className="ms-2 text-xs">
            {pendingAutoGradable}
          </Badge>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Bulk Auto-Grade</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            {result ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Auto-grading complete</span>
                </div>
                <div className="bg-muted grid grid-cols-3 gap-3 rounded-lg p-3">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{result.graded}</p>
                    <p className="text-muted-foreground text-xs">Graded</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{result.failed}</p>
                    <p className="text-muted-foreground text-xs">Failed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{result.total}</p>
                    <p className="text-muted-foreground text-xs">Total</p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <span className="block">
                  This will auto-grade <strong>{pendingAutoGradable}</strong>{" "}
                  ungraded submissions (MCQ, True/False, and Fill-in-Blank)
                  across all exams.
                </span>
                <span className="block">
                  {totalPending - pendingAutoGradable > 0 && (
                    <>
                      {totalPending - pendingAutoGradable} essay/short answer
                      submissions will not be affected and require manual or AI
                      grading.
                    </>
                  )}
                </span>
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{result ? "Close" : "Cancel"}</AlertDialogCancel>
          {!result && (
            <AlertDialogAction onClick={handleAutoGrade} disabled={isGrading}>
              {isGrading ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  Grading...
                </>
              ) : (
                <>
                  <Zap className="me-2 h-4 w-4" />
                  Auto-Grade {pendingAutoGradable} Submissions
                </>
              )}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
