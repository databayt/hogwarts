"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, LibraryBig, Loader2, Sparkles } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useLocale } from "@/components/internationalization/use-locale"
import { createDraftExam } from "@/components/school-dashboard/exams/manage/wizard/actions"

/** Local en/ar labels (mirrors the template-wizard labels.ts pattern). */
const L = {
  title: { en: "Create an exam", ar: "إنشاء اختبار" },
  subtitle: {
    en: "Choose how you want to start.",
    ar: "اختر طريقة البدء.",
  },
  adoptTitle: { en: "Start from a template", ar: "ابدأ من قالب" },
  adoptDesc: {
    en: "Pick a ready, curriculum-aligned blueprint and adopt it.",
    ar: "اختر قالبًا جاهزًا متوافقًا مع المنهج وتبنّه.",
  },
  adoptBadge: { en: "Fastest", ar: "الأسرع" },
  aiTitle: { en: "Generate with AI", ar: "إنشاء بالذكاء الاصطناعي" },
  aiDesc: {
    en: "Describe a topic — AI drafts questions into your bank to review.",
    ar: "صف موضوعًا — يصيغ الذكاء الاصطناعي أسئلة في بنكك للمراجعة.",
  },
  aiBadge: { en: "Fast", ar: "سريع" },
  blank: { en: "Or schedule a blank exam", ar: "أو جدول اختبارًا فارغًا" },
} as const

interface ModeCard {
  key: "adopt" | "ai"
  href: string
  icon: React.ComponentType<{ className?: string }>
  title: { en: string; ar: string }
  desc: { en: string; ar: string }
  badge: { en: string; ar: string }
}

export default function ExamCreateChooser() {
  const { locale } = useLocale()
  const lang = locale === "ar" ? "ar" : "en"
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const modes: ModeCard[] = [
    {
      key: "adopt",
      href: `/${locale}/exams/generate/catalog`,
      icon: LibraryBig,
      title: L.adoptTitle,
      desc: L.adoptDesc,
      badge: L.adoptBadge,
    },
    {
      key: "ai",
      href: `/${locale}/exams/qbank/ai-generate`,
      icon: Sparkles,
      title: L.aiTitle,
      desc: L.aiDesc,
      badge: L.aiBadge,
    },
  ]

  const handleBlankExam = () => {
    startTransition(async () => {
      const result = await createDraftExam()
      if (result.success && result.data) {
        router.push(`/${locale}/exams/manage/add/${result.data.id}/information`)
      }
    })
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 py-4">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">{L.title[lang]}</h1>
        <p className="text-muted-foreground">{L.subtitle[lang]}</p>
      </div>

      <div className="mx-auto grid max-w-2xl gap-4 md:grid-cols-2">
        {modes.map((mode) => {
          const Icon = mode.icon
          return (
            <Link key={mode.key} href={mode.href} className="group">
              <Card className="hover:border-primary/40 h-full transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
                <CardContent className="flex h-full flex-col gap-3 p-5">
                  <div className="flex items-center justify-between">
                    <div className="bg-primary/10 ring-primary/20 rounded-lg p-2 ring-1">
                      <Icon className="text-primary h-5 w-5" />
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {mode.badge[lang]}
                    </Badge>
                  </div>
                  <h2 className="text-base font-semibold tracking-tight">
                    {mode.title[lang]}
                  </h2>
                  <p className="text-muted-foreground flex-1 text-sm">
                    {mode.desc[lang]}
                  </p>
                  <span className="text-primary inline-flex items-center text-sm font-medium">
                    {mode.title[lang]}
                    <ArrowRight className="ms-1 h-4 w-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      <div className="text-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBlankExam}
          disabled={isPending}
        >
          {isPending && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
          {L.blank[lang]}
        </Button>
      </div>
    </div>
  )
}
