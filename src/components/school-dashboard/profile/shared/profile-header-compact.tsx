/**
 * Profile Header Compact Component
 * Horizontal compact layout for when school-dashboard sidebar is expanded
 */

"use client"

import React from "react"
import {
  Briefcase,
  Calendar,
  CircleCheck,
  EllipsisVertical,
  MessageSquare,
  PencilLine,
  Share2,
  Star,
  UserPlus,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import type { BaseProfile, ConnectionStatus } from "../types"
import { UserProfileType } from "../types"

// ============================================================================
// Types
// ============================================================================

interface ProfileHeaderCompactProps {
  profile: BaseProfile
  dictionary?: Dictionary
  lang?: "ar" | "en"
  isOwner?: boolean
  connectionStatus?: ConnectionStatus
  onEdit?: () => void
  onConnect?: () => void
  onMessage?: () => void
  onShare?: () => void
  onFollow?: () => void
  className?: string
  showExperience?: boolean
}

// ============================================================================
// Component
// ============================================================================

export function ProfileHeaderCompact({
  profile,
  dictionary,
  lang = "en",
  isOwner = false,
  connectionStatus = "none",
  onEdit,
  onConnect,
  onMessage,
  onShare,
  onFollow,
  className,
  showExperience = false,
}: ProfileHeaderCompactProps) {
  // Get initials from display name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  // Get user type badge color
  const getUserTypeBadgeColor = (type: UserProfileType) => {
    const colors = {
      [UserProfileType.STUDENT]: "bg-chart-1",
      [UserProfileType.TEACHER]: "bg-chart-2",
      [UserProfileType.PARENT]: "bg-chart-3",
      [UserProfileType.STAFF]: "bg-chart-4",
      [UserProfileType.ADMIN]: "bg-chart-5",
    }
    return colors[type] || "bg-primary"
  }

  // Render connection button
  const renderConnectionButton = () => {
    if (isOwner) {
      return (
        <Button variant="outline" size="sm" onClick={onEdit}>
          <PencilLine className="me-2 h-4 w-4" />
          Edit
        </Button>
      )
    }

    switch (connectionStatus) {
      case "connected":
        return (
          <Button variant="secondary" size="sm" onClick={onMessage}>
            <MessageSquare className="me-2 h-4 w-4" />
            Message
          </Button>
        )
      case "pending":
        return (
          <Button variant="outline" size="sm" disabled>
            Pending
          </Button>
        )
      case "requested":
        return (
          <Button variant="default" size="sm" onClick={onConnect}>
            <UserPlus className="me-2 h-4 w-4" />
            Accept
          </Button>
        )
      default:
        return (
          <Button variant="default" size="sm" onClick={onConnect}>
            <UserPlus className="me-2 h-4 w-4" />
            Connect
          </Button>
        )
    }
  }

  // Get experience data if available
  const getExperienceData = () => {
    const anyProfile = profile as any

    // For staff profile
    if (anyProfile.staffInfo) {
      return {
        title: anyProfile.staffInfo.designation || "Staff Member",
        organization: anyProfile.staffInfo.department || "",
        years: anyProfile.staffInfo.yearsOfService || 0,
        certifications: anyProfile.staffInfo.certifications || [],
      }
    }

    // For teacher profile
    if (anyProfile.professionalInfo) {
      return {
        title: anyProfile.professionalInfo.designation || "Teacher",
        organization: anyProfile.teacher?.departments?.[0]?.name || "",
        years: anyProfile.professionalInfo.totalExperience || 0,
        certifications: anyProfile.professionalInfo.certifications || [],
      }
    }

    return null
  }

  const experienceData = showExperience ? getExperienceData() : null

  return (
    <div
      className={cn(
        "border-border/40 flex flex-col gap-4 border-b px-6 py-4",
        className
      )}
    >
      {/* Top row: Avatar + Info + Experience + Actions */}
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <Avatar className="border-muted h-24 w-24 flex-shrink-0 border">
          <AvatarImage
            src={profile.avatar || undefined}
            alt={profile.displayName}
          />
          <AvatarFallback className="bg-muted text-xl">
            {getInitials(profile.displayName)}
          </AvatarFallback>
        </Avatar>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-lg font-semibold">
              {profile.displayName}
            </h1>
            <span className="text-muted-foreground text-base">
              {profile.email?.split("@")[0] || profile.type.toLowerCase()}
            </span>
            {profile.completionPercentage === 100 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <CircleCheck className="h-4 w-4 text-blue-500" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Verified Profile</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
              {profile.bio}
            </p>
          )}

          {/* Compact Stats */}
          <div className="mt-2 flex items-center gap-3 text-sm">
            <span className="text-muted-foreground">
              <strong className="text-foreground">
                {profile.activityStats.totalConnections}
              </strong>{" "}
              followers
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">
              <strong className="text-foreground">
                {Math.floor(profile.activityStats.totalConnections * 0.7)}
              </strong>{" "}
              following
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">
              <strong className="text-foreground">
                {profile.activityStats.contributionStreak}
              </strong>{" "}
              day streak
            </span>
          </div>
        </div>

        {/* Experience Section (when enabled) */}
        {experienceData && (
          <div className="bg-muted/30 border-border/40 w-64 flex-shrink-0 rounded-lg border p-3">
            <div className="flex items-start gap-2">
              <Briefcase className="text-muted-foreground mt-0.5 h-4 w-4 flex-shrink-0" />
              <div className="min-w-0 flex-1 space-y-2">
                <div>
                  <p className="truncate text-sm font-medium">
                    {experienceData.title}
                  </p>
                  {experienceData.organization && (
                    <p className="text-muted-foreground truncate text-xs">
                      {experienceData.organization}
                    </p>
                  )}
                </div>

                {experienceData.years > 0 && (
                  <div className="text-muted-foreground flex items-center gap-1 text-xs">
                    <Calendar className="h-3 w-3" />
                    <span>{experienceData.years} years experience</span>
                  </div>
                )}

                {experienceData.certifications.length > 0 && (
                  <div className="space-y-1">
                    {experienceData.certifications
                      .slice(0, 2)
                      .map((cert: any, index: number) => (
                        <div key={index} className="text-xs">
                          <p className="truncate font-medium">{cert.name}</p>
                          <p className="text-muted-foreground truncate">
                            {cert.issuer}
                          </p>
                        </div>
                      ))}
                    {experienceData.certifications.length > 2 && (
                      <p className="text-muted-foreground text-xs">
                        +{experienceData.certifications.length - 2} more
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-shrink-0 items-center gap-2">
          {renderConnectionButton()}
          {!isOwner && (
            <Button variant="outline" size="sm" onClick={onFollow}>
              <Star className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="px-2"
            onClick={onShare}
          >
            <Share2 className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="px-2">
                <EllipsisVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Profile Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Copy Profile Link</DropdownMenuItem>
              <DropdownMenuItem>Export as PDF</DropdownMenuItem>
              {!isOwner && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive">
                    Block User
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive">
                    Report Profile
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}
