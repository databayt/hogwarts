"use client"

import React, { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
  Activity,
  Bell,
  CircleAlert,
  Clock,
  RefreshCw,
  TrendingUp,
  UserCheck,
  Users,
  UserX,
  Wifi,
  WifiOff,
  Zap,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useClassAttendance } from "@/lib/websocket/use-socket"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"

import type { AttendanceRecord, AttendanceStatus } from "../shared/types"
import { formatTime, getStatusVariant } from "../shared/utils"

interface LiveAttendanceProps {
  classId: string
  className?: string
}

export function LiveAttendance({ classId, className }: LiveAttendanceProps) {
  const { attendance, liveCount, isConnected } = useClassAttendance(classId)
  const [recentActivity, setRecentActivity] = useState<AttendanceRecord[]>([])
  const [showNotification, setShowNotification] = useState(false)

  // Track recent activity (last 5 check-ins)
  useEffect(() => {
    if (attendance.length > 0) {
      const latest = attendance[attendance.length - 1]
      setRecentActivity((prev) => [latest, ...prev.slice(0, 4)])

      // Show notification for new check-ins
      setShowNotification(true)
      setTimeout(() => setShowNotification(false), 3000)
    }
  }, [attendance])

  // Calculate stats
  const totalStudents = attendance.length
  const attendanceRate =
    totalStudents > 0
      ? ((liveCount.present + liveCount.late) / totalStudents) * 100
      : 0

  return (
    <div className={cn("space-y-4", className)}>
      {/* Connection Status */}
      <Alert
        className={cn(
          "border-s-4",
          isConnected
            ? "border-s-green-500 bg-green-50"
            : "border-s-red-500 bg-red-50"
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isConnected ? (
              <>
                <Wifi className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  Live Updates Active
                </span>
                <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-red-800">
                  Disconnected
                </span>
              </>
            )}
          </div>
          <Badge variant="outline" className="text-xs">
            <Zap className="me-1 h-3 w-3" />
            Real-time
          </Badge>
        </div>
      </Alert>

      {/* Live Stats Grid */}
      <div className="grid gap-3 md:grid-cols-4">
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2">
            <Activity className="text-muted-foreground h-4 w-4 animate-pulse" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
            <p className="text-muted-foreground text-xs">Students tracked</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2">
            <UserCheck className="h-4 w-4 text-green-500" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">
              Present
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {liveCount.present}
            </div>
            <Progress
              value={(liveCount.present / Math.max(totalStudents, 1)) * 100}
              className="mt-1 h-1"
            />
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2">
            <Clock className="h-4 w-4 text-yellow-500" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-600">
              Late
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {liveCount.late}
            </div>
            <Progress
              value={(liveCount.late / Math.max(totalStudents, 1)) * 100}
              className="mt-1 h-1"
            />
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2">
            <UserX className="h-4 w-4 text-red-500" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">
              Absent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {liveCount.absent}
            </div>
            <Progress
              value={(liveCount.absent / Math.max(totalStudents, 1)) * 100}
              className="mt-1 h-1"
            />
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
          <div className="text-muted-foreground mt-2 flex justify-between text-xs">
            <span>0%</span>
            <span>
              {attendanceRate >= 90
                ? "🎉 Excellent!"
                : attendanceRate >= 80
                  ? "Good"
                  : "Needs Improvement"}
            </span>
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
                  <Bell className="text-primary h-4 w-4 animate-pulse" />
                </motion.div>
              )}
            </div>
            <Badge variant="secondary">
              <RefreshCw className="me-1 h-3 w-3" />
              Live Feed
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <AnimatePresence mode="popLayout">
              {recentActivity.length === 0 ? (
                <div className="text-muted-foreground py-8 text-center">
                  <Users className="mx-auto mb-3 h-12 w-12 opacity-50" />
                  <p>Waiting for attendance updates...</p>
                  <p className="mt-1 text-xs">
                    Students will appear here as they check in
                  </p>
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
                      className="bg-secondary/50 hover:bg-secondary flex items-center justify-between rounded-lg p-3 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-full font-medium text-white",
                            record.status === "PRESENT"
                              ? "bg-green-500"
                              : record.status === "LATE"
                                ? "bg-yellow-500"
                                : "bg-red-500"
                          )}
                        >
                          {record.studentName?.charAt(0) || "S"}
                        </div>
                        <div>
                          <p className="font-medium">
                            {record.studentName ||
                              `Student ${record.studentId}`}
                          </p>
                          <div className="text-muted-foreground flex items-center gap-2 text-xs">
                            <span>
                              {record.checkInTime
                                ? formatTime(record.checkInTime)
                                : "Just now"}
                            </span>
                            <span>•</span>
                            <span>{record.method.replace("_", " ")}</span>
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
        <Card className="border-s-4 border-s-blue-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Check-in Velocity</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{recentActivity.length}</p>
            <p className="text-muted-foreground text-xs">Last 5 minutes</p>
          </CardContent>
        </Card>

        <Card className="border-s-4 border-s-purple-500">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Active Methods</CardTitle>
              <Activity className="h-4 w-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {new Set(attendance.map((a) => a.method)).size}
            </p>
            <p className="text-muted-foreground text-xs">Tracking methods</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
