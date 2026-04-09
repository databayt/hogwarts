"use client"

import { useState } from "react"
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
  OcticonOrganization,
  OcticonPeople,
  OcticonRepo,
  OcticonSmiley,
  OcticonTable,
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

  switch (role) {
    case "student":
      return {
        title: fullName,
        subtitle:
          (data.grNumber as string) ||
          `@student_${(data.id as string)?.slice(-6)}`,
        role: "Student",
        icon: <OcticonBook className="size-4" />,
        imageSrc:
          (data.profilePhotoUrl as string) ||
          asset("/photos/contributors-h.jpeg"),
        initials,
        stats: [
          {
            label: p?.sidebar?.subjects ?? "subjects",
            value: 8,
            icon: <OcticonRepo className="size-4" />,
          },
          {
            label: p?.sidebar?.projects ?? "projects",
            value: 12,
            icon: <OcticonTable className="size-4" />,
          },
        ] as ProfileStat[],
        info: [
          {
            icon: <OcticonOrganization className="size-4" />,
            value: "Grade 10 - Section A",
          },
          {
            icon: <MapPin className="size-4" />,
            value: (data.city as string) || "Campus",
          },
          {
            icon: <OcticonClock className="size-4" />,
            value: `${p?.sidebar?.enrolled ?? "Enrolled"} ${formatDate(data.enrollmentDate as string)}`,
          },
        ],
        achievements: [
          {
            id: "1",
            title: "Student of the Year",
            description:
              "Awarded for outstanding academic performance and leadership",
            icon: "starstruck",
            level: "platinum" as const,
            earnedAt: "2025-06-15",
            context: "Academic Year 2024-2025 · School-wide Award",
          },
          {
            id: "2",
            title: "First of Class",
            description: "Ranked 1st in class for the academic term",
            icon: "galaxy-brain",
            level: "gold" as const,
            earnedAt: "2025-12-20",
            context: "Term 1, 2025-2026 · Grade 10 Mathematics",
          },
          {
            id: "3",
            title: "Second of Class",
            description: "Ranked 2nd in class for the academic term",
            icon: "galaxy-brain",
            level: "silver" as const,
            earnedAt: "2025-06-15",
            context: "Term 2, 2024-2025 · Grade 10 Science",
          },
          {
            id: "4",
            title: "Best Football Player",
            description: "MVP of the school football team",
            icon: "yolo",
            level: "gold" as const,
            earnedAt: "2025-11-10",
            context: "Inter-school Tournament 2025",
          },
          {
            id: "5",
            title: "Perfect Attendance",
            description: "100% attendance for the full semester",
            icon: "quickdraw",
            level: "silver" as const,
            earnedAt: "2025-12-20",
            context: "Term 1, 2025-2026",
          },
          {
            id: "6",
            title: "Science Fair Winner",
            description: "1st place in the annual science fair",
            icon: "galaxy-brain",
            level: "gold" as const,
            earnedAt: "2025-03-22",
            context: "Annual Science Fair 2025 · Physics Category",
          },
          {
            id: "7",
            title: "Math Olympiad",
            description: "Bronze medal in the regional math competition",
            icon: "galaxy-brain",
            level: "bronze" as const,
            earnedAt: "2025-04-15",
            context: "Regional Math Olympiad 2025",
          },
        ] as ProfileAchievement[],
        organizations: [
          {
            id: "1",
            name: "Student Council",
            avatarUrl: asset("/icons/council.png"),
            role: "Member",
          },
          {
            id: "2",
            name: "Science Club",
            avatarUrl: asset("/icons/science.png"),
            role: "Secretary",
          },
          {
            id: "3",
            name: "Chess Club",
            avatarUrl: asset("/icons/chess.png"),
            role: "Member",
          },
        ] as Organization[],
      }
    case "teacher":
      return {
        title: fullName,
        subtitle:
          (data.employeeId as string) ||
          `@teacher_${(data.id as string)?.slice(-6)}`,
        role: "Teacher",
        icon: <OcticonRepo className="size-4" />,
        imageSrc:
          (data.profilePhotoUrl as string) ||
          asset("/photos/contributors-d.jpeg"),
        initials,
        stats: [
          {
            label: p?.sidebar?.classes ?? "classes",
            value: 6,
            icon: <OcticonRepo className="size-4" />,
          },
          {
            label: p?.sidebar?.students ?? "students",
            value: 127,
            icon: <OcticonPeople className="size-4" />,
          },
        ] as ProfileStat[],
        info: [
          {
            icon: <OcticonOrganization className="size-4" />,
            value: "Mathematics Department",
          },
          {
            icon: <OcticonBook className="size-4" />,
            value: data.emailAddress as string,
          },
          {
            icon: <OcticonClock className="size-4" />,
            value: `${p?.sidebar?.joined ?? "Joined"} ${formatDate((data.joiningDate as string) || (data.createdAt as string))}`,
          },
        ],
        achievements: [
          {
            id: "1",
            title: "Teacher of the Year",
            description: "Recognized as the most impactful teacher school-wide",
            icon: "starstruck",
            level: "platinum" as const,
            earnedAt: "2025-06-15",
            context: "Academic Year 2024-2025 · School-wide Award",
          },
          {
            id: "2",
            title: "Best Curriculum Design",
            description: "Outstanding curriculum innovation and design",
            icon: "pull-shark",
            level: "gold" as const,
            earnedAt: "2025-09-01",
            context: "Term 1, 2025-2026 · Mathematics Department",
          },
          {
            id: "3",
            title: "Student Favorite",
            description: "Highest-rated teacher by student surveys",
            icon: "starstruck",
            level: "silver" as const,
            earnedAt: "2025-12-20",
            context: "Term 1, 2025-2026 · Grade 10-12 Students",
          },
          {
            id: "4",
            title: "Department Leader",
            description: "Led the mathematics department with distinction",
            icon: "pull-shark",
            level: "gold" as const,
            earnedAt: "2025-01-15",
            context: "Academic Year 2024-2025 · Mathematics",
          },
          {
            id: "5",
            title: "Perfect Attendance",
            description: "100% attendance for 12 consecutive months",
            icon: "quickdraw",
            level: "silver" as const,
            earnedAt: "2025-12-31",
            context: "Calendar Year 2025",
          },
          {
            id: "6",
            title: "Innovation Award",
            description: "Pioneered new teaching methodologies",
            icon: "starstruck",
            level: "gold" as const,
            earnedAt: "2025-03-15",
            context: "STEM Innovation Week 2025",
          },
        ] as ProfileAchievement[],
        organizations: [
          {
            id: "1",
            name: "Mathematics Dept",
            avatarUrl: asset("/icons/math.png"),
            role: "Senior Teacher",
          },
          {
            id: "2",
            name: "Curriculum Committee",
            avatarUrl: asset("/icons/curriculum.png"),
            role: "Member",
          },
        ] as Organization[],
      }
    case "parent":
      return {
        title: fullName,
        subtitle: `@parent_${(data.id as string)?.slice(-6)}`,
        role: "Parent / Guardian",
        icon: <OcticonPeople className="size-4" />,
        imageSrc:
          (data.profilePhotoUrl as string) ||
          asset("/photos/contributors-d.jpeg"),
        initials,
        stats: [
          {
            label: p?.sidebar?.children ?? "children",
            value: 3,
            icon: <OcticonPeople className="size-4" />,
          },
          {
            label: p?.sidebar?.events ?? "events",
            value: 5,
            icon: <OcticonTable className="size-4" />,
          },
        ] as ProfileStat[],
        info: [
          {
            icon: <OcticonBook className="size-4" />,
            value: (data.emailAddress as string) || "parent@email.com",
          },
          {
            icon: <OcticonOrganization className="size-4" />,
            value: "+966 50 XXX XXXX",
          },
          {
            icon: <OcticonClock className="size-4" />,
            value: `${p?.sidebar?.memberSince ?? "Member since"} ${formatDate(data.createdAt as string)}`,
          },
        ],
        achievements: [
          {
            id: "1",
            title: "Most Engaged Parent",
            description: "Attended every school event and parent meeting",
            icon: "pair-extraordinaire",
            level: "gold" as const,
            earnedAt: "2025-12-20",
            context: "Term 1, 2025-2026 · 100% Event Attendance",
          },
          {
            id: "2",
            title: "Community Champion",
            description: "Led community initiatives and fundraising efforts",
            icon: "pair-extraordinaire",
            level: "silver" as const,
            earnedAt: "2025-06-15",
            context: "Academic Year 2024-2025 · Parent Association",
          },
          {
            id: "3",
            title: "Volunteer of the Year",
            description: "Most active volunteer in school programs",
            icon: "public-sponsor",
            level: "gold" as const,
            earnedAt: "2025-06-15",
            context: "Academic Year 2024-2025 · 200+ Volunteer Hours",
          },
        ] as ProfileAchievement[],
        organizations: [
          {
            id: "1",
            name: "Parent Association",
            avatarUrl: asset("/icons/parents.png"),
            role: "Member",
          },
        ] as Organization[],
      }
    case "staff":
      return {
        title: fullName,
        subtitle: `@staff_${(data.id as string)?.slice(-6)}`,
        role: "Staff Member",
        icon: <OcticonOrganization className="size-4" />,
        imageSrc:
          (data.profilePhotoUrl as string) ||
          (data.role === "ADMIN"
            ? asset("/photos/dumbledore.jpeg")
            : asset("/photos/contributors-d.jpeg")),
        initials,
        stats: [
          {
            label: p?.sidebar?.tasks ?? "tasks",
            value: 24,
            icon: <OcticonRepo className="size-4" />,
          },
          {
            label: p?.sidebar?.projects ?? "projects",
            value: 8,
            icon: <OcticonTable className="size-4" />,
          },
        ] as ProfileStat[],
        info: [
          {
            icon: <OcticonOrganization className="size-4" />,
            value: "Administration",
          },
          {
            icon: <OcticonBook className="size-4" />,
            value: (data.emailAddress as string) || "staff@school.edu",
          },
          {
            icon: <OcticonClock className="size-4" />,
            value: `${p?.sidebar?.joined ?? "Joined"} ${formatDate(data.createdAt as string)}`,
          },
        ],
        achievements: [
          {
            id: "1",
            title: "Employee of the Year",
            description:
              "Recognized for exceptional performance and dedication",
            icon: "starstruck",
            level: "platinum" as const,
            earnedAt: "2025-06-15",
            context: "Academic Year 2024-2025 · School-wide Award",
          },
          {
            id: "2",
            title: "Best Team Player",
            description: "Outstanding collaboration and teamwork",
            icon: "pair-extraordinaire",
            level: "gold" as const,
            earnedAt: "2025-12-20",
            context: "Term 1, 2025-2026 · Administration",
          },
          {
            id: "3",
            title: "Perfect Attendance",
            description: "100% attendance for 6 consecutive months",
            icon: "quickdraw",
            level: "silver" as const,
            earnedAt: "2025-12-31",
            context: "Jul-Dec 2025",
          },
          {
            id: "4",
            title: "Service Excellence",
            description: "Consistently exceeded service quality standards",
            icon: "pull-shark",
            level: "gold" as const,
            earnedAt: "2025-09-01",
            context: "Term 1, 2025-2026 · Admin Department",
          },
          {
            id: "5",
            title: "Outstanding Support",
            description: "Provided exceptional support to faculty and students",
            icon: "galaxy-brain",
            level: "silver" as const,
            earnedAt: "2025-03-15",
            context: "Academic Year 2024-2025 · IT Support",
          },
        ] as ProfileAchievement[],
        organizations: [
          {
            id: "1",
            name: "Admin Team",
            avatarUrl: asset("/icons/admin.png"),
            role: "Coordinator",
          },
        ] as Organization[],
      }
    default:
      return {
        title: "Unknown",
        subtitle: "@unknown",
        role: "Unknown Role",
        icon: null,
        imageSrc: asset("/photos/contributors-d.jpeg"),
        initials: "??",
        stats: [],
        info: [],
        achievements: [],
        organizations: [],
      }
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
