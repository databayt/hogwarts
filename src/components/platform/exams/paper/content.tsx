/**
 * Exam Paper Content
 * Main page for paper configuration and generation
 */

import Link from "next/link"
import { Download, Eye, FileText, Key, Printer, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { getOrCreatePaperConfig, getPaperConfig } from "./actions"
import type { PaperConfigWithRelations } from "./actions/types"
import { ConfigForm } from "./config-form"
import { GenerationPanel } from "./generation-panel"
import { PaperList } from "./paper-list"

interface ContentProps {
  generatedExamId: string
  locale: "en" | "ar"
  dictionary?: Record<string, unknown>
}

export async function Content({
  generatedExamId,
  locale,
  dictionary,
}: ContentProps) {
  const isRTL = locale === "ar"

  // Get or create config
  const configResult = await getOrCreatePaperConfig(generatedExamId)

  if (!configResult.success) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle>{isRTL ? "خطأ" : "Error"}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {configResult.error ||
                (isRTL ? "فشل تحميل البيانات" : "Failed to load data")}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const config = configResult.data

  return (
    <div
      className="container mx-auto space-y-6 py-6"
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isRTL ? "إنشاء ورقة الاختبار" : "Exam Paper Generation"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isRTL
              ? "تخصيص وطباعة أوراق الاختبار"
              : "Configure and print exam papers"}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/${locale}/exams/paper/${generatedExamId}/preview`}>
              <Eye className="h-4 w-4" />
              <span className="ms-2">{isRTL ? "معاينة" : "Preview"}</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Exam Info Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">
            {config.generatedExam.exam.title}
          </CardTitle>
          <CardDescription>
            {config.generatedExam.exam.subject.subjectName} -{" "}
            {config.generatedExam.exam.class.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="flex items-center gap-2">
              <FileText className="text-muted-foreground h-4 w-4" />
              <span className="text-sm">
                {config.generatedExam.questions.length}{" "}
                {isRTL ? "سؤال" : "questions"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Printer className="text-muted-foreground h-4 w-4" />
              <span className="text-sm">
                {config.papers.length}{" "}
                {isRTL ? "نسخة مطبوعة" : "printed versions"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <RefreshCw className="text-muted-foreground h-4 w-4" />
              <span className="text-sm">
                {config.versionCount}{" "}
                {isRTL ? "نسخ مطلوبة" : "versions to generate"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs defaultValue="config" className="space-y-4">
        <TabsList>
          <TabsTrigger value="config">
            {isRTL ? "الإعدادات" : "Settings"}
          </TabsTrigger>
          <TabsTrigger value="generate">
            {isRTL ? "إنشاء" : "Generate"}
          </TabsTrigger>
          <TabsTrigger value="papers">
            {isRTL ? "الأوراق" : "Papers"}
          </TabsTrigger>
        </TabsList>

        {/* Config Tab */}
        <TabsContent value="config">
          <ConfigForm
            generatedExamId={generatedExamId}
            existingConfig={config}
            locale={locale}
            dictionary={dictionary}
          />
        </TabsContent>

        {/* Generate Tab */}
        <TabsContent value="generate">
          <GenerationPanel
            generatedExamId={generatedExamId}
            config={config}
            locale={locale}
          />
        </TabsContent>

        {/* Papers Tab */}
        <TabsContent value="papers">
          <PaperList papers={config.papers} locale={locale} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
