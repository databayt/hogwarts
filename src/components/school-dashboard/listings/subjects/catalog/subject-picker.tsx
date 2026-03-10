"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useEffect, useMemo, useState, useTransition } from "react"
import Image from "next/image"
import {
  Check,
  GraduationCap,
  Layers,
  Loader2,
  Minus,
  Plus,
  Search,
} from "lucide-react"

import { getCatalogImageUrl } from "@/lib/catalog-image-url"
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
  imageKey: string | null
  thumbnailKey: string | null
  totalChapters: number
  totalLessons: number
  usageCount: number
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
  lang: Locale
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
    return subjects.filter((s) => {
      const matchesSearch =
        !search ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.department.toLowerCase().includes(search.toLowerCase())
      const matchesLevel =
        levelFilter === "all" || s.levels.includes(levelFilter)
      const selected = optimisticSelections.has(`${s.id}:${selectedGradeId}`)
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "included" && selected) ||
        (statusFilter === "not-included" && !selected)
      return matchesSearch && matchesLevel && matchesStatus
    })
  }, [
    subjects,
    search,
    levelFilter,
    statusFilter,
    optimisticSelections,
    selectedGradeId,
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
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative min-w-[200px] flex-1">
          <Search className="text-muted-foreground absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder={t.search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ps-9"
          />
        </div>

        {/* Level filter — always visible */}
        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="w-[160px]">
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

        {/* Grade pills */}
        {visibleGrades.length > 0 && (
          <div className="flex items-center gap-1">
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

        {/* Status filter */}
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as StatusFilter)}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder={t.status} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.all}</SelectItem>
            <SelectItem value="included">{t.included}</SelectItem>
            <SelectItem value="not-included">{t.notIncluded}</SelectItem>
          </SelectContent>
        </Select>
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
                const imagePath = getCatalogImageUrl(
                  subject.thumbnailKey,
                  subject.imageKey,
                  "sm"
                )

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
                        imageUrl={imagePath}
                        name={subject.name}
                        color={subject.color}
                      />
                      {selected && (
                        <div className="bg-primary/80 absolute inset-0 flex items-center justify-center rounded-s-lg">
                          <Check className="h-5 w-5 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Name + level + stats */}
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
                      <div className="text-muted-foreground mt-0.5 flex items-center gap-3 text-xs">
                        <span className="flex items-center gap-1">
                          <Layers className="h-3 w-3" />
                          {subject.totalChapters} {t.chapters}
                        </span>
                        <span className="flex items-center gap-1">
                          <GraduationCap className="h-3 w-3" />
                          {subject.usageCount} {t.schools}
                        </span>
                      </div>
                    </div>

                    {/* Include/Remove button */}
                    <div className="shrink-0 pe-3">
                      {selected ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10 h-8 gap-1 px-2"
                          onClick={() => handleToggle(subject.id)}
                          disabled={isThisPending}
                        >
                          {isThisPending ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Minus className="h-3.5 w-3.5" />
                          )}
                          <span className="hidden sm:inline">{t.remove}</span>
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1 px-2"
                          onClick={() => handleToggle(subject.id)}
                          disabled={isThisPending}
                        >
                          {isThisPending ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Plus className="h-3.5 w-3.5" />
                          )}
                          <span className="hidden sm:inline">{t.include}</span>
                        </Button>
                      )}
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
