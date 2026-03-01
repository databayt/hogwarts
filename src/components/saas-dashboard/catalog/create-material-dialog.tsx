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

import { createCatalogMaterial } from "./material-actions"

const MATERIAL_TYPES = [
  { value: "TEXTBOOK", label: "Textbook" },
  { value: "SYLLABUS", label: "Syllabus" },
  { value: "REFERENCE", label: "Reference" },
  { value: "STUDY_GUIDE", label: "Study Guide" },
  { value: "WORKSHEET", label: "Worksheet" },
  { value: "PRESENTATION", label: "Presentation" },
  { value: "LESSON_NOTES", label: "Lesson Notes" },
  { value: "VIDEO_GUIDE", label: "Video Guide" },
  { value: "LAB_MANUAL", label: "Lab Manual" },
  { value: "OTHER", label: "Other" },
] as const

export function CreateMaterialDialog() {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [materialType, setMaterialType] = useState("OTHER")
  const [externalUrl, setExternalUrl] = useState("")
  const [tagsInput, setTagsInput] = useState("")

  function resetForm() {
    setTitle("")
    setDescription("")
    setMaterialType("OTHER")
    setExternalUrl("")
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
        formData.set("type", materialType)
        formData.set("approvalStatus", "APPROVED")
        formData.set("visibility", "PUBLIC")
        formData.set("status", "PUBLISHED")

        if (description.trim()) {
          formData.set("description", description.trim())
        }
        if (externalUrl.trim()) {
          formData.set("externalUrl", externalUrl.trim())
        }

        const tags = tagsInput
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
        for (const tag of tags) {
          formData.append("tags", tag)
        }

        const result = await createCatalogMaterial(formData)
        if (result.success) {
          toast.success("Material created")
          setOpen(false)
          resetForm()
        }
      } catch {
        toast.error("Failed to create material")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="me-2 size-4" />
          Create Material
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Material</DialogTitle>
          <DialogDescription>
            Add a new material resource to the catalog.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="cm-title">Title *</Label>
            <Input
              id="cm-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Material title"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cm-description">Description</Label>
            <Textarea
              id="cm-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type *</Label>
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
              <Label htmlFor="cm-url">External URL</Label>
              <Input
                id="cm-url"
                type="url"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cm-tags">Tags (comma-separated)</Label>
            <Input
              id="cm-tags"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="worksheet, algebra, grade-10"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending && <Loader2 className="me-2 size-4 animate-spin" />}
            Create Material
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
