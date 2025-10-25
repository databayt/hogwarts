"use client";

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-picker';
import { AttendanceExport } from '../core/attendance-export';
import {
  AttendanceTrendsChart,
  MethodUsagePieChart,
  DayWisePatternChart,
  TimeDistributionChart,
  ClassComparisonChart,
  StudentAttendanceHeatmap,
  MonthlyComparisonChart,
  AbsenceReasonsChart
} from './charts';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  Activity,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react';
import { useAttendanceContext } from '../core/attendance-context';
import type { Dictionary } from '@/components/internationalization/dictionaries';

interface AnalyticsContentProps {
  dictionary?: Dictionary;
  locale?: string;
}

export default function AnalyticsContent({ dictionary, locale = 'en' }: AnalyticsContentProps) {
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date()
  });
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);

  const { attendance, fetchAttendance } = useAttendanceContext();

  // Sample data for charts (in production, this would come from the API)
  const trendsData = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    const present = Math.floor(Math.random() * 50) + 400;
    const absent = Math.floor(Math.random() * 30) + 20;
    const late = Math.floor(Math.random() * 20) + 10;
    const total = present + absent + late;
    return {
      date: date.toISOString(),
      present,
      absent,
      late,
      rate: (present + late) / total * 100
    };
  });

  const methodData = [
    { method: 'Manual', count: 450, percentage: 45 },
    { method: 'QR Code', count: 300, percentage: 30 },
    { method: 'Geofence', count: 150, percentage: 15 },
    { method: 'Barcode', count: 80, percentage: 8 },
    { method: 'Other', count: 20, percentage: 2 }
  ];

  const dayWiseData = [
    { day: 'Monday', rate: 92, present: 460, total: 500 },
    { day: 'Tuesday', rate: 94, present: 470, total: 500 },
    { day: 'Wednesday', rate: 93, present: 465, total: 500 },
    { day: 'Thursday', rate: 91, present: 455, total: 500 },
    { day: 'Friday', rate: 88, present: 440, total: 500 }
  ];

  const timeData = [
    { hour: '7:00', checkIns: 50, onTime: 45, late: 5 },
    { hour: '8:00', checkIns: 250, onTime: 230, late: 20 },
    { hour: '9:00', checkIns: 150, onTime: 100, late: 50 },
    { hour: '10:00', checkIns: 30, onTime: 10, late: 20 },
    { hour: '11:00', checkIns: 10, onTime: 2, late: 8 },
    { hour: '12:00', checkIns: 5, onTime: 1, late: 4 }
  ];

  const classData = [
    { class: 'Math 101', rate: 95.2, students: 30 },
    { class: 'Science 201', rate: 93.5, students: 28 },
    { class: 'English 301', rate: 91.8, students: 32 },
    { class: 'History 401', rate: 89.3, students: 25 },
    { class: 'Art 501', rate: 87.6, students: 20 },
    { class: 'PE 601', rate: 85.9, students: 35 }
  ];

  const heatmapData = [
    { student: 'John Doe', monday: 100, tuesday: 100, wednesday: 100, thursday: 100, friday: 100 },
    { student: 'Jane Smith', monday: 100, tuesday: 100, wednesday: 0, thursday: 100, friday: 100 },
    { student: 'Bob Johnson', monday: 100, tuesday: 100, wednesday: 100, thursday: 0, friday: 0 },
    { student: 'Alice Brown', monday: 100, tuesday: 0, wednesday: 100, thursday: 100, friday: 100 },
    { student: 'Charlie Wilson', monday: 0, tuesday: 100, wednesday: 100, thursday: 100, friday: 100 },
    { student: 'Diana Lee', monday: 100, tuesday: 100, wednesday: 100, thursday: 100, friday: 0 },
    { student: 'Eve Garcia', monday: 100, tuesday: 0, wednesday: 0, thursday: 100, friday: 100 },
    { student: 'Frank Martinez', monday: 100, tuesday: 100, wednesday: 100, thursday: 100, friday: 100 },
    { student: 'Grace Taylor', monday: 0, tuesday: 0, wednesday: 100, thursday: 100, friday: 100 },
    { student: 'Henry Davis', monday: 100, tuesday: 100, wednesday: 0, thursday: 0, friday: 100 }
  ];

  const monthlyData = [
    { month: 'Jan', current: 92.5, previous: 89.3 },
    { month: 'Feb', current: 93.2, previous: 90.1 },
    { month: 'Mar', current: 91.8, previous: 88.5 },
    { month: 'Apr', current: 94.1, previous: 91.2 },
    { month: 'May', current: 92.7, previous: 89.8 },
    { month: 'Jun', current: 90.5, previous: 87.3 },
    { month: 'Jul', current: 89.2, previous: 86.1 },
    { month: 'Aug', current: 91.6, previous: 88.9 },
    { month: 'Sep', current: 93.8, previous: 92.1 },
    { month: 'Oct', current: 94.5, previous: 91.7 },
    { month: 'Nov', current: 92.3, previous: 90.5 },
    { month: 'Dec', current: 91.1, previous: 88.8 }
  ];

  const absenceData = [
    { reason: 'Sick', count: 120, color: '#f59e0b' },
    { reason: 'Family Emergency', count: 45, color: '#ef4444' },
    { reason: 'Medical Appointment', count: 38, color: '#3b82f6' },
    { reason: 'Transportation', count: 25, color: '#8b5cf6' },
    { reason: 'Unexcused', count: 82, color: '#64748b' },
    { reason: 'Other', count: 15, color: '#94a3b8' }
  ];

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAttendance({
      dateFrom: dateRange.from.toISOString(),
      dateTo: dateRange.to.toISOString()
    });
    setTimeout(() => setRefreshing(false), 1000);
  };

  // Key metrics calculations
  const totalStudents = 500;
  const avgAttendanceRate = 92.4;
  const perfectAttendanceCount = 127;
  const atRiskCount = 23;
  const avgDailyPresent = 485;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-100 rounded-lg">
            <BarChart3 className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Attendance Analytics</h1>
            <p className="text-muted-foreground">
              Comprehensive insights and trends for attendance tracking
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <AttendanceExport records={attendance} />
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Date Range:</label>
              <DateRangePicker
                from={dateRange.from}
                to={dateRange.to}
                onSelect={(range) => setDateRange({ from: range.from || new Date(), to: range.to || new Date() })}
                placeholder="Select date range"
              />
            </div>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                <SelectItem value="math-101">Math 101</SelectItem>
                <SelectItem value="science-201">Science 201</SelectItem>
                <SelectItem value="english-301">English 301</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedGrade} onValueChange={setSelectedGrade}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select grade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grades</SelectItem>
                <SelectItem value="9">Grade 9</SelectItem>
                <SelectItem value="10">Grade 10</SelectItem>
                <SelectItem value="11">Grade 11</SelectItem>
                <SelectItem value="12">Grade 12</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgAttendanceRate}%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+2.1%</span> from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Perfect Attendance</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{perfectAttendanceCount}</div>
            <p className="text-xs text-muted-foreground">Students this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">At Risk</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{atRiskCount}</div>
            <p className="text-xs text-muted-foreground">Below 80% attendance</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Daily</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgDailyPresent}</div>
            <p className="text-xs text-muted-foreground">Students present</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Enrolled</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
            <p className="text-xs text-muted-foreground">Active students</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
          <TabsTrigger value="methods">Methods</TabsTrigger>
          <TabsTrigger value="classes">Classes</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <AttendanceTrendsChart data={trendsData} />
            <MethodUsagePieChart data={methodData} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <DayWisePatternChart data={dayWiseData} />
            <TimeDistributionChart data={timeData} />
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <AttendanceTrendsChart data={trendsData} />
          <MonthlyComparisonChart data={monthlyData} />
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <DayWisePatternChart data={dayWiseData} />
            <TimeDistributionChart data={timeData} />
          </div>
          <StudentAttendanceHeatmap data={heatmapData} />
        </TabsContent>

        <TabsContent value="methods" className="space-y-4">
          <MethodUsagePieChart data={methodData} />
          <AbsenceReasonsChart data={absenceData} />
        </TabsContent>

        <TabsContent value="classes" className="space-y-4">
          <ClassComparisonChart data={classData} />
        </TabsContent>

        <TabsContent value="students" className="space-y-4">
          <StudentAttendanceHeatmap data={heatmapData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function cn(...classes: (string | undefined | boolean)[]) {
  return classes.filter(Boolean).join(' ');
}