/**
 * Profile GitHub Layout Component
 * GitHub-style profile layout with left sidebar and main content area
 * Used when platform sidebar is collapsed
 */

"use client"

import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  MapPin,
  Mail,
  Phone,
  Link,
  Calendar,
  Users,
  Award,
  Edit2,
  Share2,
  MoreVertical,
  UserPlus,
  MessageSquare,
  CheckCircle,
  Star,
  Eye,
  Github,
  Linkedin,
  Twitter,
  Facebook,
  Instagram,
  Youtube,
  Globe
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import type {
  BaseProfile,
  ConnectionStatus
} from '../types'
import { UserProfileType } from '../types'
import type { Dictionary } from '@/components/internationalization/dictionaries'

// ============================================================================
// Types
// ============================================================================

interface ProfileGitHubLayoutProps {
  profile: BaseProfile
  dictionary?: Dictionary
  lang?: 'ar' | 'en'
  isOwner?: boolean
  connectionStatus?: ConnectionStatus
  onEdit?: () => void
  onConnect?: () => void
  onMessage?: () => void
  onShare?: () => void
  onFollow?: () => void
  className?: string
  children: React.ReactNode
}

// ============================================================================
// Component
// ============================================================================

export function ProfileGitHubLayout({
  profile,
  dictionary,
  lang = 'en',
  isOwner = false,
  connectionStatus = 'none',
  onEdit,
  onConnect,
  onMessage,
  onShare,
  onFollow,
  className,
  children
}: ProfileGitHubLayoutProps) {

  // Get initials from display name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Get user type badge color
  const getUserTypeBadgeColor = (type: UserProfileType) => {
    const colors = {
      [UserProfileType.STUDENT]: 'bg-chart-1',
      [UserProfileType.TEACHER]: 'bg-chart-2',
      [UserProfileType.PARENT]: 'bg-chart-3',
      [UserProfileType.STAFF]: 'bg-chart-4',
      [UserProfileType.ADMIN]: 'bg-chart-5'
    }
    return colors[type] || 'bg-primary'
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
      website: <Globe className="h-4 w-4" />
    }
    return icons[platform] || <Link className="h-4 w-4" />
  }

  // Render connection button
  const renderConnectionButton = () => {
    if (isOwner) {
      return (
        <Button
          variant="outline"
          size="sm"
          onClick={onEdit}
          className="w-full"
        >
          <Edit2 className="h-4 w-4 mr-2" />
          Edit Profile
        </Button>
      )
    }

    switch (connectionStatus) {
      case 'connected':
        return (
          <Button
            variant="secondary"
            size="sm"
            onClick={onMessage}
            className="w-full"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Message
          </Button>
        )
      case 'pending':
        return (
          <Button
            variant="outline"
            size="sm"
            disabled
            className="w-full"
          >
            Request Sent
          </Button>
        )
      case 'requested':
        return (
          <Button
            variant="default"
            size="sm"
            onClick={onConnect}
            className="w-full"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Accept
          </Button>
        )
      default:
        return (
          <Button
            variant="default"
            size="sm"
            onClick={onConnect}
            className="w-full"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Connect
          </Button>
        )
    }
  }

  return (
    <div className={cn('grid grid-cols-1 lg:grid-cols-[296px_1fr] gap-6', className)}>
      {/* Left Sidebar - Profile Info */}
      <aside className="-mt-4 lg:-mt-8">
        {/* Avatar and Name */}
        <div className="space-y-4">
          <div className="relative">
            <Avatar className="h-[296px] w-[296px] border-2 border-muted">
              <AvatarImage src={profile.avatar || undefined} alt={profile.displayName} />
              <AvatarFallback className="text-6xl bg-muted">
                {getInitials(profile.displayName)}
              </AvatarFallback>
            </Avatar>
            {profile.isOnline && (
              <div className="absolute bottom-8 right-8 h-10 w-10 bg-green-500 rounded-full border-4 border-background" />
            )}
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-semibold leading-none">
              {profile.displayName}
            </h1>
            <p className="text-xl text-muted-foreground">
              {profile.email?.split('@')[0] || profile.type.toLowerCase()}
            </p>
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <p className="text-base mt-4 mb-4">
            {profile.bio}
          </p>
        )}

        {/* Action Buttons */}
        <div className="space-y-2 my-4">
          {isOwner ? (
            <Button
              variant="secondary"
              className="w-full justify-center"
              onClick={onEdit}
            >
              Edit profile
            </Button>
          ) : (
            <>
              <div className="flex gap-2">
                <Button
                  variant={connectionStatus === 'connected' ? 'secondary' : 'default'}
                  className="flex-1"
                  onClick={connectionStatus === 'connected' ? onMessage : onConnect}
                >
                  {connectionStatus === 'connected' ? (
                    <>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Message
                    </>
                  ) : connectionStatus === 'pending' ? (
                    'Pending'
                  ) : connectionStatus === 'requested' ? (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Accept
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Follow
                    </>
                  )}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="secondary" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={onShare}>
                      <Share2 className="h-4 w-4 mr-2" />
                      Share profile
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      Copy profile link
                    </DropdownMenuItem>
                    {!isOwner && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          Block or report
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
          )}
        </div>

        {/* Followers/Following */}
        <div className="flex items-center gap-2 text-sm my-4">
          <Users className="h-4 w-4 text-muted-foreground" />
          <a href="#" className="hover:text-primary">
            <span className="font-semibold">{profile.activityStats.totalConnections}</span>
            <span className="text-muted-foreground"> followers</span>
          </a>
          <span className="text-muted-foreground">·</span>
          <a href="#" className="hover:text-primary">
            <span className="font-semibold">{Math.floor(profile.activityStats.totalConnections * 0.7)}</span>
            <span className="text-muted-foreground"> following</span>
          </a>
        </div>

        {/* Contact Info */}
        <div className="space-y-1 text-sm my-4">
          {profile.city && profile.settings.showLocation && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>
                {[profile.city, profile.state, profile.country]
                  .filter(Boolean)
                  .join(', ')}
              </span>
            </div>
          )}
          {profile.email && profile.settings.showEmail && (
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <a href={`mailto:${profile.email}`} className="hover:text-primary hover:underline">
                {profile.email}
              </a>
            </div>
          )}
          {profile.socialLinks?.website && (
            <div className="flex items-center gap-2">
              <Link className="h-4 w-4 text-muted-foreground" />
              <a
                href={profile.socialLinks.website}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary hover:underline truncate"
              >
                {profile.socialLinks.website.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}
          {profile.socialLinks?.twitter && (
            <div className="flex items-center gap-2">
              <Twitter className="h-4 w-4 text-muted-foreground" />
              <a
                href={profile.socialLinks.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary hover:underline"
              >
                @{profile.socialLinks.twitter.split('/').pop()}
              </a>
            </div>
          )}
        </div>

        <Separator className="my-4" />

        {/* Achievements Section */}
        <div className="space-y-3">
          <h2 className="text-base font-semibold">Achievements</h2>
          <div className="flex gap-2 flex-wrap">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative">
                    <Award className="h-10 w-10 text-yellow-500" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-semibold">Top Performer</p>
                  <p className="text-xs">Ranked in top 10%</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {profile.activityStats.contributionStreak > 7 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="relative">
                      <Star className="h-10 w-10 text-orange-500" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-semibold">Active Contributor</p>
                    <p className="text-xs">{profile.activityStats.contributionStreak} day streak</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {profile.completionPercentage === 100 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="relative">
                      <CheckCircle className="h-10 w-10 text-blue-500" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-semibold">Profile Complete</p>
                    <p className="text-xs">100% profile completion</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <Button variant="link" className="h-auto p-0 text-xs">
            View all badges
          </Button>
        </div>

        <Separator className="my-4" />

        {/* Organizations Section */}
        <div className="space-y-3">
          <h2 className="text-base font-semibold">Organizations</h2>
          <div className="flex gap-2 flex-wrap">
            <Avatar className="h-8 w-8 cursor-pointer hover:opacity-80">
              <AvatarImage src={`https://api.dicebear.com/7.x/shapes/svg?seed=org1`} />
              <AvatarFallback className="text-xs">O1</AvatarFallback>
            </Avatar>
            <Avatar className="h-8 w-8 cursor-pointer hover:opacity-80">
              <AvatarImage src={`https://api.dicebear.com/7.x/shapes/svg?seed=org2`} />
              <AvatarFallback className="text-xs">O2</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  )
}
