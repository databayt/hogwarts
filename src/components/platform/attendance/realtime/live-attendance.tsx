"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Wifi,
  WifiOff,
  Users,
  UserCheck,
  UserX,
  Clock,
  Activity,
  Bell,
  RefreshCw,
  Zap,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { useClassAttendance } from '@/lib/websocket/use-socket';
import { cn } from '@/lib/utils';
import { formatTime, getStatusVariant } from '../shared/utils';
import type { AttendanceRecord, AttendanceStatus } from '../shared/types';

interface LiveAttendanceProps {
  classId: string;
  className?: string;
}

export function LiveAttendance({ classId, className }: LiveAttendanceProps) {
  const { attendance, liveCount, isConnected } = useClassAttendance(classId);
  const [recentActivity, setRecentActivity] = useState<AttendanceRecord[]>([]);
  const [showNotification, setShowNotification] = useState(false);

  // Track recent activity (last 5 check-ins)
  useEffect(() => {
    if (attendance.length > 0) {
      const latest = attendance[attendance.length - 1];
      setRecentActivity(prev => [latest, ...prev.slice(0, 4)]);

      // Show notification for new check-ins
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    }
  }, [attendance]);

  // Calculate stats
  const totalStudents = attendance.length;
  const attendanceRate = totalStudents > 0
    ? ((liveCount.present + liveCount.late) / totalStudents) * 100
    : 0;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Connection Status */}
      <Alert className={cn(
        "border-l-4",
        isConnected ? "border-l-green-500 bg-green-50" : "border-l-red-500 bg-red-50"
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isConnected ? (
              <>
                <Wifi className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">Live Updates Active</span>
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-red-800">Disconnected</span>
              </>
            )}
          </div>
          <Badge variant="outline" className="text-xs">
            <Zap className="h-3 w-3 mr-1" />
            Real-time
          </Badge>
        </div>
      </Alert>

      {/* Live Stats Grid */}
      <div className="grid gap-3 md:grid-cols-4">
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2">
            <Activity className="h-4 w-4 text-muted-foreground animate-pulse" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
            <p className="text-xs text-muted-foreground">Students tracked</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2">
            <UserCheck className="h-4 w-4 text-green-500" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">Present</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {liveCount.present}
            </div>
            <Progress value={(liveCount.present / Math.max(totalStudents, 1)) * 100} className="h-1 mt-1" />
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2">
            <Clock className="h-4 w-4 text-yellow-500" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-600">Late</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {liveCount.late}
            </div>
            <Progress value={(liveCount.late / Math.max(totalStudents, 1)) * 100} className="h-1 mt-1" />
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2">
            <UserX className="h-4 w-4 text-red-500" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">Absent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {liveCount.absent}
            </div>
            <Progress value={(liveCount.absent / Math.max(totalStudents, 1)) * 100} className="h-1 mt-1" />
          </CardContent>
        </Card>
      </div>

      {/* Attendance Rate Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Live Attendance Rate</CardTitle>
              <CardDescription>Real-time tracking</CardDescription>
            </div>
            <div className="text-3xl font-bold">
              {attendanceRate.toFixed(1)}%
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={attendanceRate} className="h-3" />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>0%</span>
            <span>{attendanceRate >= 90 ? '🎉 Excellent!' : attendanceRate >= 80 ? 'Good' : 'Needs Improvement'}</span>
            <span>100%</span>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity Feed */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle>Recent Activity</CardTitle>
              {showNotification && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  <Bell className="h-4 w-4 text-primary animate-pulse" />
                </motion.div>
              )}
            </div>
            <Badge variant="secondary">
              <RefreshCw className="h-3 w-3 mr-1" />
              Live Feed
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <AnimatePresence mode="popLayout">
              {recentActivity.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Waiting for attendance updates...</p>
                  <p className="text-xs mt-1">Students will appear here as they check in</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentActivity.map((record, index) => (
                    <motion.div
                      key={`${record.studentId}-${record.markedAt}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "h-10 w-10 rounded-full flex items-center justify-center text-white font-medium",
                          record.status === 'PRESENT' ? "bg-green-500" :
                          record.status === 'LATE' ? "bg-yellow-500" :
                          "bg-red-500"
                        )}>
                          {record.studentName?.charAt(0) || 'S'}
                        </div>
                        <div>
                          <p className="font-medium">{record.studentName || `Student ${record.studentId}`}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{record.checkInTime ? formatTime(record.checkInTime) : 'Just now'}</span>
                            <span>•</span>
                            <span>{record.method.replace('_', ' ')}</span>
                          </div>
                        </div>
                      </div>
                      <Badge variant={getStatusVariant(record.status)}>
                        {record.status}
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Live Indicators */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Check-in Velocity</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{recentActivity.length}</p>
            <p className="text-xs text-muted-foreground">Last 5 minutes</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Active Methods</CardTitle>
              <Activity className="h-4 w-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {new Set(attendance.map(a => a.method)).size}
            </p>
            <p className="text-xs text-muted-foreground">Tracking methods</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}