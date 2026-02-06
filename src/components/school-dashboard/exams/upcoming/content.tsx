import type { ElementType } from "react"
import Link from "next/link"
import { addDays, differenceInDays, format } from "date-fns"
import {
  BookOpen,
  Calendar,
  ChevronRight,
  CircleAlert,
  Clock,
} from "lucide-react"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

// Short labels for exam types - keep badges compact
const examTypeLabels: Record<string, string> = {
  MIDTERM: "Mid",
  FINAL: "Final",
  QUIZ: "Quiz",
  TEST: "Test",
  ASSIGNMENT: "HW",
  HOMEWORK: "HW",
  PROJECT: "Proj",
  PRACTICAL: "Prac",
}

interface Props {
  dictionary: Dictionary
  lang: Locale
}

export default async function UpcomingExamsContent({
  dictionary,
  lang,
}: Props) {
  const { schoolId } = await getTenantContext()

  let upcomingExams: Array<{
    id: string
    title: string
    description: string | null
    examDate: Date
    startTime: string
    endTime: string
    duration: number
    totalMarks: number
    examType: string
    status: string
    className: string
    subjectName: string
    daysUntil: number
  }> = []

  if (schoolId) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const exams = await db.exam.findMany({
      where: {
        schoolId,
        status: { in: ["PLANNED", "IN_PROGRESS"] },
        examDate: { gte: today },
      },
      include: {
        class: { select: { name: true } },
        subject: { select: { subjectName: true } },
      },
      orderBy: { examDate: "asc" },
      take: 30,
    })

    upcomingExams = exams.map((exam) => ({
      id: exam.id,
      title: exam.title,
      description: exam.description,
      examDate: exam.examDate,
      startTime: exam.startTime,
      endTime: exam.endTime,
      duration: exam.duration,
      totalMarks: exam.totalMarks,
      examType: exam.examType,
      status: exam.status,
      className: exam.class?.name || "Unknown",
      subjectName: exam.subject?.subjectName || "Unknown",
      daysUntil: differenceInDays(exam.examDate, today),
    }))
  }

  // Use exams dictionary - upcoming keys may not exist, use fallbacks
  const examDict = dictionary?.school?.exams
  const d = {
    labels: {
      today: "Today",
      tomorrow: "Tomorrow",
      daysLeft: "days",
      marks: "marks",
    },
    stats: {
      total: examDict?.upcomingExams || "Upcoming",
      today: "Today",
      tomorrow: "Tomorrow",
      thisWeek: "This Week",
    },
    empty: {
      title: "No Upcoming Exams",
      description: "There are no exams scheduled in the near future.",
    },
    sections: {
      today: "Today's Exams",
      tomorrow: "Tomorrow",
      thisWeek: "This Week",
      later: "Coming Up",
    },
    actions: {
      viewDetails: "View Details",
      scheduleExam: examDict?.createExam || "Schedule an Exam",
    },
  }

  // Group exams by urgency
  const todayExams = upcomingExams.filter((e) => e.daysUntil === 0)
  const tomorrowExams = upcomingExams.filter((e) => e.daysUntil === 1)
  const thisWeekExams = upcomingExams.filter(
    (e) => e.daysUntil > 1 && e.daysUntil <= 7
  )
  const laterExams = upcomingExams.filter((e) => e.daysUntil > 7)

  const getUrgencyVariant = (
    daysUntil: number
  ): "destructive" | "secondary" | "outline" => {
    if (daysUntil === 0) return "destructive"
    if (daysUntil === 1) return "secondary"
    return "outline"
  }

  const getUrgencyLabel = (daysUntil: number) => {
    if (daysUntil === 0) return d?.labels?.today || "Today"
    if (daysUntil === 1) return d?.labels?.tomorrow || "Tomorrow"
    const daysText = d?.labels?.daysLeft || "days"
    if (daysUntil <= 7) return `${daysUntil} ${daysText}`
    return format(addDays(new Date(), daysUntil), "MMM d")
  }

  const ExamCard = ({ exam }: { exam: (typeof upcomingExams)[0] }) => (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{exam.title}</CardTitle>
            <CardDescription>
              {exam.className} - {exam.subjectName}
            </CardDescription>
          </div>
          <Badge variant={getUrgencyVariant(exam.daysUntil)}>
            {getUrgencyLabel(exam.daysUntil)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="text-muted-foreground flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>{format(exam.examDate, "EEE, MMM d, yyyy")}</span>
          </div>
          <div className="text-muted-foreground flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>
              {exam.startTime} - {exam.endTime} ({exam.duration} min)
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm">
            <Badge variant="outline">
              {examTypeLabels[exam.examType] || exam.examType}
            </Badge>
            <span className="text-muted-foreground">
              {exam.totalMarks} {d?.labels?.marks || "marks"}
            </span>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href={`/${lang}/exams/${exam.id}`}>
              {d?.actions?.viewDetails || "View Details"}
              <ChevronRight className="ms-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  const ExamSection = ({
    title,
    exams,
    icon: Icon,
    urgent = false,
  }: {
    title: string
    exams: typeof upcomingExams
    icon: React.ElementType
    urgent?: boolean
  }) => {
    if (exams.length === 0) return null

    return (
      <div className="space-y-4">
        <div
          className={`flex items-center gap-2 ${urgent ? "text-destructive" : ""}`}
        >
          <Icon className="h-5 w-5" />
          <h2 className="font-semibold">
            {title} ({exams.length})
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {exams.map((exam) => (
            <ExamCard key={exam.id} exam={exam} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {d?.stats?.total || "Total Upcoming"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingExams.length}</div>
          </CardContent>
        </Card>
        <Card className={todayExams.length > 0 ? "border-destructive" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {d?.stats?.today || "Today"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayExams.length}</div>
          </CardContent>
        </Card>
        <Card className={tomorrowExams.length > 0 ? "border-yellow-500" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {d?.stats?.tomorrow || "Tomorrow"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tomorrowExams.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {d?.stats?.thisWeek || "This Week"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{thisWeekExams.length}</div>
          </CardContent>
        </Card>
      </div>

      {upcomingExams.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="text-muted-foreground mb-4 h-12 w-12" />
            <h3 className="mb-2 text-lg font-semibold">
              {d?.empty?.title || "No Upcoming Exams"}
            </h3>
            <p className="text-muted-foreground mb-4 text-sm">
              {d?.empty?.description ||
                "There are no exams scheduled in the near future."}
            </p>
            <Button asChild>
              <Link href={`/${lang}/exams/new`}>
                {d?.actions?.scheduleExam || "Schedule an Exam"}
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          <ExamSection
            title={d?.sections?.today || "Today's Exams"}
            exams={todayExams}
            icon={CircleAlert}
            urgent
          />
          <ExamSection
            title={d?.sections?.tomorrow || "Tomorrow"}
            exams={tomorrowExams}
            icon={Clock}
          />
          <ExamSection
            title={d?.sections?.thisWeek || "This Week"}
            exams={thisWeekExams}
            icon={Calendar}
          />
          <ExamSection
            title={d?.sections?.later || "Coming Up"}
            exams={laterExams}
            icon={BookOpen}
          />
        </div>
      )}
    </div>
  )
}
