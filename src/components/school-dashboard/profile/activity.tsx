"use client"

import { useMemo } from "react"
import {
  Award,
  BookOpen,
  CalendarCheck,
  FileText,
  GraduationCap,
  MessageSquare,
  Receipt,
  Trophy,
} from "lucide-react"

import { formatDate } from "@/lib/i18n-format"
import type { Locale } from "@/components/internationalization/config"

import type { ProfileActivityView } from "./queries"

interface ContributionActivityProps {
  items: ProfileActivityView[]
  dictionary?: Record<string, any>
  lang?: Locale
}

const ACTIVITY_ICON: Record<string, React.ReactNode> = {
  ASSIGNMENT_SUBMITTED: <FileText className="size-3.5" />,
  ATTENDANCE_MARKED: <CalendarCheck className="size-3.5" />,
  ACHIEVEMENT_EARNED: <Trophy className="size-3.5" />,
  EXAM_COMPLETED: <GraduationCap className="size-3.5" />,
  COURSE_ENROLLED: <BookOpen className="size-3.5" />,
  COURSE_COMPLETED: <GraduationCap className="size-3.5" />,
  GRADE_RECEIVED: <Award className="size-3.5" />,
  CERTIFICATE_EARNED: <Award className="size-3.5" />,
  LIBRARY_CHECKOUT: <BookOpen className="size-3.5" />,
  LIBRARY_RETURN: <BookOpen className="size-3.5" />,
  EVENT_ATTENDED: <CalendarCheck className="size-3.5" />,
  PROFILE_UPDATED: <FileText className="size-3.5" />,
  OTHER: <MessageSquare className="size-3.5" />,
}

function iconFor(type: string): React.ReactNode {
  return ACTIVITY_ICON[type] ?? <Receipt className="size-3.5" />
}

export default function ContributionActivity({
  items,
  dictionary,
  lang,
}: ContributionActivityProps) {
  const ov = dictionary?.overview
  const locale: Locale = lang === "ar" ? "ar" : "en"

  const grouped = useMemo(() => {
    const map = new Map<string, ProfileActivityView[]>()
    for (const item of items) {
      const d = new Date(item.createdAt)
      const key = d.toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", {
        month: "long",
        year: "numeric",
      })
      const arr = map.get(key) ?? []
      arr.push(item)
      map.set(key, arr)
    }
    return Array.from(map.entries())
  }, [items, locale])

  return (
    <div className="space-y-4">
      <h3 className="text-foreground text-sm font-medium">
        {ov?.contributionActivity ?? ""}
      </h3>

      {grouped.length === 0 ? (
        <div className="text-muted-foreground py-8 text-center">
          <p className="text-sm">{ov?.noActivityYet ?? ""}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([month, monthItems]) => (
            <div key={month}>
              <div className="mb-3 flex items-center gap-3">
                <h4 className="text-foreground shrink-0 text-xs font-semibold">
                  {month}
                </h4>
                <div className="border-border h-px flex-1 border-t" />
              </div>

              <div className="relative ms-4 ps-6">
                <div className="border-border absolute start-0 top-0 bottom-0 border-s-2" />
                <ul className="space-y-6">
                  {monthItems.map((item) => (
                    <li key={item.id} className="relative">
                      <div
                        aria-hidden="true"
                        className="bg-muted border-background text-muted-foreground absolute -start-[2.375rem] top-0 flex size-7 items-center justify-center rounded-full border-2"
                      >
                        {iconFor(item.activityType)}
                      </div>
                      <div className="space-y-1">
                        <p className="text-foreground text-sm font-medium">
                          {item.title}
                        </p>
                        {item.description && (
                          <p className="text-muted-foreground text-xs">
                            {item.description}
                          </p>
                        )}
                        <p className="text-muted-foreground text-xs">
                          {formatDate(new Date(item.createdAt), locale)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
