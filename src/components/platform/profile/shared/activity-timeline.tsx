/**
 * Activity Timeline Component
 * GitHub-style activity feed showing recent profile activities
 */

"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  FileText,
  Award,
  BookOpen,
  Users,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  MessageSquare,
  Heart,
  Share2,
  Upload,
  Download,
  CreditCard,
  GraduationCap,
  Trophy,
  Target,
  Zap,
  AlertCircle,
  Info,
  TrendingUp,
  TrendingDown,
  Activity
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow, format } from 'date-fns'
import { ar, enUS } from 'date-fns/locale'
import type { ActivityItem } from '../types'
import { ActivityType } from '../types'
import type { Dictionary } from '@/components/internationalization/dictionaries'

// ============================================================================
// Types
// ============================================================================

interface ActivityTimelineProps {
  activities: ActivityItem[]
  dictionary?: Dictionary
  lang?: 'ar' | 'en'
  className?: string
  onActivityClick?: (activity: ActivityItem) => void
  showFilters?: boolean
  maxItems?: number
}

interface ActivityGroup {
  date: string
  items: ActivityItem[]
}

// ============================================================================
// Constants
// ============================================================================

const ACTIVITY_ICONS: Record<ActivityType, React.ReactNode> = {
  [ActivityType.ASSIGNMENT_SUBMITTED]: <Upload className="h-4 w-4" />,
  [ActivityType.GRADE_RECEIVED]: <CheckCircle className="h-4 w-4" />,
  [ActivityType.COURSE_ENROLLED]: <BookOpen className="h-4 w-4" />,
  [ActivityType.COURSE_COMPLETED]: <GraduationCap className="h-4 w-4" />,
  [ActivityType.ACHIEVEMENT_EARNED]: <Award className="h-4 w-4" />,
  [ActivityType.CERTIFICATE_EARNED]: <Trophy className="h-4 w-4" />,
  [ActivityType.BADGE_EARNED]: <Star className="h-4 w-4" />,
  [ActivityType.PROFILE_UPDATED]: <Users className="h-4 w-4" />,
  [ActivityType.CONNECTION_MADE]: <Users className="h-4 w-4" />,
  [ActivityType.POST_CREATED]: <FileText className="h-4 w-4" />,
  [ActivityType.COMMENT_MADE]: <MessageSquare className="h-4 w-4" />,
  [ActivityType.FEE_PAID]: <CreditCard className="h-4 w-4" />,
  [ActivityType.DOCUMENT_UPLOADED]: <Upload className="h-4 w-4" />,
  [ActivityType.ATTENDANCE_MARKED]: <Calendar className="h-4 w-4" />,
  [ActivityType.CUSTOM]: <Activity className="h-4 w-4" />
}

const ACTIVITY_COLORS: Record<ActivityType, string> = {
  [ActivityType.ASSIGNMENT_SUBMITTED]: 'bg-blue-500',
  [ActivityType.GRADE_RECEIVED]: 'bg-green-500',
  [ActivityType.COURSE_ENROLLED]: 'bg-purple-500',
  [ActivityType.COURSE_COMPLETED]: 'bg-indigo-500',
  [ActivityType.ACHIEVEMENT_EARNED]: 'bg-yellow-500',
  [ActivityType.CERTIFICATE_EARNED]: 'bg-amber-500',
  [ActivityType.BADGE_EARNED]: 'bg-orange-500',
  [ActivityType.PROFILE_UPDATED]: 'bg-gray-500',
  [ActivityType.CONNECTION_MADE]: 'bg-cyan-500',
  [ActivityType.POST_CREATED]: 'bg-teal-500',
  [ActivityType.COMMENT_MADE]: 'bg-emerald-500',
  [ActivityType.FEE_PAID]: 'bg-pink-500',
  [ActivityType.DOCUMENT_UPLOADED]: 'bg-violet-500',
  [ActivityType.ATTENDANCE_MARKED]: 'bg-rose-500',
  [ActivityType.CUSTOM]: 'bg-slate-500'
}

const ACTIVITY_LABELS: Record<ActivityType, string> = {
  [ActivityType.ASSIGNMENT_SUBMITTED]: 'Assignment',
  [ActivityType.GRADE_RECEIVED]: 'Grade',
  [ActivityType.COURSE_ENROLLED]: 'Course',
  [ActivityType.COURSE_COMPLETED]: 'Completion',
  [ActivityType.ACHIEVEMENT_EARNED]: 'Achievement',
  [ActivityType.CERTIFICATE_EARNED]: 'Certificate',
  [ActivityType.BADGE_EARNED]: 'Badge',
  [ActivityType.PROFILE_UPDATED]: 'Profile',
  [ActivityType.CONNECTION_MADE]: 'Connection',
  [ActivityType.POST_CREATED]: 'Post',
  [ActivityType.COMMENT_MADE]: 'Comment',
  [ActivityType.FEE_PAID]: 'Payment',
  [ActivityType.DOCUMENT_UPLOADED]: 'Document',
  [ActivityType.ATTENDANCE_MARKED]: 'Attendance',
  [ActivityType.CUSTOM]: 'Activity'
}

// ============================================================================
// Utility Functions
// ============================================================================

