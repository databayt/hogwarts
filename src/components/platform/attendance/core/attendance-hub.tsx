"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import {
  Edit,
  MapPin,
  QrCode,
  Barcode,
  CreditCard,
  Fingerprint,
  User,
  Smartphone,
  Bluetooth,
  Upload,
  ChevronRight,
  Settings,
  BarChart3,
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock,
  Users,
  TrendingUp
} from 'lucide-react';
import { useAttendanceContext } from './attendance-context';
import { cn } from '@/lib/utils';
import { getMethodIcon, getMethodDisplayName, formatAttendanceDate } from '../shared/utils';
import type { Dictionary } from '@/components/internationalization/dictionaries';
import type { AttendanceMethod } from '../shared/types';

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

interface AttendanceHubProps {
  dictionary?: any;
  locale?: string;
}

export function AttendanceHub({ dictionary, locale = 'en' }: AttendanceHubProps) {
  const router = useRouter();
  const {
    currentMethod,
    methods,
    stats,
    selectedClass,
    selectedDate,
    permissions,
    checkMethodSupport,
    setCurrentMethod
  } = useAttendanceContext();

  const [activeTab, setActiveTab] = useState<'methods' | 'stats' | 'recent'>('methods');

  const handleMethodSelect = (method: AttendanceMethod) => {
    setCurrentMethod(method);

    // Navigate to method-specific page
    const methodPath = method.toLowerCase().replace('_', '-');
    router.push(`/${locale}/s/subdomain/(platform)/attendance/${methodPath}`);
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

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Present</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.present}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Absent</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Late</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.late}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.attendanceRate.toFixed(1)}%
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Method Selection */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="methods">Tracking Methods</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
          <TabsTrigger value="recent">Recent Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="methods" className="space-y-4 mt-4">
          {/* Currently Active Method */}
          <Card className="border-primary">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle>Current Method</CardTitle>
                  <Badge variant="default">Active</Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleMethodSelect(currentMethod)}
                >
                  Continue
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
            {methods.map((method) => {
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
                          <Badge variant="secondary">Unavailable</Badge>
                        )}
                        {isCurrent && (
                          <Badge variant="default">Current</Badge>
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
                            <span>Requires hardware</span>
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
        </TabsContent>

        <TabsContent value="stats" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Method Usage Statistics</CardTitle>
              <CardDescription>
                Performance and usage metrics for each attendance method
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {methods.filter(m => m.enabled).map(method => (
                  <div key={method.method} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-secondary rounded">
                        {METHOD_ICONS[method.method]}
                      </div>
                      <div>
                        <p className="font-medium">{method.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Last used: {selectedDate ? formatAttendanceDate(selectedDate) : 'Never'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">0 uses</p>
                      <p className="text-sm text-muted-foreground">0% of total</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest attendance records across all methods
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No recent attendance records</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => handleMethodSelect('MANUAL')}
                >
                  Start Marking Attendance
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}