"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useMemo } from "react"

import { Badge } from "@/components/ui/badge"

import { VARIANT_REGISTRY } from "../../../templates/composition/registry"
import type { SlotName } from "../../../templates/composition/types"
import { MiniPaperMockup, VariantThumbnail } from "../../atoms"
import { useWizard } from "../../context/wizard-provider"

const SLOT_ORDER: { slot: SlotName; label: { en: string; ar: string } }[] = [
  { slot: "header", label: { en: "Header", ar: "الرأس" } },
  { slot: "studentInfo", label: { en: "Student Info", ar: "بيانات الطالب" } },
  {
    slot: "instructions",
    label: { en: "Instructions", ar: "التعليمات" },
  },
  {
    slot: "answerSheet",
    label: { en: "Answer Sheet", ar: "ورقة الإجابة" },
  },
  { slot: "cover", label: { en: "Cover Page", ar: "صفحة الغلاف" } },
  { slot: "footer", label: { en: "Footer", ar: "التذييل" } },
]

const SLOT_STATE_KEY: Record<
  SlotName,
  keyof ReturnType<typeof useWizard>["state"]
> = {
  header: "headerVariant",
  footer: "footerVariant",
  studentInfo: "studentInfoVariant",
  instructions: "instructionsVariant",
  answerSheet: "answerSheetVariant",
  cover: "coverVariant",
}

const SLOT_ACTION_TYPE: Record<SlotName, string> = {
  header: "SET_HEADER_VARIANT",
  footer: "SET_FOOTER_VARIANT",
  studentInfo: "SET_STUDENT_INFO_VARIANT",
  instructions: "SET_INSTRUCTIONS_VARIANT",
  answerSheet: "SET_ANSWER_SHEET_VARIANT",
  cover: "SET_COVER_VARIANT",
}

interface LayoutStepProps {
  lang: string
}

export function LayoutStep({ lang }: LayoutStepProps) {
  const { state, dispatch } = useWizard()
  const isAr = lang === "ar"

  const slotEntries = useMemo(
    () =>
      SLOT_ORDER.map(({ slot, label }) => ({
        slot,
        label,
        variants: Object.entries(VARIANT_REGISTRY[slot]).map(
          ([key, entry]) => ({
            key,
            label: entry.label,
            description: entry.description,
          })
        ),
        currentVariant: state[SLOT_STATE_KEY[slot]] as string,
      })),
    [state]
  )

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold">
          {isAr ? "تخطيط الورقة" : "Paper Layout"}
        </h2>
        <p className="text-muted-foreground text-sm">
          {isAr
            ? "اختر تصميم كل قسم من أقسام ورقة الاختبار"
            : "Choose a design for each section of the exam paper"}
        </p>
      </div>

      {slotEntries.map(({ slot, label, variants, currentVariant }) => (
        <section key={slot} className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium">{label[isAr ? "ar" : "en"]}</h3>
            <Badge variant="outline" className="text-[10px]">
              {VARIANT_REGISTRY[slot][currentVariant]?.label[
                isAr ? "ar" : "en"
              ] ?? currentVariant}
            </Badge>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2">
            {variants.map((v) => (
              <div
                key={v.key}
                className="flex shrink-0 flex-col items-center gap-1"
              >
                <VariantThumbnail
                  state={currentVariant === v.key ? "selected" : "idle"}
                  size="md"
                  label={v.label[isAr ? "ar" : "en"]}
                  onClick={() =>
                    dispatch({
                      type: SLOT_ACTION_TYPE[slot] as never,
                      payload: v.key as never,
                    })
                  }
                >
                  <MiniPaperMockup slot={slot} variant={v.key} />
                </VariantThumbnail>
                <p className="text-muted-foreground max-w-20 text-center text-[9px] leading-tight">
                  {v.description[isAr ? "ar" : "en"]}
                </p>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
