"use client"

import { useState, type ReactNode } from "react"
import { MapPin } from "lucide-react"

import { asset } from "@/lib/asset-url"
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
  OcticonBook,
  OcticonClock,
  OcticonPeople,
  OcticonRepo,
  OcticonSmiley,
  OcticonTrophy,
} from "@/components/atom/icons"

import EditProfileForm from "./form"
import type {
  Organization,
  ProfileAchievement,
  ProfileRole,
  ProfileStat,
} from "./types"

interface ProfileSidebarProps {
  role: ProfileRole
  data: Record<string, unknown>
  isOwner?: boolean
  dictionary?: Record<string, any>
}

function getAchievementBadgeSrc(badgeName: string): string {
  return asset(`/illustrations/${badgeName}.png`)
}

function getRoleConfig(
  role: ProfileRole,
  data: Record<string, unknown>,
  p?: Record<string, any>
) {
  const fullName = `${data.firstName || ""} ${data.lastName || ""}`.trim()
  const initials =
    `${(data.firstName as string)?.[0] || ""}${(data.lastName as string)?.[0] || ""}`.toUpperCase()

  const permission = (data.viewerPermission as string) || "PUBLIC"
  const canSeeContact = ["OWNER", "ADMIN", "STAFF"].includes(permission)
  const num = (v: unknown): number | undefined =>
    typeof v === "number" ? v : undefined

  // Real, tenant-scoped counts derived in getProfileBasicData. Each stat is
  // omitted (never invented) when its value is undefined.
  const stats: ProfileStat[] = []
  if (role === "student") {
    const subjects = num(data.subjectCount)
    const classes = num(data.classCount)
    if (subjects !== undefined)
      stats.push({
        label: p?.sidebar?.subjects ?? "subjects",
        value: subjects,
        icon: <OcticonBook className="size-4" />,
      })
    if (classes !== undefined)
      stats.push({
        label: p?.sidebar?.classes ?? "classes",
        value: classes,
        icon: <OcticonRepo className="size-4" />,
      })
  } else if (role === "teacher") {
    const classes = num(data.classCount)
    const students = num(data.studentsTaught)
    if (classes !== undefined)
      stats.push({
        label: p?.sidebar?.classes ?? "classes",
        value: classes,
        icon: <OcticonRepo className="size-4" />,
      })
    if (students !== undefined)
      stats.push({
        label: p?.sidebar?.students ?? "students",
        value: students,
        icon: <OcticonPeople className="size-4" />,
      })
  } else if (role === "parent") {
    const children = num(data.childrenCount)
    if (children !== undefined)
      stats.push({
        label: p?.sidebar?.children ?? "children",
        value: children,
        icon: <OcticonPeople className="size-4" />,
      })
  }

  // Real info rows only: city, enrollment/joining date, permission-gated email.
  const info: { icon: ReactNode; value: string }[] = []
  if (data.city)
    info.push({
      icon: <MapPin className="size-4" />,
      value: data.city as string,
    })
  const joinDate = (data.enrollmentDate ?? data.joiningDate) as
    | string
    | undefined
  if (joinDate)
    info.push({
      icon: <OcticonClock className="size-4" />,
      value: `${
        role === "student"
          ? (p?.sidebar?.enrolled ?? "Enrolled")
          : (p?.sidebar?.joined ?? "Joined")
      } ${formatDate(joinDate)}`,
    })
  if (canSeeContact && data.emailAddress)
    info.push({
      icon: <OcticonBook className="size-4" />,
      value: data.emailAddress as string,
    })

  const subtitle =
    (data.grNumber as string) ||
    (data.employeeId as string) ||
    `@${role}_${(data.id as string)?.slice(-6) ?? ""}`

  const roleLabel =
    role === "student"
      ? (p?.roles?.student ?? "Student")
      : role === "teacher"
        ? (p?.roles?.teacher ?? "Teacher")
        : role === "parent"
          ? (p?.roles?.parent ?? "Parent")
          : (p?.roles?.staff ?? "Staff")

  const defaultPhoto =
    role === "teacher"
      ? asset("/photos/contributors-d.jpeg")
      : asset("/photos/contributors-h.jpeg")

  return {
    title: fullName || subtitle,
    subtitle,
    role: roleLabel,
    icon: <OcticonBook className="size-4" />,
    imageSrc: (data.profilePhotoUrl as string) || defaultPhoto,
    initials,
    stats,
    info,
    achievements: (data.achievements as ProfileAchievement[]) ?? [],
    organizations: [] as Organization[],
  }
}

