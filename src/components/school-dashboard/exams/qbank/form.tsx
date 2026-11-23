"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, type UseFormReturn } from "react-hook-form"

import { BloomLevel, DifficultyLevel, QuestionType } from "@/lib/client-enums"
import { Badge } from "@/components/ui/badge"
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
import { Textarea } from "@/components/ui/textarea"
import { useModal } from "@/components/atom/modal/context"
import { ErrorToast, SuccessToast } from "@/components/atom/toast"
import { Icons } from "@/components/icons"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { useDictionaryFallback } from "@/components/internationalization/use-dictionary"

import { createQuestion, updateQuestion } from "./actions"
import {
  calculateDefaultPoints,
  getBloomLevelOptions,
  getDifficultyLevelOptions,
  getQuestionTypeOptions,
} from "./config"
import { LessonAttachField } from "./lesson-attach-field"
import { qbankT } from "./t"
import type { QuestionBankDTO } from "./types"
import { createQuestionBankSchema, type QuestionBankSchema } from "./validation"

interface QuestionBankFormProps {
  initialData?: QuestionBankDTO
  subjectId?: string
  isView?: boolean
  dictionary?: Dictionary
  subjects?: { label: string; value: string }[]
  /** Callback fired on successful create/update - use for optimistic refresh */
  onSuccess?: () => void
}

