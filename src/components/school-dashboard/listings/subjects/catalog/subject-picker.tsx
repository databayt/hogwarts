"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useEffect, useMemo, useState, useTransition } from "react"
import Image from "next/image"
import { Check, Loader2, Plus, Search, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Locale } from "@/components/internationalization/config"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { toggleSubjectSelection } from "./actions"

interface CatalogSubject {
  id: string
  name: string
  slug: string
  department: string
  levels: string[]
  color: string | null
  curriculum: string
  grades: number[]
  imageUrl: string | null
  isSelected: boolean
}

interface Grade {
  id: string
  name: string
  gradeNumber: number
  levelName: string
  level: string
}

interface Selection {
  id: string
  catalogSubjectId: string
  gradeId: string
  streamId: string | null
  isRequired: boolean
  weeklyPeriods: number | null
  customName: string | null
  isActive: boolean
}

interface Props {
  subjects: CatalogSubject[]
  grades: Grade[]
  selections: Selection[]
  schoolLevels: string[]
  curricula: string[]
  lang: Locale
}

const CURRICULUM_LABELS: Record<string, string> = {
  "us-k12": "US K-12",
  national: "National",
  british: "British",
  ib: "IB",
}

const LEVEL_LABELS: Record<string, Record<string, string>> = {
  ELEMENTARY: { en: "Elementary", ar: "ابتدائي" },
  MIDDLE: { en: "Middle", ar: "متوسط" },
  HIGH: { en: "High", ar: "ثانوي" },
}

type StatusFilter = "all" | "included" | "not-included"

