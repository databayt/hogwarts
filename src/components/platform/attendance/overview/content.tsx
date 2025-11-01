"use client";

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Edit,
  MapPin,
  QrCode,
  Barcode,
  CreditCard,
  Fingerprint,
  User,
  Users,
  Smartphone,
  Bluetooth,
  Upload,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Clock,
  TrendingUp
} from 'lucide-react';
import { useAttendanceContext } from '../core/attendance-context';
import { cn } from '@/lib/utils';
import { getMethodDisplayName } from '../shared/utils';
import type { AttendanceMethod } from '../shared/types';
import { useSession } from 'next-auth/react';
import type { UserRole } from '@prisma/client';

// Method icon mapping
const METHOD_ICONS: Record<AttendanceMethod, React.ReactNode> = {
  MANUAL: <Edit className="h-6 w-6" />,
  GEOFENCE: <MapPin className="h-6 w-6" />,
  QR_CODE: <QrCode className="h-6 w-6" />,
  BARCODE: <Barcode className="h-6 w-6" />,
  RFID: <CreditCard className="h-6 w-6" />,
  FINGERPRINT: <Fingerprint className="h-6 w-6" />,
  FACE_RECOGNITION: <User className="h-6 w-6" />,
  NFC: <Smartphone className="h-6 w-6" />,
  BLUETOOTH: <Bluetooth className="h-6 w-6" />,
  BULK_UPLOAD: <Upload className="h-6 w-6" />
};

interface AttendanceOverviewProps {
  dictionary?: any;
  locale?: string;
}

