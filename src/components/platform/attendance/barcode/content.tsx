"use client";

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Barcode, Scan, CreditCard, Users, Settings, AlertCircle } from 'lucide-react';
import { BarcodeScanner } from './barcode-scanner';
import { StudentCards } from './student-cards';
import { useAttendanceContext } from '../core/attendance-context';
import { AttendanceStats } from '../core/attendance-stats';
import type { Dictionary } from '../shared/types';

interface BarcodeAttendanceContentProps {
  dictionary?: Dictionary;
  locale?: string;
}

export default function BarcodeAttendanceContent({
  dictionary,
  locale = 'en'
}: BarcodeAttendanceContentProps) {
  const [activeTab, setActiveTab] = useState<'scan' | 'cards' | 'manage'>('scan');
  const {
    selectedClass,
    selectedDate,
    attendance,
    stats,
    fetchAttendance,
    setCurrentMethod
  } = useAttendanceContext();

  useEffect(() => {
    setCurrentMethod('BARCODE');
  }, [setCurrentMethod]);

  useEffect(() => {
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
          <div className="p-3 bg-orange-100 rounded-lg">
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
          <Barcode className="h-3 w-3 mr-1" />
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
            <Scan className="h-4 w-4 mr-2" />
            Scan Cards
          </TabsTrigger>
          <TabsTrigger value="cards">
            <CreditCard className="h-4 w-4 mr-2" />
            Card Management
          </TabsTrigger>
          <TabsTrigger value="manage">
            <Users className="h-4 w-4 mr-2" />
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
                  Please select a class from the dropdown above to start scanning
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
            <BarcodeScanner
              classId={selectedClass}
              onScanSuccess={(data) => {
                toast({
                  title: "Card Scanned",
                  description: `Attendance marked for student ${data.studentId}`,
                });
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
              {attendance.filter(r => r.method === 'BARCODE').length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    No barcode scans recorded yet
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Start scanning student ID cards
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {attendance
                    .filter(record => record.method === 'BARCODE')
                    .map(record => (
                      <div
                        key={record.id}
                        className="flex items-center justify-between py-2 px-3 rounded-lg bg-secondary"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-orange-600">
                              {record.studentName?.charAt(0) || 'S'}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{record.studentName || 'Student'}</p>
                            <p className="text-sm text-muted-foreground">
                              Card: {record.deviceId || 'Unknown'}
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
                <div className="text-center p-4 bg-secondary rounded-lg">
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-sm text-muted-foreground">Total Scans</p>
                </div>
                <div className="text-center p-4 bg-secondary rounded-lg">
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-sm text-muted-foreground">Failed Scans</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Success Rate</span>
                  <span className="text-sm font-medium">100%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Avg Scan Time</span>
                  <span className="text-sm font-medium">< 1s</span>
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
  );
}