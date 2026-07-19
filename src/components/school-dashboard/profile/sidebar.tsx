"use client"

import { useState } from "react"
import { Calendar, Link as LinkIcon, Mail, MapPin, Phone } from "lucide-react"

import { asset } from "@/lib/asset-url"
import { formatDate as formatLocaleDate } from "@/lib/i18n-format"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverArrow,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useSidebar } from "@/components/ui/sidebar"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  OcticonOrganization,
  OcticonPeople,
  OcticonRepo,
  OcticonTrophy,
} from "@/components/atom/icons"
import type { Locale } from "@/components/internationalization/config"

import EditProfileForm from "./form"
import type { ProfileBadgeView, ProfileViewData } from "./queries"

interface ProfileSidebarProps {
  data: ProfileViewData
  dictionary?: Record<string, any>
  lang?: Locale
}

const STAT_ICONS: Record<string, React.ReactNode> = {
  subjects: <OcticonRepo className="size-4" />,
  classes: <OcticonRepo className="size-4" />,
  classmates: <OcticonPeople className="size-4" />,
  students: <OcticonPeople className="size-4" />,
  children: <OcticonPeople className="size-4" />,
}

const INFO_ICONS: Record<string, React.ReactNode> = {
  org: <OcticonOrganization className="size-4" />,
  location: <MapPin className="size-4" />,
  mail: <Mail className="size-4" />,
  phone: <Phone className="size-4" />,
  calendar: <Calendar className="size-4" />,
}

const BADGE_DETAIL_BG: Record<string, string> = {
  starstruck: asset("/illustrations/starstruck-detail.png"),
  "galaxy-brain": asset("/illustrations/galaxy-brain-detail.png"),
  "pull-shark": asset("/illustrations/pull-shark-detail.png"),
  yolo: asset("/illustrations/yolo-detail.png"),
  "pair-extraordinaire": asset("/illustrations/pair-extraordinaire-detail.png"),
  quickdraw: asset("/illustrations/quickdraw-detail.png"),
  "public-sponsor": asset("/illustrations/public-sponsor-detail.png"),
}

function badgeSrc(icon: string): string {
  return asset(`/illustrations/${icon}.png`)
}

function BadgePopover({
  badge,
  dictionary,
  lang,
}: {
  badge: ProfileBadgeView
  dictionary?: Record<string, any>
  lang?: Locale
}) {
  const earned = badge.earnedAt
    ? formatLocaleDate(new Date(badge.earnedAt), lang ?? "en", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        timeZone: "UTC",
      })
    : null
  const src = badgeSrc(badge.icon)
  const detailBg = BADGE_DETAIL_BG[badge.icon]

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="size-16 cursor-pointer"
          aria-label={badge.title}
        >
          <img src={src} alt={badge.title} className="size-16" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[360px] overflow-hidden border-0 p-0 shadow-md"
        side="top"
        align="start"
        sideOffset={8}
      >
        <PopoverArrow width={18} height={9} className="fill-popover" />
        <div
          className="flex items-center justify-center rounded-t-lg p-3"
          style={
            detailBg
              ? { backgroundImage: `url(${detailBg})`, backgroundSize: "cover" }
              : undefined
          }
        >
          <img src={src} alt="" className="size-[140px]" />
        </div>
        <div className="px-4 pt-3 pb-2">
          <h3 className="text-foreground text-base font-bold">{badge.title}</h3>
          {badge.description && (
            <div className="text-muted-foreground mt-1 text-sm">
              {badge.description}
            </div>
          )}
        </div>
        {(earned || badge.context) && (
          <>
            <hr className="border-border mx-4 mt-3" />
            <div className="space-y-1.5 px-4 pt-3 pb-3">
              <h4 className="text-muted-foreground mb-2 text-xs font-bold">
                {dictionary?.sidebar?.history ?? ""}
              </h4>
              {earned && (
                <div className="flex items-center gap-2 text-xs">
                  <OcticonTrophy className="text-muted-foreground size-4" />
                  <span className="text-muted-foreground">
                    {(dictionary?.sidebar?.unlockedOn ?? "{date}").replace(
                      "{date}",
                      earned
                    )}
                  </span>
                </div>
              )}
              {badge.context && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground ms-0.5">•</span>
                  <span className="text-muted-foreground">{badge.context}</span>
                </div>
              )}
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}

