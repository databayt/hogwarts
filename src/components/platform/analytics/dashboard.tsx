"use client";

import * as React from 'react';
import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns';
import {
  TrendingUp, TrendingDown, Users, GraduationCap, DollarSign,
  Calendar, Award, BookOpen, School, Activity, Target, TriangleAlert,
  Download, Filter, ChevronUp, ChevronDown, BarChart3, PieChart as PieChartIcon,
  Star
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, RadarChart, Radar,
  AreaChart, Area, ScatterChart, Scatter, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Cell, ReferenceLine
} from 'recharts';
import { Separator } from '@/components/ui/separator';

interface AnalyticsData {
  enrollment: {
    total: number;
    trend: number; // percentage
    byGrade: { grade: string; count: number }[];
    byGender: { gender: string; count: number }[];
    monthly: { month: string; students: number; teachers: number }[];
  };
  attendance: {
    overall: number;
    byDay: { day: string; rate: number }[];
    byClass: { class: string; rate: number }[];
    trends: { date: string; present: number; absent: number; late: number }[];
  };
  academic: {
    averageGrade: number;
    passingRate: number;
    bySubject: { subject: string; average: number; passing: number }[];
    gradeDistribution: { grade: string; count: number }[];
    topPerformers: { name: string; average: number; trend: 'up' | 'down' | 'stable' }[];
    strugglingStudents: { name: string; average: number; subject: string }[];
  };
  financial: {
    totalRevenue: number;
    totalOutstanding: number;
    collectionRate: number;
    monthlyRevenue: { month: string; collected: number; pending: number }[];
    feeCategories: { category: string; amount: number }[];
  };
  behavioral: {
    disciplinaryActions: number;
    positiveRecognitions: number;
    byType: { type: string; count: number; severity: 'low' | 'medium' | 'high' }[];
    trends: { week: string; incidents: number; recognitions: number }[];
  };
  resources: {
    libraryUsage: number;
    labUtilization: number;
    sportsFacilities: number;
    equipmentStatus: { category: string; available: number; inUse: number; maintenance: number }[];
  };
  teachers: {
    total: number;
    studentTeacherRatio: string;
    byDepartment: { department: string; count: number }[];
    performance: { name: string; rating: number; classAverage: number }[];
    workload: { name: string; classes: number; students: number }[];
  };
}

