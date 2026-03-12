"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useTransition,
} from "react"
import { useParams, useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { Form } from "@/components/ui/form"
import { ErrorToast } from "@/components/atom/toast"
import { InputField, TextareaField } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"

import { completeGradeWizard } from "../actions"
import { updateGradeScoring } from "./actions"
import { scoringSchema, type ScoringFormData } from "./validation"

interface ScoringFormProps {
  resultId: string
  initialData?: Partial<ScoringFormData>
  onValidChange?: (isValid: boolean) => void
}

export const ScoringForm = forwardRef<WizardFormRef, ScoringFormProps>(
  ({ resultId, initialData, onValidChange }, ref) => {
    const [isPending, startTransition] = useTransition()
    const router = useRouter()
    const params = useParams()

    const form = useForm<ScoringFormData>({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolver: zodResolver(scoringSchema) as any,
      defaultValues: {
        score: initialData?.score ?? 0,
        maxScore: initialData?.maxScore ?? 100,
        grade: initialData?.grade || "",
        feedback: initialData?.feedback,
      },
    })

    const score = form.watch("score")
    const maxScore = form.watch("maxScore")
    const grade = form.watch("grade")

    // Notify parent of validity changes
    React.useEffect(() => {
      const isValid =
        score !== undefined &&
        score !== null &&
        maxScore > 0 &&
        score <= maxScore &&
        grade?.trim().length >= 1
      onValidChange?.(isValid)
    }, [score, maxScore, grade, onValidChange])

    const handleSaveAndComplete = useCallback(async () => {
      const valid = await form.trigger()
      if (!valid) {
        throw new Error("Validation failed")
      }
      const data = form.getValues()
      const saveResult = await updateGradeScoring(resultId, data)
      if (!saveResult.success) {
        ErrorToast(saveResult.error || "Failed to save")
        throw new Error(saveResult.error)
      }
      const completeResult = await completeGradeWizard(resultId)
      if (!completeResult.success) {
        ErrorToast(completeResult.error || "Failed to complete")
        throw new Error(completeResult.error)
      }
      router.push("/grades")
    }, [resultId, form, router])

    useImperativeHandle(ref, () => ({
      saveAndNext: () =>
        new Promise<void>((resolve, reject) => {
          startTransition(async () => {
            try {
              await handleSaveAndComplete()
              resolve()
            } catch (err) {
              const msg = err instanceof Error ? err.message : "Failed to save"
              ErrorToast(msg)
              reject(err)
            }
          })
        }),
    }))

    return (
      <Form {...form}>
        <form className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <InputField
              name="score"
              label="Score"
              type="number"
              placeholder="0"
              required
              disabled={isPending}
            />
            <InputField
              name="maxScore"
              label="Max Score"
              type="number"
              placeholder="100"
              required
              disabled={isPending}
            />
          </div>
          <InputField
            name="grade"
            label="Grade"
            placeholder="e.g. A+, B, C"
            required
            disabled={isPending}
          />
          <TextareaField
            name="feedback"
            label="Feedback"
            placeholder="Optional feedback for the student"
            disabled={isPending}
          />
        </form>
      </Form>
    )
  }
)

ScoringForm.displayName = "ScoringForm"
