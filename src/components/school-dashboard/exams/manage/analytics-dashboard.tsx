// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import {
  Award,
  BarChart3,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Users,
  UserX,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { getExamAnalytics } from "./actions"

interface Props {
  examId: string
  dictionary?: Dictionary
}

export async function ExamAnalyticsDashboard({ examId, dictionary }: Props) {
  const t = dictionary?.school?.exams?.manage?.analytics
  const response = await getExamAnalytics({ examId })

  if (!response.success || !response.data) {
    return (
      <Card>
        <CardContent className="py-12">
          <p className="text-muted-foreground text-center">
            {t?.notAvailable ?? "Analytics not available"}
          </p>
        </CardContent>
      </Card>
    )
  }

  const analytics = response.data
  const {
    examTitle,
    totalMarks,
    passingMarks,
    totalStudents,
    presentStudents,
    absentStudents,
    passedStudents,
    failedStudents,
    passPercentage,
    averageMarks,
    averagePercentage,
    highestMarks,
    lowestMarks,
    gradeDistribution,
  } = analytics

  return (
    <div className="space-y-6">
      <div>
        <h2>{examTitle}</h2>
        <p className="muted">
          {(t?.totalMarksLabel ?? "Total Marks: {value}").replace(
            "{value}",
            String(totalMarks)
          )}{" "}
          •{" "}
          {(t?.passingMarksLabel ?? "Passing Marks: {value}").replace(
            "{value}",
            String(passingMarks)
          )}
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t?.totalStudents ?? "Total Students"}
            </CardTitle>
            <Users className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
            <p className="text-muted-foreground text-xs">
              {presentStudents} {t?.present ?? "present"} • {absentStudents}{" "}
              {t?.absent ?? "absent"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t?.passRate ?? "Pass Rate"}
            </CardTitle>
            {passPercentage >= 70 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {passPercentage.toFixed(1)}%
            </div>
            <Progress value={passPercentage} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t?.passed ?? "Passed"}
            </CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {passedStudents}
            </div>
            <p className="text-muted-foreground text-xs">
              {presentStudents > 0
                ? ((passedStudents / presentStudents) * 100).toFixed(1)
                : 0}
              % {t?.ofPresent ?? "of present"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t?.failed ?? "Failed"}
            </CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {failedStudents}
            </div>
            <p className="text-muted-foreground text-xs">
              {presentStudents > 0
                ? ((failedStudents / presentStudents) * 100).toFixed(1)
                : 0}
              % {t?.ofPresent ?? "of present"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t?.averageMarks ?? "Average Marks"}
            </CardTitle>
            <BarChart3 className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageMarks}</div>
            <p className="text-muted-foreground text-xs">
              {averagePercentage.toFixed(2)}%{" "}
              {t?.averagePercentage ?? "average percentage"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t?.highestMarks ?? "Highest Marks"}
            </CardTitle>
            <Award className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {highestMarks}
            </div>
            <p className="text-muted-foreground text-xs">
              {((highestMarks / totalMarks) * 100).toFixed(2)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t?.lowestMarks ?? "Lowest Marks"}
            </CardTitle>
            <TrendingDown className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowestMarks}</div>
            <p className="text-muted-foreground text-xs">
              {((lowestMarks / totalMarks) * 100).toFixed(2)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Grade Distribution */}
      {Object.keys(gradeDistribution).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              {t?.gradeDistribution ?? "Grade Distribution"}
            </CardTitle>
            <CardDescription>
              {t?.gradeDistDesc ?? "Number of students in each grade category"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(gradeDistribution)
                .sort(([a], [b]) => b.localeCompare(a))
                .map(([grade, count]) => {
                  const countNum = typeof count === "number" ? count : 0
                  const percentage =
                    presentStudents > 0 ? (countNum / presentStudents) * 100 : 0
                  return (
                    <div key={grade} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {(t?.grade ?? "Grade {grade}").replace(
                            "{grade}",
                            grade
                          )}
                        </span>
                        <span className="text-muted-foreground text-sm">
                          {(
                            t?.studentsCount ??
                            "{count} students ({percentage}%)"
                          )
                            .replace("{count}", String(countNum))
                            .replace("{percentage}", percentage.toFixed(1))}
                        </span>
                      </div>
                      <Progress value={percentage} />
                    </div>
                  )
                })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
