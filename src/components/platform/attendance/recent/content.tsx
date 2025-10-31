"use client"

import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  Filter
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import type { Dictionary } from '@/components/internationalization/dictionaries'
import type { UserRole } from '@prisma/client'

interface Props {
  dictionary?: Dictionary['school']
  locale?: string
  userRole?: UserRole
}

interface AttendanceRecord {
  id: string
  studentName: string
  className: string
  status: 'present' | 'absent' | 'late' | 'excused'
  method: string
  timestamp: Date
  markedBy: string
}

// Mock data - replace with actual API call
const getMockRecentActivity = (): AttendanceRecord[] => {
  const now = new Date()
  return [
    {
      id: '1',
      studentName: 'Harry Potter',
      className: 'Gryffindor - Year 7',
      status: 'present',
      method: 'Manual',
      timestamp: new Date(now.getTime() - 5 * 60000), // 5 minutes ago
      markedBy: 'Prof. McGonagall',
    },
    {
      id: '2',
      studentName: 'Hermione Granger',
      className: 'Gryffindor - Year 7',
      status: 'present',
      method: 'QR Code',
      timestamp: new Date(now.getTime() - 10 * 60000), // 10 minutes ago
      markedBy: 'Self Check-in',
    },
    {
      id: '3',
      studentName: 'Ron Weasley',
      className: 'Gryffindor - Year 7',
      status: 'late',
      method: 'Manual',
      timestamp: new Date(now.getTime() - 15 * 60000), // 15 minutes ago
      markedBy: 'Prof. McGonagall',
    },
    {
      id: '4',
      studentName: 'Draco Malfoy',
      className: 'Slytherin - Year 7',
      status: 'absent',
      method: 'Manual',
      timestamp: new Date(now.getTime() - 30 * 60000), // 30 minutes ago
      markedBy: 'Prof. Snape',
    },
    {
      id: '5',
      studentName: 'Luna Lovegood',
      className: 'Ravenclaw - Year 6',
      status: 'present',
      method: 'Geofence',
      timestamp: new Date(now.getTime() - 45 * 60000), // 45 minutes ago
      markedBy: 'Automatic',
    },
  ]
}

const getStatusIcon = (status: AttendanceRecord['status']) => {
  switch (status) {
    case 'present':
      return <CheckCircle2 className="h-4 w-4 text-green-500" />
    case 'absent':
      return <XCircle className="h-4 w-4 text-red-500" />
    case 'late':
      return <Clock className="h-4 w-4 text-yellow-500" />
    case 'excused':
      return <AlertCircle className="h-4 w-4 text-blue-500" />
  }
}

const getStatusBadgeVariant = (status: AttendanceRecord['status']) => {
  switch (status) {
    case 'present':
      return 'default'
    case 'absent':
      return 'destructive'
    case 'late':
      return 'secondary'
    case 'excused':
      return 'outline'
  }
}

export function RecentActivityContent({ dictionary, locale = 'en', userRole }: Props) {
  const [records, setRecords] = React.useState<AttendanceRecord[]>([])
  const [filter, setFilter] = React.useState<'all' | 'present' | 'absent' | 'late'>('all')

  React.useEffect(() => {
    // In production, fetch from API
    setRecords(getMockRecentActivity())
  }, [])

  const filteredRecords = filter === 'all'
    ? records
    : records.filter(r => r.status === filter)

  const dict = dictionary?.attendance || {
    recentActivity: 'Recent Activity',
    recentActivityDescription: 'Latest attendance records across all methods',
    allRecords: 'All Records',
    present: 'Present',
    absent: 'Absent',
    late: 'Late',
    noRecentRecords: 'No recent attendance records',
    startMarkingAttendance: 'Start Marking Attendance',
    markedBy: 'Marked by',
    via: 'via',
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{records.length}</div>
            <p className="text-xs text-muted-foreground">
              Last 24 hours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{dict.present}</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {records.filter(r => r.status === 'present').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{dict.late}</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {records.filter(r => r.status === 'late').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{dict.absent}</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {records.filter(r => r.status === 'absent').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Records */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{dict.recentActivity}</CardTitle>
              <CardDescription>{dict.recentActivityDescription}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                {dict.allRecords}
              </Button>
              <Button
                variant={filter === 'present' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('present')}
              >
                {dict.present}
              </Button>
              <Button
                variant={filter === 'late' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('late')}
              >
                {dict.late}
              </Button>
              <Button
                variant={filter === 'absent' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('absent')}
              >
                {dict.absent}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredRecords.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>{dict.noRecentRecords}</p>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-2">
                {filteredRecords.map((record) => (
                  <div
                    key={record.id}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-lg border transition-colors hover:bg-muted/50",
                      "rtl:flex-row-reverse"
                    )}
                  >
                    <div className="flex items-center gap-4 rtl:flex-row-reverse">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
                        {getStatusIcon(record.status)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 rtl:flex-row-reverse">
                          <h4 className="font-semibold">{record.studentName}</h4>
                          <Badge variant={getStatusBadgeVariant(record.status)}>
                            {record.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {record.className}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1 rtl:flex-row-reverse">
                          <span>
                            {dict.markedBy} {record.markedBy}
                          </span>
                          <span>•</span>
                          <span>
                            {dict.via} {record.method}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDistanceToNow(record.timestamp, { addSuffix: true })}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
