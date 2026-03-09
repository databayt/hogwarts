"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState, useTransition } from "react"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
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
import { useModal } from "@/components/atom/modal/context"
import { ModalFooter } from "@/components/atom/modal/modal-footer"
import { ModalFormLayout } from "@/components/atom/modal/modal-form-layout"

import {
  createCatalogChapter,
  createCatalogLesson,
  createCatalogSubject,
} from "./actions"

const STATUS_OPTIONS = [
  "DRAFT",
  "REVIEW",
  "PUBLISHED",
  "ARCHIVED",
  "DEPRECATED",
] as const

const LEVEL_OPTIONS = ["ELEMENTARY", "MIDDLE", "HIGH"] as const

const COUNTRY_OPTIONS = [
  { value: "US", label: "United States" },
  { value: "GB", label: "United Kingdom" },
  { value: "SD", label: "Sudan" },
  { value: "SA", label: "Saudi Arabia" },
  { value: "AE", label: "UAE" },
  { value: "EG", label: "Egypt" },
  { value: "JO", label: "Jordan" },
  { value: "KW", label: "Kuwait" },
  { value: "QA", label: "Qatar" },
  { value: "BH", label: "Bahrain" },
  { value: "OM", label: "Oman" },
  { value: "IQ", label: "Iraq" },
  { value: "LB", label: "Lebanon" },
  { value: "IN", label: "India" },
  { value: "PK", label: "Pakistan" },
] as const

const CURRICULUM_OPTIONS = [
  { value: "us-k12", label: "US K-12" },
  { value: "national", label: "National" },
  { value: "british", label: "British" },
  { value: "ib", label: "IB" },
  { value: "cbse", label: "CBSE" },
  { value: "igcse", label: "IGCSE" },
] as const

const SCHOOL_TYPE_OPTIONS = [
  { value: "public", label: "Public" },
  { value: "private", label: "Private" },
  { value: "international", label: "International" },
  { value: "charter", label: "Charter" },
  { value: "religious", label: "Religious" },
  { value: "montessori", label: "Montessori" },
  { value: "homeschool", label: "Homeschool" },
] as const

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
}

