"use client"

import React, { useEffect, useState } from "react"
import {
  CircleAlert,
  CircleCheck,
  CircleX,
  Download,
  FileDown,
  FileText,
  LoaderCircle,
  Users,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"

import {
  cancelBatchJob,
  downloadBatchZIP,
  generateBatchExamPDFs,
  getBatchProgress,
  type BatchProgress,
} from "./actions/batch-pdf"

interface BatchPDFGeneratorProps {
  examId: string
  examTitle: string
  totalStudents: number
  onComplete?: () => void
}

export function BatchPDFGenerator({
  examId,
  examTitle,
  totalStudents,
  onComplete,
}: BatchPDFGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [batchId, setBatchId] = useState<string | null>(null)
  const [progress, setProgress] = useState<BatchProgress | null>(null)
  const [template, setTemplate] = useState<"classic" | "modern" | "minimal">(
    "modern"
  )
  const [options, setOptions] = useState({
    includeQuestionBreakdown: false,
    includeGradeDistribution: true,
    includeClassRank: true,
    includeFeedback: false,
    includeSchoolLogo: true,
    includeSignatures: false,
  })
  const { toast } = useToast()

  // Poll for progress updates
  useEffect(() => {
    if (!batchId || !isGenerating) return

    const interval = setInterval(async () => {
      try {
        const result = await getBatchProgress(batchId)
        if (result.success && result.data) {
          setProgress(result.data)

          if (
            result.data.status === "completed" ||
            result.data.status === "failed"
          ) {
            setIsGenerating(false)

            if (result.data.status === "completed") {
              toast({
                title: "PDFs Generated Successfully",
                description: `Generated ${result.data.result?.successCount} out of ${result.data.total} PDFs`,
              })

              if (onComplete) {
                onComplete()
              }
            } else {
              toast({
                title: "Generation Failed",
                description: result.data.message,
              })
            }
          }
        }
      } catch (error) {
        console.error("Error fetching progress:", error)
      }
    }, 1000) // Poll every second

    return () => clearInterval(interval)
  }, [batchId, isGenerating, toast, onComplete])

  const handleGenerate = async () => {
    try {
      setIsGenerating(true)

      const result = await generateBatchExamPDFs({
        examId,
        template,
        options,
      })

      if (result.success && result.data) {
        setBatchId(result.data.batchId)
        toast({
          title: "Generation Started",
          description: "Generating PDFs in the background...",
        })
      } else {
        toast({
          title: "Failed to Start",
          description:
            ("error" in result ? result.error : null) ||
            "Unknown error occurred",
        })
        setIsGenerating(false)
      }
    } catch (error) {
      console.error("Error starting generation:", error)
      toast({
        title: "Error",
        description: "Failed to start PDF generation",
      })
      setIsGenerating(false)
    }
  }

  const handleDownload = async () => {
    if (!batchId) return

    try {
      const result = await downloadBatchZIP(batchId)

      if (result.success && result.data) {
        // Convert base64 to blob and trigger download
        const byteCharacters = atob(result.data.zipData)
        const byteNumbers = new Array(byteCharacters.length)

        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i)
        }

        const byteArray = new Uint8Array(byteNumbers)
        const blob = new Blob([byteArray], { type: "application/zip" })

        const url = window.URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = result.data.filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)

        toast({
          title: "Download Started",
          description: "Your ZIP file is being downloaded",
        })
      } else {
        toast({
          title: "Download Failed",
          description:
            ("error" in result ? result.error : null) ||
            "Failed to download ZIP file",
        })
      }
    } catch (error) {
      console.error("Error downloading ZIP:", error)
      toast({
        title: "Error",
        description: "Failed to download ZIP file",
      })
    }
  }

  const handleCancel = async () => {
    if (!batchId) return

    try {
      const result = await cancelBatchJob(batchId)

      if (result.success) {
        setIsGenerating(false)
        setProgress(null)
        setBatchId(null)
        toast({
          title: "Cancelled",
          description: "PDF generation has been cancelled",
        })
      }
    } catch (error) {
      console.error("Error cancelling job:", error)
    }
  }

  const progressPercentage = progress
    ? Math.round((progress.current / progress.total) * 100)
    : 0

  return (
    <>
      <Button onClick={() => setIsOpen(true)} variant="outline" size="sm">
        <Download className="mr-2 h-4 w-4" />
        Batch Download
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Batch PDF Generation</DialogTitle>
            <DialogDescription>
              Generate and download PDF results for all students in "{examTitle}
              "
            </DialogDescription>
          </DialogHeader>

          {!isGenerating && !progress ? (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="template">PDF Template</Label>
                <Select
                  value={template}
                  onValueChange={(v: any) => setTemplate(v)}
                >
                  <SelectTrigger id="template">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="classic">Classic</SelectItem>
                    <SelectItem value="modern">Modern</SelectItem>
                    <SelectItem value="minimal">Minimal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Options</Label>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="logo"
                    checked={options.includeSchoolLogo}
                    onCheckedChange={(checked) =>
                      setOptions({
                        ...options,
                        includeSchoolLogo: checked as boolean,
                      })
                    }
                  />
                  <Label htmlFor="logo" className="font-normal">
                    Include school logo
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="rank"
                    checked={options.includeClassRank}
                    onCheckedChange={(checked) =>
                      setOptions({
                        ...options,
                        includeClassRank: checked as boolean,
                      })
                    }
                  />
                  <Label htmlFor="rank" className="font-normal">
                    Include class rank
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="distribution"
                    checked={options.includeGradeDistribution}
                    onCheckedChange={(checked) =>
                      setOptions({
                        ...options,
                        includeGradeDistribution: checked as boolean,
                      })
                    }
                  />
                  <Label htmlFor="distribution" className="font-normal">
                    Include grade distribution
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="breakdown"
                    checked={options.includeQuestionBreakdown}
                    onCheckedChange={(checked) =>
                      setOptions({
                        ...options,
                        includeQuestionBreakdown: checked as boolean,
                      })
                    }
                  />
                  <Label htmlFor="breakdown" className="font-normal">
                    Include question-wise breakdown
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="feedback"
                    checked={options.includeFeedback}
                    onCheckedChange={(checked) =>
                      setOptions({
                        ...options,
                        includeFeedback: checked as boolean,
                      })
                    }
                  />
                  <Label htmlFor="feedback" className="font-normal">
                    Include teacher feedback
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="signatures"
                    checked={options.includeSignatures}
                    onCheckedChange={(checked) =>
                      setOptions({
                        ...options,
                        includeSignatures: checked as boolean,
                      })
                    }
                  />
                  <Label htmlFor="signatures" className="font-normal">
                    Include signature fields
                  </Label>
                </div>
              </div>

              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <Users className="h-4 w-4" />
                <span>This will generate {totalStudents} PDFs</span>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {progress && (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {progress.status === "processing" && (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      )}
                      {progress.status === "completed" && (
                        <CircleCheck className="h-4 w-4 text-green-600" />
                      )}
                      {progress.status === "failed" && (
                        <CircleX className="h-4 w-4 text-red-600" />
                      )}
                      <span className="text-sm font-medium">
                        {progress.status === "processing" && "Generating..."}
                        {progress.status === "completed" && "Completed"}
                        {progress.status === "failed" && "Failed"}
                      </span>
                    </div>
                    <span className="text-muted-foreground text-sm">
                      {progress.current} / {progress.total}
                    </span>
                  </div>

                  <Progress value={progressPercentage} className="h-2" />

                  <p className="text-muted-foreground text-sm">
                    {progress.message}
                  </p>

                  {progress.status === "completed" && progress.result && (
                    <div className="bg-muted space-y-3 rounded-lg p-3">
                      <div className="flex items-center justify-between text-sm">
                        <span>Successfully generated:</span>
                        <span className="font-medium text-green-600">
                          {progress.result.successCount} PDFs
                        </span>
                      </div>

                      {progress.result.failureCount > 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <span>Failed:</span>
                          <span className="font-medium text-red-600">
                            {progress.result.failureCount} PDFs
                          </span>
                        </div>
                      )}

                      {progress.result.zipFilename && (
                        <div className="flex items-center gap-2 text-sm">
                          <FileText className="h-4 w-4" />
                          <span className="font-medium">
                            {progress.result.zipFilename}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          <DialogFooter>
            {!isGenerating && !progress ? (
              <>
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleGenerate}>
                  <FileDown className="mr-2 h-4 w-4" />
                  Generate PDFs
                </Button>
              </>
            ) : progress?.status === "processing" ? (
              <>
                <Button variant="outline" onClick={handleCancel}>
                  Cancel Generation
                </Button>
              </>
            ) : progress?.status === "completed" ? (
              <>
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Close
                </Button>
                <Button onClick={handleDownload}>
                  <Download className="mr-2 h-4 w-4" />
                  Download ZIP
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsOpen(false)}>Close</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
