import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatCard } from "../atom/stat-card"
import { ActionCard } from "../atom/action-card"
import { RecentTable } from "../atom/recent-table"
import { getAttendanceStats, getRecentAttendance } from "../actions"
import type { Locale } from "@/components/internationalization/config"
import type { getDictionary } from "@/components/internationalization/dictionaries"

interface AttendanceOverviewProps {
  dictionary?: Awaited<ReturnType<typeof getDictionary>>
  locale: Locale
  subdomain: string
}

export async function AttendanceOverviewContent({
  dictionary,
  locale,
  subdomain,
}: AttendanceOverviewProps) {
  // Fetch data in parallel
  const [statsResult, recentResult] = await Promise.all([
    getAttendanceStats(),
    getRecentAttendance({ limit: 10 }),
  ])

  const d = dictionary?.school?.attendance
  const basePath = `/${locale}/s/${subdomain}/attendance`

  // Calculate percentage strings
  const presentPercent = statsResult.total > 0
    ? `${Math.round((statsResult.present / statsResult.total) * 100)}%`
    : "0%"
  const absentPercent = statsResult.total > 0
    ? `${Math.round((statsResult.absent / statsResult.total) * 100)}%`
    : "0%"
  const latePercent = statsResult.total > 0
    ? `${Math.round((statsResult.late / statsResult.total) * 100)}%`
    : "0%"

  return (
    <div className="flex flex-col gap-6 pb-14">
        {/* Quick Stats - Core-inspired colors */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title={d?.stats?.present || "Present"}
            value={statsResult.present}
            description={presentPercent}
            iconName="CircleCheck"
            iconBgColor="bg-[#BCD1CA]"
          />
          <StatCard
            title={d?.stats?.absent || "Absent"}
            value={statsResult.absent}
            description={absentPercent}
            iconName="CircleAlert"
            iconBgColor="bg-[#D97757]"
          />
          <StatCard
            title={d?.stats?.late || "Late"}
            value={statsResult.late}
            description={latePercent}
            iconName="Clock"
            iconBgColor="bg-[#CBCADB]"
          />
          <StatCard
            title={d?.stats?.attendanceRate || "Attendance Rate"}
            value={`${statsResult.attendanceRate}%`}
            description={d?.stats?.overallRate || "Overall rate"}
            iconName="TrendingUp"
            iconBgColor="bg-[#6A9BCC]"
          />
        </div>

        {/* Quick Actions */}
        <section>
          <h3 className="mb-4 text-lg font-medium">Quick Actions</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ActionCard
              title={"Mark\nAttendance"}
              href={`${basePath}/manual`}
              iconName="Pencil"
              iconBgColor="bg-[#BCD1CA]"
            />
            <ActionCard
              title={"QR Code\nSession"}
              href={`${basePath}/qr-code`}
              iconName="QrCode"
              iconBgColor="bg-[#CBCADB]"
            />
            <ActionCard
              title={"Live\nTracking"}
              href={`${basePath}/realtime`}
              iconName="Activity"
              iconBgColor="bg-[#6A9BCC]"
            />
            <ActionCard
              title={"View\nReport"}
              href={`${basePath}/reports`}
              iconName="FileText"
              iconBgColor="bg-[#D97757]"
            />
          </div>
        </section>

        {/* Recent Attendance */}
        <Card>
          <CardHeader>
            <CardTitle>{d?.recent || "Recent Attendance"}</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentTable
              data={recentResult.records.map(r => ({
                id: r.id,
                studentName: r.studentName,
                className: r.className,
                status: r.status,
                method: r.method,
                checkInTime: r.checkInTime,
                date: r.date,
              }))}
              limit={10}
              dictionary={{
                columns: {
                  student: "Student",
                  class: "Class",
                  status: "Status",
                  time: "Time",
                  method: "Method",
                },
                noRecords: "No recent attendance records",
              }}
            />
          </CardContent>
        </Card>
      </div>
  )
}
