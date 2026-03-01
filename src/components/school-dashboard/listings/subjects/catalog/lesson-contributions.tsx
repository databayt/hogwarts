"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState, useTransition } from "react"
import {
  ClipboardList,
  FileText,
  HelpCircle,
  Loader2,
  Video,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { uploadLessonVideo } from "@/components/stream/admin/courses/edit/video-actions"

import {
  submitAssignment,
  submitMaterial,
  submitQuestion,
} from "./contribution-actions"

// ============================================================================
// Types
// ============================================================================

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  catalogSubjectId: string
  catalogChapterId?: string
  catalogLessonId: string
  lessonName: string
}

// ============================================================================
// Constants
// ============================================================================

const MATERIAL_TYPES = [
  { value: "TEXTBOOK", label: "Textbook" },
  { value: "SYLLABUS", label: "Syllabus" },
  { value: "REFERENCE", label: "Reference" },
  { value: "STUDY_GUIDE", label: "Study Guide" },
  { value: "PROJECT", label: "Project" },
  { value: "WORKSHEET", label: "Worksheet" },
  { value: "PRESENTATION", label: "Presentation" },
  { value: "LESSON_NOTES", label: "Lesson Notes" },
  { value: "VIDEO_GUIDE", label: "Video Guide" },
  { value: "LAB_MANUAL", label: "Lab Manual" },
  { value: "OTHER", label: "Other" },
] as const

const QUESTION_TYPES = [
  { value: "MULTIPLE_CHOICE", label: "Multiple Choice" },
  { value: "TRUE_FALSE", label: "True / False" },
  { value: "SHORT_ANSWER", label: "Short Answer" },
  { value: "ESSAY", label: "Essay" },
  { value: "FILL_BLANK", label: "Fill in the Blank" },
] as const

