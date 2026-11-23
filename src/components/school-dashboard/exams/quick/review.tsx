"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ArrowDown, ArrowUp, Check, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ErrorToast, SuccessToast } from "@/components/atom/toast"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import {
  deleteQuickAssessment,
  launchQuickAssessment,
  updateQuickAssessment,
} from "./actions"
import type { ReviewAssessment } from "./review-load"

/**
 * A teacher's review of a DRAFT quick check before it reaches students:
 * rename it, drop or reorder questions, save, publish («نشر») or delete.
 * Students see nothing until «نشر». Phone-first; logical spacing for RTL.
 */
export function QuickReview({
  assessment,
  lang,
}: {
  assessment: ReviewAssessment
  lang: string
}) {
  const router = useRouter()
  const { dictionary } = useDictionary()
  const t = dictionary?.school?.exams?.quick?.review as
    | Record<string, any>
    | undefined
  const [pending, startTransition] = useTransition()
  const [title, setTitle] = useState(assessment.title)
  const [questions, setQuestions] = useState(assessment.questions)
  const [dirty, setDirty] = useState(false)

  const { canEdit } = assessment
  const err = (code?: string) =>
    t?.errors?.[code ?? "UNKNOWN"] ?? t?.errors?.UNKNOWN ?? ""

  const move = (i: number, by: -1 | 1) => {
    const j = i + by
    if (j < 0 || j >= questions.length) return
    const next = [...questions]
    ;[next[i], next[j]] = [next[j], next[i]]
    setQuestions(next)
    setDirty(true)
  }
  const remove = (id: string) => {
    setQuestions((qs) => qs.filter((q) => q.id !== id))
    setDirty(true)
  }

  const save = async (): Promise<boolean> => {
    const res = await updateQuickAssessment(assessment.id, {
      title: title.trim(),
      questionIds: questions.map((q) => q.id),
    })
    if (!res.success) {
      ErrorToast(err(res.code))
      return false
    }
    setDirty(false)
    return true
  }

  const onSave = () =>
    startTransition(async () => {
      if (await save()) {
        SuccessToast(t?.saved ?? "")
        router.refresh()
      }
    })

  const onPublish = () =>
    startTransition(async () => {
      // Publish what is on screen, not what was last saved
      if (dirty && !(await save())) return
      const res = await launchQuickAssessment(assessment.id)
      if (!res.success) {
        ErrorToast(err(res.code))
        return
      }
      SuccessToast(t?.published ?? "")
      router.push(`/${lang}/exams/quick`)
    })

  const onDelete = () => {
    if (!window.confirm(t?.deleteConfirm ?? "")) return
    startTransition(async () => {
      const res = await deleteQuickAssessment(assessment.id)
      if (!res.success) {
        ErrorToast(err(res.code))
        return
      }
      SuccessToast(t?.deleted ?? "")
      router.push(`/${lang}/exams/quick`)
    })
  }

  return (
    <main className="mx-auto w-full max-w-2xl space-y-4 pb-24">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold">{t?.heading}</h1>
          <Badge variant="secondary">
            {assessment.status === "DRAFT" ? t?.draft : assessment.status}
          </Badge>
        </div>
        {assessment.status === "DRAFT" && (
          <p className="text-muted-foreground text-sm">{t?.draftNotice}</p>
        )}
      </header>

      <div className="space-y-1.5">
        <Label htmlFor="review-title">{t?.titleLabel}</Label>
        <Input
          id="review-title"
          value={title}
          maxLength={200}
          disabled={!canEdit || pending}
          className="h-12"
          onChange={(e) => {
            setTitle(e.target.value)
            setDirty(true)
          }}
        />
      </div>

      <section aria-labelledby="review-questions" className="space-y-3">
        <h2 id="review-questions" className="text-base font-medium">
          {t?.questions} ({questions.length})
        </h2>
        {questions.length === 0 && (
          <p className="text-muted-foreground text-sm">{t?.emptyQuestions}</p>
        )}
        <ol className="space-y-3">
          {questions.map((q, i) => (
            <li key={q.id}>
              <Card>
                <CardContent className="space-y-3 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">
                      {t?.difficulty?.[q.difficulty] ?? q.difficulty}
                    </Badge>
                    <Badge variant="outline">
                      {t?.bloom?.[q.bloom] ?? q.bloom}
                    </Badge>
                    {q.ai && <Badge variant="secondary">{t?.aiBadge}</Badge>}
                  </div>
                  <p className="font-medium" dir="auto">
                    {i + 1}. {q.text}
                  </p>
                  <ul className="space-y-1.5 text-sm">
                    {q.options.map((o, k) => (
                      <li
                        key={k}
                        dir="auto"
                        className={
                          o.isCorrect
                            ? "bg-primary/10 flex items-center gap-2 rounded-md border px-3 py-2 font-medium"
                            : "flex items-center gap-2 rounded-md border px-3 py-2"
                        }
                      >
                        {o.isCorrect && (
                          <>
                            <Check className="h-4 w-4 shrink-0" aria-hidden />
                            <span className="sr-only">{t?.correct}</span>
                          </>
                        )}
                        <span>{o.text}</span>
                      </li>
                    ))}
                  </ul>
                  {q.explanation && (
                    <p className="text-muted-foreground text-sm" dir="auto">
                      <span className="font-medium">{t?.explanation}: </span>
                      {q.explanation}
                    </p>
                  )}
                  {canEdit && (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-12 w-12"
                        aria-label={t?.moveUp}
                        disabled={pending || i === 0}
                        onClick={() => move(i, -1)}
                      >
                        <ArrowUp className="h-4 w-4" aria-hidden />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-12 w-12"
                        aria-label={t?.moveDown}
                        disabled={pending || i === questions.length - 1}
                        onClick={() => move(i, 1)}
                      >
                        <ArrowDown className="h-4 w-4" aria-hidden />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-12 w-12"
                        aria-label={t?.remove}
                        disabled={pending}
                        onClick={() => remove(q.id)}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      {canEdit && (
        <footer className="bg-background fixed inset-x-0 bottom-0 z-10 border-t p-3">
          <div className="mx-auto flex max-w-2xl flex-wrap gap-2">
            <Button
              type="button"
              className="h-12 flex-1"
              disabled={pending || questions.length === 0 || !title.trim()}
              onClick={onPublish}
            >
              {t?.publish}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-12 flex-1"
              disabled={pending || !dirty || !title.trim()}
              onClick={onSave}
            >
              {pending ? t?.saving : t?.save}
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="h-12 flex-1"
              disabled={pending}
              onClick={onDelete}
            >
              {t?.delete}
            </Button>
          </div>
        </footer>
      )}
    </main>
  )
}
