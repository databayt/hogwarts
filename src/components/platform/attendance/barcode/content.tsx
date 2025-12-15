"use client"

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
            <h2 className="text-2xl font-bold">Barcode Attendance</h2>
            <p className="text-muted-foreground">
              Scan student ID cards for quick attendance
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-orange-600">
          <Barcode className="mr-1 h-3 w-3" />
          Barcode Mode
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
            <Scan className="mr-2 h-4 w-4" />
            Scan Cards
          </TabsTrigger>
          <TabsTrigger value="cards">
            <CreditCard className="mr-2 h-4 w-4" />
            Card Management
          </TabsTrigger>
          <TabsTrigger value="manage">
            <Users className="mr-2 h-4 w-4" />
            Recent Scans
          </TabsTrigger>
        </TabsList>

        {/* Scan Tab */}
        <TabsContent value="scan" className="space-y-4">
          {!selectedClass ? (
            <Card>
              <CardHeader>
                <CardTitle>No Class Selected</CardTitle>
                <CardDescription>
                  Please select a class from the dropdown above to start
                  scanning
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="py-4 text-center">
                  <CircleAlert className="text-muted-foreground mx-auto mb-3 h-12 w-12" />
                  <p className="text-muted-foreground text-sm">
                    Select a class to continue
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <BarcodeScanner
              classId={selectedClass}
              onScanSuccess={(data) => {
                toast({
                  title: "Card Scanned",
                  description: `Attendance marked for student ${data.studentId}`,
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
              <CardTitle>Recent Barcode Scans</CardTitle>
              <CardDescription>
                Students who have scanned their cards today
              </CardDescription>
            </CardHeader>
            <CardContent>
              {attendance.filter((r) => r.method === "BARCODE").length === 0 ? (
                <div className="py-8 text-center">
                  <Users className="text-muted-foreground mx-auto mb-3 h-12 w-12" />
                  <p className="text-muted-foreground">
                    No barcode scans recorded yet
                  </p>
                  <p className="text-muted-foreground mt-2 text-sm">
                    Start scanning student ID cards
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
                        <div className="text-right">
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
              <CardTitle>Scanning Statistics</CardTitle>
              <CardDescription>
                Performance metrics for barcode scanning
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-secondary rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-muted-foreground text-sm">Total Scans</p>
                </div>
                <div className="bg-secondary rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-muted-foreground text-sm">Failed Scans</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Success Rate</span>
                  <span className="text-sm font-medium">100%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Avg Scan Time</span>
                  <span className="text-sm font-medium">&lt; 1s</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Cards in System</span>
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
