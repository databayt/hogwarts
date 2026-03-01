"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useEffect, useState, useTransition } from "react"
import { CalendarDays, Loader2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getTimetableByClass } from "@/components/school-dashboard/timetable/actions"
import SimpleGrid from "@/components/school-dashboard/timetable/views/simple-grid"

type Section = { id: string; name: string }
type Grade = {
  id: string
  name: string
  gradeNumber: number
  sections: Section[]
}

interface ScheduleGridProps {
  lang: string
  termId: string
  grades: Grade[]
}

type TimetableData = Awaited<ReturnType<typeof getTimetableByClass>>

export function ScheduleGrid({ lang, termId, grades }: ScheduleGridProps) {
  const isRTL = lang === "ar"
  const [activeGradeId, setActiveGradeId] = useState(grades[0]?.id ?? "")
  const [activeSectionId, setActiveSectionId] = useState(
    grades[0]?.sections[0]?.id ?? ""
  )
  const [timetable, setTimetable] = useState<TimetableData | null>(null)
  const [isPending, startTransition] = useTransition()

  const activeGrade = grades.find((g) => g.id === activeGradeId)

  const loadTimetable = useCallback(
    (classId: string) => {
      startTransition(async () => {
        try {
          const data = await getTimetableByClass({ termId, classId })
          setTimetable(data)
        } catch {
          setTimetable(null)
        }
      })
    },
    [termId]
  )

  // Load on mount and when active section changes
  useEffect(() => {
    if (activeSectionId) {
      loadTimetable(activeSectionId)
    }
  }, [activeSectionId, loadTimetable])

  const handleGradeClick = (gradeId: string) => {
    setActiveGradeId(gradeId)
    const grade = grades.find((g) => g.id === gradeId)
    const firstSection = grade?.sections[0]?.id ?? ""
    setActiveSectionId(firstSection)
  }

  const handleSectionChange = (sectionId: string) => {
    setActiveSectionId(sectionId)
  }

  // Transform periods to include isBreak and order for SimpleGrid
  const gridPeriods =
    timetable?.periods.map((p, i) => ({
      ...p,
      order: i + 1,
      isBreak: p.name.toLowerCase().includes("break"),
    })) ?? []

  return (
    <div className="space-y-4">
      {/* Grade badges */}
      <div className="flex flex-wrap gap-2">
        {grades.map((grade) => (
          <Badge
            key={grade.id}
            variant={grade.id === activeGradeId ? "default" : "outline"}
            className="cursor-pointer px-3 py-1.5 select-none"
            onClick={() => handleGradeClick(grade.id)}
          >
            {grade.name}
          </Badge>
        ))}
      </div>

      {/* Section tabs (only if multiple sections) */}
      {activeGrade && activeGrade.sections.length > 1 ? (
        <Tabs value={activeSectionId} onValueChange={handleSectionChange}>
          <TabsList>
            {activeGrade.sections.map((section) => (
              <TabsTrigger key={section.id} value={section.id}>
                {section.name}
              </TabsTrigger>
            ))}
          </TabsList>
          {activeGrade.sections.map((section) => (
            <TabsContent key={section.id} value={section.id}>
              {isPending ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
                </div>
              ) : timetable && timetable.slots.length > 0 ? (
                <SimpleGrid
                  slots={timetable.slots}
                  workingDays={timetable.workingDays}
                  periods={gridPeriods}
                  lunchAfterPeriod={timetable.lunchAfterPeriod}
                  isRTL={isRTL}
                  viewMode="class"
                  editable={false}
                  highlightToday
                />
              ) : (
                <EmptyState />
              )}
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        /* Single section — no tabs needed */
        <div>
          {isPending ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
            </div>
          ) : timetable && timetable.slots.length > 0 ? (
            <SimpleGrid
              slots={timetable.slots}
              workingDays={timetable.workingDays}
              periods={gridPeriods}
              lunchAfterPeriod={timetable.lunchAfterPeriod}
              isRTL={isRTL}
              viewMode="class"
              editable={false}
              highlightToday
            />
          ) : (
            <EmptyState />
          )}
        </div>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="text-muted-foreground flex flex-col items-center py-16">
      <CalendarDays className="mb-3 h-10 w-10 opacity-50" />
      <p>No timetable data for this class.</p>
    </div>
  )
}