export function QuestionBankForm({
  initialData,
  subjectId,
  isView = false,
  dictionary,
  subjects,
  onSuccess,
}: QuestionBankFormProps) {
  const qt = qbankT(useDictionaryFallback<any>(dictionary))
  const t = qt.form as Record<string, string> | undefined
  const questionBankSchema = useMemo(
    () => createQuestionBankSchema(qt.validation),
    [qt.validation]
  )
  const typeOptions = useMemo(() => getQuestionTypeOptions(qt), [qt])
  const difficultyOptions = useMemo(() => getDifficultyLevelOptions(qt), [qt])
  const bloomOptions = useMemo(() => getBloomLevelOptions(qt), [qt])
  const { closeModal } = useModal()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedType, setSelectedType] = useState<QuestionType>(
    initialData?.questionType || QuestionType.MULTIPLE_CHOICE
  )
  // Catalog lesson attachment. Kept OUT of react-hook-form: the resolver is the
  // question's discriminated union, which deliberately knows nothing about
  // catalog FKs. Appended to the FormData in onSubmit instead.
  const [catalogLessonId, setCatalogLessonId] = useState<string>(
    initialData?.catalogLessonId ?? ""
  )
  const params = useParams<{ lang?: string }>()

  const form = useForm({
    resolver: zodResolver(questionBankSchema),
    defaultValues: {
      subjectId: initialData?.subjectId || subjectId || "",
      questionText: initialData?.questionText || "",
      questionType: initialData?.questionType || QuestionType.MULTIPLE_CHOICE,
      difficulty: initialData?.difficulty || DifficultyLevel.MEDIUM,
      bloomLevel: initialData?.bloomLevel || BloomLevel.UNDERSTAND,
      points: initialData?.points || 1,
      timeEstimate: initialData?.timeEstimate || undefined,
      options: (initialData?.options as {
        text: string
        isCorrect: boolean
        explanation?: string
      }[]) || [
        { text: "", isCorrect: false, explanation: "" },
        { text: "", isCorrect: false, explanation: "" },
      ],
      acceptedAnswers:
        initialData?.questionType === "FILL_BLANK"
          ? (
              initialData.options as {
                acceptedAnswers?: string[]
                caseSensitive?: boolean
              }
            )?.acceptedAnswers || [""]
          : [""],
      caseSensitive:
        initialData?.questionType === "FILL_BLANK"
          ? (
              initialData.options as {
                acceptedAnswers?: string[]
                caseSensitive?: boolean
              }
            )?.caseSensitive || false
          : false,
      sampleAnswer: initialData?.sampleAnswer || "",
      gradingRubric: initialData?.gradingRubric || "",
      tags: initialData?.tags || [],
      explanation: initialData?.explanation || "",
      imageUrl: initialData?.imageUrl || "",
    },
  })

  const watchType = form.watch("questionType")
  const watchDifficulty = form.watch("difficulty")
  const watchSubjectId = form.watch("subjectId")

  // Update selected type when form value changes
  useEffect(() => {
    setSelectedType(watchType)
  }, [watchType])

  // Auto-calculate default points based on type and difficulty
  useEffect(() => {
    const defaultPoints = calculateDefaultPoints(watchType, watchDifficulty)
    if (!initialData) {
      form.setValue("points", defaultPoints)
    }
  }, [watchType, watchDifficulty, initialData, form])

  const onSubmit = async (values: QuestionBankSchema) => {
    setIsSubmitting(true)
    try {
      const formData = new FormData()

      // Append all fields
      Object.entries(values).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (typeof value === "object") {
            formData.append(key, JSON.stringify(value))
          } else {
            formData.append(key, value.toString())
          }
        }
      })

      if (initialData?.id) {
        formData.append("id", initialData.id)
      }

      // Always sent, empty included: on update an empty value is an explicit
      // detach, while omitting the field would leave the old lesson attached.
      formData.append("catalogLessonId", catalogLessonId)

      const result = initialData?.id
        ? await updateQuestion(formData)
        : await createQuestion(formData)

      if (result.success) {
        SuccessToast(initialData?.id ? (t?.updated ?? "") : (t?.created ?? ""))
        closeModal()
        // Use callback for optimistic update instead of page reload
        if (onSuccess) {
          onSuccess()
        }
      } else {
        ErrorToast(result.error)
      }
    } catch (error) {
      ErrorToast(error instanceof Error ? error.message : (t?.saveFailed ?? ""))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">
            {initialData?.id ? (t?.editTitle ?? "") : (t?.createTitle ?? "")}
          </h2>

          {/* Subject Selection */}
          <FormField
            control={form.control}
            name="subjectId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t?.subject ?? ""}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isView}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t?.selectSubject ?? ""} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {subjects?.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Catalog lesson attachment — what surfaces this question in the
              lesson's Lumos practice quiz. */}
          <LessonAttachField
            subjectId={watchSubjectId}
            value={catalogLessonId}
            onChange={setCatalogLessonId}
            lang={params?.lang}
            disabled={isView}
            labels={{
              lesson: t?.attachLesson,
              chapter: t?.attachChapter,
              none: t?.attachNone,
              hint: t?.attachHint,
              pickSubject: t?.attachPickSubject,
              loading: t?.attachLoading,
              empty: t?.attachEmpty,
            }}
          />

          {/* Question Type */}
          <FormField
            control={form.control}
            name="questionType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t?.questionType ?? ""}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isView}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t?.selectType ?? ""} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {typeOptions.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  {
                    typeOptions.find((o) => o.value === field.value)
                      ?.description
                  }
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Question Text */}
          <FormField
            control={form.control}
            name="questionText"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t?.questionText ?? ""}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={t?.questionPlaceholder ?? ""}
                    className="min-h-[100px]"
                    disabled={isView}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Difficulty & Bloom Level Row */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="difficulty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t?.difficulty ?? ""}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isView}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t?.selectDifficulty ?? ""} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {difficultyOptions.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          <span className="flex items-center gap-2">
                            <span
                              className={`h-2 w-2 rounded-full bg-${level.color}-500`}
                            />
                            {level.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bloomLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t?.bloomLevel ?? ""}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isView}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t?.selectLevel ?? ""} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {bloomOptions.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                          {level.description ? ` - ${level.description}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Points & Time Estimate */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="points"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t?.points ?? ""}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="100"
                      disabled={isView}
                      value={field.value as number}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value))
                      }
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="timeEstimate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t?.timeEstimate ?? ""}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      max="480"
                      disabled={isView}
                      value={(field.value as number) || ""}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormDescription>{t?.optional ?? ""}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Dynamic Fields Based on Question Type */}
          {(selectedType === QuestionType.MULTIPLE_CHOICE ||
            selectedType === QuestionType.TRUE_FALSE) && (
            <MultipleChoiceFields
              form={form}
              isView={isView}
              type={selectedType}
            />
          )}

          {selectedType === QuestionType.FILL_BLANK && (
            <FillBlankFields form={form} isView={isView} />
          )}

          {(selectedType === QuestionType.SHORT_ANSWER ||
            selectedType === QuestionType.ESSAY) && (
            <SubjectiveFields form={form} isView={isView} />
          )}

          {/* Tags */}
          <FormField
            control={form.control}
            name="tags"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t?.tags ?? ""}</FormLabel>
                <FormControl>
                  <TagsInput
                    value={field.value || []}
                    onChange={field.onChange}
                    disabled={isView}
                  />
                </FormControl>
                <FormDescription>{t?.tagHint ?? ""}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Explanation */}
          <FormField
            control={form.control}
            name="explanation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t?.explanation ?? ""}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={t?.explanationPlaceholder ?? ""}
                    disabled={isView}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Actions */}
        {!isView && (
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="max-sm:min-h-11"
              onClick={closeModal}
              disabled={isSubmitting}
            >
              {t?.cancel ?? ""}
            </Button>
            <Button
              type="submit"
              className="max-sm:min-h-11"
              disabled={isSubmitting}
            >
              {isSubmitting && (
                <Icons.loaderCircle className="me-2 h-4 w-4 animate-spin" />
              )}
              {initialData?.id ? (t?.update ?? "") : (t?.create ?? "")}
            </Button>
          </div>
        )}
      </form>
    </Form>
  )
}

// Multiple Choice Options Component
function MultipleChoiceFields({
  form,
  isView,
  type,
}: {
  form: UseFormReturn<any>
  isView: boolean
  type: QuestionType
}) {
  const t = qbankT(useDictionaryFallback<any>()).form as
    | Record<string, string>
    | undefined
  const options = form.watch("options") || []
  const isTrueFalse = type === QuestionType.TRUE_FALSE

  const addOption = () => {
    const current = form.getValues("options") || []
    form.setValue("options", [
      ...current,
      { text: "", isCorrect: false, explanation: "" },
    ])
  }

  const removeOption = (index: number) => {
    const current = form.getValues("options") || []
    form.setValue(
      "options",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      current.filter((_: any, i: number) => i !== index)
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <FormLabel>{t?.options ?? ""}</FormLabel>
        {!isTrueFalse && !isView && options.length < 6 && (
          <Button type="button" variant="outline" size="sm" onClick={addOption}>
            <Icons.plus className="me-2 h-4 w-4" />
            {t?.addOption ?? ""}
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {options.map((option: any, index: number) => (
          <div
            key={index}
            className="flex items-start gap-2 rounded-md border p-3"
          >
            <Checkbox
              checked={option.isCorrect}
              onCheckedChange={(checked) => {
                const current = form.getValues("options")
                current[index].isCorrect = checked
                form.setValue("options", [...current])
              }}
              disabled={isView}
            />
            <div className="flex-1 space-y-2">
              <Input
                placeholder={`${t?.option ?? ""} ${index + 1}`}
                value={option.text}
                onChange={(e) => {
                  const current = form.getValues("options")
                  current[index].text = e.target.value
                  form.setValue("options", [...current])
                }}
                disabled={isView}
              />
              <Input
                placeholder={t?.optionExplanation ?? ""}
                value={option.explanation || ""}
                onChange={(e) => {
                  const current = form.getValues("options")
                  current[index].explanation = e.target.value
                  form.setValue("options", [...current])
                }}
                disabled={isView}
                className="text-sm"
              />
            </div>
            {!isTrueFalse && !isView && options.length > 2 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label={t?.remove ?? ""}
                onClick={() => removeOption(index)}
              >
                <Icons.x className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// Fill in the Blank Fields
function FillBlankFields({
  form,
  isView,
}: {
  form: UseFormReturn<any>
  isView: boolean
}) {
  const t = qbankT(useDictionaryFallback<any>()).form as
    | Record<string, string>
    | undefined
  const answers = form.watch("acceptedAnswers") || [""]

  const addAnswer = () => {
    const current = form.getValues("acceptedAnswers") || []
    form.setValue("acceptedAnswers", [...current, ""])
  }

  const removeAnswer = (index: number) => {
    const current = form.getValues("acceptedAnswers") || []
    form.setValue(
      "acceptedAnswers",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      current.filter((_: any, i: number) => i !== index)
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <FormLabel>{t?.acceptedAnswers ?? ""}</FormLabel>
        {!isView && (
          <Button type="button" variant="outline" size="sm" onClick={addAnswer}>
            <Icons.plus className="me-2 h-4 w-4" />
            {t?.addAnswer ?? ""}
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {answers.map((answer: string, index: number) => (
          <div key={index} className="flex gap-2">
            <Input
              placeholder={`${t?.answer ?? ""} ${index + 1}`}
              value={answer}
              onChange={(e) => {
                const current = form.getValues("acceptedAnswers")
                current[index] = e.target.value
                form.setValue("acceptedAnswers", [...current])
              }}
              disabled={isView}
            />
            {!isView && answers.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label={t?.remove ?? ""}
                onClick={() => removeAnswer(index)}
              >
                <Icons.x className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>

      <FormField
        control={form.control}
        name="caseSensitive"
        render={({ field }) => (
          <FormItem className="flex items-center gap-2">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={isView}
              />
            </FormControl>
            <FormLabel className="!mt-0">{t?.caseSensitive ?? ""}</FormLabel>
          </FormItem>
        )}
      />
    </div>
  )
}

// Subjective Question Fields
function SubjectiveFields({
  form,
  isView,
}: {
  form: UseFormReturn<any>
  isView: boolean
}) {
  const t = qbankT(useDictionaryFallback<any>()).form as
    | Record<string, string>
    | undefined
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="sampleAnswer"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t?.sampleAnswer ?? ""}</FormLabel>
            <FormControl>
              <Textarea
                placeholder={t?.samplePlaceholder ?? ""}
                className="min-h-[100px]"
                disabled={isView}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="gradingRubric"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t?.gradingRubric ?? ""}</FormLabel>
            <FormControl>
              <Textarea
                placeholder={t?.rubricPlaceholder ?? ""}
                disabled={isView}
                {...field}
              />
            </FormControl>
            <FormDescription>{t?.rubricDescription ?? ""}</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}

// Tags Input Component
function TagsInput({
  value = [],
  onChange,
  disabled,
}: {
  value: string[]
  onChange: (tags: string[]) => void
  disabled?: boolean
}) {
  const t2 = qbankT(useDictionaryFallback<any>()).form as
    | Record<string, string>
    | undefined
  const [input, setInput] = useState("")

  const addTag = () => {
    const tag = input.trim().toLowerCase()
    if (tag && !value.includes(tag)) {
      onChange([...value, tag])
      setInput("")
    }
  }

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag))
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              addTag()
            }
          }}
          placeholder={t2?.tagPlaceholder ?? ""}
          disabled={disabled}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addTag}
          disabled={disabled}
        >
          {t2?.add ?? ""}
        </Button>
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((tag: string) => (
            <Badge key={tag} variant="secondary" className="gap-1">
              {tag}
              {!disabled && (
                <button
                  type="button"
                  aria-label={t2?.remove ?? ""}
                  onClick={() => removeTag(tag)}
                  className="hover:text-destructive ms-1"
                >
                  <Icons.x className="h-3 w-3" />
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
