"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  Barcode,
  Bluetooth,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  Clock,
  CreditCard,
  Fingerprint,
  MapPin,
  Pencil,
  QrCode,
  Smartphone,
  TrendingUp,
  Upload,
  User,
  Users,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import type { AttendanceMethod } from "../shared/types"
import {
  formatAttendanceDate,
  getMethodDisplayName,
  getMethodIcon,
} from "../shared/utils"
import { useAttendanceContext } from "./attendance-context"

// Method icon mapping
const METHOD_ICONS: Record<AttendanceMethod, React.ReactNode> = {
  MANUAL: <Pencil className="h-6 w-6" />,
  GEOFENCE: <MapPin className="h-6 w-6" />,
  QR_CODE: <QrCode className="h-6 w-6" />,
  BARCODE: <Barcode className="h-6 w-6" />,
  RFID: <CreditCard className="h-6 w-6" />,
  FINGERPRINT: <Fingerprint className="h-6 w-6" />,
  FACE_RECOGNITION: <User className="h-6 w-6" />,
  NFC: <Smartphone className="h-6 w-6" />,
  BLUETOOTH: <Bluetooth className="h-6 w-6" />,
  BULK_UPLOAD: <Upload className="h-6 w-6" />,
}

interface AttendanceHubProps {
  dictionary?: any
  locale?: string
}

export function AttendanceHub({
  dictionary,
  locale = "en",
}: AttendanceHubProps) {
  const router = useRouter()
  const {
    currentMethod,
    methods,
    stats,
    selectedClass,
    selectedDate,
    permissions,
    checkMethodSupport,
    setCurrentMethod,
  } = useAttendanceContext()

  const handleMethodSelect = (method: AttendanceMethod) => {
    setCurrentMethod(method)

    // Navigate to method-specific page
    const methodPath = method.toLowerCase().replace("_", "-")
    router.push(`/${locale}/s/subdomain/(platform)/attendance/${methodPath}`)
  }

  const isMethodAvailable = (method: AttendanceMethod) => {
    const methodConfig = methods.find((m) => m.method === method)
    if (!methodConfig) return false

    // Check if method is enabled and user has permission
    const permissionMap: Record<AttendanceMethod, keyof typeof permissions> = {
      MANUAL: "canMarkManual",
      GEOFENCE: "canUseGeofence",
      QR_CODE: "canScanQR",
      BARCODE: "canScanBarcode",
      RFID: "canUseRFID",
      FINGERPRINT: "canUseBiometric",
      FACE_RECOGNITION: "canUseBiometric",
      NFC: "canUseNFC",
      BLUETOOTH: "canUseBluetooth",
      BULK_UPLOAD: "canBulkUpload",
    }

    const hasPermission = permissions[permissionMap[method]]
    return methodConfig.enabled && hasPermission
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Students
              </CardTitle>
              <Users className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Present</CardTitle>
              <CircleCheck className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.present}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Absent</CardTitle>
              <CircleAlert className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats.absent}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Late</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {stats.late}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Attendance Rate
              </CardTitle>
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
      <div className="space-y-4">
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
                <ChevronRight className="ms-1 h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 rounded-lg p-3">
                {METHOD_ICONS[currentMethod]}
              </div>
              <div>
                <p className="font-semibold">
                  {getMethodDisplayName(currentMethod)}
                </p>
                <p className="text-muted-foreground text-sm">
                  {methods.find((m) => m.method === currentMethod)?.description}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Method Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {methods.map((method) => {
            const isAvailable = isMethodAvailable(method.method)
            const isCurrent = method.method === currentMethod

            return (
              <motion.div
                key={method.method}
                whileHover={{ scale: isAvailable ? 1.02 : 1 }}
                whileTap={{ scale: isAvailable ? 0.98 : 1 }}
              >
                <Card
                  className={cn(
                    "cursor-pointer transition-all",
                    isAvailable
                      ? "hover:shadow-lg"
                      : "cursor-not-allowed opacity-50",
                    isCurrent && "ring-primary ring-2"
                  )}
                  onClick={() =>
                    isAvailable &&
                    !isCurrent &&
                    handleMethodSelect(method.method)
                  }
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div
                        className={cn(
                          "rounded-lg p-2",
                          isAvailable ? `bg-${method.color}-100` : "bg-gray-100"
                        )}
                      >
                        {METHOD_ICONS[method.method]}
                      </div>
                      {!isAvailable && (
                        <Badge variant="secondary">Unavailable</Badge>
                      )}
                      {isCurrent && <Badge variant="default">Current</Badge>}
                    </div>
                    <CardTitle className="mt-4">{method.name}</CardTitle>
                    <CardDescription>{method.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      {method.requiresHardware && (
                        <div className="text-muted-foreground flex items-center gap-1">
                          <CircleAlert className="h-3 w-3" />
                          <span>Requires hardware</span>
                        </div>
                      )}
                      {method.supportedDevices.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {method.supportedDevices.map((device) => (
                            <Badge
                              key={device}
                              variant="outline"
                              className="text-xs"
                            >
                              {device.replace("_", " ")}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
