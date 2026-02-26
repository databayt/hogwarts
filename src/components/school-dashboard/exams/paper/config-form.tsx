"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Paper Configuration Form
 * Configures exam paper generation settings
 */
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { Textarea } from "@/components/ui/textarea"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { createPaperConfig, updatePaperConfig } from "./actions"
import type { PaperConfigWithRelations } from "./actions/types"
import { ANSWER_SHEET_TYPES, PAPER_LAYOUTS, PAPER_TEMPLATES } from "./types"
import { paperConfigFormSchema } from "./validation"
import type { PaperConfigFormInput } from "./validation"

interface ConfigFormProps {
  generatedExamId: string
  existingConfig?: PaperConfigWithRelations
  locale: "en" | "ar"
  dictionary?: Record<string, unknown>
}

export function ConfigForm({
  generatedExamId,
  existingConfig,
  locale,
}: ConfigFormProps) {
  const router = useRouter()
  const { dictionary } = useDictionary()
  const t = dictionary?.generate?.paper?.config
  const [isPending, startTransition] = useTransition()
  const [previewKey, setPreviewKey] = useState(0)

  const isRTL = locale === "ar"
  const isEditing = !!existingConfig

  const form = useForm<PaperConfigFormInput>({
    resolver: zodResolver(paperConfigFormSchema),
    defaultValues: existingConfig
      ? {
          template: existingConfig.template,
          layout: existingConfig.layout,
          answerSheetType: existingConfig.answerSheetType,
          showSchoolLogo: existingConfig.showSchoolLogo,
          showExamTitle: existingConfig.showExamTitle,
          showInstructions: existingConfig.showInstructions,
          customInstructions: existingConfig.customInstructions ?? "",
          showStudentInfo: existingConfig.showStudentInfo,
          showQuestionNumbers: existingConfig.showQuestionNumbers,
          showPointsPerQuestion: existingConfig.showPointsPerQuestion,
          showQuestionType: existingConfig.showQuestionType ?? true,
          shuffleQuestions: existingConfig.shuffleQuestions,
          shuffleOptions: existingConfig.shuffleOptions,
          answerLinesShort: existingConfig.answerLinesShort,
          answerLinesEssay: existingConfig.answerLinesEssay,
          showPageNumbers: existingConfig.showPageNumbers,
          showTotalPages: existingConfig.showTotalPages ?? true,
          customFooter: existingConfig.customFooter ?? "",
          pageSize: (existingConfig.pageSize as "A4" | "Letter") ?? "A4",
          orientation:
            (existingConfig.orientation as "portrait" | "landscape") ??
            "portrait",
          versionCount: existingConfig.versionCount,
        }
      : {
          template: "CLASSIC",
          layout: "SINGLE_COLUMN",
          answerSheetType: "SEPARATE",
          showSchoolLogo: true,
          showExamTitle: true,
          showInstructions: true,
          customInstructions: "",
          showStudentInfo: true,
          showQuestionNumbers: true,
          showPointsPerQuestion: true,
          showQuestionType: true,
          shuffleQuestions: false,
          shuffleOptions: false,
          answerLinesShort: 3,
          answerLinesEssay: 12,
          showPageNumbers: true,
          showTotalPages: true,
          customFooter: "",
          pageSize: "A4",
          orientation: "portrait",
          versionCount: 1,
        },
  })

  const onSubmit = (data: PaperConfigFormInput) => {
    startTransition(async () => {
      try {
        const result = isEditing
          ? await updatePaperConfig({
              configId: existingConfig.id,
              ...data,
            })
          : await createPaperConfig({
              generatedExamId,
              ...data,
            })

        if (result.success) {
          toast({
            title: t?.saved || "Saved",
            description:
              t?.config_saved || "Paper configuration saved successfully",
          })
          setPreviewKey((k) => k + 1)
          if (!isEditing) {
            router.refresh()
          }
        } else {
          toast({
            title: dictionary?.generate?.paper?.error || "Error",
            description: result.error,
            variant: "destructive",
          })
        }
      } catch {
        toast({
          title: dictionary?.generate?.paper?.error || "Error",
          description: t?.unexpected_error || "An unexpected error occurred",
          variant: "destructive",
        })
      }
    })
  }

  // Trigger preview update on form change
  const triggerPreview = () => {
    setPreviewKey((k) => k + 1)
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6"
        dir={isRTL ? "rtl" : "ltr"}
      >
        {/* Template & Layout */}
        <Card>
          <CardHeader>
            <CardTitle>{t?.template_layout || "Template & Layout"}</CardTitle>
            <CardDescription>
              {t?.template_layout_desc ||
                "Choose the exam paper style and layout"}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <FormField
              control={form.control}
              name="template"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t?.template || "Template"}</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value)
                      triggerPreview()
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(PAPER_TEMPLATES).map(
                        ([key, template]) => (
                          <SelectItem key={key} value={key}>
                            {template.label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {
                      PAPER_TEMPLATES[
                        field.value as keyof typeof PAPER_TEMPLATES
                      ]?.description
                    }
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="layout"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t?.layout || "Layout"}</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value)
                      triggerPreview()
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(PAPER_LAYOUTS).map(([key, layout]) => (
                        <SelectItem key={key} value={key}>
                          {layout.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {
                      PAPER_LAYOUTS[field.value as keyof typeof PAPER_LAYOUTS]
                        ?.description
                    }
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="answerSheetType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t?.answer_sheet || "Answer Sheet"}</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value)
                      triggerPreview()
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(ANSWER_SHEET_TYPES).map(([key, type]) => (
                        <SelectItem key={key} value={key}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {
                      ANSWER_SHEET_TYPES[
                        field.value as keyof typeof ANSWER_SHEET_TYPES
                      ]?.description
                    }
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Header Settings */}
        <Card>
          <CardHeader>
            <CardTitle>{t?.header_settings || "Header Settings"}</CardTitle>
            <CardDescription>
              {t?.header_settings_desc || "Customize the exam paper header"}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="showSchoolLogo"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>{t?.school_logo || "School Logo"}</FormLabel>
                    <FormDescription>
                      {t?.school_logo_desc || "Display school logo in header"}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked)
                        triggerPreview()
                      }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="showExamTitle"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>{t?.exam_title || "Exam Title"}</FormLabel>
                    <FormDescription>
                      {t?.exam_title_desc || "Display exam title"}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked)
                        triggerPreview()
                      }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="showStudentInfo"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>{t?.student_info || "Student Info"}</FormLabel>
                    <FormDescription>
                      {t?.student_info_desc || "Name and ID fields"}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked)
                        triggerPreview()
                      }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="showInstructions"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>{t?.instructions || "Instructions"}</FormLabel>
                    <FormDescription>
                      {t?.instructions_desc || "Display exam instructions"}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked)
                        triggerPreview()
                      }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customInstructions"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>
                    {t?.custom_instructions || "Custom Instructions"}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={
                        t?.custom_instructions_placeholder ||
                        "Enter additional instructions..."
                      }
                      className="min-h-20"
                      {...field}
                      onBlur={() => triggerPreview()}
                    />
                  </FormControl>
                  <FormDescription>
                    {t?.custom_instructions_desc ||
                      "Additional instructions for students"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Question Settings */}
        <Card>
          <CardHeader>
            <CardTitle>{t?.question_settings || "Question Settings"}</CardTitle>
            <CardDescription>
              {t?.question_settings_desc || "Customize question display"}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="showQuestionNumbers"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>
                      {t?.question_numbers || "Question Numbers"}
                    </FormLabel>
                    <FormDescription>
                      {t?.question_numbers_desc || "Show question numbers"}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked)
                        triggerPreview()
                      }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="showPointsPerQuestion"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>{t?.points || "Points"}</FormLabel>
                    <FormDescription>
                      {t?.points_desc || "Show points per question"}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked)
                        triggerPreview()
                      }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="showQuestionType"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>{t?.question_type || "Question Type"}</FormLabel>
                    <FormDescription>
                      {t?.question_type_desc || "Show question type label"}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked)
                        triggerPreview()
                      }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="shuffleQuestions"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>
                      {t?.shuffle_questions || "Shuffle Questions"}
                    </FormLabel>
                    <FormDescription>
                      {t?.shuffle_questions_desc || "Randomize question order"}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked)
                        triggerPreview()
                      }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="shuffleOptions"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>
                      {t?.shuffle_options || "Shuffle Options"}
                    </FormLabel>
                    <FormDescription>
                      {t?.shuffle_options_desc || "Randomize option order"}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked)
                        triggerPreview()
                      }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="answerLinesShort"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t?.short_answer_lines || "Short Answer Lines"}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      {...field}
                      onChange={(e) => {
                        field.onChange(parseInt(e.target.value))
                        triggerPreview()
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    {t?.short_answer_lines_desc ||
                      "Number of lines for short answers"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="answerLinesEssay"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t?.essay_lines || "Essay Lines"}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={5}
                      max={30}
                      {...field}
                      onChange={(e) => {
                        field.onChange(parseInt(e.target.value))
                        triggerPreview()
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    {t?.essay_lines_desc || "Number of lines for essay answers"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Print Settings */}
        <Card>
          <CardHeader>
            <CardTitle>{t?.print_settings || "Print Settings"}</CardTitle>
            <CardDescription>
              {t?.print_settings_desc || "Page and footer settings"}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="pageSize"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t?.page_size || "Page Size"}</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value)
                      triggerPreview()
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="A4">A4</SelectItem>
                      <SelectItem value="Letter">Letter</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="orientation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t?.orientation || "Orientation"}</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value)
                      triggerPreview()
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="portrait">
                        {t?.portrait || "Portrait"}
                      </SelectItem>
                      <SelectItem value="landscape">
                        {t?.landscape || "Landscape"}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="showPageNumbers"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>{t?.page_numbers || "Page Numbers"}</FormLabel>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked)
                        triggerPreview()
                      }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="showTotalPages"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>{t?.total_pages || "Total Pages"}</FormLabel>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked)
                        triggerPreview()
                      }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customFooter"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>{t?.custom_footer || "Custom Footer"}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={
                        t?.custom_footer_placeholder || "Footer text..."
                      }
                      {...field}
                      onBlur={() => triggerPreview()}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="versionCount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t?.version_count || "Version Count"}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={5}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    {t?.version_count_desc ||
                      "Number of exam versions (A, B, C...)"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            {t?.cancel || "Cancel"}
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending
              ? t?.saving || "Saving..."
              : t?.save_settings || "Save Settings"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
