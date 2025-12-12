"use client"

import * as React from 'react'
import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DateRangePicker } from '@/components/ui/date-picker'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FileSpreadsheet, Search, ListFilter, RefreshCw, LoaderCircle, CircleCheck, CircleX, Clock, CircleAlert } from "lucide-react";
import { AttendanceReportExportButton } from "./export-button";
import { cn } from '@/lib/utils'
import type { Dictionary } from '@/components/internationalization/dictionaries'
import {
  getAttendanceReport,
  getClassesForSelection,
  getAttendanceStats
} from '../actions'

interface ReportRecord {
  id: string
  date: string
  studentId: string
  studentName: string
  classId: string
  className: string
  status: string
  method: string
  checkInTime?: string
  checkOutTime?: string
  notes?: string | null
}

interface Props {
  dictionary?: Dictionary
  locale?: string
  initialFilters?: {
    classId?: string
    studentId?: string
    status?: string
    from?: string
    to?: string
  }
}

const STATUS_COLORS: Record<string, string> = {
  PRESENT: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  ABSENT: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  LATE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  EXCUSED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  SICK: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  PRESENT: <CircleCheck className="h-4 w-4" />,
  ABSENT: <CircleX className="h-4 w-4" />,
  LATE: <Clock className="h-4 w-4" />,
  EXCUSED: <CircleAlert className="h-4 w-4" />,
  SICK: <CircleAlert className="h-4 w-4" />,
}

export function ReportsContent({ dictionary, locale = 'en', initialFilters }: Props) {
  const [records, setRecords] = useState<ReportRecord[]>([])
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // ListFilter state
  const [dateRange, setDateRange] = useState({
    from: initialFilters?.from ? new Date(initialFilters.from) : new Date(new Date().setDate(new Date().getDate() - 30)),
    to: initialFilters?.to ? new Date(initialFilters.to) : new Date()
  })
  const [selectedClass, setSelectedClass] = useState<string>(initialFilters?.classId || 'all')
  const [selectedStatus, setSelectedStatus] = useState<string>(initialFilters?.status || 'all')
  const [searchQuery, setSearchQuery] = useState('')

  // Pagination
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 50

  // Stats
  const [stats, setStats] = useState<{ total: number; present: number; absent: number; late: number; attendanceRate: number } | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)

      const [reportResult, classesResult, statsResult] = await Promise.all([
        getAttendanceReport({
          dateFrom: dateRange.from.toISOString(),
          dateTo: dateRange.to.toISOString(),
          classId: selectedClass !== 'all' ? selectedClass : undefined,
          status: selectedStatus !== 'all' ? [selectedStatus as any] : undefined,
          limit: pageSize,
          offset: (page - 1) * pageSize,
        }),
        getClassesForSelection(),
        getAttendanceStats({
          dateFrom: dateRange.from.toISOString(),
          dateTo: dateRange.to.toISOString(),
          classId: selectedClass !== 'all' ? selectedClass : undefined,
        })
      ])

      // Handle mixed return types
      if (!('success' in reportResult && !reportResult.success) && 'records' in reportResult) {
        if (reportResult.records) setRecords(reportResult.records as any)
        if (reportResult.total != null) setTotal(reportResult.total)
        if (reportResult.totalPages != null) setTotalPages(reportResult.totalPages)
      }
      if (classesResult.success && classesResult.data) setClasses(classesResult.data.classes)
      // statsResult returns raw data on success
      if (!('success' in statsResult && !statsResult.success)) setStats(statsResult as any)
    } catch (error) {
      console.error('Error fetching report data:', error)
    } finally {
      setLoading(false)
    }
  }, [dateRange, selectedClass, selectedStatus, page])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchData()
    setTimeout(() => setRefreshing(false), 500)
  }, [fetchData])

  // Get selected class name for export
  const selectedClassName = selectedClass !== 'all'
    ? classes.find(c => c.id === selectedClass)?.name
    : undefined

  // Memoize filtered records to prevent recalculation on every render
  const filteredRecords = React.useMemo(() => {
    if (!searchQuery) return records

    const query = searchQuery.toLowerCase()
    return records.filter(r =>
      r.studentName.toLowerCase().includes(query) ||
      r.className.toLowerCase().includes(query)
    )
  }, [records, searchQuery])

  const dict = dictionary?.school?.attendance || {}

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <FileSpreadsheet className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h1 className="scroll-m-20 text-2xl font-semibold tracking-tight">Attendance Reports</h1>
            <p className="text-sm text-muted-foreground">
              Generate and export detailed attendance reports
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
            Refresh
          </Button>
          <AttendanceReportExportButton
            filters={{
              classId: selectedClass !== 'all' ? selectedClass : undefined,
              status: selectedStatus !== 'all' ? selectedStatus : undefined,
              from: dateRange.from.toISOString(),
              to: dateRange.to.toISOString(),
            }}
            className={selectedClassName}
            locale={locale}
          />
        </div>
      </div>

      {/* Summary Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">{stats.attendanceRate}% attendance rate</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Present</CardTitle>
              <CircleCheck className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.present}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Late</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.late}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Absent</CardTitle>
              <CircleX className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ListFilter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Date Range:</label>
              <DateRangePicker
                from={dateRange.from}
                to={dateRange.to}
                onSelect={(range) => {
                  setDateRange({ from: range.from || new Date(), to: range.to || new Date() })
                  setPage(1)
                }}
                placeholder="Select date range"
              />
            </div>
            <Select value={selectedClass} onValueChange={(v) => { setSelectedClass(v); setPage(1) }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map(cls => (
                  <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={(v) => { setSelectedStatus(v); setPage(1) }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="PRESENT">Present</SelectItem>
                <SelectItem value="ABSENT">Absent</SelectItem>
                <SelectItem value="LATE">Late</SelectItem>
                <SelectItem value="EXCUSED">Excused</SelectItem>
                <SelectItem value="SICK">Sick</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search student or class..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Attendance Records</CardTitle>
              <CardDescription>
                Showing {filteredRecords.length} of {total} records
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoaderCircle className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileSpreadsheet className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No records found</p>
              <p className="text-sm">Adjust filters or date range to see data</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Check-in</TableHead>
                    <TableHead>Check-out</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        {new Date(record.date).toLocaleDateString(locale)}
                      </TableCell>
                      <TableCell>{record.studentName}</TableCell>
                      <TableCell>{record.className}</TableCell>
                      <TableCell>
                        <Badge className={cn("gap-1", STATUS_COLORS[record.status])}>
                          {STATUS_ICONS[record.status]}
                          {record.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {record.method.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {record.checkInTime
                          ? new Date(record.checkInTime).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {record.checkOutTime
                          ? new Date(record.checkOutTime).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
                          : '-'}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {record.notes || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
