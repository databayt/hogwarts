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
import { Frame, Paintbrush, Type } from "lucide-react"

import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { ErrorToast } from "@/components/atom/toast"
import type { WizardFormRef } from "@/components/form/wizard"

import type { DecorationConfig } from "../../types"
import { DEFAULT_DECORATIONS } from "../../types"
import { updateTemplatePrint } from "./actions"

interface PrintFormProps {
  templateId: string
  initialData?: {
    pageSize: "A4" | "LETTER"
    orientation: "portrait" | "landscape"
    answerSheetType: "NONE" | "SEPARATE" | "BUBBLE"
    layout: "SINGLE_COLUMN" | "TWO_COLUMN" | "BOOKLET"
    decorations: DecorationConfig
  }
  onValidChange?: (isValid: boolean) => void
}

export const PrintForm = forwardRef<WizardFormRef, PrintFormProps>(
  ({ templateId, initialData, onValidChange }, ref) => {
    const [pageSize, setPageSize] = useState<"A4" | "LETTER">(
      initialData?.pageSize ?? "A4"
    )
    const [orientation, setOrientation] = useState<"portrait" | "landscape">(
      initialData?.orientation ?? "portrait"
    )
    const [answerSheetType, setAnswerSheetType] = useState<
      "NONE" | "SEPARATE" | "BUBBLE"
    >(initialData?.answerSheetType ?? "SEPARATE")
    const [layout, setLayout] = useState<
      "SINGLE_COLUMN" | "TWO_COLUMN" | "BOOKLET"
    >(initialData?.layout ?? "SINGLE_COLUMN")
    const [decorations, setDecorations] = useState<DecorationConfig>(
      initialData?.decorations ?? DEFAULT_DECORATIONS
    )
    const [, startTransition] = useTransition()

    useEffect(() => {
      onValidChange?.(true)
    }, [onValidChange])

    useEffect(() => {
      if (initialData) {
        setPageSize(initialData.pageSize)
        setOrientation(initialData.orientation)
        setAnswerSheetType(initialData.answerSheetType)
        setLayout(initialData.layout)
        setDecorations(initialData.decorations)
      }
    }, [initialData])

    useImperativeHandle(ref, () => ({
      saveAndNext: () =>
        new Promise<void>((resolve, reject) => {
          startTransition(async () => {
            try {
              const result = await updateTemplatePrint(templateId, {
                pageSize,
                orientation,
                answerSheetType,
                layout,
                decorations,
              })
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

    return (
      <div className="space-y-8">
        {/* Print settings */}
        <section className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Page size */}
            <div className="space-y-2">
              <Label>Page Size</Label>
              <Select
                value={pageSize}
                onValueChange={(v) => setPageSize(v as "A4" | "LETTER")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A4">A4 (210 x 297 mm)</SelectItem>
                  <SelectItem value="LETTER">Letter (8.5 x 11 in)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Orientation */}
            <div className="space-y-2">
              <Label>Orientation</Label>
              <ToggleGroup
                type="single"
                value={orientation}
                onValueChange={(v) => {
                  if (v) setOrientation(v as "portrait" | "landscape")
                }}
                className="justify-start"
              >
                <ToggleGroupItem value="portrait" className="text-xs">
                  Portrait
                </ToggleGroupItem>
                <ToggleGroupItem value="landscape" className="text-xs">
                  Landscape
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            {/* Answer sheet type */}
            <div className="space-y-2">
              <Label>Answer Sheet</Label>
              <ToggleGroup
                type="single"
                value={answerSheetType}
                onValueChange={(v) => {
                  if (v) setAnswerSheetType(v as "NONE" | "SEPARATE" | "BUBBLE")
                }}
                className="justify-start"
              >
                <ToggleGroupItem value="NONE" className="text-xs">
                  None
                </ToggleGroupItem>
                <ToggleGroupItem value="SEPARATE" className="text-xs">
                  Separate
                </ToggleGroupItem>
                <ToggleGroupItem value="BUBBLE" className="text-xs">
                  Bubble
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            {/* Layout */}
            <div className="space-y-2">
              <Label>Column Layout</Label>
              <ToggleGroup
                type="single"
                value={layout}
                onValueChange={(v) => {
                  if (v)
                    setLayout(v as "SINGLE_COLUMN" | "TWO_COLUMN" | "BOOKLET")
                }}
                className="justify-start"
              >
                <ToggleGroupItem value="SINGLE_COLUMN" className="text-xs">
                  Single
                </ToggleGroupItem>
                <ToggleGroupItem value="TWO_COLUMN" className="text-xs">
                  Two Column
                </ToggleGroupItem>
                <ToggleGroupItem value="BOOKLET" className="text-xs">
                  Booklet
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>
        </section>

        {/* Decorations */}
        <section className="space-y-4">
          <h3 className="text-sm font-medium">Decorations</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Accent bar */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <Paintbrush className="text-muted-foreground h-4 w-4" />
                <span className="text-sm">Accent Bar</span>
              </div>
              <Switch
                checked={decorations.accentBar.enabled}
                onCheckedChange={(checked) =>
                  setDecorations((curr) => ({
                    ...curr,
                    accentBar: { ...curr.accentBar, enabled: checked },
                  }))
                }
              />
            </div>

            {/* Watermark */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <Type className="text-muted-foreground h-4 w-4" />
                <span className="text-sm">Watermark</span>
              </div>
              <Switch
                checked={decorations.watermark.enabled}
                onCheckedChange={(checked) =>
                  setDecorations((curr) => ({
                    ...curr,
                    watermark: { ...curr.watermark, enabled: checked },
                  }))
                }
              />
            </div>

            {/* Frame */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <Frame className="text-muted-foreground h-4 w-4" />
                <span className="text-sm">Frame</span>
              </div>
              <Switch
                checked={decorations.frame.enabled}
                onCheckedChange={(checked) =>
                  setDecorations((curr) => ({
                    ...curr,
                    frame: { ...curr.frame, enabled: checked },
                  }))
                }
              />
            </div>
          </div>
        </section>
      </div>
    )
  }
)
PrintForm.displayName = "PrintForm"
