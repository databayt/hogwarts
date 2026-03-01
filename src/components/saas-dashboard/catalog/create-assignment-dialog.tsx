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

import { createCatalogAssignment } from "./assignment-actions"

const ASSIGNMENT_TYPES = [
  { value: "homework", label: "Homework" },
  { value: "project", label: "Project" },
  { value: "lab", label: "Lab" },
  { value: "essay", label: "Essay" },
  { value: "presentation", label: "Presentation" },
  { value: "research", label: "Research" },
  { value: "group-work", label: "Group Work" },
  { value: "other", label: "Other" },
] as const

export function CreateAssignmentDialog() {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [instructions, setInstructions] = useState("")
  const [rubric, setRubric] = useState("")
  const [totalPoints, setTotalPoints] = useState("")
  const [estimatedTime, setEstimatedTime] = useState("")
  const [assignmentType, setAssignmentType] = useState("homework")
  const [tagsInput, setTagsInput] = useState("")

  function resetForm() {
    setTitle("")
    setDescription("")
    setInstructions("")
    setRubric("")
    setTotalPoints("")
    setEstimatedTime("")
    setAssignmentType("homework")
    setTagsInput("")
  }

  function handleSave() {
    if (!title.trim()) {
      toast.error("Title is required")
      return
    }

    startTransition(async () => {
      try {
        const formData = new FormData()
        formData.set("title", title.trim())
        formData.set("assignmentType", assignmentType)
        formData.set("approvalStatus", "APPROVED")
        formData.set("visibility", "PUBLIC")
        formData.set("status", "PUBLISHED")

        if (description.trim()) {
          formData.set("description", description.trim())
        }
        if (instructions.trim()) {
          formData.set("instructions", instructions.trim())
        }
        if (rubric.trim()) {
          formData.set("rubric", rubric.trim())
        }
        if (totalPoints) {
          formData.set("totalPoints", totalPoints)
        }
        if (estimatedTime) {
          formData.set("estimatedTime", estimatedTime)
        }

        const tags = tagsInput
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
        for (const tag of tags) {
          formData.append("tags", tag)
        }

        const result = await createCatalogAssignment(formData)
        if (result.success) {
          toast.success("Assignment created")
          setOpen(false)
          resetForm()
        }
      } catch {
        toast.error("Failed to create assignment")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="me-2 size-4" />
          Create Assignment
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Assignment</DialogTitle>
          <DialogDescription>
            Add a new assignment template to the catalog.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] space-y-4 overflow-y-auto py-4">
          <div className="space-y-2">
            <Label htmlFor="ca-title">Title *</Label>
            <Input
              id="ca-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Assignment title"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ca-description">Description</Label>
            <Textarea
              id="ca-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ca-instructions">Instructions</Label>
            <Textarea
              id="ca-instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ca-rubric">Grading Rubric</Label>
            <Textarea
              id="ca-rubric"
              value={rubric}
              onChange={(e) => setRubric(e.target.value)}
              rows={3}
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={assignmentType} onValueChange={setAssignmentType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ASSIGNMENT_TYPES.map((at) => (
                    <SelectItem key={at.value} value={at.value}>
                      {at.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ca-points">Total Points</Label>
              <Input
                id="ca-points"
                type="number"
                min={1}
                value={totalPoints}
                onChange={(e) => setTotalPoints(e.target.value)}
                placeholder="100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ca-time">Est. Time (min)</Label>
              <Input
                id="ca-time"
                type="number"
                min={1}
                value={estimatedTime}
                onChange={(e) => setEstimatedTime(e.target.value)}
                placeholder="60"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ca-tags">Tags (comma-separated)</Label>
            <Input
              id="ca-tags"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="homework, algebra, grade-10"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending && <Loader2 className="me-2 size-4 animate-spin" />}
            Create Assignment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
