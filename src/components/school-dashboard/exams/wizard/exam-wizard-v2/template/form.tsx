"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
  useTransition,
} from "react"
import { Clock, FileText, Hash } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ErrorToast } from "@/components/atom/toast"
import type { WizardFormRef } from "@/components/form/wizard"

import { getAvailableTemplates, selectTemplate } from "./actions"

interface TemplateOption {
  id: string
  name: string
  subjectName: string
  duration: number
  totalMarks: number
  questionCount: number
}

interface TemplateFormProps {
  generatedExamId: string
  initialTemplateId?: string | null
  onValidChange?: (isValid: boolean) => void
}

export const TemplateForm = forwardRef<WizardFormRef, TemplateFormProps>(
  ({ generatedExamId, initialTemplateId, onValidChange }, ref) => {
    const [isPending, startTransition] = useTransition()
    const [templates, setTemplates] = useState<TemplateOption[]>([])
    const [isLoadingTemplates, setIsLoadingTemplates] = useState(true)
    const [selectedId, setSelectedId] = useState<string | null>(
      initialTemplateId || null
    )

    // Load templates on mount
    useEffect(() => {
      let mounted = true
      getAvailableTemplates().then((result) => {
        if (!mounted) return
        if (result.success && result.data) {
          setTemplates(result.data)
        }
        setIsLoadingTemplates(false)
      })
      return () => {
        mounted = false
      }
    }, [])

    // Notify parent of validity
    useEffect(() => {
      onValidChange?.(!!selectedId)
    }, [selectedId, onValidChange])

    const handleSelect = useCallback((id: string) => {
      setSelectedId(id)
    }, [])

    useImperativeHandle(ref, () => ({
      saveAndNext: () =>
        new Promise<void>((resolve, reject) => {
          if (!selectedId) {
            ErrorToast("Select a template")
            reject(new Error("No template selected"))
            return
          }
          startTransition(async () => {
            try {
              const result = await selectTemplate(generatedExamId, selectedId)
              if (!result.success) {
                ErrorToast(result.error || "Failed to save")
                reject(new Error(result.error))
                return
              }
              resolve()
            } catch (err) {
              const msg = err instanceof Error ? err.message : "Failed to save"
              ErrorToast(msg)
              reject(err)
            }
          })
        }),
    }))

    if (isLoadingTemplates) {
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))}
        </div>
      )
    }

    if (templates.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <FileText className="text-muted-foreground mb-4 h-10 w-10" />
          <p className="text-muted-foreground text-sm">
            No templates available. Create an exam template first.
          </p>
        </div>
      )
    }

    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {templates.map((t) => (
          <Card
            key={t.id}
            className={`cursor-pointer transition-colors ${
              selectedId === t.id
                ? "border-primary ring-primary/20 ring-2"
                : "hover:border-primary/50"
            } ${isPending ? "pointer-events-none opacity-50" : ""}`}
            onClick={() => handleSelect(t.id)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <CardTitle className="line-clamp-1 text-base">
                  {t.name}
                </CardTitle>
                <Badge variant="secondary" className="shrink-0 text-xs">
                  {t.subjectName}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-muted-foreground flex flex-wrap gap-3 text-sm">
                <span className="flex items-center gap-1">
                  <Hash className="h-3.5 w-3.5" />
                  {t.questionCount} Q
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {t.duration} min
                </span>
                <span>{t.totalMarks} marks</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }
)

TemplateForm.displayName = "TemplateForm"
