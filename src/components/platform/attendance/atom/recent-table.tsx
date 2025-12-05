"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { AttendanceStatus, AttendanceMethod } from "../shared/types"

interface RecentAttendanceRecord {
  id: string
  studentName: string
  className?: string
  status: AttendanceStatus
  method: AttendanceMethod
  checkInTime?: Date | string
  date: Date | string
}

interface RecentTableProps {
  data: RecentAttendanceRecord[]
  limit?: number
  dictionary?: {
    status?: Record<string, string>
    method?: Record<string, string>
    columns?: {
      student?: string
      class?: string
      status?: string
      time?: string
      method?: string
    }
    noRecords?: string
  }
}

const statusVariants: Record<AttendanceStatus, { variant: "default" | "secondary" | "destructive" | "outline"; className?: string }> = {
  PRESENT: { variant: "default", className: "!bg-emerald-400 !text-white hover:!bg-emerald-500" },
  ABSENT: { variant: "destructive", className: "!bg-rose-400 !text-white hover:!bg-rose-500" },
  LATE: { variant: "secondary", className: "!bg-amber-300 !text-amber-900 hover:!bg-amber-400" },
  EXCUSED: { variant: "outline", className: "!border-sky-400 !text-sky-500" },
  SICK: { variant: "outline", className: "!border-rose-400 !text-rose-500" },
  HOLIDAY: { variant: "secondary", className: "!bg-sky-400 !text-white hover:!bg-sky-500" },
}

const methodLabels: Record<AttendanceMethod, string> = {
  MANUAL: "Manual",
  QR_CODE: "QR Code",
  BARCODE: "Barcode",
  GEOFENCE: "Geofence",
  RFID: "RFID",
  FINGERPRINT: "Fingerprint",
  FACE_RECOGNITION: "Face",
  NFC: "NFC",
  BLUETOOTH: "Bluetooth",
  BULK_UPLOAD: "Import",
}

function formatTime(date: Date | string | undefined): string {
  if (!date) return "-"
  const d = new Date(date)
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "-"
  try {
    const d = new Date(date)
    if (isNaN(d.getTime())) return "-"

    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (d.toDateString() === today.toDateString()) {
      return "Today"
    }
    if (d.toDateString() === yesterday.toDateString()) {
      return "Yesterday"
    }
    return d.toLocaleDateString([], { month: "short", day: "numeric" })
  } catch {
    return "-"
  }
}

export function RecentTable({ data, limit = 10, dictionary }: RecentTableProps) {
  const records = data.slice(0, limit)

  if (records.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {dictionary?.noRecords || "No recent attendance records"}
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{dictionary?.columns?.student || "Student"}</TableHead>
          <TableHead>{dictionary?.columns?.class || "Class"}</TableHead>
          <TableHead>{dictionary?.columns?.status || "Status"}</TableHead>
          <TableHead>{dictionary?.columns?.time || "Time"}</TableHead>
          <TableHead className="hidden sm:table-cell">
            {dictionary?.columns?.method || "Method"}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {records.map((record) => {
          const statusConfig = statusVariants[record.status]
          return (
            <TableRow key={record.id}>
              <TableCell className="font-medium">{record.studentName}</TableCell>
              <TableCell className="text-muted-foreground">
                {record.className || "-"}
              </TableCell>
              <TableCell>
                <Badge
                  variant={statusConfig.variant}
                  className={cn(statusConfig.className)}
                >
                  {dictionary?.status?.[record.status] || record.status}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                <span className="text-foreground">{formatDate(record.date)}</span>
                {record.checkInTime && (
                  <span className="text-xs ml-1">
                    {formatTime(record.checkInTime)}
                  </span>
                )}
              </TableCell>
              <TableCell className="hidden sm:table-cell text-muted-foreground">
                {dictionary?.method?.[record.method] || methodLabels[record.method]}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