export function CreateSubjectForm() {
  const router = useRouter()
  const { lang } = useParams()
  const { closeModal } = useModal()
  const [isPending, startTransition] = useTransition()
  const [currentStep, setCurrentStep] = useState(1)

  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [slugManual, setSlugManual] = useState(false)
  const [department, setDepartment] = useState("")
  const [description, setDescription] = useState("")
  const [color, setColor] = useState("#3b82f6")
  const [country, setCountry] = useState("US")
  const [curriculum, setCurriculum] = useState("us-k12")
  const [schoolType, setSchoolType] = useState("public")
  const [concept, setConcept] = useState("")
  const [selectedLevel, setSelectedLevel] = useState<string>("ELEMENTARY")
  const [grades, setGrades] = useState<number[]>([])
  const [status, setStatus] = useState<string>("DRAFT")

  // Step 3: Chapters
  const [chapterNames, setChapterNames] = useState<string[]>([])

  // Step 4: Lessons (keyed by chapter index)
  const [lessonNames, setLessonNames] = useState<Record<number, string[]>>({})
  const [activeChapterIndex, setActiveChapterIndex] = useState(0)

  const GRADE_MAP: Record<string, number[]> = {
    ELEMENTARY: [1, 2, 3, 4, 5],
    MIDDLE: [6, 7, 8],
    HIGH: [9, 10, 11, 12],
  }

  function selectLevel(level: string) {
    setSelectedLevel(level)
    setGrades([])
  }

  function toggleGrade(grade: number) {
    setGrades((prev) =>
      prev.includes(grade) ? prev.filter((g) => g !== grade) : [...prev, grade]
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
    setSchoolType("public")
    setConcept("")
    setSelectedLevel("ELEMENTARY")
    setGrades([])
    setStatus("DRAFT")
    setChapterNames([])
    setLessonNames({})
    setActiveChapterIndex(0)
    setCurrentStep(1)
  }

  function handleSubmit() {
    if (!name.trim()) {
      toast.error("Name is required")
      return
    }
    if (!department.trim()) {
      toast.error("Department is required")
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
        formData.append("schoolTypes", schoolType)
        formData.set("status", status)
        formData.append("levels", selectedLevel)
        for (const g of grades) {
          formData.append("grades", String(g))
        }

        const result = await createCatalogSubject(formData)
        if (!result.success) {
          toast.error("Failed to create subject")
          return
        }

        const subjectId = result.subject.id

        // Batch-create chapters and lessons
        const validChapters = chapterNames.filter((n) => n.trim())
        for (let ci = 0; ci < validChapters.length; ci++) {
          const chName = validChapters[ci].trim()
          const chFormData = new FormData()
          chFormData.set("subjectId", subjectId)
          chFormData.set("name", chName)
          chFormData.set("slug", slugify(chName))
          chFormData.set("sequenceOrder", String(ci))
          chFormData.set("status", "DRAFT")

          const chResult = await createCatalogChapter(chFormData)
          if (!chResult.success) continue

          // Create lessons for this chapter
          const chapterLessons = lessonNames[ci]?.filter((n) => n.trim()) ?? []
          for (let li = 0; li < chapterLessons.length; li++) {
            const lName = chapterLessons[li].trim()
            const lFormData = new FormData()
            lFormData.set("chapterId", chResult.chapter.id)
            lFormData.set("name", lName)
            lFormData.set("slug", slugify(lName))
            lFormData.set("sequenceOrder", String(li))
            lFormData.set("status", "DRAFT")
            await createCatalogLesson(lFormData)
          }
        }

        toast.success("Subject created")
        closeModal()
        resetForm()
        router.push(`/${lang}/catalog/${subjectId}`)
      } catch {
        toast.error("Failed to create subject")
      }
    })
  }

  function handleNext() {
    if (currentStep === 1) {
      if (!name.trim()) {
        toast.error("Name is required")
        return
      }
      if (!department.trim()) {
        toast.error("Department is required")
        return
      }
      setCurrentStep(2)
    } else if (currentStep === 2) {
      setCurrentStep(3)
    } else if (currentStep === 3) {
      if (chapterNames.filter((n) => n.trim()).length > 0) {
        setActiveChapterIndex(0)
      }
      setCurrentStep(4)
    } else {
      handleSubmit()
    }
  }

  function handleBack() {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    } else {
      closeModal()
    }
  }

  function addChapter() {
    setChapterNames((prev) => [...prev, ""])
  }

  function removeChapter(index: number) {
    setChapterNames((prev) => prev.filter((_, i) => i !== index))
    setLessonNames((prev) => {
      const next = { ...prev }
      delete next[index]
      // Re-index entries after the removed one
      const reindexed: Record<number, string[]> = {}
      Object.entries(next).forEach(([k, v]) => {
        const ki = Number(k)
        reindexed[ki > index ? ki - 1 : ki] = v
      })
      return reindexed
    })
  }

  function updateChapterName(index: number, value: string) {
    setChapterNames((prev) => prev.map((n, i) => (i === index ? value : n)))
  }

  function addLesson(chapterIndex: number) {
    setLessonNames((prev) => ({
      ...prev,
      [chapterIndex]: [...(prev[chapterIndex] ?? []), ""],
    }))
  }

  function removeLesson(chapterIndex: number, lessonIndex: number) {
    setLessonNames((prev) => ({
      ...prev,
      [chapterIndex]: (prev[chapterIndex] ?? []).filter(
        (_, i) => i !== lessonIndex
      ),
    }))
  }

  function updateLessonName(
    chapterIndex: number,
    lessonIndex: number,
    value: string
  ) {
    setLessonNames((prev) => ({
      ...prev,
      [chapterIndex]: (prev[chapterIndex] ?? []).map((n, i) =>
        i === lessonIndex ? value : n
      ),
    }))
  }

  const stepLabels: Record<number, string> = {
    1: "Basic Information",
    2: "Classification & Settings",
    3: "Chapters",
    4: "Lessons",
  }

  return (
    <form onSubmit={(e) => e.preventDefault()}>
      <ModalFormLayout
        title="Create Subject"
        description="Add a new subject to the global catalog. Fill in the basic details first, then configure classification and settings."
      >
        {currentStep === 1 ? (
          <div className="space-y-4">
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
                rows={3}
              />
            </div>
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
          </div>
        ) : currentStep === 2 ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Level *</Label>
              <div className="flex gap-2">
                {LEVEL_OPTIONS.map((level) => (
                  <Button
                    key={level}
                    type="button"
                    variant={selectedLevel === level ? "default" : "outline"}
                    size="sm"
                    onClick={() => selectLevel(level)}
                  >
                    {level}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Grades</Label>
              <div className="flex flex-wrap gap-2">
                {GRADE_MAP[selectedLevel]?.map((grade) => (
                  <Button
                    key={grade}
                    type="button"
                    variant={grades.includes(grade) ? "default" : "outline"}
                    size="sm"
                    className="w-10"
                    onClick={() => toggleGrade(grade)}
                  >
                    {grade}
                  </Button>
                ))}
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Country</Label>
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRY_OPTIONS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Curriculum</Label>
                <Select value={curriculum} onValueChange={setCurriculum}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRICULUM_OPTIONS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <Label>School Type</Label>
                <Select value={schoolType} onValueChange={setSchoolType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SCHOOL_TYPE_OPTIONS.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        ) : currentStep === 3 ? (
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm">
              Add chapters to organize your subject content. You can reorder and
              add images later from the detail page.
            </p>
            {chapterNames.map((ch, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-muted-foreground w-6 text-center text-xs">
                  {i + 1}
                </span>
                <Input
                  value={ch}
                  onChange={(e) => updateChapterName(i, e.target.value)}
                  placeholder={`Chapter ${i + 1} name`}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive h-8 w-8 shrink-0"
                  onClick={() => removeChapter(i)}
                >
                  ×
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addChapter}
            >
              + Add Chapter
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {chapterNames.filter((n) => n.trim()).length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No chapters added. Go back to add chapters first, or skip to
                create the subject without lessons.
              </p>
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  {chapterNames.map(
                    (ch, i) =>
                      ch.trim() && (
                        <Button
                          key={i}
                          type="button"
                          variant={
                            activeChapterIndex === i ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => setActiveChapterIndex(i)}
                        >
                          {ch.trim()}
                        </Button>
                      )
                  )}
                </div>
                <div className="space-y-2">
                  {(lessonNames[activeChapterIndex] ?? []).map((ln, li) => (
                    <div key={li} className="flex items-center gap-2">
                      <span className="text-muted-foreground w-6 text-center text-xs">
                        {li + 1}
                      </span>
                      <Input
                        value={ln}
                        onChange={(e) =>
                          updateLessonName(
                            activeChapterIndex,
                            li,
                            e.target.value
                          )
                        }
                        placeholder={`Lesson ${li + 1} name`}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive h-8 w-8 shrink-0"
                        onClick={() => removeLesson(activeChapterIndex, li)}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addLesson(activeChapterIndex)}
                  >
                    + Add Lesson
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </ModalFormLayout>

      <ModalFooter
        currentStep={currentStep}
        totalSteps={4}
        stepLabel={stepLabels[currentStep]}
        isSubmitting={isPending}
        onBack={handleBack}
        onNext={handleNext}
        labels={{
          cancel: "Cancel",
          back: "Back",
          next: "Next",
          create: "Create",
          saving: "Creating...",
        }}
      />
    </form>
  )
}