interface AnalyticsDashboardProps {
  data: AnalyticsData;
  schoolName: string;
  dateRange: { start: Date; end: Date };
  onDateRangeChange?: (range: { start: Date; end: Date }) => void;
  onExportReport?: () => void;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export function AnalyticsDashboard({
  data,
  schoolName,
  dateRange,
  onDateRangeChange,
  onExportReport,
}: AnalyticsDashboardProps) {
  const [selectedView, setSelectedView] = useState<'overview' | 'academic' | 'financial' | 'operational'>('overview');
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  const [comparisonEnabled, setComparisonEnabled] = useState(false);

  // Calculate key metrics
  const keyMetrics = useMemo(() => {
    const enrollmentChange = data.enrollment.trend;
    const attendanceChange =
      data.attendance.byDay[data.attendance.byDay.length - 1]?.rate -
      data.attendance.byDay[0]?.rate;

    const revenueChange =
      data.financial.monthlyRevenue[data.financial.monthlyRevenue.length - 1]?.collected /
      data.financial.monthlyRevenue[0]?.collected - 1;

    return {
      enrollment: {
        value: data.enrollment.total,
        change: enrollmentChange,
        status: enrollmentChange > 0 ? 'positive' : 'negative',
      },
      attendance: {
        value: data.attendance.overall,
        change: attendanceChange,
        status: attendanceChange > 0 ? 'positive' : 'negative',
      },
      academic: {
        value: data.academic.averageGrade,
        change: 2.5, // Mock data
        status: 'positive',
      },
      financial: {
        value: data.financial.collectionRate,
        change: revenueChange * 100,
        status: revenueChange > 0 ? 'positive' : 'negative',
      },
    };
  }, [data]);

  // Insights and recommendations
  const insights = useMemo(() => {
    const insights = [];

    // Attendance insights
    if (data.attendance.overall < 90) {
      insights.push({
        type: 'warning',
        category: 'Attendance',
        message: `Overall attendance at ${data.attendance.overall}% is below target of 90%`,
        action: 'Review attendance policies and engage with parents',
      });
    }

    // Academic insights
    const strugglingSubjects = data.academic.bySubject.filter(s => s.passing < 70);
    if (strugglingSubjects.length > 0) {
      insights.push({
        type: 'alert',
        category: 'Academic',
        message: `${strugglingSubjects.length} subjects have passing rates below 70%`,
        action: 'Consider additional support classes or tutoring',
      });
    }

    // Financial insights
    if (data.financial.totalOutstanding > data.financial.totalRevenue * 0.2) {
      insights.push({
        type: 'warning',
        category: 'Financial',
        message: 'Outstanding fees exceed 20% of total revenue',
        action: 'Implement payment reminder system and payment plans',
      });
    }

    // Behavioral insights
    if (data.behavioral.disciplinaryActions > data.behavioral.positiveRecognitions) {
      insights.push({
        type: 'info',
        category: 'Behavioral',
        message: 'More disciplinary actions than positive recognitions',
        action: 'Focus on positive reinforcement strategies',
      });
    }

    return insights;
  }, [data]);

  const getChangeIcon = (change: number) => {
    if (change > 0) return <ChevronUp className="h-4 w-4" />;
    if (change < 0) return <ChevronDown className="h-4 w-4" />;
    return null;
  };

  const getChangeColor = (change: number, inverse = false) => {
    if (inverse) {
      return change > 0 ? 'text-red-600' : 'text-green-600';
    }
    return change > 0 ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{schoolName} Analytics Dashboard</CardTitle>
              <CardDescription>
                {format(dateRange.start, 'MMM dd, yyyy')} - {format(dateRange.end, 'MMM dd, yyyy')}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={selectedPeriod} onValueChange={(v) => setSelectedPeriod(v as any)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Monthly</SelectItem>
                  <SelectItem value="quarter">Quarterly</SelectItem>
                  <SelectItem value="year">Yearly</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={onExportReport}>
                <Download className="h-4 w-4 me-2" />
                Export Report
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>Total Enrollment</CardDescription>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{keyMetrics.enrollment.value}</span>
              <div className={cn("flex items-center text-sm", getChangeColor(keyMetrics.enrollment.change))}>
                {getChangeIcon(keyMetrics.enrollment.change)}
                <span>{Math.abs(keyMetrics.enrollment.change).toFixed(1)}%</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Students and teachers combined
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>Attendance Rate</CardDescription>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{keyMetrics.attendance.value}%</span>
              <div className={cn("flex items-center text-sm", getChangeColor(keyMetrics.attendance.change))}>
                {getChangeIcon(keyMetrics.attendance.change)}
                <span>{Math.abs(keyMetrics.attendance.change).toFixed(1)}%</span>
              </div>
            </div>
            <Progress value={keyMetrics.attendance.value} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>Average Grade</CardDescription>
              <Award className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{keyMetrics.academic.value}%</span>
              <div className={cn("flex items-center text-sm", getChangeColor(keyMetrics.academic.change))}>
                {getChangeIcon(keyMetrics.academic.change)}
                <span>{Math.abs(keyMetrics.academic.change).toFixed(1)}%</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Passing rate: {data.academic.passingRate}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription>Fee Collection</CardDescription>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{keyMetrics.financial.value}%</span>
              <div className={cn("flex items-center text-sm", getChangeColor(keyMetrics.financial.change))}>
                {getChangeIcon(keyMetrics.financial.change)}
                <span>{Math.abs(keyMetrics.financial.change).toFixed(1)}%</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Outstanding: ${data.financial.totalOutstanding.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={selectedView} onValueChange={(v) => setSelectedView(v as any)}>
        <TabsList className="grid grid-cols-4 w-full max-w-lg">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="academic">Academic</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="operational">Operational</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Enrollment Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Enrollment Trends</CardTitle>
                <CardDescription>Students and teachers over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={data.enrollment.monthly}>
                    <defs>
                      <linearGradient id="students" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="teachers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="students" stroke="#3b82f6" fillOpacity={1} fill="url(#students)" />
                    <Area type="monotone" dataKey="teachers" stroke="#10b981" fillOpacity={1} fill="url(#teachers)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Attendance Patterns */}
            <Card>
              <CardHeader>
                <CardTitle>Weekly Attendance</CardTitle>
                <CardDescription>Attendance rate by day of week</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={data.attendance.byDay}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(value) => `${value}%`} />
                    <Bar dataKey="rate" fill="#3b82f6">
                      {data.attendance.byDay.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.rate >= 90 ? '#10b981' : entry.rate >= 80 ? '#f59e0b' : '#ef4444'} />
                      ))}
                    </Bar>
                    <ReferenceLine y={90} stroke="#10b981" strokeDasharray="3 3" label="Target" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Grade Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Grade Distribution</CardTitle>
                <CardDescription>Student performance breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={data.academic.gradeDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {data.academic.gradeDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Financial Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue & Collections</CardTitle>
                <CardDescription>Monthly financial performance</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <ComposedChart data={data.financial.monthlyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="collected" fill="#10b981" name="Collected" />
                    <Bar dataKey="pending" fill="#ef4444" name="Pending" />
                    <Line type="monotone" dataKey="collected" stroke="#3b82f6" strokeWidth={2} name="Trend" />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Insights and Alerts */}
          <Card>
            <CardHeader>
              <CardTitle>Insights & Recommendations</CardTitle>
              <CardDescription>AI-powered analytics and actionable insights</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {insights.map((insight, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
                    <TriangleAlert className={cn(
                      "h-5 w-5 mt-0.5",
                      insight.type === 'alert' && "text-red-600",
                      insight.type === 'warning' && "text-yellow-600",
                      insight.type === 'info' && "text-blue-600"
                    )} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline">{insight.category}</Badge>
                        <p className="font-medium">{insight.message}</p>
                      </div>
                      <p className="text-sm text-muted-foreground">{insight.action}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Academic Tab */}
        <TabsContent value="academic" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Subject Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Subject Performance</CardTitle>
                <CardDescription>Average scores and passing rates by subject</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={data.academic.bySubject}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <PolarRadiusAxis domain={[0, 100]} />
                    <Radar name="Average Score" dataKey="average" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                    <Radar name="Passing Rate" dataKey="passing" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                    <Legend />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top Performers & Struggling Students */}
            <div className="space-y-6">
              {/* Top Performers */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Performers</CardTitle>
                  <CardDescription>Students with highest averages</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {data.academic.topPerformers.map((student, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                            index === 0 && "bg-yellow-100 text-yellow-700",
                            index === 1 && "bg-gray-100 text-gray-700",
                            index === 2 && "bg-orange-100 text-orange-700",
                            index > 2 && "bg-muted"
                          )}>
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{student.name}</p>
                            <p className="text-sm text-muted-foreground">Average: {student.average}%</p>
                          </div>
                        </div>
                        {student.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-600" />}
                        {student.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-600" />}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Students Needing Support */}
              <Card>
                <CardHeader>
                  <CardTitle>Students Needing Support</CardTitle>
                  <CardDescription>Students below passing threshold</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {data.academic.strugglingStudents.map((student, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{student.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {student.subject} - {student.average}%
                          </p>
                        </div>
                        <Badge variant="destructive">Needs Help</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Financial Tab */}
        <TabsContent value="financial" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Total Revenue</span>
                    <span className="font-bold">${data.financial.totalRevenue.toLocaleString()}</span>
                  </div>
                  <Progress value={100} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Collected</span>
                    <span className="font-medium text-green-600">
                      ${(data.financial.totalRevenue * data.financial.collectionRate / 100).toLocaleString()}
                    </span>
                  </div>
                  <Progress value={data.financial.collectionRate} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Outstanding</span>
                    <span className="font-medium text-red-600">
                      ${data.financial.totalOutstanding.toLocaleString()}
                    </span>
                  </div>
                  <Progress value={(data.financial.totalOutstanding / data.financial.totalRevenue) * 100} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Fee Categories */}
            <Card>
              <CardHeader>
                <CardTitle>Fee Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={data.financial.feeCategories}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="amount"
                    >
                      {data.financial.feeCategories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {data.financial.feeCategories.map((category, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span>{category.category}</span>
                      </div>
                      <span className="font-medium">${category.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Collection Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Collection Efficiency</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600 mb-2">
                    {data.financial.collectionRate}%
                  </div>
                  <p className="text-sm text-muted-foreground">Current collection rate</p>
                  <Separator className="my-4" />
                  <div className="space-y-3 text-left">
                    <div className="flex justify-between text-sm">
                      <span>On-time payments</span>
                      <span className="font-medium">78%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Late payments</span>
                      <span className="font-medium text-yellow-600">15%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Defaulted</span>
                      <span className="font-medium text-red-600">7%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Operational Tab */}
        <TabsContent value="operational" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Teacher Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Teacher Performance</CardTitle>
                <CardDescription>Ratings and class averages</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Teacher</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Class Avg</TableHead>
                      <TableHead>Students</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.teachers.performance.map((teacher, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{teacher.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={cn(
                                  "h-4 w-4",
                                  i < Math.floor(teacher.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                                )}
                              />
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={teacher.classAverage >= 80 ? "default" : "secondary"}>
                            {teacher.classAverage}%
                          </Badge>
                        </TableCell>
                        <TableCell>{data.teachers.workload[index]?.students || 0}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Resource Utilization */}
            <Card>
              <CardHeader>
                <CardTitle>Resource Utilization</CardTitle>
                <CardDescription>Facility and equipment usage</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">Library Usage</span>
                      <span className="text-sm font-medium">{data.resources.libraryUsage}%</span>
                    </div>
                    <Progress value={data.resources.libraryUsage} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">Lab Utilization</span>
                      <span className="text-sm font-medium">{data.resources.labUtilization}%</span>
                    </div>
                    <Progress value={data.resources.labUtilization} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">Sports Facilities</span>
                      <span className="text-sm font-medium">{data.resources.sportsFacilities}%</span>
                    </div>
                    <Progress value={data.resources.sportsFacilities} className="h-2" />
                  </div>
                  <Separator className="my-4" />
                  <div className="space-y-2">
                    {data.resources.equipmentStatus.map((item, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span>{item.category}</span>
                        <div className="flex gap-2">
                          <Badge variant="outline" className="text-green-600">
                            {item.available} available
                          </Badge>
                          <Badge variant="outline" className="text-blue-600">
                            {item.inUse} in use
                          </Badge>
                          {item.maintenance > 0 && (
                            <Badge variant="outline" className="text-yellow-600">
                              {item.maintenance} maintenance
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Behavioral Metrics */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Behavioral Trends</CardTitle>
                <CardDescription>Disciplinary actions vs positive recognitions</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={data.behavioral.trends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="incidents" stroke="#ef4444" name="Incidents" strokeWidth={2} />
                    <Line type="monotone" dataKey="recognitions" stroke="#10b981" name="Recognitions" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}