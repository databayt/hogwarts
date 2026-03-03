"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useRouter } from "next/navigation"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"

import { useWizard } from "../context/wizard-provider"
import type { StepDefinition } from "../types"

interface WizardShellProps {
  steps: StepDefinition[]
  lang: string
  children: React.ReactNode
}

export function WizardShell({ steps, lang, children }: WizardShellProps) {
  const { state, dispatch } = useWizard()
  const router = useRouter()
  const isAr = lang === "ar"

  const progress =
    steps.length > 0 ? ((state.currentStep + 1) / steps.length) * 100 : 0

  return (
    <div className="flex h-dvh flex-col">
      {/* Top bar */}
      <div className="border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground text-sm">
              {isAr ? "الخطوة" : "Step"} {state.currentStep + 1}{" "}
              {isAr ? "من" : "of"} {steps.length}
            </span>
            <span className="text-sm font-medium">
              {steps[state.currentStep]?.label[isAr ? "ar" : "en"] || ""}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/${lang}/exams/generate`)}
            aria-label={isAr ? "إغلاق" : "Close"}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <Progress value={progress} className="mt-2 h-1" />
      </div>

      {/* Content + Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Step sidebar */}
        <aside className="hidden w-56 shrink-0 border-e md:block">
          <ScrollArea className="h-full">
            <nav className="space-y-1 p-3">
              {steps.map((step, idx) => {
                const isCurrent = idx === state.currentStep
                const isCompleted = step.isComplete(state)

                return (
                  <button
                    key={step.id}
                    onClick={() => dispatch({ type: "SET_STEP", payload: idx })}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-3 py-2 text-start text-sm transition-colors",
                      isCurrent
                        ? "bg-accent text-accent-foreground font-medium"
                        : "text-muted-foreground hover:bg-accent/50",
                      isCompleted && !isCurrent && "text-foreground"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs",
                        isCurrent
                          ? "bg-primary text-primary-foreground"
                          : isCompleted
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                            : "bg-muted"
                      )}
                    >
                      {isCompleted && !isCurrent ? "✓" : idx + 1}
                    </span>
                    <span className="truncate">
                      {step.label[isAr ? "ar" : "en"]}
                    </span>
                  </button>
                )
              })}
            </nav>
          </ScrollArea>
        </aside>

        {/* Main canvas */}
        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-3xl p-6">{children}</div>
        </main>
      </div>

      {/* Bottom navigation */}
      <div className="border-t px-6 py-3">
        <div className="mx-auto flex max-w-3xl justify-between">
          <Button
            variant="outline"
            onClick={() => dispatch({ type: "PREV_STEP" })}
            disabled={state.currentStep === 0}
          >
            {isAr ? "السابق" : "Previous"}
          </Button>
          <Button
            onClick={() => dispatch({ type: "NEXT_STEP" })}
            disabled={state.currentStep >= steps.length - 1}
          >
            {state.currentStep === steps.length - 2
              ? isAr
                ? "معاينة"
                : "Preview"
              : isAr
                ? "التالي"
                : "Next"}
          </Button>
        </div>
      </div>
    </div>
  )
}
