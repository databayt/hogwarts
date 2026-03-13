"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
  useTransition,
} from "react"

import { ErrorToast } from "@/components/atom/toast"
import type { WizardFormRef } from "@/components/form/wizard"

import { VARIANT_REGISTRY } from "../../../templates/composition/registry"
import type { SlotName } from "../../../templates/composition/types"
import { MiniPaperMockup, VariantThumbnail } from "../../atoms"
import { updateTemplateHeader } from "./actions"

const SLOT: SlotName = "header"

interface HeaderFormProps {
  templateId: string
  initialVariant?: string
  onValidChange?: (isValid: boolean) => void
}

export const HeaderForm = forwardRef<WizardFormRef, HeaderFormProps>(
  ({ templateId, initialVariant = "standard", onValidChange }, ref) => {
    const [selected, setSelected] = useState(initialVariant)
    const [, startTransition] = useTransition()

    useEffect(() => {
      onValidChange?.(true)
    }, [onValidChange])

    useEffect(() => {
      if (initialVariant) setSelected(initialVariant)
    }, [initialVariant])

    useImperativeHandle(ref, () => ({
      saveAndNext: () =>
        new Promise<void>((resolve, reject) => {
          startTransition(async () => {
            try {
              const result = await updateTemplateHeader(templateId, selected)
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

    const variants = Object.entries(VARIANT_REGISTRY[SLOT])

    return (
      <div className="space-y-3">
        <div className="flex flex-wrap gap-3">
          {variants.map(([key, entry]) => (
            <div
              key={key}
              className="flex shrink-0 flex-col items-center gap-1"
            >
              <VariantThumbnail
                state={selected === key ? "selected" : "idle"}
                size="md"
                label={entry.label.en}
                onClick={() => setSelected(key)}
              >
                <MiniPaperMockup slot={SLOT} variant={key} />
              </VariantThumbnail>
              <p className="text-muted-foreground max-w-20 text-center text-[9px] leading-tight">
                {entry.description.en}
              </p>
            </div>
          ))}
        </div>
      </div>
    )
  }
)
HeaderForm.displayName = "HeaderForm"
