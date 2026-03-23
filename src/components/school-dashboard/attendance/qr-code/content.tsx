"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useEffect, useState } from "react"
import {
  CircleAlert,
  QrCode,
  RefreshCw,
  Scan,
  Settings,
  Users,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { useAttendanceContext } from "../core/attendance-context"
import { AttendanceStats } from "../core/attendance-stats"
import { QRGenerator } from "./qr-generator"
import { QRScanner } from "./qr-scanner"

interface QRCodeAttendanceContentProps {
  dictionary?: Dictionary
  locale?: string
  schoolId: string
}

export default function QRCodeAttendanceContent({
  dictionary,
  locale = "en",
  schoolId,
}: QRCodeAttendanceContentProps) {
  const { dictionary: dict } = useDictionary()
  const t = (dict?.school?.attendance as any)?.qrCode as
    | Record<string, string>
    | undefined

  const [activeTab, setActiveTab] = useState<"generate" | "scan" | "manage">(
    "generate"
  )
  const [isTeacherMode, setIsTeacherMode] = useState(true) // Should come from auth/role
  const {
    selectedClass,
    selectedDate,
    attendance,
    stats,
    fetchAttendance,
    setCurrentMethod,
  } = useAttendanceContext()

  useEffect(() => {
    // Set the current method to QR_CODE when component mounts
    setCurrentMethod("QR_CODE")
  }, [setCurrentMethod])

  useEffect(() => {
    // Fetch attendance when class or date changes
    if (selectedClass && selectedDate) {
      fetchAttendance({
        schoolId,
        classId: selectedClass,
        dateFrom: selectedDate,
        dateTo: selectedDate,
      })
    }
  }, [selectedClass, selectedDate, schoolId, fetchAttendance])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-purple-100 p-3">
            <QrCode className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">
              {t?.title || "QR Code Attendance"}
            </h2>
            <p className="text-muted-foreground">
              {isTeacherMode
                ? t?.teacherDescription ||
                  "Generate and display QR codes for students to scan"
                : t?.studentDescription ||
                  "Scan the QR code displayed by your teacher"}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-purple-600">
          <QrCode className="me-1 h-3 w-3" />
          {t?.modeActive || "QR Mode Active"}
        </Badge>
      </div>

      {/* Statistics */}
      {stats && (
        <AttendanceStats
          stats={stats}
          records={attendance}
          showDetails={false}
        />
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="generate" disabled={!isTeacherMode}>
            <QrCode className="me-2 h-4 w-4" />
            {t?.generateQr || "Generate QR"}
          </TabsTrigger>
          <TabsTrigger value="scan">
            <Scan className="me-2 h-4 w-4" />
            {t?.scanQr || "Scan QR"}
          </TabsTrigger>
          <TabsTrigger value="manage" disabled={!isTeacherMode}>
            <Users className="me-2 h-4 w-4" />
            {t?.manage || "Manage"}
          </TabsTrigger>
        </TabsList>

        {/* Generate Tab - For Teachers */}
        <TabsContent value="generate" className="space-y-4">
          {!selectedClass ? (
            <Card>
              <CardHeader>
                <CardTitle>
                  {t?.noClassSelected || "No Class Selected"}
                </CardTitle>
                <CardDescription>
                  {t?.selectClassMessage ||
                    "Please select a class to generate QR codes"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="py-4 text-center">
                  <CircleAlert className="text-muted-foreground mx-auto mb-3 h-12 w-12" />
                </div>
              </CardContent>
            </Card>
          ) : (
            <QRGenerator
              classId={selectedClass}
              dictionary={dictionary}
              locale={locale}
            />
          )}
        </TabsContent>

        {/* Scan Tab - For Students/Teachers */}
        <TabsContent value="scan" className="space-y-4">
          <QRScanner
            onScanSuccess={(data) => {
              toast({
                title: t?.qrCodeScanned || "QR Code Scanned",
                description:
                  t?.attendanceMarked ||
                  "Attendance has been marked successfully",
              })
            }}
            dictionary={dictionary}
            locale={locale}
          />
        </TabsContent>

        {/* Manage Tab - For Teachers */}
        <TabsContent value="manage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t?.recentScans || "Recent QR Scans"}</CardTitle>
              <CardDescription>
                {t?.scansWillAppear ||
                  "QR code scans will appear here as students check in"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {attendance.length === 0 ? (
                <div className="py-8 text-center">
                  <Users className="text-muted-foreground mx-auto mb-3 h-12 w-12" />
                  <p className="text-muted-foreground">
                    {t?.noScansYet || "No QR scans recorded yet"}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {attendance
                    .filter((record) => record.method === "QR_CODE")
                    .map((record) => (
                      <div
                        key={record.id}
                        className="bg-secondary flex items-center justify-between rounded-lg px-3 py-2"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                            <span className="text-sm font-medium text-purple-600">
                              {record.studentName?.charAt(0) || "S"}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">
                              {record.studentName || "Student"}
                            </p>
                            <p className="text-muted-foreground text-sm">
                              ID: {record.studentId}
                            </p>
                          </div>
                        </div>
                        <div className="text-end">
                          <Badge
                            variant={
                              record.status === "PRESENT"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {record.status}
                          </Badge>
                          <p className="text-muted-foreground mt-1 text-xs">
                            {record.checkInTime
                              ? new Date(
                                  record.checkInTime
                                ).toLocaleTimeString()
                              : ""}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* QR Settings */}
          <Card>
            <CardHeader>
              <CardTitle>{t?.settings || "QR Code Settings"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {t?.autoRefresh || "Auto-refresh QR codes"}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {t?.autoRefreshDesc ||
                      "Generate new QR codes automatically at set intervals"}
                  </p>
                </div>
                <Button size="sm" variant="outline">
                  <RefreshCw className="me-2 h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {t?.requireLocation || "Require location verification"}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {t?.requireLocationDesc ||
                      "Students must be within school bounds to scan"}
                  </p>
                </div>
                <Button size="sm" variant="outline">
                  <Settings className="me-2 h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {t?.preventScreenshot || "Prevent screenshot sharing"}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {t?.preventScreenshotDesc ||
                      "Add dynamic elements to prevent QR code sharing"}
                  </p>
                </div>
                <Button size="sm" variant="outline">
                  <CircleAlert className="me-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
