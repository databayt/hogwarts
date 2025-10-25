"use client";

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { QrCode, Scan, Users, RefreshCw, Settings, AlertCircle } from 'lucide-react';
import { QRGenerator } from './qr-generator';
import { QRScanner } from './qr-scanner';
import { useAttendanceContext } from '../core/attendance-context';
import { AttendanceStats } from '../core/attendance-stats';
import type { Dictionary } from '../shared/types';

interface QRCodeAttendanceContentProps {
  dictionary?: Dictionary;
  locale?: string;
}

export default function QRCodeAttendanceContent({
  dictionary,
  locale = 'en'
}: QRCodeAttendanceContentProps) {
  const [activeTab, setActiveTab] = useState<'generate' | 'scan' | 'manage'>('generate');
  const [isTeacherMode, setIsTeacherMode] = useState(true); // Should come from auth/role
  const {
    selectedClass,
    selectedDate,
    attendance,
    stats,
    fetchAttendance,
    setCurrentMethod
  } = useAttendanceContext();

  useEffect(() => {
    // Set the current method to QR_CODE when component mounts
    setCurrentMethod('QR_CODE');
  }, [setCurrentMethod]);

  useEffect(() => {
    // Fetch attendance when class or date changes
    if (selectedClass && selectedDate) {
      fetchAttendance({
        classId: selectedClass,
        dateFrom: selectedDate,
        dateTo: selectedDate
      });
    }
  }, [selectedClass, selectedDate, fetchAttendance]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-100 rounded-lg">
            <QrCode className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">QR Code Attendance</h2>
            <p className="text-muted-foreground">
              {isTeacherMode
                ? 'Generate QR codes for students to scan'
                : 'Scan QR code to mark your attendance'}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-purple-600">
          <QrCode className="h-3 w-3 mr-1" />
          QR Mode Active
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
            <QrCode className="h-4 w-4 mr-2" />
            Generate QR
          </TabsTrigger>
          <TabsTrigger value="scan">
            <Scan className="h-4 w-4 mr-2" />
            Scan QR
          </TabsTrigger>
          <TabsTrigger value="manage" disabled={!isTeacherMode}>
            <Users className="h-4 w-4 mr-2" />
            Manage
          </TabsTrigger>
        </TabsList>

        {/* Generate Tab - For Teachers */}
        <TabsContent value="generate" className="space-y-4">
          {!selectedClass ? (
            <Card>
              <CardHeader>
                <CardTitle>No Class Selected</CardTitle>
                <CardDescription>
                  Please select a class from the dropdown above to generate QR codes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <AlertCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Select a class to continue
                  </p>
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
                title: "QR Code Scanned",
                description: `Attendance marked successfully`,
              });
            }}
            dictionary={dictionary}
            locale={locale}
          />
        </TabsContent>

        {/* Manage Tab - For Teachers */}
        <TabsContent value="manage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent QR Scans</CardTitle>
              <CardDescription>
                Students who have scanned the QR code today
              </CardDescription>
            </CardHeader>
            <CardContent>
              {attendance.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    No QR scans recorded yet
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Generate a QR code and share it with students
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {attendance
                    .filter(record => record.method === 'QR_CODE')
                    .map(record => (
                      <div
                        key={record.id}
                        className="flex items-center justify-between py-2 px-3 rounded-lg bg-secondary"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-purple-600">
                              {record.studentName?.charAt(0) || 'S'}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{record.studentName || 'Student'}</p>
                            <p className="text-sm text-muted-foreground">
                              ID: {record.studentId}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={record.status === 'PRESENT' ? 'default' : 'secondary'}>
                            {record.status}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString() : ''}
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
              <CardTitle>QR Code Settings</CardTitle>
              <CardDescription>
                Configure QR code generation and validation rules
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Auto-refresh QR codes</p>
                  <p className="text-sm text-muted-foreground">
                    Generate new codes every 60 seconds
                  </p>
                </div>
                <Button size="sm" variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Configure
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Require location verification</p>
                  <p className="text-sm text-muted-foreground">
                    Students must be within campus to scan
                  </p>
                </div>
                <Button size="sm" variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Setup
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Prevent screenshot sharing</p>
                  <p className="text-sm text-muted-foreground">
                    Add security measures to prevent QR sharing
                  </p>
                </div>
                <Button size="sm" variant="outline">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Enable
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}