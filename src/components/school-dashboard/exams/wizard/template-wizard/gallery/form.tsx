"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useState,
  useTransition,
} from "react"
import { FileText } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { ErrorToast } from "@/components/atom/toast"
import type { WizardFormRef } from "@/components/form/wizard"
import { useLocale } from "@/components/internationalization/use-locale"

import { regionPresetToComposition } from "../../../templates/composition/region-mapping"
import {
  MENA_PRIVATE,
  SA_NATIONAL,
  SD_NATIONAL,
  US_STANDARD,
} from "../../../templates/presets"
import type { RegionPreset } from "../../../templates/presets"
import { FullPaperMockup, GalleryCard } from "../../atoms"
import { DEFAULT_DECORATIONS, type DecorationConfig } from "../../types"
import { commonLabels, galleryLabels } from "../labels"
import { updateTemplatePreset } from "./actions"

const PRESETS: RegionPreset[] = [
  SD_NATIONAL,
  SA_NATIONAL,
  US_STANDARD,
  MENA_PRIVATE,
]

interface SchoolTemplate {
  id: string
  name: string
  blockConfig: unknown
}

interface GalleryFormProps {
  templateId: string
  initialPresetId: string | null
  schoolTemplates: SchoolTemplate[]
  onValidChange?: (isValid: boolean) => void
}

