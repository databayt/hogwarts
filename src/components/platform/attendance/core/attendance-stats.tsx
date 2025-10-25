"use client";

import React from 'react';
import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  UserMinus,
  Calendar,
  TrendingUp,
  TrendingDown,
  Activity,
  PieChart,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AttendanceStats, AttendanceRecord, AttendanceMethod } from '../shared/types';
import { getMethodDisplayName, getStatusColor, calculateAttendancePercentage } from '../shared/utils';

interface AttendanceStatsProps {
  stats: AttendanceStats | null;
  records?: AttendanceRecord[];
  showDetails?: boolean;
  className?: string;
  dictionary?: any;
}

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  description?: string;
  color?: string;
  percentage?: number;
  trend?: 'up' | 'down' | 'neutral';
}

function StatCard({ title, value, icon, description, color, percentage, trend }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <div className={cn("p-2 rounded-lg", color || "bg-secondary")}>
            {icon}
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
          {percentage !== undefined && (
            <div className="flex items-center mt-2">
              <Progress value={percentage} className="flex-1" />
              <span className="ml-2 text-sm font-medium">{percentage.toFixed(1)}%</span>
            </div>
          )}
          {trend && (
            <div className="flex items-center mt-2">
              {trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500 mr-1" />}
              {trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500 mr-1" />}
              {trend === 'neutral' && <Activity className="h-4 w-4 text-gray-500 mr-1" />}
              <span className="text-xs text-muted-foreground">
                vs last period
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function AttendanceStats({
  stats,
  records = [],
  showDetails = true,
  className,
  dictionary
}: AttendanceStatsProps) {
  if (!stats) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Attendance Statistics</CardTitle>
          <CardDescription>No data available</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <BarChart3 className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">
              Select a class and date to view attendance statistics
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate method distribution
  const methodDistribution: Record<AttendanceMethod, number> = {} as any;
  records.forEach(record => {
    if (!methodDistribution[record.method]) {
      methodDistribution[record.method] = 0;
    }
    methodDistribution[record.method]++;
  });

  // Calculate time-based stats (if records have check-in times)
  const timeStats = records.reduce(
    (acc, record) => {
      if (record.checkInTime) {
        const hour = new Date(record.checkInTime).getHours();
        if (hour < 9) acc.early++;
        else if (hour < 10) acc.onTime++;
        else acc.late++;
      }
      return acc;
    },
    { early: 0, onTime: 0, late: 0 }
  );

  return (
    <div className={cn("space-y-6", className)}>
      {/* Main Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Students"
          value={stats.total}
          icon={<Users className="h-4 w-4" />}
          description="Enrolled in class"
          color="bg-blue-100"
        />
        <StatCard
          title="Present"
          value={stats.present}
          icon={<UserCheck className="h-4 w-4 text-green-600" />}
          description={`${calculateAttendancePercentage(stats.present, stats.total)}% attendance`}
          color="bg-green-100"
          percentage={calculateAttendancePercentage(stats.present, stats.total)}
        />
        <StatCard
          title="Absent"
          value={stats.absent}
          icon={<UserX className="h-4 w-4 text-red-600" />}
          description={`${calculateAttendancePercentage(stats.absent, stats.total)}% absence`}
          color="bg-red-100"
        />
        <StatCard
          title="Late"
          value={stats.late}
          icon={<Clock className="h-4 w-4 text-yellow-600" />}
          description="Arrived after start time"
          color="bg-yellow-100"
        />
      </div>

      {showDetails && (
        <>
          {/* Secondary Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard
              title="Excused"
              value={stats.excused}
              icon={<UserMinus className="h-4 w-4 text-blue-600" />}
              description="With valid excuse"
              color="bg-blue-100"
            />
            <StatCard
              title="Sick"
              value={stats.sick}
              icon={<Activity className="h-4 w-4 text-orange-600" />}
              description="Health-related absence"
              color="bg-orange-100"
            />
            <StatCard
              title="Holiday"
              value={stats.holiday}
              icon={<Calendar className="h-4 w-4 text-purple-600" />}
              description="On approved leave"
              color="bg-purple-100"
            />
          </div>

          {/* Overall Attendance Rate */}
          <Card>
            <CardHeader>
              <CardTitle>Overall Attendance Rate</CardTitle>
              <CardDescription>
                Combined present and late students
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold">
                    {stats.attendanceRate.toFixed(1)}%
                  </span>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Target: 95%</p>
                    <p className="text-xs text-muted-foreground">
                      {stats.attendanceRate >= 95 ? (
                        <span className="text-green-600">Above target</span>
                      ) : (
                        <span className="text-red-600">
                          {(95 - stats.attendanceRate).toFixed(1)}% below target
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <Progress
                  value={stats.attendanceRate}
                  className="h-3"
                />
              </div>
            </CardContent>
          </Card>

          {/* Method Distribution */}
          {Object.keys(methodDistribution).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Tracking Method Distribution</CardTitle>
                <CardDescription>
                  How attendance was recorded today
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(methodDistribution).map(([method, count]) => {
                    const percentage = (count / stats.total) * 100;
                    return (
                      <div key={method} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span>{getMethodDisplayName(method as AttendanceMethod)}</span>
                          <span className="font-medium">{count} ({percentage.toFixed(0)}%)</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Time Distribution */}
          {(timeStats.early > 0 || timeStats.onTime > 0 || timeStats.late > 0) && (
            <Card>
              <CardHeader>
                <CardTitle>Arrival Time Distribution</CardTitle>
                <CardDescription>
                  When students checked in
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-green-600">{timeStats.early}</div>
                    <p className="text-sm text-muted-foreground">Early (&lt;9 AM)</p>
                  </div>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-blue-600">{timeStats.onTime}</div>
                    <p className="text-sm text-muted-foreground">On Time (9-10 AM)</p>
                  </div>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-yellow-600">{timeStats.late}</div>
                    <p className="text-sm text-muted-foreground">Late (&gt;10 AM)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status Breakdown Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Status Breakdown</CardTitle>
              <CardDescription>
                Visual representation of attendance status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Present */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      Present
                    </span>
                    <span className="font-medium">{stats.present}</span>
                  </div>
                  <Progress
                    value={(stats.present / stats.total) * 100}
                    className="h-2 bg-green-100"
                  />
                </div>

                {/* Absent */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      Absent
                    </span>
                    <span className="font-medium">{stats.absent}</span>
                  </div>
                  <Progress
                    value={(stats.absent / stats.total) * 100}
                    className="h-2 bg-red-100"
                  />
                </div>

                {/* Late */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      Late
                    </span>
                    <span className="font-medium">{stats.late}</span>
                  </div>
                  <Progress
                    value={(stats.late / stats.total) * 100}
                    className="h-2 bg-yellow-100"
                  />
                </div>

                {/* Other statuses if they exist */}
                {stats.excused > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                        Excused
                      </span>
                      <span className="font-medium">{stats.excused}</span>
                    </div>
                    <Progress
                      value={(stats.excused / stats.total) * 100}
                      className="h-2 bg-blue-100"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Last Updated */}
      {stats.lastUpdated && (
        <div className="text-center text-sm text-muted-foreground">
          Last updated: {new Date(stats.lastUpdated).toLocaleString()}
        </div>
      )}
    </div>
  );
}