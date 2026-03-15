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
import { useLocale } from "@/components/internationalization/use-locale"

import { VARIANT_REGISTRY } from "../../../templates/composition/registry"
import type { SlotName } from "../../../templates/composition/types"
import { SectionCard } from "../../atoms"
import { updateTemplateCover } from "./actions"

const SLOT: SlotName = "cover"

interface CoverFormProps {
  templateId: string
  initialVariant?: string
  onValidChange?: (isValid: boolean) => void
}

export const CoverForm = forwardRef<WizardFormRef, CoverFormProps>(
  ({ templateId, initialVariant = "standard", onValidChange }, ref) => {
    const [selected, setSelected] = useState(initialVariant)
    const [, startTransition] = useTransition()
    const { locale } = useLocale()
    const lang = locale === "ar" ? "ar" : "en"

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
              const result = await updateTemplateCover(templateId, selected)
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
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {variants.map(([key, entry]) => (
          <SectionCard
            key={key}
            slot={SLOT}
            variant={key}
            label={entry.label[lang]}
            description={entry.description[lang]}
            selected={selected === key}
            onClick={() => setSelected(key)}
          />
        ))}
      </div>
    )
  }
)
CoverForm.displayName = "CoverForm"
