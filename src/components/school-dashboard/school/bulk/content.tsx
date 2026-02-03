import {
  BookOpen,
  Building,
  Calendar,
  ClipboardList,
  Clock,
  FileText,
  Users,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { AcademicTab } from "./tabs/academic-tab"
import { AttendanceTab } from "./tabs/attendance-tab"
import { ExamsTab } from "./tabs/exams-tab"
import { MaterialsTab } from "./tabs/materials-tab"
import { PeopleTab } from "./tabs/people-tab"
import { StructureTab } from "./tabs/structure-tab"
import { TimetableTab } from "./tabs/timetable-tab"

interface Props {
  dictionary: Dictionary
  lang: Locale
}

export default function BulkContent({ dictionary, lang }: Props) {
  const isArabic = lang === "ar"

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle>
            {isArabic ? "العمليات الجماعية" : "Bulk Operations"}
          </CardTitle>
          <CardDescription>
            {isArabic
              ? "إدخال البيانات الجماعية لمدرستك. إنشاء الهيكل الأكاديمي واستيراد الطلاب والمعلمين وغير ذلك."
              : "Seed data and bulk import records for your school. Create academic structure, import students, teachers, and more."}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="academic" className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="academic" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">
              {isArabic ? "أكاديمي" : "Academic"}
            </span>
          </TabsTrigger>
          <TabsTrigger value="structure" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            <span className="hidden sm:inline">
              {isArabic ? "الهيكل" : "Structure"}
            </span>
          </TabsTrigger>
          <TabsTrigger value="people" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">
              {isArabic ? "الأشخاص" : "People"}
            </span>
          </TabsTrigger>
          <TabsTrigger value="attendance" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            <span className="hidden sm:inline">
              {isArabic ? "الحضور" : "Attendance"}
            </span>
          </TabsTrigger>
          <TabsTrigger value="timetable" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">
              {isArabic ? "الجدول" : "Timetable"}
            </span>
          </TabsTrigger>
          <TabsTrigger value="exams" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">
              {isArabic ? "الامتحانات" : "Exams"}
            </span>
          </TabsTrigger>
          <TabsTrigger value="materials" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">
              {isArabic ? "المواد" : "Materials"}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="academic">
          <AcademicTab dictionary={dictionary} lang={lang} />
        </TabsContent>

        <TabsContent value="structure">
          <StructureTab dictionary={dictionary} lang={lang} />
        </TabsContent>

        <TabsContent value="people">
          <PeopleTab dictionary={dictionary} lang={lang} />
        </TabsContent>

        <TabsContent value="attendance">
          <AttendanceTab dictionary={dictionary} lang={lang} />
        </TabsContent>

        <TabsContent value="timetable">
          <TimetableTab dictionary={dictionary} lang={lang} />
        </TabsContent>

        <TabsContent value="exams">
          <ExamsTab dictionary={dictionary} lang={lang} />
        </TabsContent>

        <TabsContent value="materials">
          <MaterialsTab dictionary={dictionary} lang={lang} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
