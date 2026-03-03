"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Composition Panel — visual slot configurator for exam paper templates
 * Each slot shows a toggle group of available variants. Changes serialize
 * to CompositionConfig JSON → saved as blockConfig on ExamPaperConfig.
 */
import { useCallback } from "react"

import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

import { DEFAULT_COMPOSITION, VARIANT_REGISTRY } from "../templates/composition"
import type { CompositionConfig, SlotName } from "../templates/composition"

interface CompositionPanelProps {
  value: CompositionConfig
  onChange: (config: CompositionConfig) => void
  locale: "en" | "ar"
}

const SLOT_LABELS: Record<SlotName, { en: string; ar: string }> = {
  header: { en: "Header", ar: "الرأس" },
  footer: { en: "Footer", ar: "التذييل" },
  studentInfo: { en: "Student Info", ar: "بيانات الطالب" },
  instructions: { en: "Instructions", ar: "التعليمات" },
  answerSheet: { en: "Answer Sheet", ar: "ورقة الإجابة" },
  cover: { en: "Cover", ar: "الغلاف" },
}

const SLOT_ORDER: SlotName[] = [
  "header",
  "footer",
  "studentInfo",
  "instructions",
  "answerSheet",
  "cover",
]

export function CompositionPanel({
  value,
  onChange,
  locale,
}: CompositionPanelProps) {
  const isRTL = locale === "ar"

  const handleSlotChange = useCallback(
    (slot: SlotName, variant: string) => {
      if (!variant) return
      onChange({
        ...value,
        slots: { ...value.slots, [slot]: variant },
      })
    },
    [value, onChange]
  )

  const handleDecorationToggle = useCallback(
    (key: keyof CompositionConfig["decorations"], enabled: boolean) => {
      onChange({
        ...value,
        decorations: {
          ...value.decorations,
          [key]: { ...value.decorations[key], enabled },
        },
      })
    },
    [value, onChange]
  )

  return (
    <div className="space-y-5" dir={isRTL ? "rtl" : "ltr"}>
      {/* Slot variant selectors */}
      {SLOT_ORDER.map((slot) => {
        const variants = VARIANT_REGISTRY[slot]
        const label = SLOT_LABELS[slot][locale]
        const currentValue = value.slots[slot]

        return (
          <div key={slot} className="space-y-2">
            <Label className="text-sm font-medium">{label}</Label>
            <ToggleGroup
              type="single"
              value={currentValue}
              onValueChange={(v) => handleSlotChange(slot, v)}
              className="flex flex-wrap justify-start gap-1"
            >
              {Object.entries(variants).map(([variantKey, entry]) => (
                <ToggleGroupItem
                  key={variantKey}
                  value={variantKey}
                  size="sm"
                  className="text-xs"
                  title={entry.description[locale]}
                >
                  {entry.label[locale]}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        )
      })}

      {/* Decorations */}
      <div className="border-t pt-4">
        <Label className="mb-3 block text-sm font-medium">
          {isRTL ? "الزخارف" : "Decorations"}
        </Label>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label className="text-sm">
                {isRTL ? "شريط ملون" : "Accent Bar"}
              </Label>
              <p className="text-muted-foreground text-xs">
                {isRTL ? "شريط ملون أعلى الصفحة" : "Colored bar at page top"}
              </p>
            </div>
            <Switch
              checked={value.decorations.accentBar.enabled}
              onCheckedChange={(checked) =>
                handleDecorationToggle("accentBar", checked)
              }
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label className="text-sm">
                {isRTL ? "علامة مائية" : "Watermark"}
              </Label>
              <p className="text-muted-foreground text-xs">
                {isRTL ? "نص مائل خلف المحتوى" : "Diagonal text behind content"}
              </p>
            </div>
            <Switch
              checked={value.decorations.watermark.enabled}
              onCheckedChange={(checked) =>
                handleDecorationToggle("watermark", checked)
              }
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label className="text-sm">
                {isRTL ? "إطار مزدوج" : "Double Frame"}
              </Label>
              <p className="text-muted-foreground text-xs">
                {isRTL
                  ? "إطار مزدوج حول المحتوى"
                  : "Double border around content"}
              </p>
            </div>
            <Switch
              checked={value.decorations.frame.enabled}
              onCheckedChange={(checked) =>
                handleDecorationToggle("frame", checked)
              }
            />
          </div>
        </div>
      </div>
    </div>
  )
}

/** Parse blockConfig JSON into CompositionConfig, falling back to defaults */
export function parseBlockConfig(blockConfig: unknown): CompositionConfig {
  if (!blockConfig || typeof blockConfig !== "object") {
    return DEFAULT_COMPOSITION
  }

  const cfg = blockConfig as Partial<CompositionConfig>

  return {
    slots: {
      ...DEFAULT_COMPOSITION.slots,
      ...(cfg.slots || {}),
    },
    decorations: {
      accentBar: {
        ...DEFAULT_COMPOSITION.decorations.accentBar,
        ...(cfg.decorations?.accentBar || {}),
      },
      watermark: {
        ...DEFAULT_COMPOSITION.decorations.watermark,
        ...(cfg.decorations?.watermark || {}),
      },
      frame: {
        ...DEFAULT_COMPOSITION.decorations.frame,
        ...(cfg.decorations?.frame || {}),
      },
    },
    slotProps: {
      ...DEFAULT_COMPOSITION.slotProps,
      ...(cfg.slotProps || {}),
    },
  }
}
