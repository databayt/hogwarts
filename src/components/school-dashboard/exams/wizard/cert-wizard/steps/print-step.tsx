"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { WizardCard } from "../../atoms/wizard-card"
import { useCertWizard } from "../context/cert-wizard-provider"

const PAGE_SIZES = [
  { value: "A4", en: "A4 (210 × 297mm)", ar: "A4 (210 × 297 ملم)" },
  {
    value: "LETTER",
    en: "Letter (8.5 × 11in)",
    ar: "ليتر (8.5 × 11 بوصة)",
  },
] as const

const ORIENTATIONS = [
  { value: "landscape", en: "Landscape", ar: "أفقي" },
  { value: "portrait", en: "Portrait", ar: "عمودي" },
] as const

export function PrintStep({ lang }: { lang: string }) {
  const { state, dispatch } = useCertWizard()
  const isAr = lang === "ar"

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">
          {isAr ? "إعداد الصفحة" : "Page Setup"}
        </h3>
        <p className="text-muted-foreground text-sm">
          {isAr
            ? "اختر حجم الورق واتجاه الطباعة"
            : "Choose paper size and print orientation"}
        </p>
      </div>

      {/* Page Size */}
      <div className="space-y-2">
        <p className="text-sm font-medium">
          {isAr ? "حجم الصفحة" : "Page Size"}
        </p>
        <div className="flex gap-3">
          {PAGE_SIZES.map((ps) => (
            <WizardCard
              key={ps.value}
              state={state.pageSize === ps.value ? "selected" : "idle"}
              size="md"
              onClick={() =>
                dispatch({
                  type: "SET_PRINT_CONFIG",
                  payload: {
                    pageSize: ps.value as "A4" | "LETTER",
                  },
                })
              }
              className="flex-1"
            >
              <p className="text-center text-sm font-medium">
                {isAr ? ps.ar : ps.en}
              </p>
            </WizardCard>
          ))}
        </div>
      </div>

      {/* Orientation */}
      <div className="space-y-2">
        <p className="text-sm font-medium">
          {isAr ? "اتجاه الطباعة" : "Orientation"}
        </p>
        <div className="flex gap-3">
          {ORIENTATIONS.map((o) => (
            <WizardCard
              key={o.value}
              state={state.orientation === o.value ? "selected" : "idle"}
              size="md"
              onClick={() =>
                dispatch({
                  type: "SET_PRINT_CONFIG",
                  payload: {
                    orientation: o.value as "portrait" | "landscape",
                  },
                })
              }
              className="flex-1"
            >
              <div className="flex flex-col items-center gap-2">
                <div
                  className={`border-muted-foreground/30 rounded border ${
                    o.value === "landscape" ? "h-8 w-12" : "h-12 w-8"
                  }`}
                />
                <p className="text-sm font-medium">{isAr ? o.ar : o.en}</p>
              </div>
            </WizardCard>
          ))}
        </div>
      </div>
    </div>
  )
}
