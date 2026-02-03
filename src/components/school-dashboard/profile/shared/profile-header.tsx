/**
 * Profile Header Component
 * GitHub-inspired profile header with avatar, stats, and bio
 */

"use client"

import React from "react"
import { format } from "date-fns"
import {
  Award,
  Briefcase,
  Calendar,
  CircleCheck,
  EllipsisVertical,
  Eye,
  Facebook,
  Github,
  Globe,
  Instagram,
  Link,
  Linkedin,
  Mail,
  MapPin,
  MessageSquare,
  PencilLine,
  Phone,
  Share2,
  Shield,
  Star,
  Twitter,
  UserPlus,
  Users,
  Youtube,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import type { BaseProfile, ConnectionStatus } from "../types"
import { ProfileVisibility, UserProfileType } from "../types"

// ============================================================================
// Types
// ============================================================================

interface ProfileHeaderProps {
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
}

interface ProfileStat {
  label: string
  value: string | number
  icon?: React.ReactNode
  link?: string
}

// ============================================================================
// Component
// ============================================================================

export function ProfileHeader({
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
}: ProfileHeaderProps) {
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

  // Get visibility icon
  const getVisibilityIcon = (visibility: ProfileVisibility) => {
    switch (visibility) {
      case ProfileVisibility.PUBLIC:
        return <Globe className="h-3 w-3" />
      case ProfileVisibility.SCHOOL:
        return <Shield className="h-3 w-3" />
      case ProfileVisibility.CONNECTIONS:
        return <Users className="h-3 w-3" />
      case ProfileVisibility.PRIVATE:
        return <Eye className="h-3 w-3" />
      default:
        return null
    }
  }

  // Get social icon component
  const getSocialIcon = (platform: string) => {
    const icons: Record<string, React.ReactNode> = {
      github: <Github className="h-4 w-4" />,
      linkedin: <Linkedin className="h-4 w-4" />,
      twitter: <Twitter className="h-4 w-4" />,
      facebook: <Facebook className="h-4 w-4" />,
      instagram: <Instagram className="h-4 w-4" />,
      youtube: <Youtube className="h-4 w-4" />,
      website: <Globe className="h-4 w-4" />,
    }
    return icons[platform] || <Link className="h-4 w-4" />
  }

  // Profile stats
  const stats: ProfileStat[] = [
    {
      label: "Connections",
      value: profile.activityStats.totalConnections,
      icon: <Users className="h-4 w-4" />,
    },
    {
      label: "Views",
      value: profile.activityStats.totalViews,
      icon: <Eye className="h-4 w-4" />,
    },
    {
      label: "Achievements",
      value: profile.activityStats.totalAchievements,
      icon: <Award className="h-4 w-4" />,
    },
    {
      label: "Streak",
      value: `${profile.activityStats.contributionStreak} days`,
      icon: <Star className="h-4 w-4" />,
    },
  ]

  // Render connection button
  const renderConnectionButton = () => {
    if (isOwner) {
      return (
        <Button variant="outline" size="sm" onClick={onEdit}>
          <PencilLine className="mr-2 h-4 w-4" />
          Edit Profile
        </Button>
      )
    }

    switch (connectionStatus) {
      case "connected":
        return (
          <Button variant="secondary" size="sm" onClick={onMessage}>
            <MessageSquare className="mr-2 h-4 w-4" />
            Message
          </Button>
        )
      case "pending":
        return (
          <Button variant="outline" size="sm" disabled>
            Request Sent
          </Button>
        )
      case "requested":
        return (
          <Button variant="default" size="sm" onClick={onConnect}>
            <UserPlus className="mr-2 h-4 w-4" />
            Accept
          </Button>
        )
      default:
        return (
          <Button variant="default" size="sm" onClick={onConnect}>
            <UserPlus className="mr-2 h-4 w-4" />
            Connect
          </Button>
        )
    }
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      {/* Cover Image */}
      {profile.coverImage && (
        <div
          className="relative h-48 bg-cover bg-center"
          style={{ backgroundImage: `url(${profile.coverImage})` }}
        >
          <div className="from-background/50 absolute inset-0 bg-gradient-to-t to-transparent" />
        </div>
      )}

      <CardContent className="p-6">
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Avatar Section */}
          <div className="flex-shrink-0">
            <Avatar
              className={cn(
                "border-background border-4",
                profile.coverImage ? "-mt-20" : "",
                "h-32 w-32 lg:h-40 lg:w-40"
              )}
            >
              <AvatarImage
                src={profile.avatar || undefined}
                alt={profile.displayName}
              />
              <AvatarFallback className="text-2xl lg:text-3xl">
                {getInitials(profile.displayName)}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Profile Info */}
          <div className="flex-1 space-y-4">
            {/* Name and Badges */}
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold lg:text-3xl">
                  {profile.displayName}
                </h1>
                <Badge
                  className={cn(
                    getUserTypeBadgeColor(profile.type),
                    "text-white"
                  )}
                >
                  {profile.type}
                </Badge>
                {profile.isOnline && (
                  <Badge variant="outline" className="gap-1">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                    Online
                  </Badge>
                )}
                {profile.completionPercentage === 100 && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <CircleCheck className="h-5 w-5 text-blue-500" />
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
                <p className="text-muted-foreground mt-2 max-w-2xl">
                  {profile.bio}
                </p>
              )}
            </div>

            {/* Contact & Location */}
            <div className="text-muted-foreground flex flex-wrap gap-4 text-sm">
              {profile.email && (
                <a
                  href={`mailto:${profile.email}`}
                  className="hover:text-primary flex items-center gap-1 transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  {profile.email}
                </a>
              )}
              {profile.phone && profile.settings.showPhone && (
                <a
                  href={`tel:${profile.phone}`}
                  className="hover:text-primary flex items-center gap-1 transition-colors"
                >
                  <Phone className="h-4 w-4" />
                  {profile.phone}
                </a>
              )}
              {profile.city && profile.settings.showLocation && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {[profile.city, profile.state, profile.country]
                    .filter(Boolean)
                    .join(", ")}
                </span>
              )}
              {profile.joinedAt && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Joined {format(profile.joinedAt, "MMMM yyyy")}
                </span>
              )}
            </div>

            {/* Social Links */}
            {profile.socialLinks &&
              Object.keys(profile.socialLinks).length > 0 && (
                <div className="flex gap-2">
                  {Object.entries(profile.socialLinks).map(
                    ([platform, url]) => {
                      if (!url) return null
                      return (
                        <TooltipProvider key={platform}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                asChild
                              >
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  {getSocialIcon(platform)}
                                </a>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                {platform.charAt(0).toUpperCase() +
                                  platform.slice(1)}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )
                    }
                  )}
                </div>
              )}

            {/* Stats */}
            <div className="flex gap-6 pt-2">
              {stats.map((stat, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-muted-foreground">{stat.icon}</span>
                  <div>
                    <p className="text-lg font-semibold">{stat.value}</p>
                    <p className="text-muted-foreground text-xs">
                      {stat.label}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 lg:flex-col">
            {renderConnectionButton()}
            {!isOwner && (
              <Button variant="outline" size="sm" onClick={onFollow}>
                <Star className="mr-2 h-4 w-4" />
                Follow
              </Button>
            )}
            <div className="flex gap-2">
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
                  <DropdownMenuItem>Print Profile</DropdownMenuItem>
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

            {/* Profile Visibility Badge */}
            <div className="text-muted-foreground flex items-center gap-1 text-xs">
              {getVisibilityIcon(profile.visibility)}
              <span>{profile.visibility.toLowerCase()}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
