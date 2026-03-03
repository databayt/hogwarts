"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
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

import { VARIANT_REGISTRY } from "../../../templates/composition/registry"
import { MiniPaperMockup, VariantThumbnail } from "../../atoms"
import { useWizard } from "../../context/wizard-provider"

interface FooterPrintStepProps {
  lang: string
}

export function FooterPrintStep({ lang }: FooterPrintStepProps) {
  const { state, dispatch } = useWizard()
  const isAr = lang === "ar"

  const footerVariants = Object.entries(VARIANT_REGISTRY.footer)

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold">
          {isAr ? "التذييل والطباعة" : "Footer & Print"}
        </h2>
        <p className="text-muted-foreground text-sm">
          {isAr
            ? "اختر تصميم التذييل وإعدادات الزخارف والطباعة"
            : "Choose footer design, decorations, and print settings"}
        </p>
      </div>

      {/* Footer variant selection */}
      <section className="space-y-3">
        <h3 className="text-sm font-medium">
          {isAr ? "تصميم التذييل" : "Footer Design"}
        </h3>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {footerVariants.map(([key, entry]) => (
            <div
              key={key}
              className="flex shrink-0 flex-col items-center gap-1"
            >
              <VariantThumbnail
                state={state.footerVariant === key ? "selected" : "idle"}
                size="md"
                label={entry.label[isAr ? "ar" : "en"]}
                onClick={() =>
                  dispatch({ type: "SET_FOOTER_VARIANT", payload: key })
                }
              >
                <MiniPaperMockup slot="footer" variant={key} />
              </VariantThumbnail>
              <p className="text-muted-foreground max-w-20 text-center text-[9px] leading-tight">
                {entry.description[isAr ? "ar" : "en"]}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Decorations */}
      <section className="space-y-4">
        <h3 className="text-sm font-medium">
          {isAr ? "الزخارف" : "Decorations"}
        </h3>
        <div className="grid gap-4 sm:grid-cols-3">
          {/* Accent bar */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <Paintbrush className="text-muted-foreground h-4 w-4" />
              <span className="text-sm">
                {isAr ? "شريط ملون" : "Accent Bar"}
              </span>
            </div>
            <Switch
              checked={state.decorations.accentBar.enabled}
              onCheckedChange={(checked) =>
                dispatch({
                  type: "SET_DECORATIONS",
                  payload: {
                    ...state.decorations,
                    accentBar: {
                      ...state.decorations.accentBar,
                      enabled: checked,
                    },
                  },
                })
              }
            />
          </div>

          {/* Watermark */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <Type className="text-muted-foreground h-4 w-4" />
              <span className="text-sm">
                {isAr ? "علامة مائية" : "Watermark"}
              </span>
            </div>
            <Switch
              checked={state.decorations.watermark.enabled}
              onCheckedChange={(checked) =>
                dispatch({
                  type: "SET_DECORATIONS",
                  payload: {
                    ...state.decorations,
                    watermark: {
                      ...state.decorations.watermark,
                      enabled: checked,
                    },
                  },
                })
              }
            />
          </div>

          {/* Frame */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <Frame className="text-muted-foreground h-4 w-4" />
              <span className="text-sm">{isAr ? "إطار" : "Frame"}</span>
            </div>
            <Switch
              checked={state.decorations.frame.enabled}
              onCheckedChange={(checked) =>
                dispatch({
                  type: "SET_DECORATIONS",
                  payload: {
                    ...state.decorations,
                    frame: { ...state.decorations.frame, enabled: checked },
                  },
                })
              }
            />
          </div>
        </div>
      </section>

      {/* Print settings */}
      <section className="space-y-4">
        <h3 className="text-sm font-medium">
          {isAr ? "إعدادات الطباعة" : "Print Settings"}
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Page size */}
          <div className="space-y-2">
            <Label>{isAr ? "حجم الصفحة" : "Page Size"}</Label>
            <Select
              value={state.pageSize}
              onValueChange={(v) =>
                dispatch({
                  type: "SET_PRINT_CONFIG",
                  payload: { pageSize: v as "A4" | "LETTER" },
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A4">A4 (210 × 297 mm)</SelectItem>
                <SelectItem value="LETTER">Letter (8.5 × 11 in)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Orientation */}
          <div className="space-y-2">
            <Label>{isAr ? "الاتجاه" : "Orientation"}</Label>
            <ToggleGroup
              type="single"
              value={state.orientation}
              onValueChange={(v) => {
                if (v)
                  dispatch({
                    type: "SET_PRINT_CONFIG",
                    payload: {
                      orientation: v as "portrait" | "landscape",
                    },
                  })
              }}
              className="justify-start"
            >
              <ToggleGroupItem value="portrait" className="text-xs">
                {isAr ? "عمودي" : "Portrait"}
              </ToggleGroupItem>
              <ToggleGroupItem value="landscape" className="text-xs">
                {isAr ? "أفقي" : "Landscape"}
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* Answer sheet type */}
          <div className="space-y-2">
            <Label>{isAr ? "ورقة الإجابة" : "Answer Sheet"}</Label>
            <ToggleGroup
              type="single"
              value={state.answerSheetType}
              onValueChange={(v) => {
                if (v)
                  dispatch({
                    type: "SET_PRINT_CONFIG",
                    payload: {
                      answerSheetType: v as "NONE" | "SEPARATE" | "BUBBLE",
                    },
                  })
              }}
              className="justify-start"
            >
              <ToggleGroupItem value="NONE" className="text-xs">
                {isAr ? "بدون" : "None"}
              </ToggleGroupItem>
              <ToggleGroupItem value="SEPARATE" className="text-xs">
                {isAr ? "منفصلة" : "Separate"}
              </ToggleGroupItem>
              <ToggleGroupItem value="BUBBLE" className="text-xs">
                {isAr ? "فقاعات" : "Bubble"}
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* Layout */}
          <div className="space-y-2">
            <Label>{isAr ? "تخطيط الأعمدة" : "Column Layout"}</Label>
            <ToggleGroup
              type="single"
              value={state.layout}
              onValueChange={(v) => {
                if (v)
                  dispatch({
                    type: "SET_PRINT_CONFIG",
                    payload: {
                      layout: v as "SINGLE_COLUMN" | "TWO_COLUMN" | "BOOKLET",
                    },
                  })
              }}
              className="justify-start"
            >
              <ToggleGroupItem value="SINGLE_COLUMN" className="text-xs">
                {isAr ? "عمود واحد" : "Single"}
              </ToggleGroupItem>
              <ToggleGroupItem value="TWO_COLUMN" className="text-xs">
                {isAr ? "عمودان" : "Two Column"}
              </ToggleGroupItem>
              <ToggleGroupItem value="BOOKLET" className="text-xs">
                {isAr ? "كتيب" : "Booklet"}
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      </section>
    </div>
  )
}
