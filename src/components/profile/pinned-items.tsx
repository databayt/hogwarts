"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  BookOpen,
  Star,
  GitFork,
  Lock,
  Globe,
  GraduationCap,
  Trophy,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  Folder,
  FileText,
  Beaker,
  Calculator,
  Palette,
  Music,
  Dumbbell
} from "lucide-react"
import type { ProfileRole, PinnedItem } from "./types"

interface PinnedItemsProps {
  role: ProfileRole
  data: Record<string, unknown>
}

// Subject/category icons mapping
const categoryIcons: Record<string, React.ReactNode> = {
  mathematics: <Calculator className="size-4" />,
  science: <Beaker className="size-4" />,
  english: <FileText className="size-4" />,
  art: <Palette className="size-4" />,
  music: <Music className="size-4" />,
  pe: <Dumbbell className="size-4" />,
  project: <Folder className="size-4" />,
  assignment: <BookOpen className="size-4" />,
  achievement: <Trophy className="size-4" />,
  class: <Users className="size-4" />,
  default: <BookOpen className="size-4" />,
}

// Subject/category colors (using semantic tokens)
const categoryColors: Record<string, string> = {
  mathematics: "bg-chart-1/20 text-chart-1 border-chart-1/30",
  science: "bg-chart-2/20 text-chart-2 border-chart-2/30",
  english: "bg-chart-3/20 text-chart-3 border-chart-3/30",
  history: "bg-chart-4/20 text-chart-4 border-chart-4/30",
  geography: "bg-chart-5/20 text-chart-5 border-chart-5/30",
  art: "bg-purple-500/20 text-purple-500 border-purple-500/30",
  music: "bg-pink-500/20 text-pink-500 border-pink-500/30",
  pe: "bg-orange-500/20 text-orange-500 border-orange-500/30",
  project: "bg-emerald-500/20 text-emerald-500 border-emerald-500/30",
  default: "bg-muted text-muted-foreground border-border",
}

