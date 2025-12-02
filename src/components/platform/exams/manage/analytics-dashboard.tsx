import { getExamAnalytics } from "./actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Users, UserCheck, UserX, TrendingUp, TrendingDown, Award } from "lucide-react"
import { BarChart3 } from "lucide-react";

interface Props {
  examId: string;
}

export async function ExamAnalyticsDashboard({ examId }: Props) {
  const response = await getExamAnalytics({ examId });

  if (!response.success || !response.data) {
    return (
      <Card>
        <CardContent className="py-12">
          <p className="text-center text-muted-foreground">Analytics not available</p>
        </CardContent>
      </Card>
    );
  }

  const analytics = response.data;
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
  } = analytics;

  return (
    <div className="space-y-6">
      <div>
        <h2>{examTitle}</h2>
        <p className="muted">
          Total Marks: {totalMarks} • Passing Marks: {passingMarks}
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              {presentStudents} present • {absentStudents} absent
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
            {passPercentage >= 70 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{passPercentage.toFixed(1)}%</div>
            <Progress value={passPercentage} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Passed</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{passedStudents}</div>
            <p className="text-xs text-muted-foreground">
              {presentStudents > 0
                ? ((passedStudents / presentStudents) * 100).toFixed(1)
                : 0}
              % of present
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{failedStudents}</div>
            <p className="text-xs text-muted-foreground">
              {presentStudents > 0
                ? ((failedStudents / presentStudents) * 100).toFixed(1)
                : 0}
              % of present
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Marks</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageMarks}</div>
            <p className="text-xs text-muted-foreground">
              {averagePercentage.toFixed(2)}% average percentage
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Highest Marks</CardTitle>
            <Award className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{highestMarks}</div>
            <p className="text-xs text-muted-foreground">
              {((highestMarks / totalMarks) * 100).toFixed(2)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lowest Marks</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowestMarks}</div>
            <p className="text-xs text-muted-foreground">
              {((lowestMarks / totalMarks) * 100).toFixed(2)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Grade Distribution */}
      {Object.keys(gradeDistribution).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Grade Distribution</CardTitle>
            <CardDescription>
              Number of students in each grade category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(gradeDistribution)
                .sort(([a], [b]) => b.localeCompare(a))
                .map(([grade, count]) => {
                  const countNum = typeof count === 'number' ? count : 0;
                  const percentage = presentStudents > 0 ? (countNum / presentStudents) * 100 : 0;
                  return (
                    <div key={grade} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Grade {grade}</span>
                        <span className="text-sm text-muted-foreground">
                          {countNum} students ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <Progress value={percentage} />
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