export const GalleryForm = forwardRef<WizardFormRef, GalleryFormProps>(
  ({ templateId, initialPresetId, schoolTemplates, onValidChange }, ref) => {
    const [selectedPresetId, setSelectedPresetId] = useState<string | null>(
      initialPresetId
    )
    const [isPending, startTransition] = useTransition()
    const { locale } = useLocale()
    const lang = locale === "ar" ? "ar" : "en"

    // Gallery is always valid
    React.useEffect(() => {
      onValidChange?.(true)
    }, [onValidChange])

    const presetCards = useMemo(
      () =>
        PRESETS.map((preset) => {
          const composition = regionPresetToComposition(preset)
          return {
            id: preset.id,
            name: preset.name,
            description: preset.description,
            headerVariant:
              (composition.slots as Record<string, string>)?.header ||
              "standard",
            footerVariant:
              (composition.slots as Record<string, string>)?.footer ||
              "standard",
            studentInfoVariant:
              (composition.slots as Record<string, string>)?.studentInfo ||
              "standard",
            instructionsVariant: "standard",
            decorations: {
              accentBar: { enabled: false },
              watermark: composition.decorations?.watermark ?? {
                enabled: false,
              },
              frame: { enabled: false },
            } as DecorationConfig,
          }
        }),
      []
    )

    const buildBlockConfig = useCallback(
      (presetId: string | null): Record<string, unknown> => {
        if (!presetId) {
          return {
            selectedPresetId: null,
            slots: {
              header: "standard",
              footer: "standard",
              studentInfo: "standard",
              instructions: "standard",
              answerSheet: "standard",
              cover: "standard",
            },
            decorations: DEFAULT_DECORATIONS,
          }
        }

        const preset = PRESETS.find((p) => p.id === presetId)
        if (!preset) {
          return {
            selectedPresetId: presetId,
            slots: {
              header: "standard",
              footer: "standard",
              studentInfo: "standard",
              instructions: "standard",
              answerSheet: "standard",
              cover: "standard",
            },
            decorations: DEFAULT_DECORATIONS,
          }
        }

        const composition = regionPresetToComposition(preset)
        const slots = composition.slots as Record<string, string> | undefined

        return {
          selectedPresetId: presetId,
          slots: {
            header: slots?.header || "standard",
            footer: slots?.footer || "standard",
            studentInfo: slots?.studentInfo || "standard",
            instructions: slots?.instructions || "standard",
            answerSheet: slots?.answerSheet || "standard",
            cover: slots?.cover || "standard",
          },
          decorations: {
            accentBar: composition.decorations?.accentBar ?? { enabled: false },
            watermark: composition.decorations?.watermark ?? { enabled: false },
            frame: composition.decorations?.frame ?? { enabled: false },
          },
        }
      },
      []
    )

    const selectPreset = useCallback((presetId: string | null) => {
      setSelectedPresetId(presetId)
    }, [])

    useImperativeHandle(ref, () => ({
      saveAndNext: () =>
        new Promise<void>((resolve, reject) => {
          startTransition(async () => {
            try {
              const blockConfig = buildBlockConfig(selectedPresetId)
              const result = await updateTemplatePreset(
                templateId,
                selectedPresetId,
                blockConfig
              )
              if (!result.success) {
                ErrorToast(result.error || commonLabels.failedToSave[lang])
                reject(new Error(result.error))
                return
              }
              resolve()
            } catch (err) {
              const msg =
                err instanceof Error
                  ? err.message
                  : commonLabels.failedToSave[lang]
              ErrorToast(msg)
              reject(err)
            }
          })
        }),
    }))

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {/* Blank template */}
          <GalleryCard
            state={selectedPresetId === null ? "selected" : "idle"}
            size="lg"
            onClick={() => selectPreset(null)}
            className="flex flex-col items-center"
          >
            <div className="flex flex-1 items-center justify-center p-4">
              <div className="flex aspect-[210/297] w-full items-center justify-center rounded border border-dashed">
                <FileText className="text-muted-foreground h-8 w-8" />
              </div>
            </div>
            <div className="border-t px-3 py-2 text-center">
              <p className="text-sm font-medium">{galleryLabels.blank[lang]}</p>
              <p className="text-muted-foreground text-xs">
                {galleryLabels.startFromScratch[lang]}
              </p>
            </div>
            {selectedPresetId === null && (
              <Badge className="absolute end-2 top-2 text-[10px]">
                {galleryLabels.selected[lang]}
              </Badge>
            )}
          </GalleryCard>

          {/* Regional presets */}
          {presetCards.map((card) => (
            <GalleryCard
              key={card.id}
              state={selectedPresetId === card.id ? "selected" : "idle"}
              size="lg"
              onClick={() => selectPreset(card.id)}
              className="flex flex-col"
            >
              <div className="flex flex-1 items-center justify-center p-3">
                <FullPaperMockup
                  headerVariant={card.headerVariant}
                  studentInfoVariant={card.studentInfoVariant}
                  instructionsVariant={card.instructionsVariant}
                  footerVariant={card.footerVariant}
                />
              </div>
              <div className="border-t px-3 py-2 text-center">
                <p className="text-sm font-medium">{card.name[lang]}</p>
                <p className="text-muted-foreground line-clamp-2 text-xs">
                  {card.description[lang]}
                </p>
              </div>
              {selectedPresetId === card.id && (
                <Badge className="absolute end-2 top-2 text-[10px]">
                  {galleryLabels.selected[lang]}
                </Badge>
              )}
            </GalleryCard>
          ))}
        </div>

        {/* School templates */}
        {schoolTemplates.length > 0 && (
          <>
            <h3 className="text-sm font-medium">
              {galleryLabels.schoolTemplates[lang]}
            </h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {schoolTemplates.map((t) => (
                <GalleryCard
                  key={t.id}
                  state={
                    selectedPresetId === `school-${t.id}` ? "selected" : "idle"
                  }
                  size="lg"
                  onClick={() => selectPreset(`school-${t.id}`)}
                  className="flex flex-col"
                >
                  <div className="flex flex-1 items-center justify-center p-3">
                    <FullPaperMockup />
                  </div>
                  <div className="border-t px-3 py-2 text-center">
                    <p className="text-sm font-medium">{t.name}</p>
                  </div>
                </GalleryCard>
              ))}
            </div>
          </>
        )}
      </div>
    )
  }
)

GalleryForm.displayName = "GalleryForm"
