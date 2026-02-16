"use client"

import { useMemo, useState, useTransition } from "react"
import Image from "next/image"
import { Check, GraduationCap, Layers, Search } from "lucide-react"

import { getCatalogImageUrl } from "@/lib/catalog-image-url"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Locale } from "@/components/internationalization/config"

import { toggleSubjectSelection } from "./actions"

interface CatalogSubject {
  id: string
  name: string
  slug: string
  department: string
  levels: string[]
  color: string | null
  imageKey: string | null
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
  lang: Locale
}

const LEVEL_LABELS: Record<string, Record<string, string>> = {
  ELEMENTARY: { en: "Elementary", ar: "ابتدائي" },
  MIDDLE: { en: "Middle", ar: "متوسط" },
  HIGH: { en: "High", ar: "ثانوي" },
}

export function SubjectPicker({ subjects, grades, selections, lang }: Props) {
  const isRTL = lang === "ar"
  const [search, setSearch] = useState("")
  const [levelFilter, setLevelFilter] = useState<string>("all")
  const [selectedGradeId, setSelectedGradeId] = useState<string>(
    grades[0]?.id ?? ""
  )
  const [isPending, startTransition] = useTransition()
  const [optimisticSelections, setOptimisticSelections] = useState<Set<string>>(
    () => {
      const set = new Set<string>()
      for (const s of selections) {
        set.add(`${s.catalogSubjectId}:${s.gradeId}`)
      }
      return set
    }
  )

  const t = {
    search: isRTL ? "بحث في المواد..." : "Search subjects...",
    allLevels: isRTL ? "كل المراحل" : "All Levels",
    selectGrade: isRTL ? "اختر الصف" : "Select Grade",
    selected: isRTL ? "مختار" : "Selected",
    add: isRTL ? "إضافة" : "Add",
    chapters: isRTL ? "فصل" : "ch",
    lessons: isRTL ? "درس" : "lessons",
    schools: isRTL ? "مدارس" : "schools",
    noResults: isRTL ? "لا توجد نتائج" : "No subjects found",
    catalogDescription: isRTL
      ? "اختر المواد من الكتالوج العالمي لإضافتها إلى مدرستك"
      : "Select subjects from the global catalog to add to your school",
  }

  const filteredSubjects = useMemo(() => {
    return subjects.filter((s) => {
      const matchesSearch =
        !search ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.department.toLowerCase().includes(search.toLowerCase())
      const matchesLevel =
        levelFilter === "all" || s.levels.includes(levelFilter)
      return matchesSearch && matchesLevel
    })
  }, [subjects, search, levelFilter])

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

    startTransition(async () => {
      await toggleSubjectSelection(subjectId, selectedGradeId)
    })
  }

  function isSelected(subjectId: string): boolean {
    if (!selectedGradeId) return false
    return optimisticSelections.has(`${subjectId}:${selectedGradeId}`)
  }

  return (
    <div className="space-y-6">
      {/* Description */}
      <p className="text-muted-foreground text-sm">{t.catalogDescription}</p>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder={t.search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder={t.allLevels} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.allLevels}</SelectItem>
            <SelectItem value="ELEMENTARY">
              {LEVEL_LABELS.ELEMENTARY[lang] ?? "Elementary"}
            </SelectItem>
            <SelectItem value="MIDDLE">
              {LEVEL_LABELS.MIDDLE[lang] ?? "Middle"}
            </SelectItem>
            <SelectItem value="HIGH">
              {LEVEL_LABELS.HIGH[lang] ?? "High"}
            </SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedGradeId} onValueChange={setSelectedGradeId}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t.selectGrade} />
          </SelectTrigger>
          <SelectContent>
            {grades.map((g) => (
              <SelectItem key={g.id} value={g.id}>
                {g.name}
              </SelectItem>
            ))}
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
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {deptSubjects.map((subject) => {
                const selected = isSelected(subject.id)
                const imagePath = getCatalogImageUrl(null, subject.imageKey)

                return (
                  <Card
                    key={subject.id}
                    className={cn(
                      "group relative cursor-pointer overflow-hidden transition-all hover:shadow-md",
                      selected && "ring-primary ring-2"
                    )}
                    onClick={() => handleToggle(subject.id)}
                  >
                    {/* Color banner */}
                    <div
                      className="relative h-24"
                      style={{
                        backgroundColor: subject.color ?? "#6b7280",
                      }}
                    >
                      {imagePath && (
                        <Image
                          src={imagePath}
                          alt={subject.name}
                          fill
                          className="object-cover opacity-80"
                          quality={100}
                          sizes="(max-width: 640px) 50vw, 25vw"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                      {/* Selected badge */}
                      {selected && (
                        <div className="bg-primary absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      )}

                      {/* Level badges */}
                      <div className="absolute bottom-2 left-2 flex gap-1">
                        {subject.levels.map((level) => (
                          <Badge
                            key={level}
                            variant="secondary"
                            className="bg-white/20 text-[10px] text-white"
                          >
                            {LEVEL_LABELS[level]?.[lang] ?? level}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <CardContent className="p-3">
                      <h4 className="truncate font-medium">{subject.name}</h4>
                      <div className="text-muted-foreground mt-1 flex items-center gap-3 text-xs">
                        <span className="flex items-center gap-1">
                          <Layers className="h-3 w-3" />
                          {subject.totalChapters} {t.chapters}
                        </span>
                        <span className="flex items-center gap-1">
                          <GraduationCap className="h-3 w-3" />
                          {subject.usageCount} {t.schools}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