function formatDate(date: string | Date | undefined, locale?: string): string {
  if (!date) return "N/A"
  const d = new Date(date)
  return d.toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", {
    month: "short",
    year: "numeric",
  })
}

const achievementDetailBg: Record<string, string> = {
  starstruck: asset("/illustrations/starstruck-detail.png"),
  "galaxy-brain": asset("/illustrations/galaxy-brain-detail.png"),
  "pull-shark": asset("/illustrations/pull-shark-detail.png"),
  yolo: asset("/illustrations/yolo-detail.png"),
  "pair-extraordinaire": asset("/illustrations/pair-extraordinaire-detail.png"),
  quickdraw: asset("/illustrations/quickdraw-detail.png"),
  "public-sponsor": asset("/illustrations/public-sponsor-detail.png"),
}

function AchievementPopover({
  achievement,
  dictionary,
}: {
  achievement: ProfileAchievement
  dictionary?: Record<string, any>
}) {
  const earnedDate = achievement.earnedAt
    ? new Date(achievement.earnedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null
  const badgeSrc = getAchievementBadgeSrc(achievement.icon)
  const detailBg = achievementDetailBg[achievement.icon]

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="size-16 cursor-pointer">
          <img src={badgeSrc} alt={achievement.title} className="size-16" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[360px] overflow-hidden border-0 p-0 shadow-md"
        side="top"
        align="start"
        sideOffset={8}
      >
        <PopoverArrow width={18} height={9} className="fill-popover" />
        {/* Badge header with per-badge background */}
        <div
          className="flex items-center justify-center rounded-t-lg p-3"
          style={
            detailBg
              ? {
                  backgroundImage: `url(${detailBg})`,
                  backgroundSize: "cover",
                }
              : undefined
          }
        >
          <img
            src={badgeSrc}
            alt={achievement.title}
            className="size-[140px]"
          />
        </div>
        {/* Title + description */}
        <div className="px-4 pt-3 pb-2">
          <h3 className="text-foreground text-base font-bold">
            {achievement.title}
          </h3>
          <div className="text-muted-foreground mt-1 text-sm">
            {achievement.description}
          </div>
        </div>
        {/* History section */}
        {(earnedDate || achievement.context) && (
          <>
            <hr className="border-border mx-4 mt-3" />
            <div className="space-y-1.5 px-4 pt-3 pb-3">
              <h4 className="text-muted-foreground mb-2 text-xs font-bold">
                {dictionary?.sidebar?.history ?? "History"}
              </h4>
              {earnedDate && (
                <div className="flex items-center gap-2 text-xs">
                  <OcticonTrophy className="text-muted-foreground size-4" />
                  <span className="text-muted-foreground">
                    {(
                      dictionary?.sidebar?.unlockedOn ?? "Unlocked on {date}"
                    ).replace("{date}", earnedDate)}
                  </span>
                </div>
              )}
              {achievement.context && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground ms-0.5">•</span>
                  <span className="text-muted-foreground">
                    {achievement.context}
                  </span>
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
  role,
  data,
  isOwner = false,
  dictionary,
}: ProfileSidebarProps) {
  const { isMobile } = useSidebar()
  const useMobileLayout = isMobile
  const p = dictionary
  const config = getRoleConfig(role, data, p)
  const [isEditing, setIsEditing] = useState(false)

  return (
    <TooltipProvider>
      <div
        className={`space-y-4 ${useMobileLayout ? "max-w-xs" : "w-full max-w-72"}`}
      >
        {/* Profile Avatar */}
        <div className="group relative">
          <Avatar className="border-border size-52 border shadow-lg lg:size-56 xl:size-64">
            <AvatarImage
              src={config.imageSrc}
              alt={config.title}
              className="object-cover"
            />
            <AvatarFallback className="from-primary/20 to-primary/40 bg-gradient-to-br text-4xl font-bold">
              {config.initials}
            </AvatarFallback>
          </Avatar>
          {/* Status indicator */}
          <div className="bg-background border-border absolute end-2 bottom-2 flex size-8 items-center justify-center rounded-full border shadow-md">
            <OcticonSmiley className="text-muted-foreground size-4" />
          </div>
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
            {/* Name */}
            <div className="space-y-1">
              <h1 className="text-foreground text-2xl leading-tight font-bold">
                {config.title.split(" ")[0]}
              </h1>
              <p className="text-muted-foreground text-xl font-light">
                {config.title.split(" ").slice(1).join(" ")}
              </p>
            </div>

            {/* Bio / Description */}
            {(data.bio as string) && (
              <p className="text-sm leading-relaxed whitespace-pre-line">
                {data.bio as string}
              </p>
            )}

            {/* Edit Profile Button - GitHub style (only for owner) */}
            {isOwner && (
              <Button
                variant="outline"
                className="w-full"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                {p?.sidebar?.editProfile ?? "Edit profile"}
              </Button>
            )}

            {/* Stats - GitHub style: "12 followers · 3 following" */}
            <div className="text-muted-foreground flex flex-wrap items-center gap-1 text-sm">
              <OcticonPeople className="size-4" />
              {config.stats.map((stat, idx) => (
                <span key={idx} className="flex items-center">
                  <span className="text-foreground font-semibold">
                    {stat.value}
                  </span>
                  <span className="ms-1">{stat.label}</span>
                  {idx < config.stats.length - 1 && (
                    <span className="mx-1">·</span>
                  )}
                </span>
              ))}
            </div>

            {/* Info List */}
            <div className="space-y-2">
              {config.info.map((item, idx) => (
                <div
                  key={idx}
                  className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm transition-colors"
                >
                  <span className="text-muted-foreground/70">{item.icon}</span>
                  <span className="truncate">{item.value || "N/A"}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Achievements */}
        {config.achievements.length > 0 && (
          <div className="border-border border-t pt-4">
            <h3 className="text-foreground mb-3 text-sm font-semibold">
              {p?.sidebar?.achievements ?? "Achievements"}
            </h3>
            <div className="flex flex-wrap gap-2">
              {config.achievements.map((achievement) => (
                <AchievementPopover
                  key={achievement.id}
                  achievement={achievement}
                  dictionary={p}
                />
              ))}
            </div>
          </div>
        )}

        {/* Organizations / Groups */}
        {config.organizations.length > 0 && (
          <div className="border-border border-t pt-4">
            <h3 className="text-foreground mb-3 text-sm font-semibold">
              {p?.sidebar?.organizations ?? "Organizations"}
            </h3>
            <div className="flex flex-wrap gap-2">
              {config.organizations.map((org) => (
                <Tooltip key={org.id}>
                  <TooltipTrigger asChild>
                    <Avatar className="border-border size-8 cursor-pointer border transition-transform hover:scale-110">
                      <AvatarImage src={org.avatarUrl} alt={org.name} />
                      <AvatarFallback className="bg-muted text-xs">
                        {org.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <div className="text-sm">
                      <p className="font-semibold">{org.name}</p>
                      {org.role && (
                        <p className="text-muted-foreground">{org.role}</p>
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
