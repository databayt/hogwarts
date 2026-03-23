"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useEffect, useState } from "react"
import {
  Barcode,
  CircleAlert,
  CreditCard,
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
import { BarcodeScanner } from "./barcode-scanner"
import { StudentCards } from "./student-cards"

interface BarcodeAttendanceContentProps {
  dictionary?: Dictionary
  locale?: string
  schoolId: string
}

export default function BarcodeAttendanceContent({
  dictionary,
  locale = "en",
  schoolId,
}: BarcodeAttendanceContentProps) {
  const { dictionary: dict } = useDictionary()
  const t = (dict?.school?.attendance as any)?.barcode as
    | Record<string, string>
    | undefined

  const [activeTab, setActiveTab] = useState<"scan" | "cards" | "manage">(
    "scan"
  )
  const {
    selectedClass,
    selectedDate,
    attendance,
    stats,
    fetchAttendance,
    setCurrentMethod,
  } = useAttendanceContext()

  useEffect(() => {
    setCurrentMethod("BARCODE")
  }, [setCurrentMethod])

  useEffect(() => {
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
          <div className="rounded-lg bg-orange-100 p-3">
            <Barcode className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">
              {t?.title || "Barcode Attendance"}
            </h2>
            <p className="text-muted-foreground">
              {t?.description || "Scan student ID cards for quick attendance"}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-orange-600">
          <Barcode className="me-1 h-3 w-3" />
          {t?.modeActive || "Barcode Mode"}
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
          <TabsTrigger value="scan">
            <Scan className="me-2 h-4 w-4" />
            {t?.scan || "Scan"}
          </TabsTrigger>
          <TabsTrigger value="cards">
            <CreditCard className="me-2 h-4 w-4" />
            {t?.studentCards || "Student Cards"}
          </TabsTrigger>
          <TabsTrigger value="manage">
            <Users className="me-2 h-4 w-4" />
            {t?.history || "History"}
          </TabsTrigger>
        </TabsList>

        {/* Scan Tab */}
        <TabsContent value="scan" className="space-y-4">
          {!selectedClass ? (
            <Card>
              <CardHeader>
                <CardTitle>
                  {t?.noClassSelected || "No Class Selected"}
                </CardTitle>
                <CardDescription>
                  {t?.selectClassMessage ||
                    "Please select a class to start scanning"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="py-4 text-center">
                  <CircleAlert className="text-muted-foreground mx-auto mb-3 h-12 w-12" />
                </div>
              </CardContent>
            </Card>
          ) : (
            <BarcodeScanner
              classId={selectedClass}
              onScanSuccess={(data) => {
                toast({
                  title: t?.cardScanned || "Card Scanned",
                  description:
                    t?.studentCheckedIn ||
                    "Student has been checked in successfully",
                })
              }}
              dictionary={dictionary}
              locale={locale}
            />
          )}
        </TabsContent>

        {/* Card Management Tab */}
        <TabsContent value="cards" className="space-y-4">
          <StudentCards
            dictionary={dictionary}
            locale={locale}
            schoolId={schoolId}
          />
        </TabsContent>

        {/* Recent Scans Tab */}
        <TabsContent value="manage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t?.recentScans || "Recent Barcode Scans"}</CardTitle>
              <CardDescription>
                {t?.scansWillAppear ||
                  "Barcode scans will appear here as students check in"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {attendance.filter((r) => r.method === "BARCODE").length === 0 ? (
                <div className="py-8 text-center">
                  <Users className="text-muted-foreground mx-auto mb-3 h-12 w-12" />
                  <p className="text-muted-foreground">
                    {t?.noScansYet || "No barcode scans recorded yet"}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {attendance
                    .filter((record) => record.method === "BARCODE")
                    .map((record) => (
                      <div
                        key={record.id}
                        className="bg-secondary flex items-center justify-between rounded-lg px-3 py-2"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
                            <span className="text-sm font-medium text-orange-600">
                              {record.studentName?.charAt(0) || "S"}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">
                              {record.studentName || "Student"}
                            </p>
                            <p className="text-muted-foreground text-sm">
                              Card: {record.deviceId || "Unknown"}
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

          {/* Scanning Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>{t?.scanningStats || "Scanning Statistics"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-secondary rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-muted-foreground text-sm">
                    {t?.totalScans || "Total Scans"}
                  </p>
                </div>
                <div className="bg-secondary rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-muted-foreground text-sm">
                    {t?.failedScans || "Failed Scans"}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">
                    {t?.successRate || "Success Rate"}
                  </span>
                  <span className="text-sm font-medium">100%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">
                    {t?.avgScanTime || "Avg Scan Time"}
                  </span>
                  <span className="text-sm font-medium">&lt; 1s</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">
                    {t?.cardsInSystem || "Cards in System"}
                  </span>
                  <span className="text-sm font-medium">0</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
