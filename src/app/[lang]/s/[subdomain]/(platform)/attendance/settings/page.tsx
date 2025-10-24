import { AttendanceProvider } from '@/components/platform/attendance/core/attendance-context'
import { getDictionary } from '@/components/internationalization/dictionaries'
import { type Locale } from '@/components/internationalization/config'
import { auth } from '@/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Settings, Shield, Clock, MapPin, QrCode, Users, Bell, Save } from 'lucide-react'

export const metadata = { title: 'Dashboard: Attendance Settings' }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Page({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const session = await auth()

  // Check permissions - only ADMIN can access settings
  if (session?.user?.role !== 'ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
        <p className="text-muted-foreground">
          Only administrators can access attendance settings.
        </p>
      </div>
    )
  }

  return (
    <AttendanceProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gray-100 rounded-lg">
              <Settings className="h-6 w-6 text-gray-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Attendance Settings</h1>
              <p className="text-muted-foreground">
                Configure global attendance system settings
              </p>
            </div>
          </div>
          <Button>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>

        {/* Settings Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* General Settings */}
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Basic attendance configuration
              </CardDescription>
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
                  <span className="w-12 text-sm font-mono">15m</span>
                </div>
                <p className="text-xs text-muted-foreground">
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
                  <span className="w-12 text-sm font-mono">30m</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Students arriving after this time are marked absent
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Require Check-Out</Label>
                  <p className="text-xs text-muted-foreground">
                    Students must check out when leaving
                  </p>
                </div>
                <Switch />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto Check-Out</Label>
                  <p className="text-xs text-muted-foreground">
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
                { method: 'Manual Entry', icon: '✏️', enabled: true },
                { method: 'QR Code', icon: '📱', enabled: true },
                { method: 'Geofence', icon: '📍', enabled: true },
                { method: 'Barcode', icon: '📊', enabled: true },
                { method: 'RFID', icon: '💳', enabled: false },
                { method: 'NFC', icon: '📲', enabled: false },
                { method: 'Bluetooth', icon: '📶', enabled: false },
                { method: 'Fingerprint', icon: '👆', enabled: false },
                { method: 'Face Recognition', icon: '👤', enabled: false },
                { method: 'Bulk Upload', icon: '📁', enabled: true },
              ].map((item) => (
                <div key={item.method} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{item.icon}</span>
                    <span className="text-sm font-medium">{item.method}</span>
                  </div>
                  <Switch defaultChecked={item.enabled} />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle>
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Settings
                </div>
              </CardTitle>
              <CardDescription>
                Anti-fraud and security measures
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Prevent Proxy Attendance</Label>
                  <p className="text-xs text-muted-foreground">
                    Detect and block proxy marking attempts
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>IP Tracking</Label>
                  <p className="text-xs text-muted-foreground">
                    Track IP addresses for QR/online methods
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Device Fingerprinting</Label>
                  <p className="text-xs text-muted-foreground">
                    Identify unique devices for security
                  </p>
                </div>
                <Switch />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Location Verification</Label>
                  <p className="text-xs text-muted-foreground">
                    Require location for certain methods
                  </p>
                </div>
                <Switch />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Two-Factor Attendance</Label>
                  <p className="text-xs text-muted-foreground">
                    Require two methods for high-security
                  </p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle>
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notifications
                </div>
              </CardTitle>
              <CardDescription>
                Alert settings for attendance events
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Notify Parents</Label>
                  <p className="text-xs text-muted-foreground">
                    Send attendance updates to parents
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Absence Alerts</Label>
                  <p className="text-xs text-muted-foreground">
                    Alert when student is absent
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Late Arrival Alerts</Label>
                  <p className="text-xs text-muted-foreground">
                    Alert when student arrives late
                  </p>
                </div>
                <Switch />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Low Attendance Warnings</Label>
                  <p className="text-xs text-muted-foreground">
                    Alert when attendance drops below 80%
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
                  <span className="w-12 text-sm font-mono">80%</span>
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

            <div className="space-y-2">
              <Label>Session Timeout (minutes)</Label>
              <div className="flex items-center gap-4">
                <Slider
                  defaultValue={[480]}
                  min={60}
                  max={1440}
                  step={60}
                  className="flex-1"
                />
                <span className="w-16 text-sm font-mono">8h</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Max Devices per Student</Label>
              <div className="flex items-center gap-4">
                <Slider
                  defaultValue={[3]}
                  min={1}
                  max={10}
                  step={1}
                  className="flex-1"
                />
                <span className="w-12 text-sm font-mono">3</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Allow Manual Override</Label>
                <p className="text-xs text-muted-foreground">
                  Teachers can override automatic marking
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Allow Past Editing</Label>
                <p className="text-xs text-muted-foreground">
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