function groupActivitiesByDate(activities: ActivityItem[]): ActivityGroup[] {
  const groups: Map<string, ActivityItem[]> = new Map()

  activities.forEach(activity => {
    const date = format(activity.timestamp, 'yyyy-MM-dd')
    if (!groups.has(date)) {
      groups.set(date, [])
    }
    groups.get(date)!.push(activity)
  })

  return Array.from(groups.entries())
    .map(([date, items]) => ({ date, items }))
    .sort((a, b) => b.date.localeCompare(a.date))
}

function getRelativeDateLabel(dateString: string, lang: 'ar' | 'en'): string {
  const date = new Date(dateString)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const isToday = date.toDateString() === today.toDateString()
  const isYesterday = date.toDateString() === yesterday.toDateString()

  if (isToday) {
    return lang === 'ar' ? 'اليوم' : 'Today'
  }
  if (isYesterday) {
    return lang === 'ar' ? 'أمس' : 'Yesterday'
  }

  const locale = lang === 'ar' ? ar : enUS
  return format(date, 'MMMM d, yyyy', { locale })
}

// ============================================================================
// Component
// ============================================================================

export function ActivityTimeline({
  activities,
  dictionary,
  lang = 'en',
  className,
  onActivityClick,
  showFilters = true,
  maxItems = 50
}: ActivityTimelineProps) {
  const [filterType, setFilterType] = useState<'all' | ActivityType>('all')
  const [showAll, setShowAll] = useState(false)
  const locale = lang === 'ar' ? ar : enUS

  // Filter activities
  const filteredActivities = activities.filter(activity => {
    if (filterType === 'all') return true
    return activity.type === filterType
  })

  // Limit activities if not showing all
  const displayedActivities = showAll
    ? filteredActivities
    : filteredActivities.slice(0, maxItems)

  // Group activities by date
  const groupedActivities = groupActivitiesByDate(displayedActivities)

  // Get unique activity types for filter
  const activityTypes = Array.from(new Set(activities.map(a => a.type)))

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">
            Recent Activity
          </CardTitle>
          {showFilters && (
            <Select
              value={filterType}
              onValueChange={(value) => setFilterType(value as typeof filterType)}
            >
              <SelectTrigger className="w-[140px] h-8">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Activities</SelectItem>
                {activityTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {ACTIVITY_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {groupedActivities.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No activities to show</p>
            </div>
          ) : (
            groupedActivities.map((group, groupIndex) => (
              <div key={group.date}>
                {/* Date Header */}
                <div className="px-6 py-2 bg-muted/50 sticky top-0 z-10">
                  <p className="text-xs font-medium text-muted-foreground">
                    {getRelativeDateLabel(group.date, lang)}
                  </p>
                </div>

                {/* Activities for this date */}
                <div className="divide-y">
                  {group.items.map((activity, index) => (
                    <div
                      key={activity.id}
                      className={cn(
                        "px-6 py-4 hover:bg-muted/50 transition-colors cursor-pointer",
                        "flex gap-4"
                      )}
                      onClick={() => onActivityClick?.(activity)}
                    >
                      {/* Activity Icon */}
                      <div className="flex-shrink-0 pt-0.5">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-white",
                          ACTIVITY_COLORS[activity.type]
                        )}>
                          {activity.icon ? (
                            <span className="text-sm">{activity.icon}</span>
                          ) : (
                            ACTIVITY_ICONS[activity.type]
                          )}
                        </div>
                      </div>

                      {/* Activity Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              {activity.title}
                            </p>
                            {activity.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {activity.description}
                              </p>
                            )}

                            {/* Metadata */}
                            {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {Object.entries(activity.metadata).map(([key, value]) => {
                                  // Skip rendering complex objects
                                  if (typeof value === 'object' && value !== null) {
                                    return null
                                  }

                                  // Special rendering for specific metadata types
                                  if (key === 'grade' || key === 'score') {
                                    return (
                                      <Badge
                                        key={key}
                                        variant={value >= 90 ? 'default' : value >= 70 ? 'secondary' : 'outline'}
                                      >
                                        {value}%
                                      </Badge>
                                    )
                                  }

                                  if (key === 'status') {
                                    return (
                                      <Badge
                                        key={key}
                                        variant={value === 'completed' ? 'default' : 'secondary'}
                                      >
                                        {value}
                                      </Badge>
                                    )
                                  }

                                  if (key === 'points' || key === 'credits') {
                                    return (
                                      <span key={key} className="text-xs text-muted-foreground">
                                        +{value} {key}
                                      </span>
                                    )
                                  }

                                  // Default rendering for other metadata
                                  return (
                                    <span key={key} className="text-xs text-muted-foreground">
                                      {key}: {String(value)}
                                    </span>
                                  )
                                })}
                              </div>
                            )}
                          </div>

                          {/* Timestamp */}
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDistanceToNow(activity.timestamp, {
                              addSuffix: true,
                              locale
                            })}
                          </span>
                        </div>

                        {/* Action Link */}
                        {activity.link && (
                          <Button
                            variant="link"
                            size="sm"
                            className="h-auto p-0 mt-2 text-xs"
                            asChild
                          >
                            <a
                              href={activity.link}
                              onClick={(e) => e.stopPropagation()}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              View Details →
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Load More */}
        {!showAll && filteredActivities.length > maxItems && (
          <div className="p-4 border-t">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setShowAll(true)}
            >
              Show {filteredActivities.length - maxItems} more activities
            </Button>
          </div>
        )}

        {/* Show Less */}
        {showAll && filteredActivities.length > maxItems && (
          <div className="p-4 border-t">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setShowAll(false)}
            >
              Show less
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}