const DIFFICULTY_LEVELS = [
  { value: "EASY", label: "Easy" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HARD", label: "Hard" },
] as const

const BLOOM_LEVELS = [
  { value: "REMEMBER", label: "Remember" },
  { value: "UNDERSTAND", label: "Understand" },
  { value: "APPLY", label: "Apply" },
  { value: "ANALYZE", label: "Analyze" },
  { value: "EVALUATE", label: "Evaluate" },
  { value: "CREATE", label: "Create" },
] as const

// ============================================================================
// Component
// ============================================================================

export function LessonContributionDialog({
  open,
  onOpenChange,
  catalogSubjectId,
  catalogChapterId,
  catalogLessonId,
  lessonName,
}: Props) {
  const [isPending, startTransition] = useTransition()
  const [activeTab, setActiveTab] = useState("video")

  // Video fields
  const [videoTitle, setVideoTitle] = useState("")
  const [videoUrl, setVideoUrl] = useState("")

  // Material fields
  const [materialTitle, setMaterialTitle] = useState("")
  const [materialDescription, setMaterialDescription] = useState("")
  const [materialType, setMaterialType] = useState("OTHER")
  const [materialUrl, setMaterialUrl] = useState("")

  // Question fields
  const [questionText, setQuestionText] = useState("")
  const [questionType, setQuestionType] = useState("MULTIPLE_CHOICE")
  const [difficulty, setDifficulty] = useState("MEDIUM")
  const [bloomLevel, setBloomLevel] = useState("REMEMBER")
  const [points, setPoints] = useState("1")
  const [sampleAnswer, setSampleAnswer] = useState("")
  const [explanation, setExplanation] = useState("")

  // Assignment fields
  const [assignmentTitle, setAssignmentTitle] = useState("")
  const [assignmentInstructions, setAssignmentInstructions] = useState("")
  const [totalPoints, setTotalPoints] = useState("")
  const [estimatedTime, setEstimatedTime] = useState("")

  function resetAll() {
    setVideoTitle("")
    setVideoUrl("")
    setMaterialTitle("")
    setMaterialDescription("")
    setMaterialType("OTHER")
    setMaterialUrl("")
    setQuestionText("")
    setQuestionType("MULTIPLE_CHOICE")
    setDifficulty("MEDIUM")
    setBloomLevel("REMEMBER")
    setPoints("1")
    setSampleAnswer("")
    setExplanation("")
    setAssignmentTitle("")
    setAssignmentInstructions("")
    setTotalPoints("")
    setEstimatedTime("")
  }

  function handleSubmitVideo() {
    if (!videoUrl.trim()) {
      toast.error("Video URL is required")
      return
    }

    const provider =
      videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be")
        ? ("YOUTUBE" as const)
        : videoUrl.includes("vimeo.com")
          ? ("VIMEO" as const)
          : ("OTHER" as const)

    startTransition(async () => {
      try {
        const result = await uploadLessonVideo({
          catalogLessonId,
          title: videoTitle.trim() || lessonName,
          videoUrl: videoUrl.trim(),
          provider,
        })
        if (result.status === "success") {
          toast.success("Video submitted for review")
          resetAll()
          onOpenChange(false)
        } else {
          toast.error(result.message)
        }
      } catch {
        toast.error("Failed to upload video")
      }
    })
  }

  function handleSubmitMaterial() {
    if (!materialTitle.trim()) {
      toast.error("Title is required")
      return
    }

    startTransition(async () => {
      try {
        const result = await submitMaterial({
          catalogSubjectId,
          catalogChapterId: catalogChapterId || null,
          catalogLessonId,
          title: materialTitle.trim(),
          description: materialDescription.trim() || undefined,
          type: materialType as
            | "TEXTBOOK"
            | "SYLLABUS"
            | "REFERENCE"
            | "STUDY_GUIDE"
            | "PROJECT"
            | "WORKSHEET"
            | "PRESENTATION"
            | "LESSON_NOTES"
            | "VIDEO_GUIDE"
            | "LAB_MANUAL"
            | "OTHER",
          externalUrl: materialUrl.trim() || undefined,
        })
        if (result.success) {
          toast.success("Material submitted for review")
          resetAll()
          onOpenChange(false)
        }
      } catch {
        toast.error("Failed to submit material")
      }
    })
  }

  function handleSubmitQuestion() {
    if (!questionText.trim()) {
      toast.error("Question text is required")
      return
    }

    startTransition(async () => {
      try {
        const result = await submitQuestion({
          catalogSubjectId,
          catalogChapterId: catalogChapterId || null,
          catalogLessonId,
          questionText: questionText.trim(),
          questionType: questionType as
            | "MULTIPLE_CHOICE"
            | "TRUE_FALSE"
            | "SHORT_ANSWER"
            | "ESSAY"
            | "FILL_BLANK",
          difficulty: difficulty as "EASY" | "MEDIUM" | "HARD",
          bloomLevel: bloomLevel as
            | "REMEMBER"
            | "UNDERSTAND"
            | "APPLY"
            | "ANALYZE"
            | "EVALUATE"
            | "CREATE",
          points: parseFloat(points) || 1,
          sampleAnswer: sampleAnswer.trim() || undefined,
          explanation: explanation.trim() || undefined,
        })
        if (result.success) {
          toast.success("Question submitted for review")
          resetAll()
          onOpenChange(false)
        }
      } catch {
        toast.error("Failed to submit question")
      }
    })
  }

  function handleSubmitAssignment() {
    if (!assignmentTitle.trim()) {
      toast.error("Title is required")
      return
    }

    startTransition(async () => {
      try {
        const result = await submitAssignment({
          catalogSubjectId,
          catalogChapterId: catalogChapterId || null,
          catalogLessonId,
          title: assignmentTitle.trim(),
          instructions: assignmentInstructions.trim() || undefined,
          totalPoints: totalPoints ? parseFloat(totalPoints) : undefined,
          estimatedTime: estimatedTime
            ? parseInt(estimatedTime, 10)
            : undefined,
        })
        if (result.success) {
          toast.success("Assignment submitted for review")
          resetAll()
          onOpenChange(false)
        }
      } catch {
        toast.error("Failed to submit assignment")
      }
    })
  }

  const submitActions: Record<string, () => void> = {
    video: handleSubmitVideo,
    material: handleSubmitMaterial,
    question: handleSubmitQuestion,
    assignment: handleSubmitAssignment,
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Contribute to &quot;{lessonName}&quot;</DialogTitle>
          <DialogDescription>
            Submit content for review. Approved contributions become available
            to all schools using this subject.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="video" className="gap-1 text-xs">
              <Video className="size-3" />
              Video
            </TabsTrigger>
            <TabsTrigger value="material" className="gap-1 text-xs">
              <FileText className="size-3" />
              Material
            </TabsTrigger>
            <TabsTrigger value="question" className="gap-1 text-xs">
              <HelpCircle className="size-3" />
              Question
            </TabsTrigger>
            <TabsTrigger value="assignment" className="gap-1 text-xs">
              <ClipboardList className="size-3" />
              Assignment
            </TabsTrigger>
          </TabsList>

          {/* Video Tab */}
          <TabsContent value="video" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="lc-video-title">Video Title</Label>
              <Input
                id="lc-video-title"
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
                placeholder={lessonName}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lc-video-url">Video URL *</Label>
              <Input
                id="lc-video-url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>
          </TabsContent>

          {/* Material Tab */}
          <TabsContent value="material" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="lc-mat-title">Title *</Label>
              <Input
                id="lc-mat-title"
                value={materialTitle}
                onChange={(e) => setMaterialTitle(e.target.value)}
                placeholder="Material title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lc-mat-desc">Description</Label>
              <Textarea
                id="lc-mat-desc"
                value={materialDescription}
                onChange={(e) => setMaterialDescription(e.target.value)}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={materialType} onValueChange={setMaterialType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MATERIAL_TYPES.map((mt) => (
                      <SelectItem key={mt.value} value={mt.value}>
                        {mt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lc-mat-url">URL</Label>
                <Input
                  id="lc-mat-url"
                  value={materialUrl}
                  onChange={(e) => setMaterialUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>
          </TabsContent>

          {/* Question Tab */}
          <TabsContent value="question" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="lc-q-text">Question Text *</Label>
              <Textarea
                id="lc-q-text"
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={questionType} onValueChange={setQuestionType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {QUESTION_TYPES.map((qt) => (
                      <SelectItem key={qt.value} value={qt.value}>
                        {qt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Difficulty</Label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DIFFICULTY_LEVELS.map((d) => (
                      <SelectItem key={d.value} value={d.value}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Bloom Level</Label>
                <Select value={bloomLevel} onValueChange={setBloomLevel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BLOOM_LEVELS.map((b) => (
                      <SelectItem key={b.value} value={b.value}>
                        {b.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lc-q-points">Points</Label>
                <Input
                  id="lc-q-points"
                  type="number"
                  min={0.25}
                  step={0.25}
                  value={points}
                  onChange={(e) => setPoints(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lc-q-answer">Sample Answer</Label>
              <Textarea
                id="lc-q-answer"
                value={sampleAnswer}
                onChange={(e) => setSampleAnswer(e.target.value)}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lc-q-explanation">Explanation</Label>
              <Textarea
                id="lc-q-explanation"
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                rows={2}
              />
            </div>
          </TabsContent>

          {/* Assignment Tab */}
          <TabsContent value="assignment" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="lc-a-title">Title *</Label>
              <Input
                id="lc-a-title"
                value={assignmentTitle}
                onChange={(e) => setAssignmentTitle(e.target.value)}
                placeholder="Assignment title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lc-a-instructions">Instructions</Label>
              <Textarea
                id="lc-a-instructions"
                value={assignmentInstructions}
                onChange={(e) => setAssignmentInstructions(e.target.value)}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lc-a-points">Total Points</Label>
                <Input
                  id="lc-a-points"
                  type="number"
                  min={1}
                  value={totalPoints}
                  onChange={(e) => setTotalPoints(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lc-a-time">Est. Time (min)</Label>
                <Input
                  id="lc-a-time"
                  type="number"
                  min={1}
                  value={estimatedTime}
                  onChange={(e) => setEstimatedTime(e.target.value)}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submitActions[activeTab]} disabled={isPending}>
            {isPending && <Loader2 className="me-2 size-4 animate-spin" />}
            Submit for Review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
