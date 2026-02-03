import { type Metadata } from "next"
import { Bell, Clock, Save, Settings, Shield } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { type Locale } from "@/components/internationalization/config"
import { AttendanceProvider } from "@/components/school-dashboard/attendance/core/attendance-context"

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Attendance Configuration",
    description: "Configure attendance system settings",
  }
}

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Page({ params }: Props) {
  await params // Consume params to satisfy Next.js

  return (
    <AttendanceProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-muted rounded-lg p-3">
              <Settings className="text-muted-foreground h-6 w-6" />
            </div>
            <div>
              <h2>Attendance Configuration</h2>
              <p className="text-muted-foreground text-sm">
                Configure global attendance system settings
              </p>
            </div>
          </div>
          <Button>
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>

        {/* Settings Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* General Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                General Settings
              </CardTitle>
              <CardDescription>Basic attendance configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Default Attendance Method</Label>
                <Select defaultValue="MANUAL">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MANUAL">Manual Entry</SelectItem>
                    <SelectItem value="QR_CODE">QR Code</SelectItem>
                    <SelectItem value="GEOFENCE">Geofence</SelectItem>
                    <SelectItem value="BARCODE">Barcode</SelectItem>
                    <SelectItem value="RFID">RFID</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Late Threshold (minutes)</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    defaultValue={[15]}
                    min={5}
                    max={60}
                    step={5}
                    className="flex-1"
                  />
                  <span className="w-12 font-mono text-sm">15m</span>
                </div>
                <p className="text-muted-foreground text-xs">
                  Students arriving after this time are marked late
                </p>
              </div>

              <div className="space-y-2">
                <Label>Absent Threshold (minutes)</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    defaultValue={[30]}
                    min={15}
                    max={120}
                    step={15}
                    className="flex-1"
                  />
                  <span className="w-12 font-mono text-sm">30m</span>
                </div>
                <p className="text-muted-foreground text-xs">
                  Students arriving after this time are marked absent
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Require Check-Out</Label>
                  <p className="text-muted-foreground text-xs">
                    Students must check out when leaving
                  </p>
                </div>
                <Switch />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto Check-Out</Label>
                  <p className="text-muted-foreground text-xs">
                    Automatically check out at end of day
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          {/* Method Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Method Availability</CardTitle>
              <CardDescription>
                Enable or disable attendance methods
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { method: "Manual Entry", enabled: true },
                { method: "QR Code", enabled: true },
                { method: "Geofence", enabled: true },
                { method: "Barcode", enabled: true },
                { method: "RFID", enabled: false },
                { method: "NFC", enabled: false },
                { method: "Bluetooth", enabled: false },
                { method: "Fingerprint", enabled: false },
                { method: "Face Recognition", enabled: false },
                { method: "Bulk Upload", enabled: true },
              ].map((item) => (
                <div
                  key={item.method}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm font-medium">{item.method}</span>
                  <Switch defaultChecked={item.enabled} />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Anti-fraud and security measures
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Prevent Proxy Attendance</Label>
                  <p className="text-muted-foreground text-xs">
                    Detect and block proxy marking attempts
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>IP Tracking</Label>
                  <p className="text-muted-foreground text-xs">
                    Track IP addresses for QR/online methods
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Device Fingerprinting</Label>
                  <p className="text-muted-foreground text-xs">
                    Identify unique devices for security
                  </p>
                </div>
                <Switch />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Location Verification</Label>
                  <p className="text-muted-foreground text-xs">
                    Require location for certain methods
                  </p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>
                Alert settings for attendance events
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Notify Parents</Label>
                  <p className="text-muted-foreground text-xs">
                    Send attendance updates to parents
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Absence Alerts</Label>
                  <p className="text-muted-foreground text-xs">
                    Alert when student is absent
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Late Arrival Alerts</Label>
                  <p className="text-muted-foreground text-xs">
                    Alert when student arrives late
                  </p>
                </div>
                <Switch />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Low Attendance Warnings</Label>
                  <p className="text-muted-foreground text-xs">
                    Alert when attendance drops below threshold
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="space-y-2">
                <Label>Alert Threshold (%)</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    defaultValue={[80]}
                    min={50}
                    max={95}
                    step={5}
                    className="flex-1"
                  />
                  <span className="w-12 font-mono text-sm">80%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Advanced Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Advanced Settings</CardTitle>
            <CardDescription>
              Fine-tune attendance system behavior
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Data Retention Period</Label>
              <Select defaultValue="365">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                  <SelectItem value="180">180 days</SelectItem>
                  <SelectItem value="365">1 year</SelectItem>
                  <SelectItem value="730">2 years</SelectItem>
                  <SelectItem value="-1">Forever</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Audit Log Level</Label>
              <Select defaultValue="MEDIUM">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">None</SelectItem>
                  <SelectItem value="BASIC">Basic</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="DETAILED">Detailed</SelectItem>
                  <SelectItem value="VERBOSE">Verbose</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Allow Manual Override</Label>
                <p className="text-muted-foreground text-xs">
                  Teachers can override automatic marking
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Allow Past Editing</Label>
                <p className="text-muted-foreground text-xs">
                  Edit attendance for past dates
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>
      </div>
    </AttendanceProvider>
  )
}
