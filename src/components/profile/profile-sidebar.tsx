"use client"

import Image from "next/image"
import Link from "next/link"
import { useSidebar } from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  MapPin,
  Building2,
  Calendar,
  Mail,
  Phone,
  GraduationCap,
  BookOpen,
  Users,
  Briefcase,
  Heart,
  Award,
  Star,
  Trophy,
  Medal,
  Target,
  Flame,
  Zap,
  Crown,
  Sparkles
} from "lucide-react"
import type { ProfileRole, Achievement, Organization, ProfileStat } from "./types"

interface ProfileSidebarProps {
  role: ProfileRole
  data: Record<string, unknown>
}

// Achievement badge icons mapping
const achievementIcons: Record<string, React.ReactNode> = {
  honor_roll: <Trophy className="size-5 text-amber-400" />,
  perfect_attendance: <Calendar className="size-5 text-emerald-400" />,
  science_fair: <Sparkles className="size-5 text-purple-400" />,
  sports: <Medal className="size-5 text-blue-400" />,
  leadership: <Crown className="size-5 text-amber-500" />,
  academic: <Star className="size-5 text-yellow-400" />,
  community: <Heart className="size-5 text-rose-400" />,
  streak: <Flame className="size-5 text-orange-400" />,
  excellence: <Award className="size-5 text-indigo-400" />,
  participation: <Target className="size-5 text-cyan-400" />,
}

// Achievement level colors
const achievementLevelColors = {
  bronze: "from-amber-700 to-amber-900",
  silver: "from-gray-300 to-gray-500",
  gold: "from-amber-300 to-amber-500",
  platinum: "from-slate-200 to-slate-400",
}

