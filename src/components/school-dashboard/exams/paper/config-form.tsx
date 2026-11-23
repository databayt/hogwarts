"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Paper Configuration Form
 * Configures exam paper generation settings
 */
import { useMemo, useState, useTransition } from "react"
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

import type { CompositionConfig } from "../templates/composition"
import { createPaperConfig, updatePaperConfig } from "./actions"
import type { PaperConfigWithRelations } from "./actions/types"
import { CompositionPanel, parseBlockConfig } from "./composition-panel"
import { paperErrorText } from "./error-text"
import { ANSWER_SHEET_TYPES, PAPER_LAYOUTS, PAPER_TEMPLATES } from "./types"
import { createPaperConfigFormSchema } from "./validation"
import type { PaperConfigFormInput } from "./validation"

/** Region preset ids; labels come from `school.exams.paper.standards`. */
const REGION_PRESETS = {
  "sd-national": "sudan",
  "sa-national": "saudi",
  "us-standard": "usK12",
  "mena-private": "mena",
} as const

interface ConfigFormProps {
  generatedExamId: string
  existingConfig?: PaperConfigWithRelations
  locale: "en" | "ar"
  dictionary?: Record<string, unknown>
  recommendedCopies?: number
}

export function ConfigForm({
  generatedExamId,
  existingConfig,
  locale,
  recommendedCopies,
}: ConfigFormProps) {
  const router = useRouter()
  const { dictionary } = useDictionary()
  // Cast to allow new i18n keys not yet in typed dictionary
  const t = dictionary?.generate?.paper?.config as
    | Record<string, string>
    | undefined
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tx = (dictionary as any)?.exams?.paper ?? {}
  const options = tx.options ?? {}
  const standards =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ((dictionary as any)?.school?.exams?.paper?.standards ?? {}) as Record<
      string,
      string
    >
  const schema = useMemo(
    () => createPaperConfigFormSchema(tx.validation ?? {}),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tx.validation]
  )
  const [isPending, startTransition] = useTransition()
  const [previewKey, setPreviewKey] = useState(0)
  const [composition, setComposition] = useState<CompositionConfig>(() =>
    parseBlockConfig(existingConfig?.blockConfig)
  )

  const isRTL = locale === "ar"
  const isEditing = !!existingConfig

  const form = useForm<PaperConfigFormInput>({
    resolver: zodResolver(schema),
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
          regionPreset: existingConfig.regionPreset ?? undefined,
          customCopies: existingConfig.customCopies ?? undefined,
          spareCopies: existingConfig.spareCopies ?? 2,
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
          regionPreset: undefined,
          customCopies: undefined,
          spareCopies: 2,
        },
  })

  const onSubmit = (data: PaperConfigFormInput) => {
    startTransition(async () => {
      try {
        const blockConfig = composition as unknown as Record<string, unknown>
        const result = isEditing
          ? await updatePaperConfig({
              configId: existingConfig.id,
              ...data,
              blockConfig,
            })
          : await createPaperConfig({
              generatedExamId,
              ...data,
              blockConfig,
            })

        if (result.success) {
          toast({
            title: t?.saved || "",
            description: t?.config_saved || "",
          })
          setPreviewKey((k) => k + 1)
          if (!isEditing) {
            router.refresh()
          }
        } else {
          toast({
            title: dictionary?.generate?.paper?.error || "",
            description: paperErrorText(result, dictionary),
            variant: "destructive",
          })
        }
      } catch {
        toast({
          title: dictionary?.generate?.paper?.error || "",
          description: t?.unexpected_error || "",
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
            <CardTitle>{t?.template_layout || ""}</CardTitle>
            <CardDescription>{t?.template_layout_desc || ""}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <FormField
              control={form.control}
              name="template"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t?.template || ""}</FormLabel>
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
                      {Object.keys(PAPER_TEMPLATES).map((key) => (
                        <SelectItem key={key} value={key}>
                          {options.template?.[key]?.label ?? ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {(field.value ? options.template?.[field.value] : undefined)?.description ?? ""}
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
                  <FormLabel>{t?.layout || ""}</FormLabel>
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
                      {Object.keys(PAPER_LAYOUTS).map((key) => (
                        <SelectItem key={key} value={key}>
                          {options.layout?.[key]?.label ?? ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {(field.value ? options.layout?.[field.value] : undefined)?.description ?? ""}
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
                  <FormLabel>{t?.answer_sheet || ""}</FormLabel>
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
                      {Object.keys(ANSWER_SHEET_TYPES).map((key) => (
                        <SelectItem key={key} value={key}>
                          {options.answerSheet?.[key]?.label ?? ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {(field.value ? options.answerSheet?.[field.value] : undefined)?.description ?? ""}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Compose — Section Variants */}
        <Card>
          <CardHeader>
            <CardTitle>{tx.config?.compose || ""}</CardTitle>
            <CardDescription>{tx.config?.compose_desc || ""}</CardDescription>
          </CardHeader>
          <CardContent>
            <CompositionPanel
              value={composition}
              onChange={(config) => {
                setComposition(config)
                triggerPreview()
              }}
              locale={locale}
            />
          </CardContent>
        </Card>

        {/* Header Settings */}
        <Card>
          <CardHeader>
            <CardTitle>{t?.header_settings || ""}</CardTitle>
            <CardDescription>{t?.header_settings_desc || ""}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="showSchoolLogo"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>{t?.school_logo || ""}</FormLabel>
                    <FormDescription>
                      {t?.school_logo_desc || ""}
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
                    <FormLabel>{t?.exam_title || ""}</FormLabel>
                    <FormDescription>
                      {t?.exam_title_desc || ""}
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
                    <FormLabel>{t?.student_info || ""}</FormLabel>
                    <FormDescription>
                      {t?.student_info_desc || ""}
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
                    <FormLabel>{t?.instructions || ""}</FormLabel>
                    <FormDescription>
                      {t?.instructions_desc || ""}
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
                  <FormLabel>{t?.custom_instructions || ""}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t?.custom_instructions_placeholder || ""}
                      className="min-h-20"
                      {...field}
                      onBlur={() => triggerPreview()}
                    />
                  </FormControl>
                  <FormDescription>
                    {t?.custom_instructions_desc || ""}
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
            <CardTitle>{t?.question_settings || ""}</CardTitle>
            <CardDescription>{t?.question_settings_desc || ""}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="showQuestionNumbers"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>{t?.question_numbers || ""}</FormLabel>
                    <FormDescription>
                      {t?.question_numbers_desc || ""}
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
                    <FormLabel>{t?.points || ""}</FormLabel>
                    <FormDescription>{t?.points_desc || ""}</FormDescription>
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
                    <FormLabel>{t?.question_type || ""}</FormLabel>
                    <FormDescription>
                      {t?.question_type_desc || ""}
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
                    <FormLabel>{t?.shuffle_questions || ""}</FormLabel>
                    <FormDescription>
                      {t?.shuffle_questions_desc || ""}
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
                    <FormLabel>{t?.shuffle_options || ""}</FormLabel>
                    <FormDescription>
                      {t?.shuffle_options_desc || ""}
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
                  <FormLabel>{t?.short_answer_lines || ""}</FormLabel>
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
                    {t?.short_answer_lines_desc || ""}
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
                  <FormLabel>{t?.essay_lines || ""}</FormLabel>
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
                  <FormDescription>{t?.essay_lines_desc || ""}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Print Settings */}
        <Card>
          <CardHeader>
            <CardTitle>{t?.print_settings || ""}</CardTitle>
            <CardDescription>{t?.print_settings_desc || ""}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="pageSize"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t?.page_size || ""}</FormLabel>
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
                      <SelectItem value="Letter">
                        {tx.config?.letter ?? ""}
                      </SelectItem>
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
                  <FormLabel>{t?.orientation || ""}</FormLabel>
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
                        {t?.portrait || ""}
                      </SelectItem>
                      <SelectItem value="landscape">
                        {t?.landscape || ""}
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
                    <FormLabel>{t?.page_numbers || ""}</FormLabel>
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
                    <FormLabel>{t?.total_pages || ""}</FormLabel>
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
                  <FormLabel>{t?.custom_footer || ""}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t?.custom_footer_placeholder || ""}
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
                  <FormLabel>{t?.version_count || ""}</FormLabel>
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
                    {t?.version_count_desc || ""}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Region Preset & Print Copies */}
        <Card>
          <CardHeader>
            <CardTitle>{tx.config?.region_copies || ""}</CardTitle>
            <CardDescription>
              {tx.config?.region_copies_desc || ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="regionPreset"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tx.config?.region_preset || ""}</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value === "auto" ? undefined : value)
                      triggerPreview()
                    }}
                    defaultValue={field.value ?? "auto"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="auto">
                        {tx.config?.auto_detect || ""}
                      </SelectItem>
                      {Object.entries(REGION_PRESETS).map(([key, preset]) => (
                        <SelectItem key={key} value={key}>
                          {standards[preset] ?? ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {tx.config?.region_preset_desc || ""}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="spareCopies"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tx.config?.spare_copies || ""}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      max={50}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    {tx.config?.spare_copies_desc || ""}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customCopies"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tx.config?.custom_copies || ""}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={1000}
                      placeholder={
                        recommendedCopies
                          ? String(recommendedCopies)
                          : tx.config?.auto_placeholder || ""
                      }
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? parseInt(e.target.value) : undefined
                        )
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    {recommendedCopies
                      ? (tx.config?.recommended_copies || "")
                          .replace("{count}", String(recommendedCopies))
                          .replace(
                            "{enrolled}",
                            String(
                              recommendedCopies -
                                (form.watch("spareCopies") ?? 2)
                            )
                          )
                          .replace(
                            "{spare}",
                            String(form.watch("spareCopies") ?? 2)
                          )
                      : tx.config?.custom_copies_desc || ""}
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
            {t?.cancel || ""}
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? t?.saving || "" : t?.save_settings || ""}
          </Button>
        </div>
      </form>
    </Form>
  )
}
