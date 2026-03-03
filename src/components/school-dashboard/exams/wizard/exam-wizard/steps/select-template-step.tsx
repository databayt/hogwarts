"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { Check } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import type { ExamWizardAction, TemplateOption } from "../types"

interface SelectTemplateStepProps {
  lang: string
  templates: TemplateOption[]
  selectedId: string | null
  dispatch: React.Dispatch<ExamWizardAction>
}

export function SelectTemplateStep({
  lang,
  templates,
  selectedId,
  dispatch,
}: SelectTemplateStepProps) {
  const isAr = lang === "ar"

  if (templates.length === 0) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">
            {isAr ? "اختر القالب" : "Select Template"}
          </h2>
          <p className="text-muted-foreground text-sm">
            {isAr
              ? "لا توجد قوالب متاحة. أنشئ قالبًا أولاً."
              : "No templates available. Create a template first."}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">
          {isAr ? "اختر القالب" : "Select Template"}
        </h2>
        <p className="text-muted-foreground text-sm">
          {isAr
            ? "اختر قالب اختبار لتحديد توزيع الأسئلة"
            : "Choose an exam template to define question distribution"}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((t) => {
          const isSelected = selectedId === t.id
          return (
            <Card
              key={t.id}
              className={`cursor-pointer transition-all ${
                isSelected ? "ring-primary ring-2" : "hover:border-primary/50"
              }`}
              onClick={() => dispatch({ type: "SET_TEMPLATE", payload: t.id })}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-sm font-medium">
                    {t.name}
                  </CardTitle>
                  {isSelected && (
                    <Check className="text-primary h-4 w-4 shrink-0" />
                  )}
                </div>
                <Badge variant="secondary" className="w-fit text-xs">
                  {t.subjectName}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-1 text-xs">
                <div className="text-muted-foreground flex justify-between">
                  <span>{isAr ? "الأسئلة" : "Questions"}</span>
                  <span className="text-foreground font-medium">
                    {t.totalQuestions}
                  </span>
                </div>
                <div className="text-muted-foreground flex justify-between">
                  <span>{isAr ? "المدة" : "Duration"}</span>
                  <span className="text-foreground font-medium">
                    {t.duration} {isAr ? "د" : "min"}
                  </span>
                </div>
                <div className="text-muted-foreground flex justify-between">
                  <span>{isAr ? "الدرجات" : "Marks"}</span>
                  <span className="text-foreground font-medium">
                    {t.totalMarks}
                  </span>
                </div>
                {/* Distribution breakdown */}
                <div className="border-t pt-1">
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(t.distribution).map(
                      ([type, difficulties]) => {
                        const total = Object.values(
                          difficulties as Record<string, number>
                        ).reduce((a, b) => a + b, 0)
                        return (
                          <Badge
                            key={type}
                            variant="outline"
                            className="text-[10px]"
                          >
                            {type.replace(/_/g, " ")}: {total}
                          </Badge>
                        )
                      }
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
