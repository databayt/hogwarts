"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

import type { ExamWizardAction, ExamWizardState } from "../types"

interface PaperConfigStepProps {
  lang: string
  state: ExamWizardState
  dispatch: React.Dispatch<ExamWizardAction>
}

export function PaperConfigStep({
  lang,
  state,
  dispatch,
}: PaperConfigStepProps) {
  const isAr = lang === "ar"

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">
          {isAr ? "إعدادات الورقة" : "Paper Configuration"}
        </h2>
        <p className="text-muted-foreground text-sm">
          {isAr
            ? "اضبط إعدادات طباعة ورقة الاختبار"
            : "Configure exam paper printing settings"}
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Paper template */}
        <div className="space-y-2">
          <Label>{isAr ? "نمط الورقة" : "Paper Template"}</Label>
          <Select
            value={state.paperTemplate}
            onValueChange={(v) =>
              dispatch({
                type: "SET_PAPER_CONFIG",
                payload: {
                  paperTemplate: v as ExamWizardState["paperTemplate"],
                },
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CLASSIC">
                {isAr ? "كلاسيكي" : "Classic"}
              </SelectItem>
              <SelectItem value="MODERN">{isAr ? "حديث" : "Modern"}</SelectItem>
              <SelectItem value="FORMAL">{isAr ? "رسمي" : "Formal"}</SelectItem>
              <SelectItem value="CUSTOM">{isAr ? "مخصص" : "Custom"}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Page size */}
        <div className="space-y-2">
          <Label>{isAr ? "حجم الصفحة" : "Page Size"}</Label>
          <Select
            value={state.pageSize}
            onValueChange={(v) =>
              dispatch({
                type: "SET_PAPER_CONFIG",
                payload: { pageSize: v as ExamWizardState["pageSize"] },
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="A4">A4</SelectItem>
              <SelectItem value="Letter">Letter</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Version count */}
        <div className="space-y-2">
          <Label>{isAr ? "عدد النسخ" : "Number of Versions"}</Label>
          <Select
            value={String(state.versionCount)}
            onValueChange={(v) =>
              dispatch({
                type: "SET_PAPER_CONFIG",
                payload: { versionCount: parseInt(v) },
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1</SelectItem>
              <SelectItem value="2">2 (A, B)</SelectItem>
              <SelectItem value="3">3 (A, B, C)</SelectItem>
              <SelectItem value="4">4 (A, B, C, D)</SelectItem>
              <SelectItem value="5">5 (A, B, C, D, E)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Toggle switches */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium">
          {isAr ? "خيارات العرض" : "Display Options"}
        </h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="shuffle-questions">
              {isAr ? "خلط الأسئلة" : "Shuffle Questions"}
            </Label>
            <Switch
              id="shuffle-questions"
              checked={state.shuffleQuestions}
              onCheckedChange={(v) =>
                dispatch({
                  type: "SET_PAPER_CONFIG",
                  payload: { shuffleQuestions: v },
                })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="shuffle-options">
              {isAr ? "خلط الخيارات" : "Shuffle Options"}
            </Label>
            <Switch
              id="shuffle-options"
              checked={state.shuffleOptions}
              onCheckedChange={(v) =>
                dispatch({
                  type: "SET_PAPER_CONFIG",
                  payload: { shuffleOptions: v },
                })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="show-logo">
              {isAr ? "إظهار شعار المدرسة" : "Show School Logo"}
            </Label>
            <Switch
              id="show-logo"
              checked={state.showSchoolLogo}
              onCheckedChange={(v) =>
                dispatch({
                  type: "SET_PAPER_CONFIG",
                  payload: { showSchoolLogo: v },
                })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="show-instructions">
              {isAr ? "إظهار التعليمات" : "Show Instructions"}
            </Label>
            <Switch
              id="show-instructions"
              checked={state.showInstructions}
              onCheckedChange={(v) =>
                dispatch({
                  type: "SET_PAPER_CONFIG",
                  payload: { showInstructions: v },
                })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="show-points">
              {isAr ? "إظهار درجة كل سؤال" : "Show Points per Question"}
            </Label>
            <Switch
              id="show-points"
              checked={state.showPointsPerQuestion}
              onCheckedChange={(v) =>
                dispatch({
                  type: "SET_PAPER_CONFIG",
                  payload: { showPointsPerQuestion: v },
                })
              }
            />
          </div>
        </div>
      </div>
    </div>
  )
}
