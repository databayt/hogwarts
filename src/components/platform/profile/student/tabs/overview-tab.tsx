/**
 * Student Profile Overview Tab
 * Summary view with key highlights and statistics
 */

"use client"

import React from "react"
import {
  Award,
  BookOpen,
  Brain,
  Calendar,
  ChevronRight,
  Code,
  FileText,
  Globe,
  Star,
  Target,
  TrendingUp,
  Users,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import type { StudentProfile } from "../../types"

// ============================================================================
// Types
// ============================================================================

interface OverviewTabProps {
  profile: StudentProfile
  dictionary?: Dictionary
  lang?: "ar" | "en"
  className?: string
}

interface StatCard {
  title: string
  value: string | number
  description?: string
  icon: React.ReactNode
  color?: string
  trend?: "up" | "down" | "stable"
}

// ============================================================================
// Component
// ============================================================================

export function OverviewTab({
  profile,
  dictionary,
  lang = "en",
  className,
}: OverviewTabProps) {
  const { student, academicInfo, performance, skillsAndInterests } = profile

  // Key statistics
  const stats: StatCard[] = [
    {
      title: "GPA",
      value: academicInfo.gpa?.toFixed(2) || "N/A",
      description: "Grade Point Average",
      icon: <TrendingUp className="h-4 w-4" />,
      color: "text-green-500",
      trend: "up",
    },
    {
      title: "Attendance",
      value: `${performance.attendanceRate}%`,
      description: "This semester",
      icon: <Calendar className="h-4 w-4" />,
      color: "text-blue-500",
      trend: "stable",
    },
    {
      title: "Rank",
      value: `#${academicInfo.rank || "N/A"}`,
      description: "Class ranking",
      icon: <Award className="h-4 w-4" />,
      color: "text-yellow-500",
      trend: "up",
    },
    {
      title: "Credits",
      value: academicInfo.totalCredits || 0,
      description: "Total earned",
      icon: <BookOpen className="h-4 w-4" />,
      color: "text-purple-500",
      trend: "up",
    },
  ]

  // Featured achievements (top 3)
  const featuredAchievements = [
    { name: "Dean's List", date: "Fall 2023", icon: "🏆" },
    { name: "Perfect Attendance", date: "Spring 2023", icon: "📅" },
    { name: "Coding Champion", date: "Dec 2023", icon: "💻" },
  ]

  // Top skills
  const topSkills = skillsAndInterests.skills
    .filter((skill) => skill.verified)
    .slice(0, 5)

  return (
    <div className={cn("space-y-6", className)}>
      {/* Statistics Grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="mb-2 flex items-start justify-between">
                <div className={cn("bg-muted rounded-lg p-2", stat.color)}>
                  {stat.icon}
                </div>
                {stat.trend && (
                  <Badge
                    variant={
                      stat.trend === "up"
                        ? "default"
                        : stat.trend === "down"
                          ? "destructive"
                          : "secondary"
                    }
                    className="text-xs"
                  >
                    {stat.trend === "up"
                      ? "↑"
                      : stat.trend === "down"
                        ? "↓"
                        : "→"}
                  </Badge>
                )}
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-muted-foreground text-xs">{stat.title}</p>
              {stat.description && (
                <p className="text-muted-foreground mt-1 text-xs">
                  {stat.description}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Academic Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="h-4 w-4" />
              Academic Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Subject Performance */}
            {performance.subjectPerformance
              .slice(0, 3)
              .map((subject, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {subject.subjectName}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">
                        {subject.currentGrade}%
                      </span>
                      {subject.trend === "up" && (
                        <TrendingUp className="h-3 w-3 text-green-500" />
                      )}
                    </div>
                  </div>
                  <Progress value={subject.currentGrade} className="h-2" />
                  <div className="text-muted-foreground flex justify-between text-xs">
                    <span>Attendance: {subject.attendance}%</span>
                    <span>
                      Assignments: {subject.assignmentsCompleted}/
                      {subject.assignmentsTotal}
                    </span>
                  </div>
                </div>
              ))}

            <Button variant="outline" size="sm" className="w-full">
              View All Subjects
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Skills & Expertise */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Brain className="h-4 w-4" />
              Skills & Expertise
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Top Skills */}
            {topSkills.map((skill, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code className="text-muted-foreground h-4 w-4" />
                  <span className="text-sm font-medium">{skill.name}</span>
                  {skill.verified && (
                    <Badge variant="outline" className="text-xs">
                      Verified
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      skill.level === "expert"
                        ? "default"
                        : skill.level === "advanced"
                          ? "secondary"
                          : "outline"
                    }
                    className="text-xs"
                  >
                    {skill.level}
                  </Badge>
                  <span className="text-muted-foreground text-xs">
                    {skill.endorsements} endorsements
                  </span>
                </div>
              </div>
            ))}

            {/* Languages */}
            {skillsAndInterests.languages.length > 0 && (
              <div className="border-t pt-2">
                <p className="text-muted-foreground mb-2 text-xs font-medium">
                  Languages
                </p>
                <div className="flex flex-wrap gap-2">
                  {skillsAndInterests.languages.map((lang, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      <Globe className="mr-1 h-3 w-3" />
                      {lang.name} ({lang.proficiency})
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Additional Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Recent Achievements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Award className="h-4 w-4" />
              Recent Achievements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {featuredAchievements.map((achievement, index) => (
              <div key={index} className="flex items-center gap-3">
                <span className="text-2xl">{achievement.icon}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium">{achievement.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {achievement.date}
                  </p>
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" className="w-full">
              View All
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Extracurricular Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" />
              Activities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {skillsAndInterests.extracurriculars.map((activity, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="bg-primary h-2 w-2 rounded-full" />
                  <span className="text-sm">{activity}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Interests & Hobbies */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Star className="h-4 w-4" />
              Interests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {[...skillsAndInterests.interests, ...skillsAndInterests.hobbies]
                .slice(0, 6)
                .map((interest, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {interest}
                  </Badge>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Strengths and Areas for Improvement */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4" />
              Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {performance.strengthAreas.map((strength, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-sm">{strength}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4" />
              Areas for Growth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {performance.improvementAreas.map((area, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-yellow-500" />
                  <span className="text-sm">{area}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
