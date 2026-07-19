"use client"

import { asset } from "@/lib/asset-url"
import { formatDate } from "@/lib/i18n-format"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import type { Locale } from "@/components/internationalization/config"

import type { ProfileBadgeView } from "./queries"

interface AchievementsGridProps {
  badges: ProfileBadgeView[]
  dictionary?: Record<string, any>
  lang?: Locale
}

const LEVEL_CLASS: Record<ProfileBadgeView["level"], string> = {
  BRONZE: "bg-muted text-muted-foreground",
  SILVER: "bg-secondary text-secondary-foreground",
  GOLD: "bg-primary/15 text-primary",
  PLATINUM: "bg-primary text-primary-foreground",
}

/**
 * GitHub-style achievements tab: the user's earned badges as a grid of cards.
 * Pure presenter of ProfileViewData.badges — no fetching, no fabrication.
 */
export default function AchievementsGrid({
  badges,
  dictionary,
  lang,
}: AchievementsGridProps) {
  const p = dictionary
  const locale: Locale = lang === "ar" ? "ar" : "en"

  if (badges.length === 0) {
    return (
      <div className="border-border text-muted-foreground rounded-md border border-dashed p-10 text-center text-sm">
        {p?.achievementsTab?.empty ?? ""}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {badges.map((badge) => {
        const earned = badge.earnedAt
          ? formatDate(new Date(badge.earnedAt), locale, {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              timeZone: "UTC",
            })
          : null
        return (
          <Card key={badge.id} className="border-border">
            <CardContent className="flex items-start gap-3 p-4">
              <img
                src={asset(`/illustrations/${badge.icon}.png`)}
                alt=""
                className="size-16 shrink-0"
              />
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <h4 className="text-foreground text-sm font-semibold">
                    {badge.title}
                  </h4>
                  <Badge
                    variant="secondary"
                    className={`h-4 px-1.5 py-0 text-[10px] ${LEVEL_CLASS[badge.level]}`}
                  >
                    {p?.levels?.[badge.level.toLowerCase()] ?? badge.level}
                  </Badge>
                </div>
                {badge.description && (
                  <p className="text-muted-foreground line-clamp-2 text-xs">
                    {badge.description}
                  </p>
                )}
                {earned && (
                  <p className="text-muted-foreground text-xs">
                    {(p?.sidebar?.unlockedOn ?? "{date}").replace(
                      "{date}",
                      earned
                    )}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
