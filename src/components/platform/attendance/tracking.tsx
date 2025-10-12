"use client";

import * as React from 'react';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { format, isToday, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import {
  QrCode, Scan, Users, Clock, Calendar, CheckCircle, XCircle,
  AlertCircle, Timer, TrendingUp, TrendingDown, Wifi, WifiOff,
  Download, Upload, RefreshCw
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Student {
  id: string;
  givenName: string;
  surname: string;
  studentId: string;
  profileImageUrl?: string;
  class: string;
}

interface AttendanceRecord {
  id: string;
  studentId: string;
  date: Date;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  checkInTime?: string;
  checkOutTime?: string;
  note?: string;
  method?: 'MANUAL' | 'QR_CODE' | 'BIOMETRIC' | 'AUTO';
}

interface ClassSession {
  id: string;
  classId: string;
  className: string;
  subject: string;
  startTime: string;
  endTime: string;
  date: Date;
}

interface AttendanceTrackingProps {
  session: ClassSession;
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  onMarkAttendance: (records: Omit<AttendanceRecord, 'id'>[]) => Promise<void>;
  onGenerateQRCode?: (sessionId: string) => Promise<string>;
  onScanQRCode?: (qrData: string, studentId: string) => Promise<void>;
  enableQRCode?: boolean;
  enableBulkUpload?: boolean;
}

const statusConfig = {
  PRESENT: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
  ABSENT: { color: 'bg-red-100 text-red-800', icon: XCircle },
  LATE: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  EXCUSED: { color: 'bg-blue-100 text-blue-800', icon: AlertCircle },
};

export function AttendanceTracking({
  session,
  students,
  attendanceRecords,
  onMarkAttendance,
  onGenerateQRCode,
  onScanQRCode,
  enableQRCode = true,
  enableBulkUpload = true,
}: AttendanceTrackingProps) {
  const [selectedTab, setSelectedTab] = useState<'manual' | 'qrcode' | 'bulk'>('manual');
  const [attendanceData, setAttendanceData] = useState<Map<string, AttendanceRecord>>(new Map());
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);

  // Initialize attendance data
  useEffect(() => {
    const dataMap = new Map<string, AttendanceRecord>();

    // Add existing records
    attendanceRecords.forEach(record => {
      dataMap.set(record.studentId, record);
    });

    // Add default absent for missing students
    students.forEach(student => {
      if (!dataMap.has(student.id)) {
        dataMap.set(student.id, {
          id: '',
          studentId: student.id,
          date: session.date,
          status: 'ABSENT',
          method: 'MANUAL',
        });
      }
    });

    setAttendanceData(dataMap);
  }, [students, attendanceRecords, session.date]);

  // Auto-save functionality
  useEffect(() => {
    if (!autoSaveEnabled) return;

    const timer = setTimeout(() => {
      handleSaveAttendance(true);
    }, 5000); // Auto-save after 5 seconds of inactivity

    return () => clearTimeout(timer);
  }, [attendanceData, autoSaveEnabled]);

  // Calculate statistics
  const stats = useMemo(() => {
    const records = Array.from(attendanceData.values());
    const present = records.filter(r => r.status === 'PRESENT').length;
    const absent = records.filter(r => r.status === 'ABSENT').length;
    const late = records.filter(r => r.status === 'LATE').length;
    const excused = records.filter(r => r.status === 'EXCUSED').length;

    const attendanceRate = students.length > 0
      ? ((present + late) / students.length) * 100
      : 0;

    return {
      total: students.length,
      present,
      absent,
      late,
      excused,
      attendanceRate,
      unmarked: students.length - records.filter(r => r.id).length,
    };
  }, [attendanceData, students]);

  // Filter students based on search
  const filteredStudents = useMemo(() => {
    if (!searchQuery) return students;

    const query = searchQuery.toLowerCase();
    return students.filter(student => {
      const fullName = `${student.givenName} ${student.surname}`.toLowerCase();
      return fullName.includes(query) ||
             student.studentId.toLowerCase().includes(query) ||
             student.class.toLowerCase().includes(query);
    });
  }, [students, searchQuery]);

  const markAttendance = useCallback((studentId: string, status: AttendanceRecord['status'], note?: string) => {
    setAttendanceData(prev => {
      const newData = new Map(prev);
      const existing = newData.get(studentId);

      newData.set(studentId, {
        ...existing!,
        status,
        note,
        checkInTime: status === 'PRESENT' || status === 'LATE' ? format(new Date(), 'HH:mm') : undefined,
        method: 'MANUAL',
      });

      return newData;
    });

    toast.success(`Marked ${status.toLowerCase()}`);
  }, []);

  const markAllStudents = useCallback((status: AttendanceRecord['status']) => {
    setAttendanceData(prev => {
      const newData = new Map(prev);

      students.forEach(student => {
        const existing = newData.get(student.id);
        newData.set(student.id, {
          ...existing!,
          status,
          checkInTime: status === 'PRESENT' ? format(new Date(), 'HH:mm') : undefined,
          method: 'MANUAL',
        });
      });

      return newData;
    });

    toast.success(`Marked all students as ${status.toLowerCase()}`);
  }, [students]);

  const handleGenerateQRCode = async () => {
    if (!onGenerateQRCode) return;

    try {
      const url = await onGenerateQRCode(session.id);
      setQrCodeUrl(url);
      setQrDialogOpen(true);
    } catch (error) {
      toast.error('Failed to generate QR code');
    }
  };

  const handleSaveAttendance = async (isAutoSave = false) => {
    setSaving(true);
    try {
      const records = Array.from(attendanceData.values())
        .filter(r => r.studentId) // Only save valid records
        .map(r => ({
          studentId: r.studentId,
          date: r.date,
          status: r.status,
          checkInTime: r.checkInTime,
          checkOutTime: r.checkOutTime,
          note: r.note,
          method: r.method,
        }));

      await onMarkAttendance(records);

      if (!isAutoSave) {
        toast.success('Attendance saved successfully');
      }
    } catch (error) {
      toast.error('Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const handleBulkUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());

        const studentIdIndex = headers.findIndex(h =>
          h.toLowerCase().includes('student') && h.toLowerCase().includes('id')
        );
        const statusIndex = headers.findIndex(h => h.toLowerCase().includes('status'));

        if (studentIdIndex === -1 || statusIndex === -1) {
          toast.error('CSV must contain Student ID and Status columns');
          return;
        }

        const newData = new Map(attendanceData);
        let updated = 0;

        lines.slice(1).forEach(line => {
          if (!line.trim()) return;

          const values = line.split(',').map(v => v.trim());
          const studentId = values[studentIdIndex];
          const status = values[statusIndex].toUpperCase() as AttendanceRecord['status'];

          const student = students.find(s => s.studentId === studentId);
          if (student && ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'].includes(status)) {
            const existing = newData.get(student.id);
            newData.set(student.id, {
              ...existing!,
              status,
              method: 'MANUAL',
            });
            updated++;
          }
        });

        setAttendanceData(newData);
        toast.success(`Updated attendance for ${updated} students`);
      } catch (error) {
        toast.error('Failed to parse CSV file');
      }
    };
    reader.readAsText(file);
  };

  const exportAttendance = () => {
    const headers = ['Student ID', 'Name', 'Status', 'Check-in Time', 'Note'];
    const rows = students.map(student => {
      const record = attendanceData.get(student.id);
      return [
        student.studentId,
        `${student.givenName} ${student.surname}`,
        record?.status || 'ABSENT',
        record?.checkInTime || '',
        record?.note || '',
      ];
    });

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${session.className}_${format(session.date, 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Session Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{session.className} - {session.subject}</CardTitle>
              <CardDescription>
                {format(session.date, 'EEEE, MMMM dd, yyyy')} • {session.startTime} - {session.endTime}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {isLiveMode ? (
                <Badge variant="default" className="animate-pulse">
                  <Wifi className="h-3 w-3 mr-1" />
                  Live Mode
                </Badge>
              ) : (
                <Badge variant="outline">
                  <WifiOff className="h-3 w-3 mr-1" />
                  Offline
                </Badge>
              )}
              <Switch
                checked={isLiveMode}
                onCheckedChange={setIsLiveMode}
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Students</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Present</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.present}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Absent</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Late</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.late}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Excused</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.excused}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Attendance Rate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.attendanceRate.toFixed(1)}%</div>
            <Progress value={stats.attendanceRate} className="mt-2 h-2" />
          </CardContent>
        </Card>
      </div>

      {/* Attendance Interface */}
      <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as any)}>
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="manual">Manual</TabsTrigger>
          {enableQRCode && <TabsTrigger value="qrcode">QR Code</TabsTrigger>}
          {enableBulkUpload && <TabsTrigger value="bulk">Bulk Upload</TabsTrigger>}
        </TabsList>

        {/* Manual Attendance */}
        <TabsContent value="manual">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Mark Attendance</CardTitle>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Search students..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64"
                  />
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => markAllStudents('PRESENT')}
                    >
                      All Present
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={exportAttendance}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Check-in</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map(student => {
                    const record = attendanceData.get(student.id);
                    const StatusIcon = statusConfig[record?.status || 'ABSENT'].icon;

                    return (
                      <TableRow key={student.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={student.profileImageUrl} />
                              <AvatarFallback>
                                {student.givenName[0]}{student.surname[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">
                                {student.givenName} {student.surname}
                              </p>
                              <p className="text-xs text-muted-foreground">{student.class}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{student.studentId}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={statusConfig[record?.status || 'ABSENT'].color}
                          >
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {record?.status || 'ABSENT'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {record?.checkInTime || '—'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant={record?.status === 'PRESENT' ? 'default' : 'outline'}
                              onClick={() => markAttendance(student.id, 'PRESENT')}
                            >
                              P
                            </Button>
                            <Button
                              size="sm"
                              variant={record?.status === 'ABSENT' ? 'destructive' : 'outline'}
                              onClick={() => markAttendance(student.id, 'ABSENT')}
                            >
                              A
                            </Button>
                            <Button
                              size="sm"
                              variant={record?.status === 'LATE' ? 'secondary' : 'outline'}
                              onClick={() => markAttendance(student.id, 'LATE')}
                            >
                              L
                            </Button>
                            <Button
                              size="sm"
                              variant={record?.status === 'EXCUSED' ? 'secondary' : 'outline'}
                              onClick={() => markAttendance(student.id, 'EXCUSED')}
                            >
                              E
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  checked={autoSaveEnabled}
                  onCheckedChange={setAutoSaveEnabled}
                />
                <Label>Auto-save</Label>
              </div>
              <Button onClick={() => handleSaveAttendance(false)} disabled={saving}>
                {saving ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Save Attendance
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* QR Code */}
        {enableQRCode && (
          <TabsContent value="qrcode">
            <Card>
              <CardHeader>
                <CardTitle>QR Code Attendance</CardTitle>
                <CardDescription>
                  Generate a QR code for students to scan and mark their attendance
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center py-8">
                <QrCode className="h-32 w-32 text-muted-foreground mb-4" />
                <Button onClick={handleGenerateQRCode}>
                  Generate QR Code
                </Button>
                <p className="text-sm text-muted-foreground mt-4 text-center max-w-md">
                  Students can scan the QR code with their mobile devices to automatically
                  mark their attendance for this session.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Bulk Upload */}
        {enableBulkUpload && (
          <TabsContent value="bulk">
            <Card>
              <CardHeader>
                <CardTitle>Bulk Upload</CardTitle>
                <CardDescription>
                  Upload a CSV file with attendance data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleBulkUpload}
                      className="hidden"
                      id="csv-upload"
                    />
                    <Button asChild>
                      <label htmlFor="csv-upload" className="cursor-pointer">
                        Upload CSV File
                      </label>
                    </Button>
                    <p className="text-sm text-muted-foreground mt-4">
                      CSV should contain Student ID and Status columns
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">CSV Format Example:</h4>
                    <div className="bg-muted p-3 rounded font-mono text-xs">
                      Student ID,Status<br />
                      STU001,PRESENT<br />
                      STU002,ABSENT<br />
                      STU003,LATE<br />
                      STU004,EXCUSED
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* QR Code Dialog */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Attendance QR Code</DialogTitle>
            <DialogDescription>
              Display this QR code for students to scan
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center py-8">
            {qrCodeUrl ? (
              <img src={qrCodeUrl} alt="Attendance QR Code" className="w-64 h-64" />
            ) : (
              <div className="w-64 h-64 bg-muted animate-pulse rounded" />
            )}
            <p className="text-sm text-muted-foreground mt-4 text-center">
              Valid for: {session.startTime} - {session.endTime}
            </p>
            <Badge variant="outline" className="mt-2">
              {stats.present} / {stats.total} checked in
            </Badge>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQrDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={() => window.print()}>
              Print QR Code
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}