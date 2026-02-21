import { Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@/auth"

import { getCatalogImageUrl } from "@/lib/catalog-image-url"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import AdminCoursesContent from "@/components/stream/admin/courses/content"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Catalog Subjects - Stream Admin",
    description: "Manage adopted catalog subjects and video content",
  }
}

async function getAdminCatalogSubjects(schoolId: string) {
  // Get adopted subjects
  const selections = await db.schoolSubjectSelection.findMany({
    where: { schoolId, isActive: true },
    include: {
      subject: {
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          imageKey: true,
          thumbnailKey: true,
          color: true,
          department: true,
          status: true,
          totalChapters: true,
          totalLessons: true,
          usageCount: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  // Get enrollment counts and video counts per subject
  const subjectIds = selections
    .map((s) => s.catalogSubjectId)
    .filter(Boolean) as string[]

  const [enrollmentCounts, videoCounts] = await Promise.all([
    subjectIds.length > 0
      ? db.enrollment.groupBy({
          by: ["catalogSubjectId"],
          where: {
            catalogSubjectId: { in: subjectIds },
            isActive: true,
          },
          _count: true,
        })
      : [],
    subjectIds.length > 0
      ? db.lessonVideo.groupBy({
          by: ["catalogLessonId"],
          where: {
            schoolId,
            lesson: {
              chapter: {
                subjectId: { in: subjectIds },
              },
            },
          },
          _count: true,
        })
      : [],
  ])

  const enrollmentMap = new Map(
    enrollmentCounts.map((e) => [e.catalogSubjectId, e._count])
  )

  // Map to CourseRow-compatible shape for the existing content component
  const rows = selections
    .filter((s) => s.subject)
    .map((s) => {
      const subject = s.subject!
      return {
        id: subject.id,
        title: s.customName || subject.name,
        slug: subject.slug,
        description: subject.description,
        imageUrl: getCatalogImageUrl(
          subject.thumbnailKey,
          subject.imageKey,
          "original"
        ),
        price: null as number | null,
        lang: "en",
        isPublished: subject.status === "PUBLISHED",
        level: "",
        status: subject.status,
        userId: "",
        createdAt: subject.createdAt,
        updatedAt: subject.updatedAt,
        category: { id: subject.department, name: subject.department },
        chapters: Array.from({ length: subject.totalChapters }, () => ({
          id: "",
          lessons: Array.from({ length: 1 }, () => ({ id: "" })),
        })),
        _count: {
          chapters: subject.totalChapters,
          enrollments: enrollmentMap.get(subject.id) || 0,
        },
      }
    })

  return { rows, count: rows.length }
}

export default async function StreamAdminCoursesPage({ params }: Props) {
  const { lang, subdomain } = await params
  const dictionary = await getDictionary(lang)
  const { schoolId } = await getTenantContext()
  const session = await auth()

  if (!session?.user) {
    redirect(`/${lang}/s/${subdomain}/auth/login`)
  }

  if (
    session.user.role !== "ADMIN" &&
    session.user.role !== "TEACHER" &&
    session.user.role !== "DEVELOPER"
  ) {
    redirect(`/${lang}/s/${subdomain}/stream/not-admin`)
  }

  if (!schoolId) {
    return (
      <AdminCoursesContent
        dictionary={dictionary.stream}
        lang={lang}
        initialData={[]}
        total={0}
        categories={[]}
      />
    )
  }

  const { rows, count } = await getAdminCatalogSubjects(schoolId)

  // Get unique departments as categories
  const categories = [
    ...new Set(rows.map((r) => r.category?.name).filter(Boolean)),
  ].map((name) => ({ id: name!, name: name! }))

  return (
    <AdminCoursesContent
      dictionary={dictionary.stream}
      lang={lang}
      initialData={rows}
      total={count}
      categories={categories}
    />
  )
}