export function AttendanceOverviewContent({ dictionary, locale = 'en' }: AttendanceOverviewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = session?.user?.role as UserRole | undefined;

  const {
    currentMethod,
    methods,
    stats,
    permissions,
    setCurrentMethod
  } = useAttendanceContext();

  // Dictionary shorthand
  const d = dictionary?.school?.attendance;

  const handleMethodSelect = (method: AttendanceMethod) => {
    setCurrentMethod(method);

    // Navigate to method-specific page with correct path mapping
    const methodPathMap: Record<AttendanceMethod, string> = {
      MANUAL: 'manual',
      GEOFENCE: 'geo', // Maps to existing 'geo' page
      QR_CODE: 'qr-code',
      BARCODE: 'barcode',
      RFID: 'rfid',
      FINGERPRINT: 'biometric',
      FACE_RECOGNITION: 'biometric',
      NFC: 'nfc',
      BLUETOOTH: 'bluetooth',
      BULK_UPLOAD: 'bulk-upload'
    };

    const methodPath = methodPathMap[method];
    router.push(`/${locale}/attendance/${methodPath}`);
  };

  const isMethodAvailable = (method: AttendanceMethod) => {
    const methodConfig = methods.find(m => m.method === method);
    if (!methodConfig) return false;

    // Check if method is enabled and user has permission
    const permissionMap: Record<AttendanceMethod, keyof typeof permissions> = {
      MANUAL: 'canMarkManual',
      GEOFENCE: 'canUseGeofence',
      QR_CODE: 'canScanQR',
      BARCODE: 'canScanBarcode',
      RFID: 'canUseRFID',
      FINGERPRINT: 'canUseBiometric',
      FACE_RECOGNITION: 'canUseBiometric',
      NFC: 'canUseNFC',
      BLUETOOTH: 'canUseBluetooth',
      BULK_UPLOAD: 'canBulkUpload'
    };

    const hasPermission = permissions[permissionMap[method]];
    return methodConfig.enabled && hasPermission;
  };

  // Role-based quick actions
  const getQuickActions = () => {
    switch (userRole) {
      case 'ADMIN':
        return [
          { label: d?.quickActions?.bulkImport || 'Bulk Import', icon: Upload, action: () => handleMethodSelect('BULK_UPLOAD'), color: 'blue' },
          { label: d?.quickActions?.settings || 'Settings', icon: Edit, action: () => router.push(`/${locale}/attendance/settings`), color: 'gray' },
        ];
      case 'TEACHER':
        return [
          { label: d?.quickActions?.markAttendance || 'Mark Attendance', icon: Edit, action: () => handleMethodSelect('MANUAL'), color: 'green' },
          { label: d?.quickActions?.viewReports || 'View Reports', icon: Users, action: () => router.push(`/${locale}/attendance/reports`), color: 'purple' },
        ];
      case 'STUDENT':
        return [
          { label: d?.quickActions?.selfCheckIn || 'Self Check-in', icon: QrCode, action: () => handleMethodSelect('QR_CODE'), color: 'blue' },
          { label: d?.quickActions?.myAttendance || 'My Attendance', icon: User, action: () => router.push(`/${locale}/attendance/my-attendance`), color: 'green' },
        ];
      default:
        return [];
    }
  };

  const quickActions = getQuickActions();

  return (
    <div className="space-y-6">
      {/* Role-based Welcome Message */}
      {userRole && (
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg">
              {userRole === 'ADMIN' && (d?.dashboards?.admin?.title || 'Attendance Management Dashboard')}
              {userRole === 'TEACHER' && (d?.dashboards?.teacher?.title || 'Class Attendance Tracker')}
              {userRole === 'STUDENT' && (d?.dashboards?.student?.title || 'Your Attendance Portal')}
              {userRole === 'GUARDIAN' && (d?.dashboards?.guardian?.title || "Your Child's Attendance")}
            </CardTitle>
            <CardDescription>
              {userRole === 'ADMIN' && (d?.dashboards?.admin?.description || 'Manage school-wide attendance with advanced tracking methods')}
              {userRole === 'TEACHER' && (d?.dashboards?.teacher?.description || 'Mark and monitor attendance for your classes')}
              {userRole === 'STUDENT' && (d?.dashboards?.student?.description || 'Check in and view your attendance records')}
              {userRole === 'GUARDIAN' && (d?.dashboards?.guardian?.description || 'Monitor and track attendance records')}
            </CardDescription>
          </CardHeader>
          {quickActions.length > 0 && (
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={action.action}
                    className="gap-2"
                  >
                    <action.icon className="h-4 w-4" />
                    {action.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Quick Stats */}
      {stats && (userRole === 'ADMIN' || userRole === 'TEACHER') && (
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{d?.stats?.totalStudents || 'Total Students'}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                {d?.stats?.enrolledStudents || 'Enrolled students'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{d?.stats?.present || 'Present'}</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.present}</div>
              <p className="text-xs text-muted-foreground">
                {stats.total > 0 ? `${((stats.present / stats.total) * 100).toFixed(0)}%` : '0%'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{d?.stats?.absent || 'Absent'}</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
              <p className="text-xs text-muted-foreground">
                {stats.total > 0 ? `${((stats.absent / stats.total) * 100).toFixed(0)}%` : '0%'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{d?.stats?.late || 'Late'}</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.late}</div>
              <p className="text-xs text-muted-foreground">
                {stats.total > 0 ? `${((stats.late / stats.total) * 100).toFixed(0)}%` : '0%'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{d?.stats?.attendanceRate || 'Attendance Rate'}</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.attendanceRate.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {d?.stats?.overallRate || 'Overall rate'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Student Personal Stats */}
      {userRole === 'STUDENT' && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{d?.stats?.myAttendance || 'My Attendance'}</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">95%</div>
              <p className="text-xs text-muted-foreground">{d?.stats?.thisMonth || 'This month'}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{d?.stats?.presentDays || 'Present Days'}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">18</div>
              <p className="text-xs text-muted-foreground">{d?.stats?.outOfDays?.replace('{total}', '20') || 'Out of 20 days'}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{d?.stats?.lateArrivals || 'Late Arrivals'}</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">2</div>
              <p className="text-xs text-muted-foreground">{d?.stats?.thisMonth || 'This month'}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{d?.stats?.nextClass || 'Next Class'}</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">Mathematics</div>
              <p className="text-xs text-muted-foreground">{d?.stats?.inMinutes?.replace('{minutes}', '30') || 'In 30 minutes'}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Attendance Methods - Show for Admin and Teachers */}
      {(userRole === 'ADMIN' || userRole === 'TEACHER') && (
        <div className="space-y-4">
          {/* Currently Active Method */}
          <Card className="border-primary">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle>{d?.methods?.currentMethod || 'Current Method'}</CardTitle>
                  <Badge variant="default">{d?.methods?.active || 'Active'}</Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleMethodSelect(currentMethod)}
                >
                  {d?.methods?.continue || 'Continue'}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-lg">
                  {METHOD_ICONS[currentMethod]}
                </div>
                <div>
                  <p className="font-semibold">{getMethodDisplayName(currentMethod)}</p>
                  <p className="text-sm text-muted-foreground">
                    {methods.find(m => m.method === currentMethod)?.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Method Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {methods
              .filter(method => {
                // For teachers, show only relevant methods
                if (userRole === 'TEACHER') {
                  return ['MANUAL', 'QR_CODE', 'BARCODE', 'BULK_UPLOAD'].includes(method.method);
                }
                return true;
              })
              .map((method) => {
                const isAvailable = isMethodAvailable(method.method);
                const isCurrent = method.method === currentMethod;

                return (
                  <motion.div
                    key={method.method}
                    whileHover={{ scale: isAvailable ? 1.02 : 1 }}
                    whileTap={{ scale: isAvailable ? 0.98 : 1 }}
                  >
                    <Card
                      className={cn(
                        "cursor-pointer transition-all",
                        isAvailable ? "hover:shadow-lg" : "opacity-50 cursor-not-allowed",
                        isCurrent && "ring-2 ring-primary"
                      )}
                      onClick={() => isAvailable && !isCurrent && handleMethodSelect(method.method)}
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div
                            className={cn(
                              "p-2 rounded-lg",
                              isAvailable ? `bg-${method.color}-100` : "bg-gray-100"
                            )}
                          >
                            {METHOD_ICONS[method.method]}
                          </div>
                          {!isAvailable && (
                            <Badge variant="secondary">{d?.methods?.unavailable || 'Unavailable'}</Badge>
                          )}
                          {isCurrent && (
                            <Badge variant="default">{d?.methods?.current || 'Current'}</Badge>
                          )}
                        </div>
                        <CardTitle className="mt-4">{method.name}</CardTitle>
                        <CardDescription>{method.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          {method.requiresHardware && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <AlertCircle className="h-3 w-3" />
                              <span>{d?.methods?.requiresHardware || 'Requires hardware'}</span>
                            </div>
                          )}
                          {method.supportedDevices.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {method.supportedDevices.map(device => (
                                <Badge key={device} variant="outline" className="text-xs">
                                  {device.replace('_', ' ')}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
          </div>
        </div>
      )}

      {/* Student Check-in Options */}
      {userRole === 'STUDENT' && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card
            className="cursor-pointer hover:shadow-lg transition-all"
            onClick={() => handleMethodSelect('QR_CODE')}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <QrCode className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <CardTitle>{d?.studentCheckIn?.qrCode?.title || 'QR Code Check-in'}</CardTitle>
                  <CardDescription>{d?.studentCheckIn?.qrCode?.description || 'Scan the classroom QR code to mark attendance'}</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-all"
            onClick={() => handleMethodSelect('GEOFENCE')}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <MapPin className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <CardTitle>{d?.studentCheckIn?.location?.title || 'Location Check-in'}</CardTitle>
                  <CardDescription>{d?.studentCheckIn?.location?.description || 'Automatic attendance when you enter campus'}</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>
      )}
    </div>
  );
}