export default function ProfileSidebar({
  data,
  dictionary,
  lang,
}: ProfileSidebarProps) {
  const { isMobile } = useSidebar()
  const p = dictionary
  const [isEditing, setIsEditing] = useState(false)

  const firstName = data.displayName.split(" ")[0] ?? data.displayName
  const restName = data.displayName.split(" ").slice(1).join(" ")
  const initials =
    `${data.firstName?.[0] ?? ""}${data.lastName?.[0] ?? ""}`.toUpperCase() ||
    (data.displayName[0] ?? "?").toUpperCase()

  const roleLabel = p?.roles?.[data.role] ?? ""

  // GitHub-style link rows: website + social accounts (already stored + edited
  // via the profile form, previously never displayed).
  const prettyUrl = (url: string) =>
    url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")
  const socialEntries = Object.entries(data.socialLinks ?? {})
    .filter(([, url]) => typeof url === "string" && url.length > 0)
    .slice(0, 4)

  // Joined/enrolled row: the most meaningful real date for the role.
  const joinedDate = data.enrollmentDate ?? data.joiningDate ?? data.createdAt
  const joinedLabel = data.enrollmentDate
    ? (p?.sidebar?.enrolled ?? "")
    : (p?.sidebar?.joined ?? "")

  return (
    <TooltipProvider>
      <div className={`space-y-4 ${isMobile ? "max-w-xs" : "w-full max-w-72"}`}>
        {/* Avatar */}
        <div className="group relative">
          <Avatar className="border-border size-52 border shadow-lg lg:size-56 xl:size-64">
            {data.photoUrl && (
              <AvatarImage
                src={data.photoUrl}
                alt={data.displayName}
                className="object-cover"
              />
            )}
            <AvatarFallback className="from-primary/20 to-primary/40 bg-gradient-to-br text-4xl font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          {data.statusEmoji && (
            <div
              className="bg-background border-border absolute end-2 bottom-2 flex size-8 items-center justify-center rounded-full border text-base shadow-md"
              title={data.statusMessage ?? undefined}
              aria-label={data.statusMessage ?? data.statusEmoji}
            >
              {data.statusEmoji}
            </div>
          )}
        </div>

        {isEditing ? (
          <EditProfileForm
            data={data}
            onSave={() => setIsEditing(false)}
            onCancel={() => setIsEditing(false)}
            dictionary={p}
          />
        ) : (
          <>
            {/* Name + role */}
            <div className="space-y-1">
              <h1 className="text-foreground text-2xl leading-tight font-bold">
                {firstName}
              </h1>
              {restName && (
                <p className="text-muted-foreground text-xl font-light">
                  {restName}
                </p>
              )}
              {(roleLabel || data.pronouns) && (
                <p className="text-muted-foreground text-sm">
                  {roleLabel}
                  {data.pronouns && (
                    <span className="text-muted-foreground/80">
                      {roleLabel ? " · " : ""}
                      {data.pronouns}
                    </span>
                  )}
                </p>
              )}
            </div>

            {data.bio && (
              <p className="text-sm leading-relaxed whitespace-pre-line">
                {data.bio}
              </p>
            )}

            {data.canEdit && (
              <Button
                variant="outline"
                className="w-full"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                {p?.sidebar?.editProfile ?? ""}
              </Button>
            )}

            {/* Stats */}
            {data.stats.length > 0 && (
              <div className="text-muted-foreground flex flex-wrap items-center gap-1 text-sm">
                <OcticonPeople className="size-4" />
                {data.stats.map((stat, idx) => (
                  <span key={stat.key} className="flex items-center">
                    {STAT_ICONS[stat.key] ? (
                      <span className="me-1">{STAT_ICONS[stat.key]}</span>
                    ) : null}
                    <span className="text-foreground font-semibold">
                      {stat.value}
                    </span>
                    <span className="ms-1">
                      {p?.stats?.[stat.key] ?? stat.key}
                    </span>
                    {idx < data.stats.length - 1 && (
                      <span className="mx-1">·</span>
                    )}
                  </span>
                ))}
              </div>
            )}

            {/* Info */}
            {(data.info.length > 0 ||
              data.website ||
              socialEntries.length > 0 ||
              joinedDate) && (
              <div className="space-y-2">
                {data.info.map((item, idx) => (
                  <div
                    key={idx}
                    className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm transition-colors"
                  >
                    <span className="text-muted-foreground/70">
                      {INFO_ICONS[item.icon] ?? INFO_ICONS.org}
                    </span>
                    <span className="truncate">{item.value}</span>
                  </div>
                ))}
                {data.website && (
                  <a
                    href={data.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm transition-colors"
                  >
                    <LinkIcon className="text-muted-foreground/70 size-4 shrink-0" />
                    <span className="truncate hover:underline" dir="ltr">
                      {prettyUrl(data.website)}
                    </span>
                  </a>
                )}
                {socialEntries.map(([key, url]) => (
                  <a
                    key={key}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm transition-colors"
                  >
                    <LinkIcon className="text-muted-foreground/70 size-4 shrink-0" />
                    <span className="truncate hover:underline" dir="ltr">
                      {prettyUrl(url)}
                    </span>
                  </a>
                ))}
                {joinedDate && (
                  <div className="text-muted-foreground flex items-center gap-2 text-sm">
                    <Calendar className="text-muted-foreground/70 size-4 shrink-0" />
                    <span className="truncate">
                      {joinedLabel}{" "}
                      {formatLocaleDate(new Date(joinedDate), lang ?? "en", {
                        year: "numeric",
                        month: "long",
                        timeZone: "UTC",
                      })}
                    </span>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Badges (real, earned) */}
        {data.badges.length > 0 && (
          <div className="border-border border-t pt-4">
            <h3 className="text-foreground mb-3 text-sm font-semibold">
              {p?.sidebar?.achievements ?? ""}
            </h3>
            <div className="flex flex-wrap gap-2">
              {data.badges.map((badge) => (
                <BadgePopover
                  key={badge.id}
                  badge={badge}
                  dictionary={p}
                  lang={lang}
                />
              ))}
            </div>
          </div>
        )}

        {/* Organizations (real memberships) */}
        {data.organizations.length > 0 && (
          <div className="border-border border-t pt-4">
            <h3 className="text-foreground mb-3 text-sm font-semibold">
              {p?.sidebar?.organizations ?? ""}
            </h3>
            <div className="flex flex-wrap gap-2">
              {data.organizations.map((org) => (
                <Tooltip key={org.id}>
                  <TooltipTrigger asChild>
                    <Avatar className="border-border size-8 cursor-pointer border transition-transform hover:scale-110">
                      {org.avatarUrl && (
                        <AvatarImage src={org.avatarUrl} alt={org.name} />
                      )}
                      <AvatarFallback className="bg-muted text-xs">
                        {org.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <div className="text-sm">
                      <p className="font-semibold">{org.name}</p>
                      {org.role && (
                        <p className="text-muted-foreground">
                          {p?.orgRoles?.[org.role] ?? org.role}
                        </p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}
