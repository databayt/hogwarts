"use client";

import { useState, useMemo } from "react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, subDays } from "date-fns";
import { Calendar, CheckCircle, XCircle, Clock, AlertCircle, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Attendance {
  id: string;
  date: Date;
  status: string;
  classId: string;
  className: string;
  notes: string | null;
}

interface Student {
  id: string;
  name: string;
  email: string | null;
  classes: Array<{
    id: string;
    name: string;
    teacher: string;
  }>;
  attendances: Attendance[];
}

interface AttendanceViewProps {
  students: Student[];
}

export function AttendanceView({ students }: AttendanceViewProps) {
  const [selectedStudent, setSelectedStudent] = useState(students[0]?.id || '');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'week' | 'month' | '90days'>('week');

  const student = students.find(s => s.id === selectedStudent);

  const filteredAttendances = useMemo(() => {
    if (!student) return [];
    
    let filtered = student.attendances;
    
    // Filter by class
    if (selectedClass !== 'all') {
      filtered = filtered.filter(a => a.classId === selectedClass);
    }
    
    // Filter by date range
    const now = new Date();
    let startDate: Date;
    
    switch (dateRange) {
      case 'week':
        startDate = startOfWeek(now);
        break;
      case 'month':
        startDate = subDays(now, 30);
        break;
      case '90days':
        startDate = subDays(now, 90);
        break;
    }
    
    filtered = filtered.filter(a => new Date(a.date) >= startDate);
    
    return filtered;
  }, [student, selectedClass, dateRange]);

  // Calculate attendance statistics
  const stats = useMemo(() => {
    const total = filteredAttendances.length;
    const present = filteredAttendances.filter(a => a.status === 'present').length;
    const absent = filteredAttendances.filter(a => a.status === 'absent').length;
    const late = filteredAttendances.filter(a => a.status === 'late').length;
    const excused = filteredAttendances.filter(a => a.status === 'excused').length;
    
    const attendanceRate = total > 0 ? (present / total) * 100 : 0;
    
    return { total, present, absent, late, excused, attendanceRate };
  }, [filteredAttendances]);

  // Group attendances by date for calendar view
  const attendanceByDate = useMemo(() => {
    const map = new Map<string, Attendance[]>();
    
    filteredAttendances.forEach(attendance => {
      const dateKey = format(new Date(attendance.date), 'yyyy-MM-dd');
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(attendance);
    });
    
    return map;
  }, [filteredAttendances]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'absent':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'late':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'excused':
        return <AlertCircle className="w-4 h-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return <Badge className="bg-green-100 text-green-800">Present</Badge>;
      case 'absent':
        return <Badge className="bg-red-100 text-red-800">Absent</Badge>;
      case 'late':
        return <Badge className="bg-yellow-100 text-yellow-800">Late</Badge>;
      case 'excused':
        return <Badge className="bg-blue-100 text-blue-800">Excused</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!student) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No students found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Student Selector */}
      {students.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Student</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {students.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {student.classes.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={dateRange} onValueChange={(v) => setDateRange(v as typeof dateRange)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">Last 30 Days</SelectItem>
              <SelectItem value="90days">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            {stats.attendanceRate >= 90 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.attendanceRate.toFixed(1)}%</div>
            <Progress value={stats.attendanceRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {stats.present} of {stats.total} classes attended
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.present}</div>
            <p className="text-xs text-muted-foreground">classes attended</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absent</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.absent}</div>
            <p className="text-xs text-muted-foreground">classes missed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Late</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.late}</div>
            <p className="text-xs text-muted-foreground">late arrivals</p>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Details */}
      <Tabs defaultValue="list" className="w-full">
        <TabsList>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>Attendance History</CardTitle>
              <CardDescription>
                Detailed attendance records for {student.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {filteredAttendances.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No attendance records found.</p>
                ) : (
                  filteredAttendances.map(attendance => (
                    <div key={attendance.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(attendance.status)}
                        <div>
                          <p className="font-medium">{attendance.className}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(attendance.date), 'PPP')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(attendance.status)}
                        {attendance.notes && (
                          <Badge variant="outline" className="text-xs">
                            {attendance.notes}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar">
          <Card>
            <CardHeader>
              <CardTitle>Calendar View</CardTitle>
              <CardDescription>
                Visual attendance overview for {student.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                    {day}
                  </div>
                ))}
                {/* Simple calendar grid - would need more implementation for full calendar */}
                {Array.from({ length: 35 }, (_, i) => {
                  const date = subDays(new Date(), 35 - i);
                  const dateKey = format(date, 'yyyy-MM-dd');
                  const dayAttendances = attendanceByDate.get(dateKey) || [];
                  
                  const hasPresent = dayAttendances.some(a => a.status === 'present');
                  const hasAbsent = dayAttendances.some(a => a.status === 'absent');
                  const hasLate = dayAttendances.some(a => a.status === 'late');
                  
                  return (
                    <div
                      key={i}
                      className={cn(
                        "aspect-square border rounded-lg p-1 text-xs",
                        hasAbsent && "bg-red-50 border-red-200",
                        hasPresent && !hasAbsent && "bg-green-50 border-green-200",
                        hasLate && !hasAbsent && !hasPresent && "bg-yellow-50 border-yellow-200"
                      )}
                    >
                      <div className="font-medium">{format(date, 'd')}</div>
                      {dayAttendances.length > 0 && (
                        <div className="mt-1">
                          {dayAttendances.length} class{dayAttendances.length > 1 ? 'es' : ''}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}