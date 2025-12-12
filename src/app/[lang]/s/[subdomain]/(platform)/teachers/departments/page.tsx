import DepartmentsContent from '@/components/platform/teachers/departments/content'
import { getDictionary } from '@/components/internationalization/dictionaries'
import { type Locale } from '@/components/internationalization/config'
import { db } from '@/lib/db'
import { getTenantContext } from '@/components/operator/lib/tenant'

export const metadata = { title: 'Dashboard: Departments' }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Page({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const { schoolId } = await getTenantContext()

  // Fetch departments with teachers and subjects
  const departments = await (db as any).department?.findMany?.({
    where: { schoolId },
    include: {
      teacherDepartments: {
        include: {
          teacher: {
            select: {
              id: true,
              givenName: true,
              surname: true,
              emailAddress: true,
              profilePhotoUrl: true,
            },
          },
        },
      },
      subjects: {
        select: {
          id: true,
          subjectName: true,
          subjectNameAr: true,
        },
      },
    },
    orderBy: { departmentName: 'asc' },
  }) || []

  // Transform the data to match the component's expected format
  const transformedDepartments = departments.map((dept: any) => ({
    id: dept.id,
    departmentName: dept.departmentName,
    departmentNameAr: dept.departmentNameAr,
    teachers: dept.teacherDepartments?.map((td: any) => ({
      id: td.teacher.id,
      givenName: td.teacher.givenName,
      surname: td.teacher.surname,
      emailAddress: td.teacher.emailAddress,
      profilePhotoUrl: td.teacher.profilePhotoUrl,
      isPrimary: td.isPrimary,
    })) || [],
    subjects: dept.subjects || [],
  }))

  return (
    <DepartmentsContent
      departments={transformedDepartments}
      dictionary={dictionary.school}
      lang={lang}
    />
  )
}