function getRoleConfig(role: ProfileRole, data: Record<string, unknown>) {
  const fullName = `${data.givenName || ""} ${data.surname || ""}`.trim()
  const initials = `${(data.givenName as string)?.[0] || ""}${(data.surname as string)?.[0] || ""}`.toUpperCase()

  switch (role) {
    case "student":
      return {
        title: fullName,
        subtitle: (data.grNumber as string) || `@student_${(data.id as string)?.slice(-6)}`,
        role: "Student",
        icon: <GraduationCap className="size-4" />,
        imageSrc: (data.profilePhotoUrl as string) || "/contributors/h.jpeg",
        initials,
        stats: [
          { label: "subjects", value: 8, icon: <BookOpen className="size-4" /> },
          { label: "projects", value: 12, icon: <Target className="size-4" /> },
        ] as ProfileStat[],
        info: [
          { icon: <Building2 className="size-4" />, value: "Grade 10 - Section A" },
          { icon: <MapPin className="size-4" />, value: (data.city as string) || "Campus" },
          { icon: <Calendar className="size-4" />, value: `Enrolled ${formatDate(data.enrollmentDate as string)}` },
        ],
        achievements: [
          { id: "1", title: "Honor Roll", description: "Achieved 4 times", icon: "honor_roll", level: "gold" as const },
          { id: "2", title: "Perfect Attendance", description: "Current semester", icon: "perfect_attendance", level: "silver" as const },
          { id: "3", title: "Science Fair Winner", description: "1st Place", icon: "science_fair", level: "gold" as const },
          { id: "4", title: "Sports Champion", description: "2 events", icon: "sports", level: "bronze" as const },
          { id: "5", title: "100 Day Streak", description: "Learning streak", icon: "streak", level: "platinum" as const },
        ] as Achievement[],
        organizations: [
          { id: "1", name: "Student Council", avatarUrl: "/icons/council.png", role: "Member" },
          { id: "2", name: "Science Club", avatarUrl: "/icons/science.png", role: "Secretary" },
          { id: "3", name: "Chess Club", avatarUrl: "/icons/chess.png", role: "Member" },
        ] as Organization[],
      }
    case "teacher":
      return {
        title: fullName,
        subtitle: (data.employeeId as string) || `@teacher_${(data.id as string)?.slice(-6)}`,
        role: "Teacher",
        icon: <Briefcase className="size-4" />,
        imageSrc: (data.profilePhotoUrl as string) || "/contributors/d.jpeg",
        initials,
        stats: [
          { label: "classes", value: 6, icon: <Users className="size-4" /> },
          { label: "students", value: 127, icon: <GraduationCap className="size-4" /> },
        ] as ProfileStat[],
        info: [
          { icon: <Building2 className="size-4" />, value: "Mathematics Department" },
          { icon: <Mail className="size-4" />, value: data.emailAddress as string },
          { icon: <Calendar className="size-4" />, value: `Joined ${formatDate(data.joiningDate as string || data.createdAt as string)}` },
        ],
        achievements: [
          { id: "1", title: "Excellence Award", description: "Best Teacher 2024", icon: "excellence", level: "gold" as const },
          { id: "2", title: "Perfect Attendance", description: "12 months", icon: "perfect_attendance", level: "platinum" as const },
          { id: "3", title: "Student Favorite", description: "Top rated", icon: "academic", level: "silver" as const },
          { id: "4", title: "Leadership", description: "Department Head", icon: "leadership", level: "gold" as const },
        ] as Achievement[],
        organizations: [
          { id: "1", name: "Mathematics Dept", avatarUrl: "/icons/math.png", role: "Senior Teacher" },
          { id: "2", name: "Curriculum Committee", avatarUrl: "/icons/curriculum.png", role: "Member" },
        ] as Organization[],
      }
    case "parent":
      return {
        title: fullName,
        subtitle: `@parent_${(data.id as string)?.slice(-6)}`,
        role: "Parent / Guardian",
        icon: <Heart className="size-4" />,
        imageSrc: (data.profilePhotoUrl as string) || "/contributors/d.jpeg",
        initials,
        stats: [
          { label: "children", value: 3, icon: <Users className="size-4" /> },
          { label: "events", value: 5, icon: <Calendar className="size-4" /> },
        ] as ProfileStat[],
        info: [
          { icon: <Mail className="size-4" />, value: data.emailAddress as string || "parent@email.com" },
          { icon: <Phone className="size-4" />, value: "+966 50 XXX XXXX" },
          { icon: <Calendar className="size-4" />, value: `Member since ${formatDate(data.createdAt as string)}` },
        ],
        achievements: [
          { id: "1", title: "Engaged Parent", description: "100% event attendance", icon: "participation", level: "gold" as const },
          { id: "2", title: "Community Helper", description: "Volunteer", icon: "community", level: "silver" as const },
        ] as Achievement[],
        organizations: [
          { id: "1", name: "Parent Association", avatarUrl: "/icons/parents.png", role: "Member" },
        ] as Organization[],
      }
    case "staff":
      return {
        title: fullName,
        subtitle: `@staff_${(data.id as string)?.slice(-6)}`,
        role: "Staff Member",
        icon: <Briefcase className="size-4" />,
        imageSrc: (data.profilePhotoUrl as string) || "/contributors/d.jpeg",
        initials,
        stats: [
          { label: "tasks", value: 24, icon: <Target className="size-4" /> },
          { label: "projects", value: 8, icon: <Zap className="size-4" /> },
        ] as ProfileStat[],
        info: [
          { icon: <Building2 className="size-4" />, value: "Administration" },
          { icon: <Mail className="size-4" />, value: data.emailAddress as string || "staff@school.edu" },
          { icon: <Calendar className="size-4" />, value: `Joined ${formatDate(data.createdAt as string)}` },
        ],
        achievements: [
          { id: "1", title: "Excellence Award", description: "Outstanding service", icon: "excellence", level: "gold" as const },
          { id: "2", title: "Perfect Attendance", description: "6 months", icon: "perfect_attendance", level: "silver" as const },
        ] as Achievement[],
        organizations: [
          { id: "1", name: "Admin Team", avatarUrl: "/icons/admin.png", role: "Coordinator" },
        ] as Organization[],
      }
    default:
      return {
        title: "Unknown",
        subtitle: "@unknown",
        role: "Unknown Role",
        icon: null,
        imageSrc: "/contributors/d.jpeg",
        initials: "??",
        stats: [],
        info: [],
        achievements: [],
        organizations: [],
      }
  }
}

function formatDate(date: string | Date | undefined): string {
  if (!date) return "N/A"
  const d = new Date(date)
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" })
}

