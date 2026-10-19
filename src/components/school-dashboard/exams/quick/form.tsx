"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
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
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { useDictionary } from "@/components/internationalization/use-dictionary"
import { TeachingScopePicker } from "@/components/school-dashboard/teaching-scope/picker"
import type { TeachingScopeValue } from "@/components/school-dashboard/teaching-scope/validation"

import { createQuickAssessment, listQuickCheckQuestions } from "./actions"
import { quickAssessmentCreateSchema } from "./validation"

export function QuickAssessmentForm() {
  const router = useRouter()
  const { toast } = useToast()
  const { dictionary } = useDictionary()
  const t = dictionary?.school?.exams?.quick
  const [isSubmitting, setIsSubmitting] = useState(false)

  type FormValues = z.output<typeof quickAssessmentCreateSchema>

  const form = useForm<FormValues>({
    resolver: zodResolver(quickAssessmentCreateSchema) as any,
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
          title: t?.toast?.success ?? "Success",
          description:
            t?.toast?.created ?? "Quick assessment created successfully",
        })
        router.push("/exams/quick")
      } else {
        toast({
          title: t?.toast?.error ?? "Error",
          description: result.error || "Failed to create assessment",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: t?.toast?.error ?? "Error",
        description: t?.toast?.unexpected ?? "An unexpected error occurred",
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
              <FormLabel>{t?.form?.title ?? "Title"}</FormLabel>
              <FormControl>
                <Input
                  placeholder={
                    t?.formPage?.titlePlaceholder ??
                    "e.g., Exit Ticket - Lesson 3"
                  }
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
                <FormLabel>{t?.form?.type ?? "Assessment Type"}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t?.form?.selectType ?? "Select type"}
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="EXIT_TICKET">
                      {t?.form?.types?.exitTicket ?? "Exit Ticket"}
                    </SelectItem>
                    <SelectItem value="POLL">
                      {t?.form?.types?.poll ?? "Poll"}
                    </SelectItem>
                    <SelectItem value="WARM_UP">
                      {t?.form?.types?.warmUp ?? "Warm-Up"}
                    </SelectItem>
                    <SelectItem value="CHECK_IN">
                      {t?.form?.types?.checkIn ?? "Check-In"}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  {t?.form?.typeDescription ?? "Type of formative assessment"}
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
                <FormLabel>
                  {t?.form?.duration ?? "Duration (minutes)"}
                </FormLabel>
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
                  {t?.form?.durationDescription ?? "Time limit in minutes"}
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
              <FormLabel>{t?.form?.questionIds ?? "Questions"}</FormLabel>
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
                    {t?.formPage?.anonymousResponses ?? "Anonymous Responses"}
                  </FormLabel>
                  <FormDescription>
                    {t?.formPage?.anonymousDescription ??
                      "Students can submit responses anonymously"}
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
                    {t?.formPage?.showResults ?? "Show Results to Students"}
                  </FormLabel>
                  <FormDescription>
                    {t?.formPage?.showResultsDescription ??
                      "Display results to students after completion"}
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
            {t?.formPage?.cancel ?? "Cancel"}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
            {t?.formPage?.createAssessment ?? "Create Assessment"}
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
        {labels?.pickSubjectFirst ??
          "Choose the subject first to see its questions."}
      </p>
    )
  }
  if (rows === null) {
    return (
      <p className="text-muted-foreground text-sm" role="status">
        {labels?.loadingQuestions ?? "Loading questions…"}
      </p>
    )
  }
  if (rows.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        {labels?.noBankQuestions ??
          "This subject has no questions in the bank yet."}
      </p>
    )
  }

  const selected = new Set(value)
  return (
    <div className="space-y-2">
      <p className="text-muted-foreground text-xs">
        {(labels?.questionsSelected ?? "{count} selected").replace(
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
                    on
                      ? [...value, q.id]
                      : value.filter((id) => id !== q.id)
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
