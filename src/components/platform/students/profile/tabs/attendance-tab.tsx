import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "@/components/ui/calendar";
import { CheckCircle, XCircle, Clock, TrendingUp, TrendingDown } from "lucide-react";
import type { Student } from "../../registration/types";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from "date-fns";

interface AttendanceTabProps {
  student: Student;
}

export function AttendanceTab({ student }: AttendanceTabProps) {
  // Mock attendance data
  const currentMonth = new Date();
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Mock attendance records for current month
  const attendanceRecords = daysInMonth.map(date => {
    const dayOfWeek = getDay(date);
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isToday = format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
    const isFuture = date > new Date();

    let status: "present" | "absent" | "late" | "holiday" | "weekend" | "future" = "future";

    if (isFuture) {
      status = "future";
    } else if (isWeekend) {
      status = "weekend";
    } else if (Math.random() > 0.15) { // 85% attendance rate
      status = Math.random() > 0.9 ? "late" : "present";
    } else {
      status = "absent";
    }

    return {
      date,
      status,
      checkInTime: status === "present" ? "08:00 AM" : status === "late" ? "08:30 AM" : null,
      checkOutTime: status === "present" || status === "late" ? "03:00 PM" : null,
    };
  });

  const stats = {
    present: attendanceRecords.filter(r => r.status === "present").length,
    absent: attendanceRecords.filter(r => r.status === "absent").length,
    late: attendanceRecords.filter(r => r.status === "late").length,
    holidays: attendanceRecords.filter(r => r.status === "holiday").length,
    totalSchoolDays: attendanceRecords.filter(r =>
      r.status !== "weekend" && r.status !== "future" && r.status !== "holiday"
    ).length,
  };

  const attendancePercentage = stats.totalSchoolDays > 0
    ? ((stats.present + stats.late) / stats.totalSchoolDays) * 100
    : 0;

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 90) return "text-green-600";
    if (percentage >= 75) return "text-yellow-600";
    return "text-red-600";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "present": return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "absent": return <XCircle className="h-4 w-4 text-red-600" />;
      case "late": return <Clock className="h-4 w-4 text-yellow-600" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Attendance Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Attendance Rate</p>
              <p className={`text-2xl font-bold ${getAttendanceColor(attendancePercentage)}`}>
                {attendancePercentage.toFixed(1)}%
              </p>
              <Progress value={attendancePercentage} className="h-2 mt-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Present Days</p>
              <p className="text-2xl font-bold text-green-600">{stats.present}</p>
              <p className="text-xs text-muted-foreground">This month</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Absent Days</p>
              <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
              <p className="text-xs text-muted-foreground">This month</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Late Arrivals</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.late}</p>
              <p className="text-xs text-muted-foreground">This month</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">School Days</p>
              <p className="text-2xl font-bold">{stats.totalSchoolDays}</p>
              <p className="text-xs text-muted-foreground">This month</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Calendar View */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Calendar - {format(currentMonth, "MMMM yyyy")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {/* Day headers */}
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}

            {/* Calendar days */}
            {attendanceRecords.map((record, index) => {
              const isFirstDay = index === 0;
              const startOffset = isFirstDay ? getDay(record.date) : 0;

              return (
                <>
                  {isFirstDay && Array.from({ length: startOffset }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  <div
                    key={record.date.toString()}
                    className={`
                      p-2 border rounded-lg text-center relative
                      ${record.status === "weekend" ? "bg-gray-50" : ""}
                      ${record.status === "present" ? "bg-green-50 border-green-200" : ""}
                      ${record.status === "absent" ? "bg-red-50 border-red-200" : ""}
                      ${record.status === "late" ? "bg-yellow-50 border-yellow-200" : ""}
                      ${record.status === "future" ? "bg-gray-50 opacity-50" : ""}
                    `}
                  >
                    <div className="text-sm font-medium">{format(record.date, "d")}</div>
                    <div className="mt-1">
                      {getStatusIcon(record.status)}
                    </div>
                  </div>
                </>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-6 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Present</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <span>Absent</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <span>Late</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 bg-gray-200 rounded" />
              <span>Weekend/Holiday</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-xl font-bold">{attendancePercentage.toFixed(1)}%</p>
              </div>
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Last Month</p>
                <p className="text-xl font-bold">92.5%</p>
              </div>
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Year Average</p>
                <p className="text-xl font-bold">89.2%</p>
              </div>
              <TrendingDown className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Attendance Records */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Attendance Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {attendanceRecords
              .filter(r => r.status !== "future" && r.status !== "weekend")
              .slice(-10)
              .reverse()
              .map((record, index) => (
                <div key={index} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(record.status)}
                    <div>
                      <p className="font-medium">{format(record.date, "EEEE, MMM dd")}</p>
                      {record.checkInTime && (
                        <p className="text-xs text-muted-foreground">
                          In: {record.checkInTime} • Out: {record.checkOutTime}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge variant={
                    record.status === "present" ? "default" :
                    record.status === "absent" ? "destructive" :
                    "secondary"
                  }>
                    {record.status}
                  </Badge>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}