export default function ProfileSidebar({ role, data }: ProfileSidebarProps) {
  const { open, isMobile } = useSidebar()
  const useMobileLayout = isMobile || open
  const config = getRoleConfig(role, data)

  return (
    <TooltipProvider>
      <div className={`space-y-4 ${useMobileLayout ? "max-w-xs" : "w-72"}`}>
        {/* Profile Avatar */}
        <div className="relative group">
          <Avatar className="size-64 border-4 border-border shadow-lg transition-transform group-hover:scale-[1.02]">
            <AvatarImage
              src={config.imageSrc}
              alt={config.title}
              className="object-cover"
            />
            <AvatarFallback className="text-4xl font-bold bg-gradient-to-br from-primary/20 to-primary/40">
              {config.initials}
            </AvatarFallback>
          </Avatar>
          {/* Status indicator */}
          <div className="absolute bottom-4 end-4 size-10 bg-background rounded-full flex items-center justify-center border-2 border-border shadow-md">
            <span className="text-lg">😀</span>
          </div>
        </div>

        {/* Name and Username */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground leading-tight">{config.title}</h1>
          <p className="text-lg text-muted-foreground font-light">{config.subtitle}</p>
          <Badge variant="secondary" className="mt-2 gap-1.5">
            {config.icon}
            {config.role}
          </Badge>
        </div>

        {/* Bio / Description */}
        <p className="text-sm text-muted-foreground leading-relaxed">
          Passionate about learning and growth. Always striving for excellence in academics and extracurricular activities.
        </p>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button className="flex-1" size="sm">
            View Full Profile
          </Button>
          <Button variant="outline" size="sm" className="px-3">
            <Mail className="size-4" />
          </Button>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm">
          {config.stats.map((stat, idx) => (
            <div key={idx} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
              {stat.icon}
              <span className="font-semibold text-foreground">{stat.value}</span>
              <span>{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Info List */}
        <div className="space-y-2 pt-2 border-t border-border">
          {config.info.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <span className="text-muted-foreground/70">{item.icon}</span>
              <span className="truncate">{item.value || "N/A"}</span>
            </div>
          ))}
        </div>

        {/* Achievements */}
        {config.achievements.length > 0 && (
          <div className="pt-4 border-t border-border">
            <h3 className="text-sm font-semibold text-foreground mb-3">Achievements</h3>
            <div className="flex flex-wrap gap-2">
              {config.achievements.map((achievement) => (
                <Tooltip key={achievement.id}>
                  <TooltipTrigger asChild>
                    <div
                      className={`relative size-12 rounded-full bg-gradient-to-br ${
                        achievementLevelColors[achievement.level || "bronze"]
                      } flex items-center justify-center cursor-pointer transition-all hover:scale-110 hover:shadow-lg`}
                    >
                      {achievementIcons[achievement.icon] || <Award className="size-5 text-white" />}
                      {/* Multiplier badge */}
                      <span className="absolute -bottom-1 -end-1 text-[10px] font-bold bg-background text-foreground px-1.5 py-0.5 rounded-full border border-border shadow-sm">
                        x{Math.floor(Math.random() * 4) + 1}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <div className="text-sm">
                      <p className="font-semibold">{achievement.title}</p>
                      <p className="text-muted-foreground">{achievement.description}</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>
        )}

        {/* Organizations / Groups */}
        {config.organizations.length > 0 && (
          <div className="pt-4 border-t border-border">
            <h3 className="text-sm font-semibold text-foreground mb-3">Organizations</h3>
            <div className="flex flex-wrap gap-2">
              {config.organizations.map((org) => (
                <Tooltip key={org.id}>
                  <TooltipTrigger asChild>
                    <Avatar className="size-8 cursor-pointer transition-transform hover:scale-110 border border-border">
                      <AvatarImage src={org.avatarUrl} alt={org.name} />
                      <AvatarFallback className="text-xs bg-muted">
                        {org.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <div className="text-sm">
                      <p className="font-semibold">{org.name}</p>
                      {org.role && <p className="text-muted-foreground">{org.role}</p>}
                    </div>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>
        )}

        {/* Block/Report (subtle) */}
        <div className="pt-4 border-t border-border">
          <button className="text-xs text-muted-foreground hover:text-destructive transition-colors">
            Block or Report
          </button>
        </div>
      </div>
    </TooltipProvider>
  )
}
