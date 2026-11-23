"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import {
  useDictionary,
  useDictionaryFallback,
} from "@/components/internationalization/use-dictionary"
import { TeachingScopePicker } from "@/components/school-dashboard/teaching-scope/picker"
import type { TeachingScopeValue } from "@/components/school-dashboard/teaching-scope/validation"

import { createQuickAssessment, listQuickCheckQuestions } from "./actions"
import {
  createQuickAssessmentCreateSchema,
  type QuickValidationMessages,
} from "./validation"

export function QuickAssessmentForm() {
  const router = useRouter()
  const { toast } = useToast()
  const { dictionary } = useDictionary()
  const t = dictionary?.school?.exams?.quick
  const [isSubmitting, setIsSubmitting] = useState(false)

  // New keys live in the `exams` namespace (not in the TS types yet)
  const x = (useDictionaryFallback(dictionary) as any)?.exams?.quick ?? {}
  const validation: QuickValidationMessages = x.validation ?? {}
  const schema = useMemo(
    () => createQuickAssessmentCreateSchema(validation),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [x.validation]
  )

  type FormValues = z.output<
    ReturnType<typeof createQuickAssessmentCreateSchema>
  >

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      title: "",
      gradeId: "",
      sectionId: null,
      subjectId: "",
      type: "EXIT_TICKET" as const,
      questionIds: [],
      duration: 5,
      isAnonymous: false,
      showResults: true,
    },
  })

  // Who it's for: grade → section (or the whole grade) → subject
  const gradeId = form.watch("gradeId")
  const sectionId = form.watch("sectionId")
  const subjectId = form.watch("subjectId")
  const setScope = useCallback(
    (scope: TeachingScopeValue) => {
      const opts = { shouldValidate: true, shouldDirty: true }
      form.setValue("gradeId", scope.gradeId, opts)
      form.setValue("sectionId", scope.sectionId, opts)
      form.setValue("subjectId", scope.subjectId, opts)
    },
    [form]
  )

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true)
    try {
      const result = await createQuickAssessment(values)

      if (result.success) {
        toast({
          title: t?.toast?.success ?? "",
          description: t?.toast?.created ?? "",
        })
        router.push("/exams/quick")
      } else {
        toast({
          title: t?.toast?.error ?? "",
          description: x.toast?.createFailed ?? "",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: t?.toast?.error ?? "",
        description: t?.toast?.unexpected ?? "",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t?.form?.title ?? ""}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t?.formPage?.titlePlaceholder ?? ""}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t?.form?.type ?? ""}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t?.form?.selectType ?? ""} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="EXIT_TICKET">
                      {t?.form?.types?.exitTicket ?? ""}
                    </SelectItem>
                    <SelectItem value="POLL">
                      {t?.form?.types?.poll ?? ""}
                    </SelectItem>
                    <SelectItem value="WARM_UP">
                      {t?.form?.types?.warmUp ?? ""}
                    </SelectItem>
                    <SelectItem value="CHECK_IN">
                      {t?.form?.types?.checkIn ?? ""}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  {t?.form?.typeDescription ?? ""}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t?.form?.duration ?? ""}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    max={60}
                    {...field}
                    onChange={(e) =>
                      field.onChange(parseInt(e.target.value, 10))
                    }
                  />
                </FormControl>
                <FormDescription>
                  {t?.form?.durationDescription ?? ""}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <TeachingScopePicker
          value={{ gradeId, sectionId, subjectId }}
          onChange={setScope}
          disabled={isSubmitting}
        />

        <FormField
          control={form.control}
          name="questionIds"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t?.form?.questionIds ?? ""}</FormLabel>
              <QuestionPicker
                subjectId={subjectId}
                value={field.value}
                onChange={field.onChange}
                labels={t?.form}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <FormField
            control={form.control}
            name="isAnonymous"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    {t?.formPage?.anonymousResponses ?? ""}
                  </FormLabel>
                  <FormDescription>
                    {t?.formPage?.anonymousDescription ?? ""}
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="showResults"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    {t?.formPage?.showResults ?? ""}
                  </FormLabel>
                  <FormDescription>
                    {t?.formPage?.showResultsDescription ?? ""}
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            {t?.formPage?.cancel ?? ""}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
            {t?.formPage?.createAssessment ?? ""}
          </Button>
        </div>
      </form>
    </Form>
  )
}

type BankQuestion = { id: string; questionText: string; difficulty: string }

/**
 * Tick questions from the school's bank for the chosen subject. Replaces a
 * text box that asked a teacher to type raw question ids.
 */
function QuestionPicker({
  subjectId,
  value,
  onChange,
  labels,
}: {
  subjectId: string
  value: string[]
  onChange: (ids: string[]) => void
  labels?: Partial<Record<string, unknown>> & {
    pickSubjectFirst?: string
    loadingQuestions?: string
    noBankQuestions?: string
    questionsSelected?: string
  }
}) {
  const [rows, setRows] = useState<BankQuestion[] | null>(null)

  useEffect(() => {
    if (!subjectId) {
      setRows(null)
      return
    }
    let cancelled = false
    setRows(null)
    void listQuickCheckQuestions({ subjectId }).then((res) => {
      if (!cancelled) setRows(res.success ? res.data : [])
    })
    return () => {
      cancelled = true
    }
  }, [subjectId])

  if (!subjectId) {
    return (
      <p className="text-muted-foreground text-sm">
        {labels?.pickSubjectFirst ?? ""}
      </p>
    )
  }
  if (rows === null) {
    return (
      <p className="text-muted-foreground text-sm" role="status">
        {labels?.loadingQuestions ?? ""}
      </p>
    )
  }
  if (rows.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        {labels?.noBankQuestions ?? ""}
      </p>
    )
  }

  const selected = new Set(value)
  return (
    <div className="space-y-2">
      <p className="text-muted-foreground text-xs">
        {(labels?.questionsSelected ?? "").replace(
          "{count}",
          String(selected.size)
        )}
      </p>
      <ul className="max-h-72 divide-y overflow-y-auto rounded-lg border">
        {rows.map((q) => (
          <li key={q.id}>
            <label className="flex cursor-pointer items-start gap-3 p-3">
              <Checkbox
                checked={selected.has(q.id)}
                onCheckedChange={(on) =>
                  onChange(
                    on ? [...value, q.id] : value.filter((id) => id !== q.id)
                  )
                }
                className="mt-0.5"
              />
              <span dir="auto" className="line-clamp-2 text-sm">
                {q.questionText}
              </span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  )
}
