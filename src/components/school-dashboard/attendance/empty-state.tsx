"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Attendance empty states — one quiet centered block each. Copy comes from
 * `attendanceToday.shell.empty`; a `dictionary` prop still overrides it.
 * Attendance is section-based (classes were removed), so "no classes"
 * points at section setup.
 */
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  BarChart3,
  Calendar,
  CalendarOff,
  FileText,
  QrCode,
  School,
  Users,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { useDictionary } from "@/components/internationalization/use-dictionary"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Dict = Record<string, any>

function useEmptyCopy(): Dict {
  const { dictionary } = useDictionary()
  return ((dictionary as Dict | undefined)?.attendanceToday?.shell?.empty ??
    {}) as Dict
}

function useLangPrefix(locale?: string): string {
  const params = useParams<{ lang?: string }>()
  const lang = locale ?? params?.lang
  return lang ? `/${lang}` : ""
}

function EmptyBlock({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: React.ComponentType<{ className?: string }>
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      {Icon ? (
        <span className="bg-muted flex size-12 items-center justify-center rounded-full">
          <Icon className="text-muted-foreground size-5" />
        </span>
      ) : null}
      <div className="max-w-sm space-y-1.5">
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
      {action}
    </div>
  )
}

interface EmptyStateProps {
  type?:
    | "no-students"
    | "no-classes"
    | "no-attendance"
    | "no-data"
    | "no-analytics"
  title?: string
  description?: string
  actionLabel?: string
  actionHref?: string
  onAction?: () => void
  showIcon?: boolean
  dictionary?: Dict
}

export function AttendanceEmptyState({
  type = "no-data",
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  showIcon = true,
  dictionary,
}: EmptyStateProps) {
  const e = useEmptyCopy()
  const prefix = useLangPrefix()
  const d = dictionary ?? {}

  const states = {
    "no-students": {
      icon: Users,
      title: d.noStudents ?? e.noStudents ?? "No students in this section",
      description:
        d.noStudentsDesc ??
        e.noStudentsDesc ??
        "Place students in this section to start taking attendance.",
      label: d.addStudents ?? e.manageStudents ?? "Manage students",
      href: `${prefix}/students`,
    },
    "no-classes": {
      icon: School,
      title: d.noClasses ?? e.noSections ?? "No sections yet",
      description:
        d.noClassesDesc ??
        e.noSectionsDesc ??
        "Attendance is taken per section. Add sections to your grades first.",
      label: d.createClass ?? e.setUpSections ?? "Set up sections",
      href: `${prefix}/classrooms/configure`,
    },
    "no-attendance": {
      icon: Calendar,
      title: d.noAttendance ?? e.noAttendance ?? "No attendance for this date",
      description:
        d.noAttendanceDesc ??
        e.noAttendanceDesc ??
        "Nothing has been marked for this date yet.",
      label: d.markAttendance ?? e.startMarking ?? "Take attendance",
      href: `${prefix}/attendance/manual`,
    },
    "no-data": {
      icon: FileText,
      title: d.noData ?? e.noData ?? "Nothing to show yet",
      description:
        d.noDataDesc ?? e.noDataDesc ?? "There's no data to display right now.",
      label: d.refresh ?? e.refresh ?? "Refresh",
      href: null as string | null,
    },
    "no-analytics": {
      icon: BarChart3,
      title: d.noAnalytics ?? e.noAnalytics ?? "No insights yet",
      description:
        d.noAnalyticsDesc ??
        e.noAnalyticsDesc ??
        "Take attendance for a few days to see trends here.",
      label: d.viewAttendance ?? e.viewAttendance ?? "Go to attendance",
      href: `${prefix}/attendance`,
    },
  }

  const s = states[type]
  const href = actionHref ?? s.href
  const label = actionLabel ?? s.label
  const action = href ? (
    <Button asChild size="sm" className="rounded-full px-4">
      <Link href={href}>{label}</Link>
    </Button>
  ) : onAction ? (
    <Button size="sm" className="rounded-full px-4" onClick={onAction}>
      {label}
    </Button>
  ) : null

  return (
    <EmptyBlock
      icon={showIcon ? s.icon : undefined}
      title={title ?? s.title}
      description={description ?? s.description}
      action={action}
    />
  )
}

export function NoClassesEmptyState({
  dictionary,
  locale,
}: {
  dictionary?: Dict
  locale?: string
}) {
  const e = useEmptyCopy()
  const prefix = useLangPrefix(locale)
  // Older callers pass school.attendance (with an emptyStates subtree).
  const es = (dictionary?.emptyStates ?? {}) as Dict
  return (
    <EmptyBlock
      icon={School}
      title={e.noSections ?? es.noClasses ?? "No sections yet"}
      description={
        e.noSectionsDesc ??
        "Attendance is taken per section. Add sections to your grades first."
      }
      action={
        <Button asChild className="rounded-full px-5">
          <Link href={`${prefix}/classrooms/configure`}>
            {e.setUpSections ?? "Set up sections"}
          </Link>
        </Button>
      }
    />
  )
}

export function NoStudentsEmptyState({
  dictionary,
  locale,
}: {
  dictionary?: Dict
  locale?: string
}) {
  const e = useEmptyCopy()
  const prefix = useLangPrefix(locale)
  const es = (dictionary?.emptyStates ?? {}) as Dict
  return (
    <EmptyBlock
      icon={Users}
      title={
        e.noStudents ?? es.noStudentsInClass ?? "No students in this section"
      }
      description={
        e.noStudentsDesc ??
        "Place students in this section to start taking attendance."
      }
      action={
        // A section's roster is whoever is placed in it — placement happens
        // on the students list, not in a class-enrollment screen.
        <Button asChild size="sm" className="rounded-full px-4">
          <Link href={`${prefix}/students`}>
            {e.manageStudents ?? es.manageStudents ?? "Manage students"}
          </Link>
        </Button>
      }
    />
  )
}

export function NoAttendanceDataEmptyState({
  dictionary,
}: {
  dictionary?: Dict
}) {
  const e = useEmptyCopy()
  const prefix = useLangPrefix()
  return (
    <EmptyBlock
      icon={CalendarOff}
      title={
        dictionary?.noAttendanceToday ??
        e.noAttendance ??
        "No attendance for this date"
      }
      description={
        dictionary?.noAttendanceTodayDesc ??
        e.noAttendanceDesc ??
        "Nothing has been marked for this date yet."
      }
      action={
        <Button asChild size="sm" className="rounded-full px-4">
          <Link href={`${prefix}/attendance/manual`}>
            {dictionary?.startMarking ?? e.startMarking ?? "Take attendance"}
          </Link>
        </Button>
      }
    />
  )
}

export function QRCodeEmptyState({ dictionary }: { dictionary?: Dict }) {
  const e = useEmptyCopy()
  const prefix = useLangPrefix()
  return (
    <EmptyBlock
      icon={QrCode}
      title={dictionary?.noQRSessions ?? e.noQr ?? "No QR sessions running"}
      description={
        dictionary?.noQRSessionsDesc ??
        e.noQrDesc ??
        "Show a QR code so students can check themselves in."
      }
      action={
        <Button asChild size="sm" className="rounded-full px-4">
          <Link href={`${prefix}/attendance/qr-code`}>
            {dictionary?.generateQR ?? e.generateQr ?? "Show a QR code"}
          </Link>
        </Button>
      }
    />
  )
}
