import {
  BarChart3,
  BookOpen,
  Eye,
  GraduationCap,
  TrendingUp,
  Users,
} from "lucide-react"

import { db } from "@/lib/db"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Locale } from "@/components/internationalization/config"
import type { getDictionary } from "@/components/internationalization/dictionaries"
import { Shell as PageContainer } from "@/components/table/shell"

interface Props {
  dictionary: Awaited<ReturnType<typeof getDictionary>>
  lang: Locale
}

export async function AnalyticsContent({ lang }: Props) {
  const [
    subjects,
    totalQuestions,
    totalMaterials,
    totalAssignments,
    totalVideos,
    topSubjectsByUsage,
    topLessonsByUsage,
  ] = await Promise.all([
    db.catalogSubject.count(),
    db.catalogQuestion.count(),
    db.catalogMaterial.count(),
    db.catalogAssignment.count(),
    db.lessonVideo.count(),
    db.catalogSubject.findMany({
      orderBy: { usageCount: "desc" },
      take: 10,
      select: {
        id: true,
        name: true,
        department: true,
        usageCount: true,
        totalChapters: true,
        totalLessons: true,
        averageRating: true,
        status: true,
      },
    }),
    db.catalogLesson.findMany({
      orderBy: { usageCount: "desc" },
      take: 10,
      select: {
        id: true,
        name: true,
        usageCount: true,
        averageRating: true,
        videoCount: true,
        resourceCount: true,
        chapter: {
          select: {
            name: true,
            subject: {
              select: { name: true },
            },
          },
        },
      },
    }),
  ])

  const totalContent =
    totalQuestions + totalMaterials + totalAssignments + totalVideos

  return (
    <PageContainer>
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subjects</CardTitle>
            <GraduationCap className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{subjects}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Questions</CardTitle>
            <BookOpen className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalQuestions}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Materials</CardTitle>
            <BarChart3 className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalMaterials}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assignments</CardTitle>
            <TrendingUp className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalAssignments}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Videos</CardTitle>
            <Eye className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalVideos}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Content</CardTitle>
            <Users className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalContent}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Subjects by Usage</CardTitle>
            <CardDescription>
              Most adopted subjects across schools
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Chapters</TableHead>
                  <TableHead>Lessons</TableHead>
                  <TableHead>Schools</TableHead>
                  <TableHead>Rating</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topSubjectsByUsage.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No subjects yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  topSubjectsByUsage.map((subject) => (
                    <TableRow key={subject.id}>
                      <TableCell className="font-medium">
                        {subject.name}
                      </TableCell>
                      <TableCell>{subject.department}</TableCell>
                      <TableCell>{subject.totalChapters}</TableCell>
                      <TableCell>{subject.totalLessons}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{subject.usageCount}</Badge>
                      </TableCell>
                      <TableCell>
                        {subject.averageRating > 0
                          ? subject.averageRating.toFixed(1)
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Lessons by Usage</CardTitle>
            <CardDescription>Most viewed and used lessons</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lesson</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Videos</TableHead>
                  <TableHead>Resources</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Rating</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topLessonsByUsage.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No lessons yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  topLessonsByUsage.map((lesson) => (
                    <TableRow key={lesson.id}>
                      <TableCell className="font-medium">
                        {lesson.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {lesson.chapter.subject.name}
                      </TableCell>
                      <TableCell>{lesson.videoCount}</TableCell>
                      <TableCell>{lesson.resourceCount}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{lesson.usageCount}</Badge>
                      </TableCell>
                      <TableCell>
                        {lesson.averageRating > 0
                          ? lesson.averageRating.toFixed(1)
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  )
}
