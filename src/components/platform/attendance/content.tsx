"use client";

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { useCallback } from 'react'
import { markAttendance } from '@/components/platform/attendance/actions'
import { SuccessToast, ErrorToast } from '@/components/atom/toast'
import { AttendanceTable, type AttendanceRow } from './table'
import { getAttendanceColumns } from './columns'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { getAttendanceList, getClassesForSelection, getAttendanceReportCsv } from '@/components/platform/attendance/actions'
import type { Dictionary } from '@/components/internationalization/dictionaries'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface Props {
  dictionary?: Dictionary['school']
}

export function AttendanceContent({ dictionary }: Props) {
  const [submitting, setSubmitting] = React.useState(false)
  const [classId, setClassId] = React.useState('')
  const [date, setDate] = React.useState(new Date().toISOString().slice(0, 10))
  const [classes, setClasses] = React.useState<Array<{ id: string; name: string }>>([])
  const [rows, setRows] = React.useState<AttendanceRow[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      if (!classId) { setRows([]); return }
      const { rows } = await getAttendanceList({ classId, date })
      setRows(rows)
    } finally {
      setIsLoading(false)
    }
  }, [classId, date])
  React.useEffect(() => { void load() }, [load])
  React.useEffect(() => {
    ;(async () => {
      const res = await getClassesForSelection()
      setClasses(res.classes)
      if (!classId && res.classes[0]) setClassId(res.classes[0].id)
    })()
  }, [])
  const [changed, setChanged] = React.useState<Record<string, AttendanceRow['status']>>({})
  const onSubmit = async () => {
    setSubmitting(true)
    try {
      const records = Object.entries(changed).map(([studentId, status]) => ({ studentId, status }))
      await markAttendance({ classId, date: new Date(date).toISOString(), records })
      setChanged({})
      await load()
      SuccessToast("Attendance saved successfully")
    } catch (e) {
      ErrorToast(e instanceof Error ? e.message : 'Failed')
    } finally {
      setSubmitting(false)
    }
  }
  const onChangeStatus = (studentId: string, status: AttendanceRow['status']) => {
    setChanged((prev) => ({ ...prev, [studentId]: status }))
    setRows((prev) => prev.map((r) => (r.studentId === studentId ? { ...r, status } : r)))
  }
  // Get dictionary with fallbacks
  const dict = dictionary?.attendance || {
    title: "Attendance",
    selectClass: "Select class",
    allPresent: "All Present",
    allAbsent: "All Absent",
    allLate: "All Late",
    saveAttendance: "Save Attendance",
    status: {
      present: "Present",
      absent: "Absent",
      late: "Late",
      excused: "Excused"
    }
  }

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'p') setRows((r) => r.map((x) => ({ ...x, status: 'present' })))
      if (e.key.toLowerCase() === 'a') setRows((r) => r.map((x) => ({ ...x, status: 'absent' })))
      if (e.key.toLowerCase() === 'l') setRows((r) => r.map((x) => ({ ...x, status: 'late' })))
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); void onSubmit() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onSubmit])
  return (
    <div className="grid gap-3">
      <div className="rounded-lg border bg-card p-4">
        <div className="mb-2 text-sm text-muted-foreground">{dict.title}</div>
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <Select value={classId} onValueChange={setClassId}>
            <SelectTrigger className="h-8 w-56"><SelectValue placeholder={dict.selectClass} /></SelectTrigger>
            <SelectContent>
              {classes.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
            </SelectContent>
          </Select>
          <Input type="date" className="h-8 w-44" value={date} onChange={(e) => setDate(e.target.value)} />
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setRows((r) => r.map((x) => ({ ...x, status: 'present' })))}>{dict.allPresent || "All Present"}</Button>
            <Button variant="outline" size="sm" onClick={() => setRows((r) => r.map((x) => ({ ...x, status: 'absent' })))}>{dict.allAbsent || "All Absent"}</Button>
            <Button variant="outline" size="sm" onClick={() => setRows((r) => r.map((x) => ({ ...x, status: 'late' })))}>All Late</Button>
          </div>
        </div>
        <Button size="sm" onClick={onSubmit} disabled={submitting || !Object.keys(changed).length}>{dict.saveAttendance || "Save Attendance"}</Button>
      </div>
      <AttendanceTable data={rows} columns={getAttendanceColumns(dictionary?.attendance)} onChangeStatus={onChangeStatus} />
    </div>
  )
}


