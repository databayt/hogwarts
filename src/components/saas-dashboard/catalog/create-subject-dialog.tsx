"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState, useTransition } from "react"
import { useParams, useRouter } from "next/navigation"
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

import { createCatalogSubject } from "./actions"

const STATUS_OPTIONS = [
  "DRAFT",
  "REVIEW",
  "PUBLISHED",
  "ARCHIVED",
  "DEPRECATED",
] as const

const LEVEL_OPTIONS = ["ELEMENTARY", "MIDDLE", "HIGH"] as const

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
}

export function CreateSubjectDialog() {
  const router = useRouter()
  const { lang } = useParams()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [slugManual, setSlugManual] = useState(false)
  const [department, setDepartment] = useState("")
  const [description, setDescription] = useState("")
  const [color, setColor] = useState("#3b82f6")
  const [country, setCountry] = useState("US")
  const [curriculum, setCurriculum] = useState("us-k12")
  const [schoolTypesInput, setSchoolTypesInput] = useState("")
  const [concept, setConcept] = useState("")
  const [levels, setLevels] = useState<string[]>([])
  const [gradesInput, setGradesInput] = useState("")
  const [status, setStatus] = useState<string>("DRAFT")

  function toggleLevel(level: string) {
    setLevels((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]
    )
  }

  function resetForm() {
    setName("")
    setSlug("")
    setSlugManual(false)
    setDepartment("")
    setDescription("")
    setColor("#3b82f6")
    setCountry("US")
    setCurriculum("us-k12")
    setSchoolTypesInput("")
    setConcept("")
    setLevels([])
    setGradesInput("")
    setStatus("DRAFT")
  }

  function handleSave() {
    if (!name.trim()) {
      toast.error("Name is required")
      return
    }
    if (!department.trim()) {
      toast.error("Department is required")
      return
    }
    if (levels.length === 0) {
      toast.error("Select at least one level")
      return
    }

    const finalSlug = slug || slugify(name)

    startTransition(async () => {
      try {
        const formData = new FormData()
        formData.set("name", name.trim())
        formData.set("slug", finalSlug)
        formData.set("department", department.trim())
        formData.set("description", description.trim())
        formData.set("color", color)
        formData.set("country", country)
        formData.set("curriculum", curriculum)
        if (concept.trim()) formData.set("concept", concept.trim())
        const schoolTypes = schoolTypesInput
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
        for (const st of schoolTypes) {
          formData.append("schoolTypes", st)
        }
        formData.set("status", status)
        for (const level of levels) {
          formData.append("levels", level)
        }
        const grades = gradesInput
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .map(Number)
          .filter((n) => !isNaN(n))
        for (const g of grades) {
          formData.append("grades", String(g))
        }

        const result = await createCatalogSubject(formData)
        if (!result.success) {
          toast.error("Failed to create subject")
          return
        }

        toast.success("Subject created")
        setOpen(false)
        resetForm()
        router.push(`/${lang}/catalog/${result.subject.id}`)
      } catch {
        toast.error("Failed to create subject")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="me-2 size-4" />
          Create Subject
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Subject</DialogTitle>
          <DialogDescription>
            Add a new subject to the global catalog.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] space-y-4 overflow-y-auto py-4">
          <div className="space-y-2">
            <Label htmlFor="cs-name">Name *</Label>
            <Input
              id="cs-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (!slugManual) setSlug(slugify(e.target.value))
              }}
              placeholder="e.g., Mathematics"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cs-slug">Slug</Label>
            <Input
              id="cs-slug"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value)
                setSlugManual(true)
              }}
              placeholder="auto-generated-from-name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cs-department">Department *</Label>
            <Input
              id="cs-department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g., STEM, Languages, Arts"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cs-description">Description</Label>
            <Textarea
              id="cs-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Subject description..."
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cs-color">Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  id="cs-color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-9 w-12 cursor-pointer rounded border"
                />
                <Input
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cs-country">Country</Label>
              <Input
                id="cs-country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="US"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cs-curriculum">Curriculum</Label>
              <Input
                id="cs-curriculum"
                value={curriculum}
                onChange={(e) => setCurriculum(e.target.value)}
                placeholder="us-k12"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cs-concept">Concept</Label>
              <Input
                id="cs-concept"
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                placeholder="e.g., math, science"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cs-school-types">
                School Types{" "}
                <span className="text-muted-foreground text-xs">
                  (comma-separated)
                </span>
              </Label>
              <Input
                id="cs-school-types"
                value={schoolTypesInput}
                onChange={(e) => setSchoolTypesInput(e.target.value)}
                placeholder="international, private"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Levels *</Label>
            <div className="flex gap-2">
              {LEVEL_OPTIONS.map((level) => (
                <Button
                  key={level}
                  type="button"
                  variant={levels.includes(level) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleLevel(level)}
                >
                  {level}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cs-grades">
              Grades{" "}
              <span className="text-muted-foreground text-xs">
                (comma-separated, e.g., 9,10,11)
              </span>
            </Label>
            <Input
              id="cs-grades"
              value={gradesInput}
              onChange={(e) => setGradesInput(e.target.value)}
              placeholder="9, 10, 11, 12"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending && <Loader2 className="me-2 size-4 animate-spin" />}
            Create Subject
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
