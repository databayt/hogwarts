"use client";

import * as React from 'react';
import { useState, useMemo } from 'react';
import { format, startOfWeek, endOfWeek, isToday, isTomorrow, isPast } from 'date-fns';
import {
  Users, Calendar, TrendingUp, Award, Clock, CircleAlert, ChevronRight,
  BookOpen, FileText, DollarSign, Bell, BarChart3, User, School
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LineChart, Line, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Area, AreaChart
} from 'recharts';

interface Child {
  id: string;
  givenName: string;
  surname: string;
  yearLevel: string;
  class: string;
  profileImageUrl?: string;
  attendance: {
    present: number;
    absent: number;
    late: number;
    percentage: number;
  };
  grades: {
    average: number;
    trend: 'up' | 'down' | 'stable';
    subjects: Array<{
      name: string;
      grade: number;
      previousGrade: number;
    }>;
  };
  assignments: {
    pending: number;
    submitted: number;
    overdue: number;
    upcoming: Array<{
      id: string;
      title: string;
      subject: string;
      dueDate: Date;
    }>;
  };
  exams: {
    upcoming: Array<{
      id: string;
      title: string;
      subject: string;
      date: Date;
      time: string;
    }>;
    recent: Array<{
      id: string;
      title: string;
      subject: string;
      score: number;
      total: number;
    }>;
  };
  fees: {
    paid: number;
    pending: number;
    nextDue: Date | null;
  };
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  date: Date;
  priority: 'low' | 'medium' | 'high';
  category: string;
}

interface ParentDashboardProps {
  parentId: string;
  children: Child[];
  announcements: Announcement[];
  onChildSelect?: (childId: string) => void;
  onViewDetails?: (type: string, childId: string) => void;
}

