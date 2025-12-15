import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Users,
} from "lucide-react"
import { SearchParams } from "nuqs/server"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { type Dictionary } from "@/components/internationalization/dictionaries"

import { getAllClassesCapacity, type ClassCapacityAnalytics } from "../actions"

interface Props {
  searchParams: Promise<SearchParams>
  dictionary: Dictionary["school"]
}

function getStatusBadge(status: ClassCapacityAnalytics["status"]) {
  switch (status) {
    case "full":
      return <Badge variant="destructive">Full</Badge>
    case "near-full":
      return (
        <Badge
          variant="secondary"
          className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100"
        >
          Near Full
        </Badge>
      )
    case "under":
      return (
        <Badge
          variant="secondary"
          className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
        >
          Under Capacity
        </Badge>
      )
    case "optimal":
      return (
        <Badge
          variant="secondary"
          className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
        >
          Optimal
        </Badge>
      )
  }
}

function getProgressColor(percentageFull: number): string {
  if (percentageFull >= 100) return "bg-destructive"
  if (percentageFull >= 85) return "bg-amber-500"
  if (percentageFull < 20) return "bg-blue-500"
  return "bg-green-500"
}

export default async function ClassCapacityContent({ dictionary }: Props) {
  const d = dictionary?.classes

  const result = await getAllClassesCapacity()

  if (!result.success) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>
              {d?.capacity?.title || "Class Capacity Analysis"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">{result.error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const data = result.data

  // Handle empty state
  if (data.totalClasses === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>
              {d?.capacity?.title || "Class Capacity Analysis"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              No classes found. Create classes to view capacity analytics.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
            <Users className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalClasses}</div>
            <p className="text-muted-foreground text-xs">
              {data.totalEnrolled} / {data.totalCapacity} total capacity
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Utilization
            </CardTitle>
            <TrendingUp className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.averageUtilization}%</div>
            <Progress value={data.averageUtilization} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Classes Full</CardTitle>
            <AlertCircle className="text-destructive size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.classesFull}</div>
            <p className="text-muted-foreground text-xs">
              {data.classesNearFull} near full (85%+)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Optimal Classes
            </CardTitle>
            <CheckCircle className="size-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.classesOptimal}</div>
            <p className="text-muted-foreground text-xs">
              {data.classesUnderCapacity} under minimum
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Status Distribution</CardTitle>
          <CardDescription>Classes by enrollment status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="size-3 rounded-full bg-green-500" />
              <span className="text-sm">Optimal: {data.classesOptimal}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-3 rounded-full bg-amber-500" />
              <span className="text-sm">Near Full: {data.classesNearFull}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-destructive size-3 rounded-full" />
              <span className="text-sm">Full: {data.classesFull}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-3 rounded-full bg-blue-500" />
              <span className="text-sm">
                Under Capacity: {data.classesUnderCapacity}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Classes Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {d?.capacity?.title || "Class Capacity Details"}
          </CardTitle>
          <CardDescription>Enrollment status for all classes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-muted-foreground px-4 py-3 text-left text-sm font-medium">
                    Class
                  </th>
                  <th className="text-muted-foreground px-4 py-3 text-left text-sm font-medium">
                    Subject
                  </th>
                  <th className="text-muted-foreground px-4 py-3 text-left text-sm font-medium">
                    Teacher
                  </th>
                  <th className="text-muted-foreground px-4 py-3 text-left text-sm font-medium">
                    Enrollment
                  </th>
                  <th className="text-muted-foreground px-4 py-3 text-left text-sm font-medium">
                    Capacity
                  </th>
                  <th className="text-muted-foreground px-4 py-3 text-left text-sm font-medium">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.classes.map((classItem) => (
                  <tr key={classItem.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium">{classItem.name}</td>
                    <td className="text-muted-foreground px-4 py-3">
                      {classItem.subjectName}
                    </td>
                    <td className="text-muted-foreground px-4 py-3">
                      {classItem.teacherName}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {classItem.currentEnrollment}
                        </span>
                        <span className="text-muted-foreground">
                          / {classItem.maxCapacity}
                        </span>
                      </div>
                      <div className="mt-1 w-24">
                        <div className="bg-muted h-1.5 w-full rounded-full">
                          <div
                            className={`h-1.5 rounded-full ${getProgressColor(classItem.percentageFull)}`}
                            style={{
                              width: `${Math.min(100, classItem.percentageFull)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm">
                        {classItem.availableSpots} spots available
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(classItem.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Alerts for Classes at Capacity */}
      {(data.classesFull > 0 || data.classesNearFull > 0) && (
        <Card className="border-amber-200 dark:border-amber-800">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-amber-500" />
              <CardTitle className="text-amber-700 dark:text-amber-300">
                Capacity Alerts
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.classes
                .filter((c) => c.status === "full" || c.status === "near-full")
                .map((classItem) => (
                  <div
                    key={classItem.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium">{classItem.name}</p>
                      <p className="text-muted-foreground text-sm">
                        {classItem.currentEnrollment}/{classItem.maxCapacity}{" "}
                        students ({classItem.percentageFull}%)
                      </p>
                    </div>
                    {getStatusBadge(classItem.status)}
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