function getPinnedItemsForRole(role: ProfileRole): PinnedItem[] {
  switch (role) {
    case "student":
      return [
        {
          id: "1",
          title: "Advanced Mathematics",
          description: "Calculus, Linear Algebra, and Statistics coursework",
          category: "mathematics",
          categoryColor: categoryColors.mathematics,
          stats: [
            { label: "Grade", value: "A" },
            { label: "Progress", value: "85%" },
          ],
          isPrivate: false,
        },
        {
          id: "2",
          title: "Science Fair Project",
          description: "Renewable Energy: Solar Panel Efficiency Analysis",
          category: "science",
          categoryColor: categoryColors.science,
          stats: [
            { label: "Status", value: "1st Place" },
            { label: "Year", value: "2024" },
          ],
          isPrivate: false,
        },
        {
          id: "3",
          title: "English Literature",
          description: "Analysis of Modern Literature and Creative Writing",
          category: "english",
          categoryColor: categoryColors.english,
          stats: [
            { label: "Grade", value: "A-" },
            { label: "Essays", value: "12" },
          ],
          isPrivate: false,
        },
        {
          id: "4",
          title: "History Research Paper",
          description: "The Impact of Industrial Revolution on Modern Society",
          category: "history",
          categoryColor: categoryColors.history,
          stats: [
            { label: "Pages", value: "24" },
            { label: "Grade", value: "A+" },
          ],
          isPrivate: false,
        },
        {
          id: "5",
          title: "Art Portfolio",
          description: "Collection of digital and traditional artwork",
          category: "art",
          categoryColor: categoryColors.art,
          stats: [
            { label: "Pieces", value: "15" },
            { label: "Exhibitions", value: "2" },
          ],
          isPrivate: true,
        },
        {
          id: "6",
          title: "Coding Projects",
          description: "Web development and programming assignments",
          category: "project",
          categoryColor: categoryColors.project,
          stats: [
            { label: "Projects", value: "8" },
            { label: "Languages", value: "3" },
          ],
          isPrivate: false,
        },
      ]
    case "teacher":
      return [
        {
          id: "1",
          title: "Advanced Calculus - Grade 12",
          description: "Differential equations and integration techniques",
          category: "mathematics",
          categoryColor: categoryColors.mathematics,
          stats: [
            { label: "Students", value: 32 },
            { label: "Avg Grade", value: "B+" },
          ],
          isPrivate: false,
        },
        {
          id: "2",
          title: "Algebra II - Grade 10",
          description: "Polynomial functions and complex numbers",
          category: "mathematics",
          categoryColor: categoryColors.mathematics,
          stats: [
            { label: "Students", value: 28 },
            { label: "Avg Grade", value: "A-" },
          ],
          isPrivate: false,
        },
        {
          id: "3",
          title: "Statistics - Grade 11",
          description: "Probability theory and data analysis",
          category: "mathematics",
          categoryColor: categoryColors.mathematics,
          stats: [
            { label: "Students", value: 25 },
            { label: "Avg Grade", value: "B" },
          ],
          isPrivate: false,
        },
        {
          id: "4",
          title: "Math Competition Team",
          description: "Preparing students for regional mathematics olympiad",
          category: "project",
          categoryColor: categoryColors.project,
          stats: [
            { label: "Members", value: 12 },
            { label: "Medals", value: 5 },
          ],
          isPrivate: false,
        },
      ]
    case "parent":
      return [
        {
          id: "1",
          title: "Emma's Progress",
          description: "Grade 10 - Overall academic performance tracking",
          category: "project",
          categoryColor: categoryColors.project,
          stats: [
            { label: "GPA", value: "3.9" },
            { label: "Subjects", value: 8 },
          ],
          isPrivate: true,
        },
        {
          id: "2",
          title: "Liam's Progress",
          description: "Grade 8 - Academic and extracurricular activities",
          category: "project",
          categoryColor: categoryColors.project,
          stats: [
            { label: "GPA", value: "3.7" },
            { label: "Clubs", value: 3 },
          ],
          isPrivate: true,
        },
        {
          id: "3",
          title: "Sophia's Progress",
          description: "Grade 6 - Foundation level excellence",
          category: "project",
          categoryColor: categoryColors.project,
          stats: [
            { label: "GPA", value: "4.0" },
            { label: "Awards", value: 2 },
          ],
          isPrivate: true,
        },
        {
          id: "4",
          title: "School Events",
          description: "Upcoming parent-teacher conferences and activities",
          category: "default",
          categoryColor: categoryColors.default,
          stats: [
            { label: "Upcoming", value: 5 },
            { label: "Attended", value: 12 },
          ],
          isPrivate: false,
        },
      ]
    case "staff":
      return [
        {
          id: "1",
          title: "Student Enrollment System",
          description: "Managing new student registrations and documentation",
          category: "project",
          categoryColor: categoryColors.project,
          stats: [
            { label: "Processed", value: 156 },
            { label: "Pending", value: 8 },
          ],
          isPrivate: false,
        },
        {
          id: "2",
          title: "Financial Records",
          description: "Fee collection and expense tracking",
          category: "default",
          categoryColor: categoryColors.default,
          stats: [
            { label: "Collected", value: "98%" },
            { label: "Outstanding", value: 12 },
          ],
          isPrivate: true,
        },
        {
          id: "3",
          title: "Event Planning",
          description: "Coordinating school events and ceremonies",
          category: "project",
          categoryColor: categoryColors.project,
          stats: [
            { label: "Events", value: 8 },
            { label: "This Month", value: 2 },
          ],
          isPrivate: false,
        },
        {
          id: "4",
          title: "Facility Management",
          description: "Maintenance schedules and resource allocation",
          category: "default",
          categoryColor: categoryColors.default,
          stats: [
            { label: "Tasks", value: 24 },
            { label: "Completed", value: "92%" },
          ],
          isPrivate: false,
        },
      ]
    default:
      return []
  }
}

export default function PinnedItems({ role, data }: PinnedItemsProps) {
  const items = getPinnedItemsForRole(role)

  if (items.length === 0) return null

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Pinned</h2>
          <button className="text-xs text-muted-foreground hover:text-primary transition-colors">
            Customize your pins
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item) => (
            <Card
              key={item.id}
              className="group relative overflow-hidden border border-border bg-card hover:border-primary/50 transition-all duration-200 cursor-pointer"
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`p-1.5 rounded-md border ${item.categoryColor}`}>
                      {categoryIcons[item.category] || categoryIcons.default}
                    </span>
                    <div className="min-w-0">
                      <CardTitle className="text-sm font-semibold text-primary hover:underline truncate">
                        {item.title}
                      </CardTitle>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {item.isPrivate ? (
                      <Tooltip>
                        <TooltipTrigger>
                          <Badge variant="outline" className="h-5 px-1.5 text-[10px] gap-1">
                            <Lock className="size-3" />
                            Private
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>Only visible to you</TooltipContent>
                      </Tooltip>
                    ) : (
                      <Tooltip>
                        <TooltipTrigger>
                          <Badge variant="secondary" className="h-5 px-1.5 text-[10px] gap-1">
                            <Globe className="size-3" />
                            Public
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>Visible to others</TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-xs text-muted-foreground line-clamp-2 mb-3">
                  {item.description}
                </CardDescription>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {item.stats.map((stat, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-current opacity-60" />
                      <span>{stat.label}:</span>
                      <span className="font-medium text-foreground">{stat.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
              {/* Hover gradient effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </Card>
          ))}
        </div>
      </div>
    </TooltipProvider>
  )
}