export function ParentDashboard({
  parentId,
  children,
  announcements,
  onChildSelect,
  onViewDetails,
}: ParentDashboardProps) {
  const [selectedChildId, setSelectedChildId] = useState<string>(children[0]?.id || '');
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'term'>('month');

  const selectedChild = useMemo(() => {
    return children.find(c => c.id === selectedChildId) || children[0];
  }, [selectedChildId, children]);

  // Performance data for charts
  const performanceData = useMemo(() => {
    if (!selectedChild) return [];

    return selectedChild.grades.subjects.map(subject => ({
      subject: subject.name,
      current: subject.grade,
      previous: subject.previousGrade,
      improvement: subject.grade - subject.previousGrade,
    }));
  }, [selectedChild]);

  // Attendance chart data
  const attendanceData = useMemo(() => {
    if (!selectedChild) return [];

    return [
      { name: 'Present', value: selectedChild.attendance.present, fill: '#10b981' },
      { name: 'Absent', value: selectedChild.attendance.absent, fill: '#ef4444' },
      { name: 'Late', value: selectedChild.attendance.late, fill: '#f59e0b' },
    ];
  }, [selectedChild]);

  // Grade trend data
  const gradeTrendData = useMemo(() => {
    // Mock data for demonstration - would come from API
    return [
      { month: 'Sep', average: 78 },
      { month: 'Oct', average: 82 },
      { month: 'Nov', average: 85 },
      { month: 'Dec', average: 83 },
      { month: 'Jan', average: 87 },
      { month: 'Feb', average: selectedChild?.grades.average || 0 },
    ];
  }, [selectedChild]);

  const handleChildChange = (childId: string) => {
    setSelectedChildId(childId);
    onChildSelect?.(childId);
  };

  const getGradeColor = (grade: number) => {
    if (grade >= 90) return 'text-green-600';
    if (grade >= 80) return 'text-blue-600';
    if (grade >= 70) return 'text-yellow-600';
    if (grade >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!selectedChild) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">No children data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Child Selector */}
      {children.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Child</CardTitle>
            <CardDescription>View dashboard for a specific child</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="w-full">
              <div className="flex gap-4">
                {children.map(child => (
                  <button
                    key={child.id}
                    onClick={() => handleChildChange(child.id)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors min-w-[120px]",
                      selectedChildId === child.id
                        ? "border-primary bg-primary/5"
                        : "border-transparent hover:border-muted-foreground/20"
                    )}
                  >
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={child.profileImageUrl} />
                      <AvatarFallback>
                        {child.givenName[0]}{child.surname[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-center">
                      <p className="font-medium">{child.givenName}</p>
                      <p className="text-sm text-muted-foreground">{child.yearLevel}</p>
                    </div>
                  </button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Overall Grade</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className={cn("text-3xl font-bold", getGradeColor(selectedChild.grades.average))}>
                {selectedChild.grades.average}%
              </span>
              {selectedChild.grades.trend === 'up' && (
                <Badge variant="outline" className="text-green-600">
                  <TrendingUp className="h-3 w-3 me-1" />
                  Improving
                </Badge>
              )}
              {selectedChild.grades.trend === 'down' && (
                <Badge variant="outline" className="text-red-600">
                  <TrendingUp className="h-3 w-3 mr-1 rotate-180" />
                  Declining
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Attendance Rate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <span className="text-3xl font-bold">
                {selectedChild.attendance.percentage}%
              </span>
              <Progress value={selectedChild.attendance.percentage} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Assignments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <span className="text-3xl font-bold">{selectedChild.assignments.pending}</span>
              {selectedChild.assignments.overdue > 0 && (
                <Badge variant="destructive">
                  {selectedChild.assignments.overdue} overdue
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Fee Balance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <span className="text-3xl font-bold">
                ${selectedChild.fees.pending}
              </span>
              {selectedChild.fees.nextDue && (
                <p className="text-xs text-muted-foreground">
                  Due {format(selectedChild.fees.nextDue, 'MMM dd')}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grade Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Grade Trend</CardTitle>
            <CardDescription>Average grade over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={gradeTrendData}>
                <defs>
                  <linearGradient id="colorGrade" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="average"
                  stroke="#3b82f6"
                  fillOpacity={1}
                  fill="url(#colorGrade)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Subject Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Subject Performance</CardTitle>
            <CardDescription>Current vs Previous grades</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="subject" angle={-45} textAnchor="end" height={70} />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="previous" fill="#94a3b8" name="Previous" />
                <Bar dataKey="current" fill="#3b82f6" name="Current" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tabs */}
      <Tabs defaultValue="assignments" className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="exams">Exams</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
        </TabsList>

        <TabsContent value="assignments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Assignments</CardTitle>
              <CardDescription>
                {selectedChild.assignments.upcoming.length} assignments due this week
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {selectedChild.assignments.upcoming.slice(0, 5).map(assignment => (
                  <div key={assignment.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{assignment.title}</p>
                      <p className="text-sm text-muted-foreground">{assignment.subject}</p>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={isPast(assignment.dueDate) ? "destructive" : "outline"}
                      >
                        {isToday(assignment.dueDate) && "Due Today"}
                        {isTomorrow(assignment.dueDate) && "Due Tomorrow"}
                        {!isToday(assignment.dueDate) && !isTomorrow(assignment.dueDate) &&
                          format(assignment.dueDate, 'MMM dd')}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => onViewDetails?.('assignments', selectedChild.id)}
              >
                View All Assignments
                <ChevronRight className="h-4 w-4 ms-2" />
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="exams" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Upcoming Exams */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Exams</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {selectedChild.exams.upcoming.map(exam => (
                    <div key={exam.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{exam.title}</p>
                        <p className="text-sm text-muted-foreground">{exam.subject}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {format(exam.date, 'MMM dd')}
                        </p>
                        <p className="text-xs text-muted-foreground">{exam.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Results */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {selectedChild.exams.recent.map(exam => (
                    <div key={exam.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{exam.title}</p>
                        <p className="text-sm text-muted-foreground">{exam.subject}</p>
                      </div>
                      <div className="text-right">
                        <p className={cn("font-bold", getGradeColor((exam.score / exam.total) * 100))}>
                          {exam.score}/{exam.total}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {((exam.score / exam.total) * 100).toFixed(0)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Overview</CardTitle>
              <CardDescription>Current term attendance statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {selectedChild.attendance.present}
                  </p>
                  <p className="text-sm text-muted-foreground">Days Present</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">
                    {selectedChild.attendance.absent}
                  </p>
                  <p className="text-sm text-muted-foreground">Days Absent</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-600">
                    {selectedChild.attendance.late}
                  </p>
                  <p className="text-sm text-muted-foreground">Days Late</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Attendance Rate</span>
                  <span className="font-medium">{selectedChild.attendance.percentage}%</span>
                </div>
                <Progress value={selectedChild.attendance.percentage} className="h-3" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="announcements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>School Announcements</CardTitle>
              <CardDescription>Latest updates from the school</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {announcements.map(announcement => (
                  <div key={announcement.id} className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{announcement.title}</h4>
                          <Badge
                            variant="outline"
                            className={getPriorityColor(announcement.priority)}
                          >
                            {announcement.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {announcement.content}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{format(announcement.date, 'MMM dd, yyyy')}</span>
                      <span>{announcement.category}</span>
                    </div>
                    <Separator />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}