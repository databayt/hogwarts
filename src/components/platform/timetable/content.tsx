// Re-export the production-ready timetable content
export { TimetableContent } from './content-production'

// Keep the legacy implementation below for reference
/*

'use client'

import "./print.css"
import { TimetableHeader } from "@/components/platform/timetable/timetable-header"
import { TimetableGrid } from "@/components/platform/timetable/timetable-grid"
import { AboutHoverCard } from "@/components/platform/timetable/about-hover-card"
import { ConfigDialog } from "@/components/platform/timetable/config-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { useTimetableStore } from "@/components/platform/timetable/timetable"
import { getFallbackTimetableData } from "@/components/platform/timetable/fallback-data"
import { useEffect } from "react"

function getCurrentSchoolYear() {
  const today = new Date();
  let schoolYear = today.getFullYear();
  if (today.getMonth() < 2) {
    schoolYear--;
  }
  return schoolYear;
}

function generatePeriods(timetableData: any, classConfig: any) {
  // Use fallback data if enabled and main data is not available
  if (classConfig?.displayFallbackData && (!timetableData?.day_time?.length || !timetableData?.timetable?.length)) {
    const fallbackData = getFallbackTimetableData()
    timetableData = fallbackData
  }
  
  if (!timetableData?.day_time?.length || !timetableData?.timetable?.length) return []
  
  const dayLabels = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]
  const days = (timetableData?.days as number[] | undefined)?.map((d) => dayLabels[d] ?? String(d)) ?? ["Mon", "Tue", "Wed", "Thu", "Fri"]
  
  // First, create all regular periods
  const periods = timetableData.day_time.map((timeStr: string, idx: number) => {
    const period = timeStr.split('(')[0]
    const time = timeStr.split('(')[1]?.replace(')', '')
    
    return {
      id: period,
      time,
      subjects: days.map((_, dayIndex) => {
        const periodData = timetableData.timetable[dayIndex]?.[idx]
        return periodData?.subject || ""
      })
    }
  })

  // Then insert lunch at the correct position
  const lunchPeriod = {
    id: "Lunch",
    time: "12:20~13:20",
    subjects: Array(days.length).fill("Lunch")
  }

  // Insert lunch after the specified period
  const lunchAfterFromServer = typeof timetableData?.lunchAfterPeriod === 'number' ? timetableData.lunchAfterPeriod : null
  const lunchAfter = lunchAfterFromServer ?? (typeof classConfig?.lunchAfter === 'number' ? classConfig.lunchAfter : null)
  if (typeof lunchAfter === 'number') periods.splice(lunchAfter, 0, lunchPeriod)

  return periods
}

import type { Dictionary } from '@/components/internationalization/dictionaries'

interface TimetableContentProps {
  dictionary?: Dictionary['school']
}

export function TimetableContent({ dictionary }: TimetableContentProps) {
  const { 
    isNextWeek, 
    isWeekChangeLoading,
    changeWeek,
    showConfig,
    setShowConfig,
    classConfig,
    isLoading,
    error,
    timetableData,
    initializeStore,
    setTempConfig,
    saveConfig,
    saveTeacherInfo,
    getTeacherInfo
  } = useTimetableStore()

  useEffect(() => {
    initializeStore()
  }, [])

  useEffect(() => {
    if (classConfig) {
      document.title = `${classConfig.grade}-${classConfig.class} Timetable - ${classConfig.school}`
    }
  }, [classConfig])

  const handleConfigSave = (newConfig: any) => {
    setTempConfig(newConfig)
    saveConfig()
    setShowConfig(false)
  }

  const handleSubjectChange = (dayIndex: number, periodIdx: number, newSubject: string) => {
    // This function would typically update the timetable data
    // For now, we'll just log the change
    console.log(`Subject changed: Day ${dayIndex}, Period ${periodIdx} -> ${newSubject}`)
    
    // In a real implementation, you would:
    // 1. Update the local state
    // 2. Send the change to the server
    // 3. Update the timetable data
  }

  // Extract available subjects from current timetable data
  const getAvailableSubjects = () => {
    if (!timetableData?.timetable) return []
    
    const subjects = new Set<string>()
    timetableData.timetable.forEach((day: any[]) => {
      day.forEach((period: any) => {
        if (period.subject && period.subject !== "Lunch") {
          subjects.add(period.subject)
        }
      })
    })
    
    return Array.from(subjects).sort()
  }

  if (!classConfig) {
    return (
      <div className="py-6 px-2 sm:px-6 max-w-4xl mx-auto">
        <Skeleton className="h-[600px] rounded-xl" />
      </div>
    )
  }

  const periods = generatePeriods(timetableData, classConfig)
  const availableSubjects = getAvailableSubjects()

  return (
    
      <main className="min-h-screen print:bg-white print:py-4">
        <div className=" max-w-4xl mx-auto print:max-w-none">
          <TimetableHeader
            schoolYear={getCurrentSchoolYear()}
            school={classConfig.school}
            grade={classConfig.grade}
            class={classConfig.class}
            isNextWeek={isNextWeek}
            isWeekChangeLoading={isWeekChangeLoading}
            onWeekChange={changeWeek}
          />

          {error ? (
            <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
              <pre className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 overflow-auto">
                {error}
              </pre>
            </div>
          ) : (isLoading || isWeekChangeLoading) ? (
            <div className="overflow-x-auto shadow-lg rounded-xl border border-neutral-200 dark:border-neutral-800">
              <div className="min-w-full bg-white dark:bg-neutral-900">
                <Skeleton className="h-[600px]" />
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 print:shadow-none print:border print:rounded-none">
              <TimetableGrid
                periods={periods}
                timetableData={timetableData}
                onTeacherInfoSave={saveTeacherInfo}
                getTeacherInfo={getTeacherInfo}
                onSubjectChange={handleSubjectChange}
                showAllSubjects={classConfig.showAllSubjects}
                availableSubjects={availableSubjects}
              />
            </div>
          )}
          
          <div className="mt-6 print:hidden">
            <div className="flex justify-between items-center mb-4">
              {timetableData?.update_date && !error && (
                <p className="ml-1 text-sm text-neutral-500 dark:text-neutral-400">
                  Updated: {timetableData.update_date.slice(1, -1)}
                </p>
              )}
            </div>
          </div>

          <ConfigDialog
            open={showConfig}
            onOpenChange={setShowConfig}
            classConfig={classConfig}
            onConfigChange={setTempConfig}
            onSave={handleConfigSave}
          />
        </div>
      </main>
    
  )
}
*/
