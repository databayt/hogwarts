// "use client";

// import * as React from 'react'

// export function TimetableContent() {
//   const days = ["Sun", "Mon", "Tue", "Wed", "Thu"];
//   const periods = [1, 2, 3, 4, 5, 6];
//   const [conflicts, setConflicts] = React.useState<Array<{ type: string; classA: { name: string }; classB: { name: string }; teacher?: { name: string } | null; room?: { name: string } | null }>>([])
//   const [checking, setChecking] = React.useState(false)
//   const [termId, setTermId] = React.useState<string>("")
//   const [terms, setTerms] = React.useState<Array<{ id: string; label: string }>>([])
//   const onCheckConflicts = async () => {
//     setChecking(true)
//     try {
//       const { detectTimetableConflicts } = await import('./actions')
//       const res = await detectTimetableConflicts({ termId: termId || undefined })
//       setConflicts(res.conflicts)
//     } finally {
//       setChecking(false)
//     }
//   }
//   React.useEffect(() => {
//     ;(async () => {
//       const { getTermsForSelection } = await import('./actions')
//       const res = await getTermsForSelection()
//       setTerms(res.terms)
//       if (!termId && res.terms[0]) setTermId(res.terms[0].id)
//     })()
//   }, [])
//   return (
//     <div className="rounded-lg border bg-card p-4">
//       <div className="mb-2 text-sm font-medium">Weekly Timetable (placeholder)</div>
//       <div className="mb-3 flex items-center gap-2">
//         <select className="h-8 rounded-md border px-2 text-xs" value={termId} onChange={(e) => setTermId(e.target.value)}>
//           {terms.map((t) => (
//             <option key={t.id} value={t.id}>{t.label}</option>
//           ))}
//         </select>
//         <button onClick={onCheckConflicts} className="h-8 rounded-md border px-3 text-xs" disabled={checking}>{checking ? 'Checking…' : 'Check conflicts'}</button>
//         {conflicts.length > 0 && (
//           <div className="text-xs text-red-600">{conflicts.length} conflict(s) found</div>
//         )}
//       </div>
//       <div className="grid grid-cols-6 gap-px rounded-md border bg-border text-xs">
//         <div className="bg-muted p-2 font-medium">Period</div>
//         {days.map((d) => (
//           <div key={d} className="bg-muted p-2 font-medium text-center">
//             {d}
//           </div>
//         ))}
//         {periods.map((p) => (
//           <>
//             <div key={`p-${p}`} className="bg-background p-2 font-medium">
//               {p}
//             </div>
//             {days.map((d) => (
//               <div key={`${d}-${p}`} className="bg-background p-2 h-14" />
//             ))}
//           </>
//         ))}
//       </div>
//       {conflicts.length > 0 && (
//         <div className="mt-3 rounded-md border p-2">
//           <div className="mb-1 text-xs font-medium">Conflicts</div>
//           <ul className="text-xs list-disc pl-5">
//             {conflicts.map((c, i) => (
//               <li key={i}>
//                 {c.type === 'TEACHER' ? 'Teacher' : 'Room'} conflict: {c.classA.name} vs {c.classB.name} {c.teacher?.name ? `(${c.teacher.name})` : c.room?.name ? `(${c.room.name})` : ''}
//               </li>
//             ))}
//           </ul>
//         </div>
//       )}
//     </div>
//   );
// }

'use client'

import "./print.css"
import { TimetableHeader } from "@/components/platform/timetable/timetable-header"
import { TimetableGrid } from "@/components/platform/timetable/timetable-grid"
import { AboutHoverCard } from "@/components/platform/timetable/about-hover-card"
import { ConfigDialog } from "@/components/platform/timetable/config-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { useTimetableStore } from "@/components/platform/timetable/timetable"
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
  if (!timetableData?.day_time?.length || !timetableData?.timetable?.length) return []
  
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"]
  
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
  if (typeof classConfig?.lunchAfter === 'number') {
    periods.splice(classConfig.lunchAfter, 0, lunchPeriod)
  }

  return periods
}

export function TimetableContent() {
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

  if (!classConfig) {
    return (
      <div className="py-6 px-2 sm:px-6 max-w-4xl mx-auto">
        <Skeleton className="h-[600px] rounded-xl" />
      </div>
    )
  }

  const periods = generatePeriods(timetableData, classConfig)

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