export function SubjectPicker({
  subjects,
  grades,
  selections,
  schoolLevels,
  curricula,
  lang,
}: Props) {
  const { dictionary } = useDictionary()
  const cat = dictionary?.school?.subjects?.catalog as
    | Record<string, string>
    | undefined
  const [search, setSearch] = useState("")
  const [levelFilter, setLevelFilter] = useState<string>(
    schoolLevels.length === 1 ? schoolLevels[0] : "all"
  )
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [curriculumFilter, setCurriculumFilter] = useState("all")
  const [isPending, startTransition] = useTransition()
  const [pendingSubjectId, setPendingSubjectId] = useState<string | null>(null)
  const [optimisticSelections, setOptimisticSelections] = useState<Set<string>>(
    () => {
      const set = new Set<string>()
      for (const s of selections) {
        set.add(`${s.catalogSubjectId}:${s.gradeId}`)
      }
      return set
    }
  )

  // Grade pills filtered by level
  const visibleGrades = useMemo(() => {
    if (levelFilter === "all") return grades
    return grades.filter((g) => g.level === levelFilter)
  }, [grades, levelFilter])

  // Auto-select first visible grade
  const [selectedGradeId, setSelectedGradeId] = useState<string>(
    grades[0]?.id ?? ""
  )

  // When level changes and current grade is not in visible list, select first visible
  useEffect(() => {
    if (
      visibleGrades.length > 0 &&
      !visibleGrades.some((g) => g.id === selectedGradeId)
    ) {
      setSelectedGradeId(visibleGrades[0].id)
    }
  }, [visibleGrades, selectedGradeId])

  const t = {
    search: cat?.searchSubjects || "Search subjects...",
    allLevels: cat?.allLevels || "All Levels",
    selectGrade: cat?.selectGrade || "Select Grade",
    selected: cat?.selected || "Selected",
    add: cat?.add || "Add",
    chapters: cat?.chapters || "ch",
    lessons: cat?.lessons || "lessons",
    schools: cat?.schools || "schools",
    noResults: cat?.noResults || "No subjects found",
    catalogDescription:
      cat?.catalogDescription ||
      "Select subjects from the global catalog to add to your school",
    include: cat?.include || "Include",
    remove: cat?.remove || "Remove",
    included: cat?.included || "Included",
    notIncluded: cat?.notIncluded || "Not Included",
    all: cat?.all || "All",
    status: cat?.status || "Status",
  }

  function isSelected(subjectId: string): boolean {
    if (!selectedGradeId) return false
    return optimisticSelections.has(`${subjectId}:${selectedGradeId}`)
  }

  const filteredSubjects = useMemo(() => {
    const selectedGrade = grades.find((g) => g.id === selectedGradeId)
    return subjects.filter((s) => {
      const matchesSearch =
        !search ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.department.toLowerCase().includes(search.toLowerCase())
      const matchesLevel =
        levelFilter === "all" || s.levels.includes(levelFilter)
      const matchesCurriculum =
        curriculumFilter === "all" || s.curriculum === curriculumFilter
      const matchesGrade =
        !selectedGrade ||
        s.grades.length === 0 ||
        s.grades.includes(selectedGrade.gradeNumber)
      const selected = optimisticSelections.has(`${s.id}:${selectedGradeId}`)
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "included" && selected) ||
        (statusFilter === "not-included" && !selected)
      return (
        matchesSearch &&
        matchesLevel &&
        matchesCurriculum &&
        matchesGrade &&
        matchesStatus
      )
    })
  }, [
    subjects,
    search,
    levelFilter,
    curriculumFilter,
    statusFilter,
    optimisticSelections,
    selectedGradeId,
    grades,
  ])

  // Group subjects by department
  const groupedSubjects = useMemo(() => {
    const groups: Record<string, CatalogSubject[]> = {}
    for (const s of filteredSubjects) {
      const dept = s.department
      if (!groups[dept]) groups[dept] = []
      groups[dept].push(s)
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
  }, [filteredSubjects])

  function handleToggle(subjectId: string) {
    if (!selectedGradeId) return

    const key = `${subjectId}:${selectedGradeId}`
    const newSet = new Set(optimisticSelections)

    if (newSet.has(key)) {
      newSet.delete(key)
    } else {
      newSet.add(key)
    }
    setOptimisticSelections(newSet)
    setPendingSubjectId(subjectId)

    startTransition(async () => {
      await toggleSubjectSelection(subjectId, selectedGradeId)
      setPendingSubjectId(null)
    })
  }

  return (
    <div className="space-y-6">
      {/* Description */}
      <p className="text-muted-foreground text-sm">{t.catalogDescription}</p>

      {/* Toolbar */}
      <div
        role="toolbar"
        className="flex w-full flex-wrap items-center gap-2 p-1"
      >
        {/* Search */}
        <div className="relative">
          <Search className="text-muted-foreground absolute start-2.5 top-1/2 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder={t.search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-40 ps-8 lg:w-56"
          />
        </div>

        {/* Level filter */}
        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="h-9 w-[140px]">
            <SelectValue placeholder={t.allLevels} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.allLevels}</SelectItem>
            {schoolLevels.map((level) => (
              <SelectItem key={level} value={level}>
                {LEVEL_LABELS[level]?.[lang] ?? level}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Curriculum filter */}
        {curricula.length > 1 && (
          <Select value={curriculumFilter} onValueChange={setCurriculumFilter}>
            <SelectTrigger className="h-9 w-[140px]">
              <SelectValue placeholder="Curriculum" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Curricula</SelectItem>
              {curricula.map((c) => (
                <SelectItem key={c} value={c}>
                  {CURRICULUM_LABELS[c] ?? c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Status filter */}
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as StatusFilter)}
        >
          <SelectTrigger className="h-9 w-[140px]">
            <SelectValue placeholder={t.status} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.all}</SelectItem>
            <SelectItem value="included">{t.included}</SelectItem>
            <SelectItem value="not-included">{t.notIncluded}</SelectItem>
          </SelectContent>
        </Select>

        {/* Grade pills — pushed to end */}
        {visibleGrades.length > 0 && (
          <div className="ms-auto flex items-center gap-1">
            {visibleGrades.map((g) => (
              <Button
                key={g.id}
                variant={selectedGradeId === g.id ? "default" : "outline"}
                size="sm"
                className="h-8 min-w-8 px-2.5"
                onClick={() => setSelectedGradeId(g.id)}
              >
                {g.gradeNumber}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Subject Grid by Department */}
      {groupedSubjects.length === 0 ? (
        <p className="text-muted-foreground py-12 text-center text-sm">
          {t.noResults}
        </p>
      ) : (
        groupedSubjects.map(([department, deptSubjects]) => (
          <div key={department}>
            <h3 className="text-muted-foreground mb-3 text-sm font-medium tracking-wide uppercase">
              {department}
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {deptSubjects.map((subject) => {
                const selected = isSelected(subject.id)
                const isThisPending =
                  isPending && pendingSubjectId === subject.id

                return (
                  <div
                    key={subject.id}
                    className={cn(
                      "flex items-center gap-3 overflow-hidden rounded-lg border transition-colors",
                      selected && "ring-primary ring-2"
                    )}
                  >
                    {/* Thumbnail with optional check overlay */}
                    <div className="relative">
                      <PickerThumb
                        imageUrl={subject.imageUrl}
                        name={subject.name}
                        color={subject.color}
                      />
                      {selected && (
                        <div className="bg-primary/80 absolute inset-0 flex items-center justify-center rounded-s-lg">
                          <Check className="h-5 w-5 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Name + level */}
                    <div className="min-w-0 flex-1 pe-1">
                      <p className="line-clamp-2 text-sm leading-snug font-medium">
                        {subject.name}
                      </p>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        {subject.levels.map((level) => (
                          <Badge
                            key={level}
                            variant="secondary"
                            className="px-1.5 py-0 text-[10px]"
                          >
                            {LEVEL_LABELS[level]?.[lang] ?? level}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Include/Remove icon button */}
                    <div className="shrink-0 pe-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "h-8 w-8",
                          selected && "text-destructive hover:bg-destructive/10"
                        )}
                        onClick={() => handleToggle(subject.id)}
                        disabled={isThisPending}
                      >
                        {isThisPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : selected ? (
                          <X className="h-4 w-4" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

function PickerThumb({
  imageUrl,
  name,
  color,
}: {
  imageUrl: string | null
  name: string
  color: string | null
}) {
  const [failed, setFailed] = useState(false)
  const onError = useCallback(() => setFailed(true), [])
  const showImage = imageUrl && !failed

  return (
    <div
      className="relative h-16 w-16 shrink-0 overflow-hidden rounded-s-lg"
      style={{ backgroundColor: color ?? "#6b7280" }}
    >
      {showImage && (
        <Image
          src={imageUrl}
          alt={name}
          fill
          className="object-cover"
          sizes="192px"
          quality={100}
          onError={onError}
          unoptimized={imageUrl.startsWith("https://")}
        />
      )}
    </div>
  )
}
