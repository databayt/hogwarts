"use client"

// Unified Question Create/Pencil Form
import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import type { BloomLevel, DifficultyLevel, QuestionType } from "@prisma/client"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Icons } from "@/components/icons"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { createQuestion, updateQuestion } from "./actions"
import { createQuestionSchema, type CreateQuestionFormData } from "./validation"

interface QuestionFormProps {
  dictionary: Dictionary
  locale: string
  subjectId?: string
  questionId?: string
  initialData?: Partial<CreateQuestionFormData>
  onSuccess?: () => void
}

export function QuestionForm({
  dictionary,
  locale,
  subjectId,
  questionId,
  initialData,
  onSuccess,
}: QuestionFormProps) {
  const dict = dictionary.marking
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [options, setOptions] = useState<
    Array<{ text: string; isCorrect: boolean }>
  >(
    initialData?.options || [
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
    ]
  )

  const form = useForm<CreateQuestionFormData>({
    resolver: zodResolver(createQuestionSchema),
    defaultValues: initialData || {
      subjectId: subjectId || "",
      questionText: "",
      questionType: "MULTIPLE_CHOICE",
      difficulty: "MEDIUM",
      bloomLevel: "UNDERSTAND",
      points: 1,
      timeEstimate: 5,
      explanation: "",
      sampleAnswer: "",
      tags: [],
      imageUrl: "",
    },
  })

  const questionType = form.watch("questionType") as QuestionType

  const handleSubmit = async (data: CreateQuestionFormData) => {
    setLoading(true)

    try {
      const formData = new FormData()
      Object.keys(data).forEach((key) => {
        const k = key as keyof CreateQuestionFormData
        if (key === "options") {
          formData.append(key, JSON.stringify(options))
        } else if (key === "tags") {
          formData.append(key, JSON.stringify(data[k]))
        } else {
          formData.append(key, String(data[k]))
        }
      })

      const result = questionId
        ? await updateQuestion(questionId, formData)
        : await createQuestion(formData)

      if (result.success) {
        toast.success(
          questionId
            ? dict.messages.questionUpdated
            : dict.messages.questionCreated
        )
        onSuccess?.()
        router.push(`/${locale}/exams/mark/questions`)
      } else {
        toast.error(result.error || dict.messages.error)
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : dict.messages.error)
    } finally {
      setLoading(false)
    }
  }

  const addOption = () => {
    setOptions([...options, { text: "", isCorrect: false }])
  }

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index))
    }
  }

  const updateOption = (
    index: number,
    field: "text" | "isCorrect",
    value: string | boolean
  ) => {
    const newOptions = [...options]
    if (field === "text") {
      newOptions[index].text = value as string
    } else {
      newOptions[index].isCorrect = value as boolean
    }
    setOptions(newOptions)
  }

  const needsOptions =
    questionType === "MULTIPLE_CHOICE" || questionType === "TRUE_FALSE"

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      {/* Step 1: Basic Information */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>{dict.questionForm.questionText}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Question Text */}
            <div>
              <Label htmlFor="questionText">
                {dict.questionForm.questionText}
              </Label>
              <Textarea
                id="questionText"
                rows={4}
                placeholder={dict.questionForm.questionTextPlaceholder}
                {...form.register("questionText")}
              />
              {form.formState.errors.questionText && (
                <p className="text-destructive mt-1 text-xs">
                  {form.formState.errors.questionText.message}
                </p>
              )}
            </div>

            {/* Question Type */}
            <div>
              <Label htmlFor="questionType">
                {dict.questionForm.questionType}
              </Label>
              <Select
                value={form.watch("questionType")}
                onValueChange={(value) =>
                  form.setValue("questionType", value as QuestionType)
                }
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={dict.questionForm.selectQuestionType}
                  />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(dict.questionTypes).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Difficulty */}
            <div>
              <Label htmlFor="difficulty">{dict.questionForm.difficulty}</Label>
              <Select
                value={form.watch("difficulty")}
                onValueChange={(value) =>
                  form.setValue("difficulty", value as DifficultyLevel)
                }
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={dict.questionForm.selectDifficulty}
                  />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(dict.difficulty).map(([key, label]) => (
                    <SelectItem key={key} value={key.toUpperCase()}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Bloom's Level */}
            <div>
              <Label htmlFor="bloomLevel">{dict.questionForm.bloomLevel}</Label>
              <Select
                value={form.watch("bloomLevel")}
                onValueChange={(value) =>
                  form.setValue("bloomLevel", value as BloomLevel)
                }
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={dict.questionForm.selectBloomLevel}
                  />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(dict.bloomLevels).map(([key, label]) => (
                    <SelectItem key={key} value={key.toUpperCase()}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Points & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="points">{dict.questionForm.points}</Label>
                <Input
                  id="points"
                  type="number"
                  min="1"
                  max="100"
                  placeholder={dict.questionForm.pointsPlaceholder}
                  {...form.register("points", { valueAsNumber: true })}
                />
              </div>
              <div>
                <Label htmlFor="timeEstimate">
                  {dict.questionForm.timeEstimate}
                </Label>
                <Input
                  id="timeEstimate"
                  type="number"
                  min="1"
                  max="120"
                  placeholder={dict.questionForm.timeEstimatePlaceholder}
                  {...form.register("timeEstimate", { valueAsNumber: true })}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Options/Answer */}
      {step === 2 && needsOptions && (
        <Card>
          <CardHeader>
            <CardTitle>{dict.options.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {options.map((option, index) => (
              <div key={index} className="flex items-start gap-2">
                <Input
                  placeholder={`${dict.options.optionText} ${index + 1}`}
                  value={option.text}
                  onChange={(e) => updateOption(index, "text", e.target.value)}
                  className="flex-1"
                />
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={option.isCorrect}
                    onCheckedChange={(checked) =>
                      updateOption(index, "isCorrect", checked)
                    }
                  />
                  <Label className="text-sm">{dict.options.isCorrect}</Label>
                </div>
                {options.length > 2 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeOption(index)}
                  >
                    <Icons.trash className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={addOption}
              className="w-full"
            >
              <Icons.plus className="mr-2 h-4 w-4" />
              {dict.options.addOption}
            </Button>

            <p className="text-muted-foreground text-xs">
              {dict.options.atLeastTwo}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Additional Details */}
      {step === (needsOptions ? 3 : 2) && (
        <Card>
          <CardHeader>
            <CardTitle>Additional Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Explanation */}
            <div>
              <Label htmlFor="explanation">
                {dict.questionForm.explanation}
              </Label>
              <Textarea
                id="explanation"
                rows={3}
                placeholder={dict.questionForm.explanationPlaceholder}
                {...form.register("explanation")}
              />
            </div>

            {/* Sample Answer */}
            <div>
              <Label htmlFor="sampleAnswer">
                {dict.questionForm.sampleAnswer}
              </Label>
              <Textarea
                id="sampleAnswer"
                rows={3}
                placeholder={dict.questionForm.sampleAnswerPlaceholder}
                {...form.register("sampleAnswer")}
              />
            </div>

            {/* Tags */}
            <div>
              <Label htmlFor="tags">{dict.questionForm.tags}</Label>
              <Input
                id="tags"
                placeholder={dict.questionForm.tagsPlaceholder}
                {...form.register("tags")}
              />
              <p className="text-muted-foreground mt-1 text-xs">
                Comma-separated tags
              </p>
            </div>

            {/* Image URL */}
            <div>
              <Label htmlFor="imageUrl">{dict.questionForm.imageUrl}</Label>
              <Input
                id="imageUrl"
                type="url"
                placeholder={dict.questionForm.imageUrlPlaceholder}
                {...form.register("imageUrl")}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {step > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(step - 1)}
            >
              <Icons.arrowLeft className="mr-2 h-4 w-4" />
              {dict.buttons.previous}
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          {step < (needsOptions ? 3 : 2) && (
            <Button type="button" onClick={() => setStep(step + 1)}>
              {dict.buttons.next}
              <Icons.arrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
          {step === (needsOptions ? 3 : 2) && (
            <Button type="submit" disabled={loading}>
              <Icons.save className="mr-2 h-4 w-4" />
              {questionId
                ? dict.buttons.saveQuestion
                : dict.buttons.createQuestion}
            </Button>
          )}
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center justify-center gap-2">
        {Array.from({ length: needsOptions ? 3 : 2 }).map((_, i) => (
          <div
            key={i}
            className={`h-2 w-2 rounded-full ${
              i + 1 === step ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>
    </form>
  )
}
