import { attendanceReportParams } from '@/components/platform/attendance/reports/page-params'
import { SearchParams } from 'nuqs/server'
import { Shell as PageContainer } from '@/components/table/shell'
import Link from 'next/link'
import { AttendanceReportExportButton } from '@/components/platform/attendance/reports/export-button'
import { getDictionary } from '@/components/internationalization/dictionaries'
import { type Locale } from '@/components/internationalization/config'

export const metadata = { title: 'Dashboard: Attendance Reports' }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
  searchParams: Promise<SearchParams>
}

export default async function Page({ params, searchParams }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const sp = await attendanceReportParams.parse(await searchParams)

  return (
    <PageContainer>
      <div className="flex flex-1 flex-col gap-4">
        <div>
          <h1 className="font-semibold">Attendance Reports</h1>
          <p className="muted text-muted-foreground">Filters and CSV export coming soon</p>
          <div className="muted flex items-center gap-3">
            <Link className="underline" href={`/dashboard/attendance/reports?${new URLSearchParams({
              ...(sp.classId ? { classId: sp.classId } : {}),
              ...(sp.studentId ? { studentId: sp.studentId } : {}),
              ...(sp.status ? { status: sp.status } : {}),
              ...(sp.from ? { from: sp.from } : {}),
              ...(sp.to ? { to: sp.to } : {}),
            }).toString()}`}>Apply filters</Link>
            <AttendanceReportExportButton filters={{
              ...(sp.classId ? { classId: sp.classId } : {}),
              ...(sp.studentId ? { studentId: sp.studentId } : {}),
              ...(sp.status ? { status: sp.status } : {}),
              ...(sp.from ? { from: sp.from } : {}),
              ...(sp.to ? { to: sp.to } : {}),
            }} />
          </div>
        </div>
      </div>
    </PageContainer>
  )
}



