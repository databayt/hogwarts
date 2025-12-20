"use client"

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
  const isRTL = locale === "ar"
  const [isPending, startTransition] = useTransition()
  const [progress, setProgress] = useState(0)
  const [currentTask, setCurrentTask] = useState("")

  const handleGenerateSingle = (versionIndex: number) => {
    const versionCode = getVersionCode(versionIndex)
    setCurrentTask(
      isRTL ? `إنشاء نسخة ${versionCode}` : `Generating version ${versionCode}`
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
            title: isRTL ? "تم بنجاح" : "Success",
            description: isRTL
              ? `تم إنشاء نسخة ${versionCode}`
              : `Version ${versionCode} generated successfully`,
          })
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
          description: isRTL ? "فشل في الإنشاء" : "Generation failed",
          variant: "destructive",
        })
      } finally {
        setCurrentTask("")
        setProgress(0)
      }
    })
  }

  const handleGenerateAll = () => {
    setCurrentTask(isRTL ? "إنشاء جميع النسخ" : "Generating all versions")
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
            title: isRTL ? "تم بنجاح" : "Success",
            description: isRTL
              ? `تم إنشاء ${result.data.papers.length} نسخة`
              : `${result.data.papers.length} versions generated successfully`,
          })
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
          description: isRTL ? "فشل في الإنشاء" : "Generation failed",
          variant: "destructive",
        })
      } finally {
        setCurrentTask("")
        setProgress(0)
      }
    })
  }

  const handleGenerateAnswerKey = () => {
    setCurrentTask(isRTL ? "إنشاء مفتاح الإجابة" : "Generating answer key")
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
            title: isRTL ? "تم بنجاح" : "Success",
            description: isRTL
              ? "تم إنشاء مفتاح الإجابة"
              : "Answer key generated successfully",
          })
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
          description: isRTL ? "فشل في الإنشاء" : "Generation failed",
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
            {isRTL ? "إنشاء نسخة واحدة" : "Generate Single Version"}
          </CardTitle>
          <CardDescription>
            {isRTL
              ? "إنشاء نسخة واحدة من ورقة الاختبار"
              : "Generate a single version of the exam paper"}
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
                    {isRTL ? `نسخة ${versionCode}` : `Version ${versionCode}`}
                  </span>
                  {existingPaper && (
                    <span className="text-muted-foreground ms-1 text-xs">
                      ({isRTL ? "موجود" : "exists"})
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
          <CardTitle>{isRTL ? "إنشاء جماعي" : "Batch Generation"}</CardTitle>
          <CardDescription>
            {isRTL
              ? `إنشاء ${config.versionCount} نسخة دفعة واحدة مع مفتاح الإجابة`
              : `Generate all ${config.versionCount} versions at once with answer key`}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button onClick={handleGenerateAll} disabled={isPending}>
            <Printer className="h-4 w-4" />
            <span className="ms-2">
              {isRTL
                ? `إنشاء ${config.versionCount} نسخ`
                : `Generate ${config.versionCount} Versions`}
            </span>
          </Button>

          <Button
            variant="outline"
            onClick={handleGenerateAnswerKey}
            disabled={isPending}
          >
            <Key className="h-4 w-4" />
            <span className="ms-2">
              {isRTL ? "مفتاح الإجابة" : "Answer Key"}
            </span>
          </Button>
        </CardContent>
      </Card>

      {/* Download Section */}
      <Card>
        <CardHeader>
          <CardTitle>{isRTL ? "التحميل" : "Download"}</CardTitle>
          <CardDescription>
            {isRTL ? "تحميل الأوراق المولدة" : "Download generated papers"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {config.papers.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {isRTL ? "لم يتم إنشاء أي أوراق بعد" : "No papers generated yet"}
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
                          ? isRTL
                            ? `نسخة ${paper.versionCode}`
                            : `Version ${paper.versionCode}`
                          : isRTL
                            ? "ورقة"
                            : "Paper"}
                      </span>
                    </a>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      <span className="ms-2">
                        {paper.versionCode || (isRTL ? "ورقة" : "Paper")}
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
