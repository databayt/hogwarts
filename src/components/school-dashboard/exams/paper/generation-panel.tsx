"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Paper Generation Panel
 * Controls for generating exam papers and answer keys
 */
import { useState, useTransition } from "react"
import { Download, FileText, Key, Loader2, Printer } from "lucide-react"

import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import {
  generateAnswerKey,
  generateExamPaper,
  generateMultipleVersions,
} from "./actions"
import type { PaperConfigWithRelations } from "./actions/types"
import { getVersionCode } from "./config"

interface GenerationPanelProps {
  generatedExamId: string
  config: PaperConfigWithRelations
  locale: "en" | "ar"
}

export function GenerationPanel({
  generatedExamId,
  config,
  locale,
}: GenerationPanelProps) {
  const { dictionary } = useDictionary()
  const t = dictionary?.generate?.paper?.generation
  const tp = dictionary?.generate?.paper
  const isRTL = locale === "ar"
  const [isPending, startTransition] = useTransition()
  const [progress, setProgress] = useState(0)
  const [currentTask, setCurrentTask] = useState("")

  const handleGenerateSingle = (versionIndex: number) => {
    const versionCode = getVersionCode(versionIndex)
    setCurrentTask(
      (t?.generating_version || "Generating version {code}").replace(
        "{code}",
        versionCode
      )
    )
    setProgress(0)

    startTransition(async () => {
      try {
        setProgress(30)
        const result = await generateExamPaper({
          generatedExamId,
          versionCode,
        })

        setProgress(100)

        if (result.success) {
          toast({
            title: t?.success || "Success",
            description: (
              t?.version_generated || "Version {code} generated successfully"
            ).replace("{code}", versionCode),
          })
        } else {
          toast({
            title: tp?.error || "Error",
            description: result.error,
            variant: "destructive",
          })
        }
      } catch {
        toast({
          title: tp?.error || "Error",
          description: t?.generation_failed || "Generation failed",
          variant: "destructive",
        })
      } finally {
        setCurrentTask("")
        setProgress(0)
      }
    })
  }

  const handleGenerateAll = () => {
    setCurrentTask(t?.generating_all || "Generating all versions")
    setProgress(0)

    startTransition(async () => {
      try {
        setProgress(10)
        const result = await generateMultipleVersions({
          generatedExamId,
          versionCount: config.versionCount,
        })

        setProgress(100)

        if (result.success) {
          toast({
            title: t?.success || "Success",
            description: (
              t?.versions_generated || "{count} versions generated successfully"
            ).replace("{count}", String(result.data.papers.length)),
          })
        } else {
          toast({
            title: tp?.error || "Error",
            description: result.error,
            variant: "destructive",
          })
        }
      } catch {
        toast({
          title: tp?.error || "Error",
          description: t?.generation_failed || "Generation failed",
          variant: "destructive",
        })
      } finally {
        setCurrentTask("")
        setProgress(0)
      }
    })
  }

  const handleGenerateAnswerKey = () => {
    setCurrentTask(t?.generating_answer_key || "Generating answer key")
    setProgress(0)

    startTransition(async () => {
      try {
        setProgress(50)
        const result = await generateAnswerKey({
          generatedExamId,
        })

        setProgress(100)

        if (result.success) {
          toast({
            title: t?.success || "Success",
            description:
              t?.answer_key_generated || "Answer key generated successfully",
          })
        } else {
          toast({
            title: tp?.error || "Error",
            description: result.error,
            variant: "destructive",
          })
        }
      } catch {
        toast({
          title: tp?.error || "Error",
          description: t?.generation_failed || "Generation failed",
          variant: "destructive",
        })
      } finally {
        setCurrentTask("")
        setProgress(0)
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      {isPending && currentTask && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm font-medium">{currentTask}</span>
              </div>
              <Progress value={progress} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Single Version Generation */}
      <Card>
        <CardHeader>
          <CardTitle>
            {t?.generate_single || "Generate Single Version"}
          </CardTitle>
          <CardDescription>
            {t?.generate_single_desc ||
              "Generate a single version of the exam paper"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: config.versionCount }).map((_, idx) => {
              const versionCode = getVersionCode(idx)
              const existingPaper = config.papers.find(
                (p) => p.versionCode === versionCode
              )

              return (
                <Button
                  key={versionCode}
                  variant={existingPaper ? "secondary" : "outline"}
                  onClick={() => handleGenerateSingle(idx)}
                  disabled={isPending}
                >
                  <FileText className="h-4 w-4" />
                  <span className="ms-2">
                    {(t?.version || "Version {code}").replace(
                      "{code}",
                      versionCode
                    )}
                  </span>
                  {existingPaper && (
                    <span className="text-muted-foreground ms-1 text-xs">
                      ({t?.exists || "exists"})
                    </span>
                  )}
                </Button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Batch Generation */}
      <Card>
        <CardHeader>
          <CardTitle>{t?.batch || "Batch Generation"}</CardTitle>
          <CardDescription>
            {(
              t?.batch_desc ||
              "Generate all {count} versions at once with answer key"
            ).replace("{count}", String(config.versionCount))}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button onClick={handleGenerateAll} disabled={isPending}>
            <Printer className="h-4 w-4" />
            <span className="ms-2">
              {(t?.generate_versions || "Generate {count} Versions").replace(
                "{count}",
                String(config.versionCount)
              )}
            </span>
          </Button>

          <Button
            variant="outline"
            onClick={handleGenerateAnswerKey}
            disabled={isPending}
          >
            <Key className="h-4 w-4" />
            <span className="ms-2">{t?.answer_key || "Answer Key"}</span>
          </Button>
        </CardContent>
      </Card>

      {/* Download Section */}
      <Card>
        <CardHeader>
          <CardTitle>{t?.download || "Download"}</CardTitle>
          <CardDescription>
            {t?.download_desc || "Download generated papers"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {config.papers.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {t?.no_papers || "No papers generated yet"}
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {config.papers.map((paper) => (
                <Button
                  key={paper.id}
                  variant="outline"
                  size="sm"
                  disabled={!paper.pdfUrl}
                  asChild={!!paper.pdfUrl}
                >
                  {paper.pdfUrl ? (
                    <a href={paper.pdfUrl} download>
                      <Download className="h-4 w-4" />
                      <span className="ms-2">
                        {paper.versionCode
                          ? (t?.version || "Version {code}").replace(
                              "{code}",
                              paper.versionCode
                            )
                          : t?.paper_label || "Paper"}
                      </span>
                    </a>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      <span className="ms-2">
                        {paper.versionCode || t?.paper_label || "Paper"}
                      </span>
                    </>
                  )}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
