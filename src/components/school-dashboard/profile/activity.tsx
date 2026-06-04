"use client"

import { useMemo } from "react"
import useSWR from "swr"

import { OcticonRepo } from "@/components/atom/icons"
import { useLocale } from "@/components/internationalization/use-locale"

import { getRecentActivity } from "./actions"
import type { ProfileRole } from "./types"

interface ContributionActivityProps {
  role?: ProfileRole
  userId?: string
  selectedYear?: number
  onYearChange?: (year: number) => void
  dictionary?: Record<string, any>
}

interface UserActivityRow {
  id: string
  activityType: string
  title: string
  description: string | null
  createdAt: string
}

export default function ContributionActivity({
  userId,
  selectedYear,
  dictionary,
}: ContributionActivityProps) {
  const ov = dictionary?.overview
  const { locale } = useLocale()

  // Real, tenant-scoped activity feed. UserActivity rows are written by
  // logUserActivity; until producers are wired it is honestly empty.
  const { data: activities } = useSWR(
    userId ? ["recent-activity", userId] : null,
    async () => {
      const res = await getRecentActivity(userId)
      return res.success ? (res.data as unknown as UserActivityRow[]) : []
    },
    { revalidateOnFocus: false }
  )

  // Group recent activity by month label (locale-aware).
  const groups = useMemo(() => {
    const map = new Map<string, UserActivityRow[]>()
    for (const a of activities ?? []) {
      const label = new Date(a.createdAt).toLocaleDateString(
        locale === "ar" ? "ar-SA" : "en-US",
        { month: "long", year: "numeric" }
      )
      const arr = map.get(label) ?? []
      arr.push(a)
      map.set(label, arr)
    }
    return map
  }, [activities, locale])

  const isEmpty = (activities?.length ?? 0) === 0

  return (
    <div className="space-y-4">
      <h3 className="text-foreground text-sm font-medium">
        {ov?.contributionActivity ?? "Contribution activity"}
      </h3>

      {isEmpty ? (
        <div className="text-muted-foreground py-8 text-center">
          <p className="text-sm">
            {(ov?.noActivity ?? "No activity recorded for {year}").replace(
              "{year}",
              String(selectedYear ?? new Date().getFullYear())
            )}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Array.from(groups.entries()).map(([month, items]) => (
            <div key={month}>
              <div className="mb-3 flex items-center gap-3">
                <h4 className="text-foreground shrink-0 text-xs font-semibold">
                  {month}
                </h4>
                <div className="border-border h-px flex-1 border-t" />
              </div>
              <div className="relative ms-4 ps-6">
                <div className="border-border absolute start-0 top-0 bottom-0 border-s-2" />
                <div className="space-y-6">
                  {items.map((item) => (
                    <div key={item.id} className="relative">
                      <div className="bg-muted border-background absolute -start-[2.375rem] top-0 flex size-7 items-center justify-center rounded-full border-2">
                        <OcticonRepo className="text-muted-foreground size-3.5" />
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
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
