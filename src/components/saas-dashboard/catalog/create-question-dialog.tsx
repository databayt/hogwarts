"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState, useTransition } from "react"
import { Loader2, Plus } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Textarea } from "@/components/ui/textarea"

import { createCatalogQuestion } from "./question-actions"

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

export function CreateQuestionDialog() {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const [questionText, setQuestionText] = useState("")
  const [questionType, setQuestionType] = useState("MULTIPLE_CHOICE")
  const [difficulty, setDifficulty] = useState("MEDIUM")
  const [bloomLevel, setBloomLevel] = useState("REMEMBER")
  const [points, setPoints] = useState("1")
  const [optionsJson, setOptionsJson] = useState("")
  const [sampleAnswer, setSampleAnswer] = useState("")
  const [explanation, setExplanation] = useState("")
  const [tagsInput, setTagsInput] = useState("")

  function resetForm() {
    setQuestionText("")
    setQuestionType("MULTIPLE_CHOICE")
    setDifficulty("MEDIUM")
    setBloomLevel("REMEMBER")
    setPoints("1")
    setOptionsJson("")
    setSampleAnswer("")
    setExplanation("")
    setTagsInput("")
  }

  function handleSave() {
    if (!questionText.trim()) {
      toast.error("Question text is required")
      return
    }

    const parsedPoints = parseFloat(points)
    if (Number.isNaN(parsedPoints) || parsedPoints <= 0) {
      toast.error("Points must be a positive number")
      return
    }

    startTransition(async () => {
      try {
        const formData = new FormData()
        formData.set("questionText", questionText.trim())
        formData.set("questionType", questionType)
        formData.set("difficulty", difficulty)
        formData.set("bloomLevel", bloomLevel)
        formData.set("points", String(parsedPoints))
        formData.set("approvalStatus", "APPROVED")
        formData.set("visibility", "PUBLIC")
        formData.set("status", "PUBLISHED")

        if (optionsJson.trim()) {
          formData.set("options", optionsJson.trim())
        }
        if (sampleAnswer.trim()) {
          formData.set("sampleAnswer", sampleAnswer.trim())
        }
        if (explanation.trim()) {
          formData.set("explanation", explanation.trim())
        }

        const tags = tagsInput
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
        for (const tag of tags) {
          formData.append("tags", tag)
        }

        const result = await createCatalogQuestion(formData)
        if (result.success) {
          toast.success("Question created")
          setOpen(false)
          resetForm()
        }
      } catch {
        toast.error("Failed to create question")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="me-2 size-4" />
          Create Question
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Question</DialogTitle>
          <DialogDescription>
            Add a new question to the catalog question bank.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] space-y-4 overflow-y-auto py-4">
          <div className="space-y-2">
            <Label htmlFor="cq-text">Question Text *</Label>
            <Textarea
              id="cq-text"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Enter the question..."
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type *</Label>
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
              <Label>Difficulty *</Label>
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
              <Label>Bloom Level *</Label>
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
              <Label htmlFor="cq-points">Points *</Label>
              <Input
                id="cq-points"
                type="number"
                min={0.25}
                step={0.25}
                value={points}
                onChange={(e) => setPoints(e.target.value)}
              />
            </div>
          </div>
          {(questionType === "MULTIPLE_CHOICE" ||
            questionType === "FILL_BLANK") && (
            <div className="space-y-2">
              <Label htmlFor="cq-options">Options (JSON)</Label>
              <Textarea
                id="cq-options"
                value={optionsJson}
                onChange={(e) => setOptionsJson(e.target.value)}
                placeholder='[{"label": "A", "text": "...", "isCorrect": false}]'
                rows={3}
                className="font-mono text-sm"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="cq-answer">Sample Answer</Label>
            <Textarea
              id="cq-answer"
              value={sampleAnswer}
              onChange={(e) => setSampleAnswer(e.target.value)}
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cq-explanation">Explanation</Label>
            <Textarea
              id="cq-explanation"
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cq-tags">Tags (comma-separated)</Label>
            <Input
              id="cq-tags"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="algebra, equations, grade-10"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending && <Loader2 className="me-2 size-4 animate-spin" />}
            Create Question
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
