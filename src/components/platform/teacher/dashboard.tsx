"use client";

import * as React from 'react';
import { useState, useMemo } from 'react';
import { format, isToday, isTomorrow, startOfWeek, endOfWeek, addDays, isPast, isFuture, differenceInMinutes } from 'date-fns';
import {
  Calendar, Clock, Users, BookOpen, FileText, TrendingUp, CircleAlert,
  ChevronRight, BarChart3, CircleCheck, CircleX, Timer, School,
  GraduationCap, Target, Award, Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

interface ClassSession {
  id: string;
  className: string;
  subject: string;
  room: string;
  startTime: string; // "09:00"
  endTime: string; // "10:00"
  studentCount: number;
  status: 'upcoming' | 'current' | 'completed';
}

interface Assignment {
  id: string;
  title: string;
  class: string;
  dueDate: Date;
  submittedCount: number;
  totalCount: number;
  status: 'active' | 'overdue' | 'graded';
}

interface Exam {
  id: string;
  title: string;
  class: string;
  date: Date;
  time: string;
  room: string;
  studentCount: number;
}

interface StudentPerformance {
  className: string;
  average: number;
  trend: 'up' | 'down' | 'stable';
  attendanceRate: number;
  submissionRate: number;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  date: Date;
  priority: 'low' | 'medium' | 'high';
}

interface TeacherDashboardProps {
  teacherId: string;
  teacherName: string;
  todaySchedule: ClassSession[];
  weekSchedule: ClassSession[];
  assignments: Assignment[];
  upcomingExams: Exam[];
  studentPerformance: StudentPerformance[];
  announcements: Announcement[];
  stats: {
    totalStudents: number;
    totalClasses: number;
    averageAttendance: number;
    pendingGrading: number;
  };
}

export function TeacherDashboard({
  teacherId,
  teacherName,
  todaySchedule,
  weekSchedule,
  assignments,
  upcomingExams,
  studentPerformance,
  announcements,
  stats,
}: TeacherDashboardProps) {
  const [selectedView, setSelectedView] = useState<'today' | 'week'>('today');

  // Get current class
  const currentClass = useMemo(() => {
    const now = new Date();
    const currentTime = format(now, 'HH:mm');

    return todaySchedule.find(session => {
      return session.startTime <= currentTime && session.endTime > currentTime;
    });
  }, [todaySchedule]);

  // Get next class
  const nextClass = useMemo(() => {
    const now = new Date();
    const currentTime = format(now, 'HH:mm');

    return todaySchedule.find(session => {
      return session.startTime > currentTime;
    });
  }, [todaySchedule]);

  // Calculate assignment statistics
  const assignmentStats = useMemo(() => {
    const active = assignments.filter(a => a.status === 'active').length;
    const overdue = assignments.filter(a => a.status === 'overdue').length;
    const needsGrading = assignments.filter(a =>
      a.submittedCount > 0 && a.status !== 'graded'
    ).length;

    const totalSubmissions = assignments.reduce((sum, a) => sum + a.submittedCount, 0);
    const totalExpected = assignments.reduce((sum, a) => sum + a.totalCount, 0);
    const submissionRate = totalExpected > 0 ? (totalSubmissions / totalExpected) * 100 : 0;

    return { active, overdue, needsGrading, submissionRate };
  }, [assignments]);

  // Performance chart data
  const performanceChartData = useMemo(() => {
    return studentPerformance.map(p => ({
      class: p.className,
      average: p.average,
      attendance: p.attendanceRate,
      submission: p.submissionRate,
    }));
  }, [studentPerformance]);

  // Today's workload
  const workloadData = useMemo(() => {
    return [
      { name: 'Classes', value: todaySchedule.length, fill: '#3b82f6' },
      { name: 'Assignments Due', value: assignments.filter(a => isToday(a.dueDate)).length, fill: '#10b981' },
      { name: 'To Grade', value: stats.pendingGrading, fill: '#f59e0b' },
    ];
  }, [todaySchedule, assignments, stats]);

  const getTimeUntilNext = (time: string) => {
    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    const nextTime = new Date();
    nextTime.setHours(hours, minutes, 0, 0);

    const diff = differenceInMinutes(nextTime, now);
    if (diff < 60) return `${diff} minutes`;
    return `${Math.floor(diff / 60)}h ${diff % 60}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'current': return 'bg-green-100 text-green-800';
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Welcome back, {teacherName}!</CardTitle>
              <CardDescription>
                {format(new Date(), 'EEEE, MMMM dd, yyyy')}
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              {currentClass ? (
                <Badge variant="default" className="py-2 px-4">
                  <Activity className="h-4 w-4 mr-2 animate-pulse" />
                  In Class: {currentClass.className}
                </Badge>
              ) : nextClass ? (
                <Badge variant="outline" className="py-2 px-4">
                  <Clock className="h-4 w-4 mr-2" />
                  Next class in {getTimeUntilNext(nextClass.startTime)}
                </Badge>
              ) : (
                <Badge variant="secondary" className="py-2 px-4">
                  <CircleCheck className="h-4 w-4 mr-2" />
                  No more classes today
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Students</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold">{stats.totalStudents}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Today's Classes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <School className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold">{todaySchedule.length}</span>
              <Badge variant="outline" className="ml-2">
                {todaySchedule.filter(s => s.status === 'completed').length} done
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Grading</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold text-orange-600">{stats.pendingGrading}</span>
              {stats.pendingGrading > 10 && (
                <Badge variant="destructive" className="ml-2">High</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg Attendance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <span className="text-2xl font-bold">{stats.averageAttendance}%</span>
              <Progress value={stats.averageAttendance} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Schedule and Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Today's Schedule</CardTitle>
              <Button variant="outline" size="sm">
                View Full Timetable
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {todaySchedule.length > 0 ? (
                  todaySchedule.map((session, index) => (
                    <div key={session.id}>
                      <div
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg border",
                          session.status === 'current' && "border-primary bg-primary/5",
                          session.status === 'completed' && "opacity-60"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex flex-col items-center">
                            <Badge variant="outline" className={getStatusColor(session.status)}>
                              {session.startTime}
                            </Badge>
                            <div className="w-px h-4 bg-border my-1" />
                            <span className="text-xs text-muted-foreground">
                              {session.endTime}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{session.className}</p>
                            <p className="text-sm text-muted-foreground">{session.subject}</p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              <span>Room {session.room}</span>
                              <span>{session.studentCount} students</span>
                            </div>
                          </div>
                        </div>
                        {session.status === 'current' && (
                          <Badge variant="default">In Progress</Badge>
                        )}
                        {session.status === 'upcoming' && (
                          <Badge variant="outline">
                            In {getTimeUntilNext(session.startTime)}
                          </Badge>
                        )}
                        {session.status === 'completed' && (
                          <CircleCheck className="h-5 w-5 text-green-600" />
                        )}
                      </div>
                      {index < todaySchedule.length - 1 && (
                        <Separator className="my-2" />
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">No classes scheduled today</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Class Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Class Performance</CardTitle>
            <CardDescription>Average scores and metrics by class</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={performanceChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="class" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="average" fill="#3b82f6" name="Avg Grade" />
                <Bar dataKey="attendance" fill="#10b981" name="Attendance" />
                <Bar dataKey="submission" fill="#f59e0b" name="Submission Rate" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Assignments and Exams */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Assignments */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Assignments</CardTitle>
              <div className="flex gap-2">
                <Badge variant="outline">{assignmentStats.active} active</Badge>
                {assignmentStats.overdue > 0 && (
                  <Badge variant="destructive">{assignmentStats.overdue} overdue</Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {assignments.slice(0, 5).map(assignment => (
                <div key={assignment.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{assignment.title}</p>
                    <p className="text-sm text-muted-foreground">{assignment.class}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <Progress
                        value={(assignment.submittedCount / assignment.totalCount) * 100}
                        className="w-20 h-2"
                      />
                      <span className="text-xs text-muted-foreground">
                        {assignment.submittedCount}/{assignment.totalCount}
                      </span>
                    </div>
                    <Badge
                      variant={assignment.status === 'overdue' ? 'destructive' : 'outline'}
                      className="mt-1"
                    >
                      {isToday(assignment.dueDate) ? 'Due Today' :
                       isTomorrow(assignment.dueDate) ? 'Due Tomorrow' :
                       format(assignment.dueDate, 'MMM dd')}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">
              View All Assignments
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </CardFooter>
        </Card>

        {/* Upcoming Exams */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Exams</CardTitle>
            <CardDescription>Scheduled exams for your classes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingExams.length > 0 ? (
                upcomingExams.slice(0, 5).map(exam => (
                  <div key={exam.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{exam.title}</p>
                      <p className="text-sm text-muted-foreground">{exam.class}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{exam.time}</span>
                        <span>•</span>
                        <span>Room {exam.room}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline">
                        {format(exam.date, 'MMM dd')}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {exam.studentCount} students
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No upcoming exams</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Announcements */}
      <Card>
        <CardHeader>
          <CardTitle>School Announcements</CardTitle>
          <CardDescription>Latest updates and notices</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {announcements.map(announcement => (
              <div key={announcement.id} className="flex items-start gap-3">
                <CircleAlert className={cn(
                  "h-5 w-5 mt-0.5",
                  announcement.priority === 'high' && "text-red-600",
                  announcement.priority === 'medium' && "text-yellow-600",
                  announcement.priority === 'low' && "text-gray-600"
                )} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{announcement.title}</p>
                    <Badge
                      variant="outline"
                      className={cn(
                        announcement.priority === 'high' && "text-red-600",
                        announcement.priority === 'medium' && "text-yellow-600"
                      )}
                    >
                      {announcement.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {announcement.content}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {format(announcement.date, 'MMM dd, yyyy at h:mm a')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}