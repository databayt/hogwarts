/**
 * Pinned Items Component
 * GitHub-style pinned repositories/items grid
 */

"use client"

import React from "react"
import Link from "next/link"
import type { PinnedItem as PinnedItemType } from "@prisma/client"
import {
  Award,
  Beaker,
  BookOpen,
  Calculator,
  FileText,
  Folder,
  Globe,
  GraduationCap,
  Lock,
  Music,
  Palette,
  Star,
  Trophy,
  Users,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { Dictionary } from "@/components/internationalization/dictionaries"

// ============================================================================
// Types
// ============================================================================

interface PinnedItemsProps {
  items: PinnedItemType[]
  isOwner?: boolean
  onCustomize?: () => void
  dictionary?: Dictionary
  lang?: "ar" | "en"
  className?: string
}

// ============================================================================
// Constants
// ============================================================================

// Category icons mapping
const categoryIcons: Record<string, React.ReactNode> = {
  COURSE: <BookOpen className="size-4" />,
  SUBJECT: <Calculator className="size-4" />,
  PROJECT: <Folder className="size-4" />,
  ACHIEVEMENT: <Trophy className="size-4" />,
  CERTIFICATE: <Award className="size-4" />,
  CLASS: <Users className="size-4" />,
  CHILD: <GraduationCap className="size-4" />,
  DEPARTMENT: <Beaker className="size-4" />,
  PUBLICATION: <FileText className="size-4" />,
  TASK: <Star className="size-4" />,
}

// Category colors (using semantic chart tokens)
const categoryColors: Record<string, string> = {
  COURSE: "bg-chart-1",
  SUBJECT: "bg-chart-2",
  PROJECT: "bg-chart-3",
  ACHIEVEMENT: "bg-chart-4",
  CERTIFICATE: "bg-chart-5",
  CLASS: "bg-chart-1",
  CHILD: "bg-chart-2",
  DEPARTMENT: "bg-chart-3",
  PUBLICATION: "bg-chart-4",
  TASK: "bg-chart-5",
}

// Category labels
const categoryLabels: Record<string, string> = {
  COURSE: "Course",
  SUBJECT: "Subject",
  PROJECT: "Project",
  ACHIEVEMENT: "Achievement",
  CERTIFICATE: "Certificate",
  CLASS: "Class",
  CHILD: "Child",
  DEPARTMENT: "Department",
  PUBLICATION: "Publication",
  TASK: "Task",
}

// ============================================================================
// Component
// ============================================================================

export function PinnedItems({
  items,
  isOwner = false,
  onCustomize,
  dictionary,
  lang = "en",
  className,
}: PinnedItemsProps) {
  if (items.length === 0 && !isOwner) {
    return null
  }

  return (
    <TooltipProvider>
      <div className={cn("space-y-4", className)}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-foreground text-base font-semibold">Pinned</h2>
          {isOwner && (
            <Button
              variant="link"
              size="sm"
              className="text-muted-foreground hover:text-primary h-auto p-0 text-xs"
              onClick={onCustomize}
            >
              Customize your pins
            </Button>
          )}
        </div>

        {/* Empty State for Owner */}
        {items.length === 0 && isOwner && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <Folder className="text-muted-foreground mb-2 size-8" />
              <p className="text-muted-foreground text-sm">
                Pin your favorite courses, projects, or achievements
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={onCustomize}
              >
                Add pinned items
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Pinned Items Grid */}
        {items.length > 0 && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {items.map((item) => (
              <PinnedItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}

// ============================================================================
// Pinned Item Card
// ============================================================================

interface PinnedItemCardProps {
  item: PinnedItemType
}

function PinnedItemCard({ item }: PinnedItemCardProps) {
  const metadata = item.metadata as Record<string, unknown> | null
  const stats = metadata?.stats as
    | { label: string; value: string | number }[]
    | undefined
  const language = metadata?.language as string | undefined
  const link = metadata?.link as string | undefined

  const CardWrapper = link ? Link : "div"
  const cardProps = link ? { href: link } : {}

  return (
    <Card
      className={cn(
        "group border-border bg-card hover:border-primary/50 relative overflow-hidden border transition-all duration-200",
        link && "cursor-pointer"
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            {/* Category Icon */}
            <span className="text-muted-foreground">
              {categoryIcons[item.itemType] || <Folder className="size-4" />}
            </span>

            {/* Title */}
            <CardTitle className="text-primary truncate text-sm font-semibold group-hover:underline">
              {item.title}
            </CardTitle>
          </div>

          {/* Public/Private Badge */}
          <div className="flex shrink-0 items-center gap-1">
            {item.isPublic ? (
              <Badge
                variant="secondary"
                className="h-5 gap-1 px-1.5 text-[10px]"
              >
                <Globe className="size-3" />
                Public
              </Badge>
            ) : (
              <Badge variant="outline" className="h-5 gap-1 px-1.5 text-[10px]">
                <Lock className="size-3" />
                Private
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Description */}
        {item.description && (
          <CardDescription className="text-muted-foreground mb-3 line-clamp-2 text-xs">
            {item.description}
          </CardDescription>
        )}

        {/* Stats Row */}
        <div className="text-muted-foreground flex items-center gap-4 text-xs">
          {/* Category Tag */}
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "size-3 rounded-full",
                categoryColors[item.itemType] || "bg-muted"
              )}
            />
            <span>{categoryLabels[item.itemType] || item.itemType}</span>
          </div>

          {/* Language (if applicable) */}
          {language && (
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-yellow-400" />
              <span>{language}</span>
            </div>
          )}

          {/* Custom Stats */}
          {stats?.map((stat, idx) => (
            <div key={idx} className="flex items-center gap-1">
              <span>{stat.label}:</span>
              <span className="text-foreground font-medium">{stat.value}</span>
            </div>
          ))}
        </div>
      </CardContent>

      {/* Hover Gradient Effect */}
      <div className="from-primary/0 via-primary/5 to-primary/0 pointer-events-none absolute inset-0 bg-gradient-to-r opacity-0 transition-opacity group-hover:opacity-100" />
    </Card>
  )
}

// ============================================================================
// Default Pinned Items by Role
// ============================================================================

export function getDefaultPinnedItems(
  role: string,
  userId: string,
  schoolId: string
): Omit<PinnedItemType, "id" | "createdAt" | "updatedAt">[] {
  switch (role) {
    case "STUDENT":
      return [
        {
          schoolId,
          userId,
          itemType: "COURSE",
          itemId: "placeholder-1",
          title: "Advanced Mathematics",
          description: "Calculus, Linear Algebra, and Statistics coursework",
          metadata: {
            stats: [
              { label: "Grade", value: "A" },
              { label: "Progress", value: "85%" },
            ],
          },
          order: 0,
          isPublic: true,
        },
        {
          schoolId,
          userId,
          itemType: "PROJECT",
          itemId: "placeholder-2",
          title: "Science Fair Project",
          description: "Renewable Energy: Solar Panel Efficiency Analysis",
          metadata: {
            stats: [{ label: "Status", value: "1st Place" }],
          },
          order: 1,
          isPublic: true,
        },
      ]
    case "TEACHER":
      return [
        {
          schoolId,
          userId,
          itemType: "CLASS",
          itemId: "placeholder-1",
          title: "Advanced Calculus - Grade 12",
          description: "Differential equations and integration techniques",
          metadata: {
            stats: [
              { label: "Students", value: 32 },
              { label: "Avg Grade", value: "B+" },
            ],
          },
          order: 0,
          isPublic: true,
        },
        {
          schoolId,
          userId,
          itemType: "SUBJECT",
          itemId: "placeholder-2",
          title: "Algebra II - Grade 10",
          description: "Polynomial functions and complex numbers",
          metadata: {
            stats: [{ label: "Students", value: 28 }],
          },
          order: 1,
          isPublic: true,
        },
      ]
    case "GUARDIAN":
      return [
        {
          schoolId,
          userId,
          itemType: "CHILD",
          itemId: "placeholder-1",
          title: "Emma's Progress",
          description: "Grade 10 - Overall academic performance tracking",
          metadata: {
            stats: [
              { label: "GPA", value: "3.9" },
              { label: "Subjects", value: 8 },
            ],
          },
          order: 0,
          isPublic: false,
        },
      ]
    case "STAFF":
      return [
        {
          schoolId,
          userId,
          itemType: "DEPARTMENT",
          itemId: "placeholder-1",
          title: "Student Enrollment System",
          description: "Managing new student registrations and documentation",
          metadata: {
            stats: [
              { label: "Processed", value: 156 },
              { label: "Pending", value: 8 },
            ],
          },
          order: 0,
          isPublic: true,
        },
      ]
    default:
      return []
  }
}
