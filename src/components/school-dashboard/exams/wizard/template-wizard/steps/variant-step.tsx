"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useMemo, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

import { VARIANT_REGISTRY } from "../../../templates/composition/registry"
import type { SlotName } from "../../../templates/composition/types"
import { useWizard } from "../../context/wizard-provider"

interface VariantStepProps {
  slot: "header" | "footer" | "studentInfo" | "instructions"
  lang: string
}

const SLOT_ACTION_MAP = {
  header: "SET_HEADER_VARIANT",
  footer: "SET_FOOTER_VARIANT",
  studentInfo: "SET_STUDENT_INFO_VARIANT",
  instructions: "SET_INSTRUCTIONS_VARIANT",
} as const

const SLOT_STATE_MAP = {
  header: "headerVariant",
  footer: "footerVariant",
  studentInfo: "studentInfoVariant",
  instructions: "instructionsVariant",
} as const

const SLOT_LABELS: Record<string, { en: string; ar: string }> = {
  header: { en: "Header Style", ar: "نمط الترويسة" },
  footer: { en: "Footer Style", ar: "نمط التذييل" },
  studentInfo: { en: "Student Info Style", ar: "نمط بيانات الطالب" },
  instructions: { en: "Instructions Style", ar: "نمط التعليمات" },
}

export function VariantStep({ slot, lang }: VariantStepProps) {
  const { state, dispatch } = useWizard()
  const isAr = lang === "ar"

  const variants = useMemo(() => {
    const registry = VARIANT_REGISTRY[slot as SlotName]
    if (!registry) return []
    return Object.entries(registry).map(([key, entry]) => ({
      key,
      label: entry.label,
      description: entry.description,
    }))
  }, [slot])

  const currentVariant = state[SLOT_STATE_MAP[slot]]
  const currentIndex = variants.findIndex((v) => v.key === currentVariant)
  const [browseIndex, setBrowseIndex] = useState(
    currentIndex >= 0 ? currentIndex : 0
  )

  const activeVariant = variants[browseIndex]

  const selectVariant = (key: string) => {
    dispatch({ type: SLOT_ACTION_MAP[slot], payload: key })
  }

  const prev = () => {
    setBrowseIndex((i) => (i > 0 ? i - 1 : variants.length - 1))
  }

  const next = () => {
    setBrowseIndex((i) => (i < variants.length - 1 ? i + 1 : 0))
  }

  if (variants.length === 0) {
    return (
      <p className="text-muted-foreground">
        {isAr ? "لا توجد خيارات متاحة" : "No variants available"}
      </p>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">
          {SLOT_LABELS[slot]?.[isAr ? "ar" : "en"] || slot}
        </h2>
        <p className="text-muted-foreground text-sm">
          {isAr
            ? "تصفح الأنماط المتاحة واختر الأنسب"
            : "Browse available styles and select the best fit"}
        </p>
      </div>

      {/* Variant browser: one variant centered with left/right arrows */}
      <div className="flex items-center justify-center gap-4">
        <Button variant="outline" size="icon" onClick={prev}>
          <ChevronLeft className="h-5 w-5 rtl:rotate-180" />
        </Button>

        <Card
          className={cn(
            "w-full max-w-md cursor-pointer transition-all",
            activeVariant?.key === currentVariant &&
              "ring-primary ring-2 ring-offset-2"
          )}
          onClick={() => activeVariant && selectVariant(activeVariant.key)}
        >
          <CardContent className="flex flex-col items-center gap-4 py-8">
            {/* Preview placeholder - will be enhanced with usePDF later */}
            <div className="bg-muted flex h-40 w-full items-center justify-center rounded-lg">
              <span className="text-muted-foreground text-sm">
                {activeVariant?.label[isAr ? "ar" : "en"]}
              </span>
            </div>

            <div className="text-center">
              <p className="font-medium">
                {activeVariant?.label[isAr ? "ar" : "en"]}
              </p>
              <p className="text-muted-foreground text-sm">
                {activeVariant?.description[isAr ? "ar" : "en"]}
              </p>
            </div>

            {activeVariant?.key === currentVariant && (
              <Badge>{isAr ? "محدد" : "Selected"}</Badge>
            )}
          </CardContent>
        </Card>

        <Button variant="outline" size="icon" onClick={next}>
          <ChevronRight className="h-5 w-5 rtl:rotate-180" />
        </Button>
      </div>

      {/* Dots indicator */}
      <div className="flex justify-center gap-1.5">
        {variants.map((v, i) => (
          <button
            key={v.key}
            onClick={() => setBrowseIndex(i)}
            className={cn(
              "h-2 w-2 rounded-full transition-all",
              i === browseIndex ? "bg-primary w-4" : "bg-muted-foreground/30"
            )}
            aria-label={v.label[isAr ? "ar" : "en"]}
          />
        ))}
      </div>

      {/* Quick select grid */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {variants.map((v) => (
          <button
            key={v.key}
            onClick={() => {
              selectVariant(v.key)
              setBrowseIndex(variants.indexOf(v))
            }}
            className={cn(
              "rounded-lg border px-3 py-2 text-xs transition-colors",
              v.key === currentVariant
                ? "border-primary bg-primary/10 font-medium"
                : "border-border hover:bg-accent"
            )}
          >
            {v.label[isAr ? "ar" : "en"]}
          </button>
        ))}
      </div>
    </div>
  )
}
