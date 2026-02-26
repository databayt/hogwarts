// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Exam Paper Content
 * Main page for paper configuration and generation
 */

import Link from "next/link"
import {
  CheckCircle2,
  Eye,
  FileText,
  Printer,
  RefreshCw,
  Settings,
  Sparkles,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { getOrCreatePaperConfig, getPaperData } from "./actions"
import type { PaperConfigWithRelations } from "./actions/types"
import { ConfigForm } from "./config-form"
import { GenerationPanel } from "./generation-panel"
import { PaperActions } from "./paper-actions"
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const t = (dictionary as any)?.generate?.paper as
    | Record<string, string>
    | undefined

  // Get or create config
  const configResult = await getOrCreatePaperConfig(generatedExamId)

  if (!configResult.success) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle>{t?.error || "Error"}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {configResult.error || t?.failed_to_load || "Failed to load data"}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const config = configResult.data

  // Fetch paper data for download/print
  const paperDataResult = await getPaperData(generatedExamId)
  const paperData = paperDataResult.success ? paperDataResult.data : null

  return (
    <div
      className="container mx-auto space-y-6 py-6"
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t?.title || "Exam Paper Generation"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t?.subtitle || "Configure and print exam papers"}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/${locale}/exams/paper/${generatedExamId}/preview`}>
              <Eye className="h-4 w-4" />
              <span className="ms-2">{t?.preview || "Preview"}</span>
            </Link>
          </Button>
          <PaperActions data={paperData} locale={locale} />
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
                {t?.questions || "questions"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Printer className="text-muted-foreground h-4 w-4" />
              <span className="text-sm">
                {config.papers.length}{" "}
                {t?.printed_versions || "printed versions"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <RefreshCw className="text-muted-foreground h-4 w-4" />
              <span className="text-sm">
                {config.versionCount}{" "}
                {t?.versions_to_generate || "versions to generate"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Stepper */}
      <div className="flex items-center justify-center gap-1 sm:gap-3">
        {[
          {
            step: 1,
            label: t?.configure || "Configure",
            done: true,
          },
          {
            step: 2,
            label: t?.generate || "Generate",
            done: config.papers.length > 0,
          },
          {
            step: 3,
            label: t?.preview || "Preview",
            done: config.papers.some((p) => p.pdfUrl),
          },
          {
            step: 4,
            label: t?.papers || "Download",
            done: config.papers.some((p) => p.pdfUrl),
          },
        ].map(({ step, label, done }, idx) => (
          <div key={step} className="flex items-center gap-1 sm:gap-3">
            {idx > 0 && (
              <div
                className={`hidden h-px w-6 sm:block ${done ? "bg-primary" : "bg-muted-foreground/30"}`}
              />
            )}
            <div className="flex items-center gap-1.5">
              {done ? (
                <CheckCircle2 className="text-primary h-5 w-5" />
              ) : (
                <div className="text-muted-foreground flex h-5 w-5 items-center justify-center rounded-full border text-xs">
                  {step}
                </div>
              )}
              <span
                className={`text-xs sm:text-sm ${done ? "text-primary font-medium" : "text-muted-foreground"}`}
              >
                {label}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Tabs */}
      <Tabs
        defaultValue={config.papers.length > 0 ? "papers" : "config"}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="config" className="gap-1.5">
            <Settings className="h-3.5 w-3.5" />
            {t?.settings || "Settings"}
          </TabsTrigger>
          <TabsTrigger value="generate" className="gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            {t?.generate || "Generate"}
            {config.papers.length > 0 && (
              <Badge variant="secondary" className="ms-1 px-1.5 py-0 text-xs">
                {config.papers.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="papers" className="gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            {t?.papers || "Papers"}
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
