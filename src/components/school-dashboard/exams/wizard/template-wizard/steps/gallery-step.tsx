"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useMemo } from "react"
import { FileText } from "lucide-react"

import { Badge } from "@/components/ui/badge"

import { regionPresetToComposition } from "../../../templates/composition/region-mapping"
import {
  MENA_PRIVATE,
  SA_NATIONAL,
  SD_NATIONAL,
  US_STANDARD,
} from "../../../templates/presets"
import type { RegionPreset } from "../../../templates/presets"
import { FullPaperMockup, GalleryCard } from "../../atoms"
import { useWizard } from "../../context/wizard-provider"
import { DEFAULT_DECORATIONS, type DecorationConfig } from "../../types"

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

interface GalleryStepProps {
  lang: string
  schoolTemplates?: SchoolTemplate[]
}

export function GalleryStep({ lang, schoolTemplates = [] }: GalleryStepProps) {
  const { state, dispatch } = useWizard()
  const isAr = lang === "ar"

  const presetCards = useMemo(
    () =>
      PRESETS.map((preset) => {
        const composition = regionPresetToComposition(preset)
        return {
          id: preset.id,
          name: preset.name,
          description: preset.description,
          headerVariant:
            (composition.slots as Record<string, string>)?.header || "standard",
          footerVariant:
            (composition.slots as Record<string, string>)?.footer || "standard",
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

  const selectPreset = (presetId: string | null) => {
    dispatch({ type: "SET_PRESET", payload: presetId })

    if (!presetId) {
      // Blank template — reset to defaults
      dispatch({
        type: "APPLY_PRESET",
        payload: {
          slots: {
            header: "standard",
            footer: "standard",
            studentInfo: "standard",
            instructions: "standard",
            answerSheet: "standard",
            cover: "standard",
          },
          decorations: DEFAULT_DECORATIONS,
        },
      })
      return
    }

    const preset = PRESETS.find((p) => p.id === presetId)
    if (!preset) return

    const composition = regionPresetToComposition(preset)
    const slots = composition.slots as Record<string, string> | undefined

    dispatch({
      type: "APPLY_PRESET",
      payload: {
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
      },
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">
          {isAr ? "اختر قالب" : "Choose a Template"}
        </h2>
        <p className="text-muted-foreground text-sm">
          {isAr
            ? "ابدأ من قالب إقليمي جاهز أو ابدأ من الصفر"
            : "Start from a regional preset or begin from scratch"}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {/* Blank template */}
        <GalleryCard
          state={state.selectedPresetId === null ? "selected" : "idle"}
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
            <p className="text-sm font-medium">
              {isAr ? "قالب فارغ" : "Blank"}
            </p>
            <p className="text-muted-foreground text-xs">
              {isAr ? "ابدأ من الصفر" : "Start from scratch"}
            </p>
          </div>
          {state.selectedPresetId === null && (
            <Badge className="absolute end-2 top-2 text-[10px]">
              {isAr ? "محدد" : "Selected"}
            </Badge>
          )}
        </GalleryCard>

        {/* Regional presets */}
        {presetCards.map((card) => (
          <GalleryCard
            key={card.id}
            state={state.selectedPresetId === card.id ? "selected" : "idle"}
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
              <p className="text-sm font-medium">
                {card.name[isAr ? "ar" : "en"]}
              </p>
              <p className="text-muted-foreground line-clamp-2 text-xs">
                {card.description[isAr ? "ar" : "en"]}
              </p>
            </div>
            {state.selectedPresetId === card.id && (
              <Badge className="absolute end-2 top-2 text-[10px]">
                {isAr ? "محدد" : "Selected"}
              </Badge>
            )}
          </GalleryCard>
        ))}
      </div>

      {/* School templates */}
      {schoolTemplates.length > 0 && (
        <>
          <h3 className="text-sm font-medium">
            {isAr ? "قوالب المدرسة" : "School Templates"}
          </h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {schoolTemplates.map((t) => (
              <GalleryCard
                key={t.id}
                state={
                  state.selectedPresetId === `school-${t.id}`
                    ? "selected"
                    : "idle"
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
