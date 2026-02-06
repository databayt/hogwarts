"use client"

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
  dictionary,
}: ConfigFormProps) {
  const router = useRouter()
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
            title: isRTL ? "تم الحفظ" : "Saved",
            description: isRTL
              ? "تم حفظ إعدادات الورقة"
              : "Paper configuration saved successfully",
          })
          setPreviewKey((k) => k + 1)
          if (!isEditing) {
            router.refresh()
          }
        } else {
          toast({
            title: isRTL ? "خطأ" : "Error",
            description: result.error,
            variant: "destructive",
          })
        }
      } catch {
        toast({
          title: isRTL ? "خطأ" : "Error",
          description: isRTL
            ? "حدث خطأ غير متوقع"
            : "An unexpected error occurred",
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
            <CardTitle>
              {isRTL ? "القالب والتخطيط" : "Template & Layout"}
            </CardTitle>
            <CardDescription>
              {isRTL
                ? "اختر نمط وتخطيط ورقة الاختبار"
                : "Choose the exam paper style and layout"}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <FormField
              control={form.control}
              name="template"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isRTL ? "القالب" : "Template"}</FormLabel>
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
                  <FormLabel>{isRTL ? "التخطيط" : "Layout"}</FormLabel>
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
                  <FormLabel>
                    {isRTL ? "ورقة الإجابة" : "Answer Sheet"}
                  </FormLabel>
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
            <CardTitle>{isRTL ? "إعدادات الرأس" : "Header Settings"}</CardTitle>
            <CardDescription>
              {isRTL
                ? "تخصيص رأس ورقة الاختبار"
                : "Customize the exam paper header"}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="showSchoolLogo"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>
                      {isRTL ? "شعار المدرسة" : "School Logo"}
                    </FormLabel>
                    <FormDescription>
                      {isRTL
                        ? "عرض شعار المدرسة في الرأس"
                        : "Display school logo in header"}
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
                    <FormLabel>
                      {isRTL ? "عنوان الاختبار" : "Exam Title"}
                    </FormLabel>
                    <FormDescription>
                      {isRTL ? "عرض عنوان الاختبار" : "Display exam title"}
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
                    <FormLabel>
                      {isRTL ? "معلومات الطالب" : "Student Info"}
                    </FormLabel>
                    <FormDescription>
                      {isRTL ? "حقول الاسم ورقم الطالب" : "Name and ID fields"}
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
                    <FormLabel>
                      {isRTL ? "التعليمات" : "Instructions"}
                    </FormLabel>
                    <FormDescription>
                      {isRTL
                        ? "عرض تعليمات الاختبار"
                        : "Display exam instructions"}
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
                    {isRTL ? "تعليمات مخصصة" : "Custom Instructions"}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={
                        isRTL
                          ? "أدخل تعليمات إضافية..."
                          : "Enter additional instructions..."
                      }
                      className="min-h-20"
                      {...field}
                      onBlur={() => triggerPreview()}
                    />
                  </FormControl>
                  <FormDescription>
                    {isRTL
                      ? "تعليمات إضافية للطلاب"
                      : "Additional instructions for students"}
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
            <CardTitle>
              {isRTL ? "إعدادات الأسئلة" : "Question Settings"}
            </CardTitle>
            <CardDescription>
              {isRTL ? "تخصيص عرض الأسئلة" : "Customize question display"}
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
                      {isRTL ? "أرقام الأسئلة" : "Question Numbers"}
                    </FormLabel>
                    <FormDescription>
                      {isRTL ? "عرض أرقام الأسئلة" : "Show question numbers"}
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
                    <FormLabel>{isRTL ? "الدرجات" : "Points"}</FormLabel>
                    <FormDescription>
                      {isRTL ? "عرض درجات كل سؤال" : "Show points per question"}
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
                    <FormLabel>
                      {isRTL ? "نوع السؤال" : "Question Type"}
                    </FormLabel>
                    <FormDescription>
                      {isRTL ? "عرض نوع السؤال" : "Show question type label"}
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
                      {isRTL ? "خلط الأسئلة" : "Shuffle Questions"}
                    </FormLabel>
                    <FormDescription>
                      {isRTL
                        ? "ترتيب عشوائي للأسئلة"
                        : "Randomize question order"}
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
                      {isRTL ? "خلط الخيارات" : "Shuffle Options"}
                    </FormLabel>
                    <FormDescription>
                      {isRTL
                        ? "ترتيب عشوائي للخيارات"
                        : "Randomize option order"}
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
                    {isRTL ? "أسطر الإجابة القصيرة" : "Short Answer Lines"}
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
                    {isRTL
                      ? "عدد الأسطر للإجابات القصيرة"
                      : "Number of lines for short answers"}
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
                  <FormLabel>{isRTL ? "أسطر المقال" : "Essay Lines"}</FormLabel>
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
                    {isRTL
                      ? "عدد الأسطر للمقالات"
                      : "Number of lines for essay answers"}
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
            <CardTitle>
              {isRTL ? "إعدادات الطباعة" : "Print Settings"}
            </CardTitle>
            <CardDescription>
              {isRTL ? "إعدادات الصفحة والتذييل" : "Page and footer settings"}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="pageSize"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isRTL ? "حجم الورقة" : "Page Size"}</FormLabel>
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
                  <FormLabel>{isRTL ? "الاتجاه" : "Orientation"}</FormLabel>
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
                        {isRTL ? "عمودي" : "Portrait"}
                      </SelectItem>
                      <SelectItem value="landscape">
                        {isRTL ? "أفقي" : "Landscape"}
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
                    <FormLabel>
                      {isRTL ? "أرقام الصفحات" : "Page Numbers"}
                    </FormLabel>
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
                    <FormLabel>
                      {isRTL ? "إجمالي الصفحات" : "Total Pages"}
                    </FormLabel>
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
                  <FormLabel>
                    {isRTL ? "تذييل مخصص" : "Custom Footer"}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={isRTL ? "نص التذييل..." : "Footer text..."}
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
                  <FormLabel>{isRTL ? "عدد النسخ" : "Version Count"}</FormLabel>
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
                    {isRTL
                      ? "عدد نسخ الاختبار (A، B، C...)"
                      : "Number of exam versions (A, B, C...)"}
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
            {isRTL ? "إلغاء" : "Cancel"}
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending
              ? isRTL
                ? "جاري الحفظ..."
                : "Saving..."
              : isRTL
                ? "حفظ الإعدادات"
                : "Save Settings"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
