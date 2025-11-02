/**
 * Staff Settings Tab Component
 * Profile and system preferences management
 */

'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import type { StaffProfile } from '../../types'
import type { Dictionary } from '@/components/internationalization/dictionaries'
import {
  User,
  Bell,
  Shield,
  Globe,
  Palette,
  Eye,
  Mail,
  Phone,
  MapPin,
  Camera,
  Lock,
  Key,
  Smartphone,
  Monitor,
  Moon,
  Sun,
  Languages,
  Volume2,
  Wifi,
  Download,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Info,
  Settings2,
  UserCog,
  BellRing,
  ShieldCheck
} from 'lucide-react'

// ============================================================================
// Types
// ============================================================================

interface SettingsTabProps {
  profile: StaffProfile
  dictionary?: Dictionary
  lang?: 'ar' | 'en'
  isOwner?: boolean
}

interface NotificationSetting {
  id: string
  label: string
  description: string
  enabled: boolean
  channels: {
    email: boolean
    push: boolean
    sms: boolean
  }
}

interface PrivacySetting {
  id: string
  label: string
  description: string
  value: 'public' | 'school' | 'department' | 'private'
  icon: React.ReactNode
}

interface SecuritySession {
  id: string
  device: string
  browser: string
  location: string
  ipAddress: string
  lastActive: Date
  isCurrent: boolean
}

// Mock notification settings
const mockNotifications: NotificationSetting[] = [
  {
    id: 'task-assigned',
    label: 'Task Assignments',
    description: 'When a new task is assigned to you',
    enabled: true,
    channels: { email: true, push: true, sms: false }
  },
  {
    id: 'task-completed',
    label: 'Task Completion',
    description: 'When a task you created is completed',
    enabled: true,
    channels: { email: false, push: true, sms: false }
  },
  {
    id: 'report-ready',
    label: 'Report Generation',
    description: 'When scheduled reports are ready',
    enabled: true,
    channels: { email: true, push: false, sms: false }
  },
  {
    id: 'meeting-reminder',
    label: 'Meeting Reminders',
    description: '15 minutes before scheduled meetings',
    enabled: true,
    channels: { email: false, push: true, sms: true }
  },
  {
    id: 'system-updates',
    label: 'System Updates',
    description: 'Important system announcements',
    enabled: false,
    channels: { email: true, push: false, sms: false }
  },
  {
    id: 'document-shared',
    label: 'Document Sharing',
    description: 'When someone shares a document with you',
    enabled: true,
    channels: { email: true, push: true, sms: false }
  }
]

// Mock privacy settings
const mockPrivacySettings: PrivacySetting[] = [
  {
    id: 'profile-visibility',
    label: 'Profile Visibility',
    description: 'Who can view your profile',
    value: 'school',
    icon: <Eye className="h-4 w-4" />
  },
  {
    id: 'email-visibility',
    label: 'Email Address',
    description: 'Who can see your email',
    value: 'department',
    icon: <Mail className="h-4 w-4" />
  },
  {
    id: 'phone-visibility',
    label: 'Phone Number',
    description: 'Who can see your phone',
    value: 'private',
    icon: <Phone className="h-4 w-4" />
  },
  {
    id: 'schedule-visibility',
    label: 'Work Schedule',
    description: 'Who can view your schedule',
    value: 'school',
    icon: <Calendar className="h-4 w-4" />
  },
  {
    id: 'activity-visibility',
    label: 'Activity Status',
    description: 'Who can see your online status',
    value: 'department',
    icon: <Wifi className="h-4 w-4" />
  }
]

// Mock sessions
const mockSessions: SecuritySession[] = [
  {
    id: '1',
    device: 'Windows PC',
    browser: 'Chrome 122.0',
    location: 'New York, US',
    ipAddress: '192.168.1.100',
    lastActive: new Date(),
    isCurrent: true
  },
  {
    id: '2',
    device: 'iPhone 14',
    browser: 'Safari 17.2',
    location: 'New York, US',
    ipAddress: '192.168.1.105',
    lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000),
    isCurrent: false
  },
  {
    id: '3',
    device: 'iPad Pro',
    browser: 'Safari 17.2',
    location: 'Brooklyn, US',
    ipAddress: '192.168.2.50',
    lastActive: new Date(Date.now() - 24 * 60 * 60 * 1000),
    isCurrent: false
  }
]

// ============================================================================
// Component
// ============================================================================

export function SettingsTab({
  profile,
  dictionary,
  lang = 'en',
  isOwner = false
}: SettingsTabProps) {
  const [activeTab, setActiveTab] = useState('profile')
  const [notifications, setNotifications] = useState(mockNotifications)
  const [privacySettings, setPrivacySettings] = useState(mockPrivacySettings)
  const [theme, setTheme] = useState(profile.settings?.theme || 'system')
  const [language, setLanguage] = useState(profile.settings?.language || 'en')
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)

  const handleNotificationToggle = (id: string, field: 'enabled' | 'email' | 'push' | 'sms') => {
    setNotifications(prev => prev.map(notif => {
      if (notif.id === id) {
        if (field === 'enabled') {
          return { ...notif, enabled: !notif.enabled }
        } else {
          return {
            ...notif,
            channels: { ...notif.channels, [field]: !notif.channels[field] }
          }
        }
      }
      return notif
    }))
  }

  const handlePrivacyChange = (id: string, value: string) => {
    setPrivacySettings(prev => prev.map(setting => {
      if (setting.id === id) {
        return { ...setting, value: value as PrivacySetting['value'] }
      }
      return setting
    }))
  }

  if (!isOwner) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>
            You don't have permission to view or edit these settings
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="privacy">
            <Eye className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Privacy</span>
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your profile details and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    defaultValue={profile.staff?.givenName}
                    placeholder="Enter first name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    defaultValue={profile.staff?.surname}
                    placeholder="Enter last name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  defaultValue={profile.email}
                  placeholder="Enter email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  defaultValue={profile.phone}
                  placeholder="Enter phone number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  defaultValue={profile.bio}
                  placeholder="Tell us about yourself..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select defaultValue={profile.staffInfo?.department}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Finance & Administration">Finance & Administration</SelectItem>
                      <SelectItem value="Human Resources">Human Resources</SelectItem>
                      <SelectItem value="Operations">Operations</SelectItem>
                      <SelectItem value="IT">Information Technology</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input
                    id="role"
                    defaultValue={profile.staffInfo?.designation}
                    placeholder="Enter role"
                  />
                </div>
              </div>

              <Separator />

              <div className="flex justify-end gap-2">
                <Button variant="outline">Cancel</Button>
                <Button>Save Changes</Button>
              </div>
            </CardContent>
          </Card>

          {/* Appearance Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize how the application looks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">
                      <div className="flex items-center gap-2">
                        <Sun className="h-4 w-4" />
                        Light
                      </div>
                    </SelectItem>
                    <SelectItem value="dark">
                      <div className="flex items-center gap-2">
                        <Moon className="h-4 w-4" />
                        Dark
                      </div>
                    </SelectItem>
                    <SelectItem value="system">
                      <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4" />
                        System
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ar">العربية</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Sound Effects</Label>
                  <p className="text-sm text-muted-foreground">
                    Play sounds for notifications
                  </p>
                </div>
                <Switch />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Compact Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Reduce spacing between elements
                  </p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose how you want to be notified
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Global Settings */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Enable All Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Master switch for all notification types
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Do Not Disturb</Label>
                    <p className="text-sm text-muted-foreground">
                      Silence notifications during specific hours
                    </p>
                  </div>
                  <Switch />
                </div>

                <Separator />
              </div>

              {/* Individual Notifications */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Notification Types</h4>
                {notifications.map((notif) => (
                  <div key={notif.id} className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <Label>{notif.label}</Label>
                        <p className="text-sm text-muted-foreground">
                          {notif.description}
                        </p>
                      </div>
                      <Switch
                        checked={notif.enabled}
                        onCheckedChange={() => handleNotificationToggle(notif.id, 'enabled')}
                      />
                    </div>
                    {notif.enabled && (
                      <div className="ml-6 flex items-center gap-6 text-sm">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notif.channels.email}
                            onChange={() => handleNotificationToggle(notif.id, 'email')}
                            className="rounded"
                          />
                          <Mail className="h-4 w-4" />
                          Email
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notif.channels.push}
                            onChange={() => handleNotificationToggle(notif.id, 'push')}
                            className="rounded"
                          />
                          <BellRing className="h-4 w-4" />
                          Push
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notif.channels.sms}
                            onChange={() => handleNotificationToggle(notif.id, 'sms')}
                            className="rounded"
                          />
                          <Smartphone className="h-4 w-4" />
                          SMS
                        </label>
                      </div>
                    )}
                    <Separator />
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline">Reset to Default</Button>
                <Button>Save Preferences</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
              <CardDescription>
                Control who can see your information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {privacySettings.map((setting) => (
                <div key={setting.id} className="space-y-2">
                  <div className="flex items-center gap-2">
                    {setting.icon}
                    <Label>{setting.label}</Label>
                  </div>
                  <p className="text-sm text-muted-foreground ml-6">
                    {setting.description}
                  </p>
                  <Select
                    value={setting.value}
                    onValueChange={(value) => handlePrivacyChange(setting.id, value)}
                  >
                    <SelectTrigger className="ml-6">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Everyone</SelectItem>
                      <SelectItem value="school">School Only</SelectItem>
                      <SelectItem value="department">Department Only</SelectItem>
                      <SelectItem value="private">Only Me</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}

              <Separator />

              <div className="space-y-4">
                <h4 className="text-sm font-medium">Additional Privacy Options</h4>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Allow Messages</Label>
                    <p className="text-sm text-muted-foreground">
                      Let others send you direct messages
                    </p>
                  </div>
                  <Switch defaultChecked={profile.settings?.allowMessages} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Show in Directory</Label>
                    <p className="text-sm text-muted-foreground">
                      Appear in the staff directory
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Activity Status</Label>
                    <p className="text-sm text-muted-foreground">
                      Show when you're online
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline">Cancel</Button>
                <Button>Update Privacy</Button>
              </div>
            </CardContent>
          </Card>

          {/* Data Export */}
          <Card>
            <CardHeader>
              <CardTitle>Your Data</CardTitle>
              <CardDescription>
                Download or delete your personal data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  You can request a copy of your data at any time. The export will include
                  all your profile information, activities, and generated content.
                </AlertDescription>
              </Alert>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button variant="outline" className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Export My Data
                </Button>
                <Button variant="destructive" className="flex-1">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          {/* Password Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Password & Authentication</CardTitle>
              <CardDescription>
                Manage your password and authentication methods
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input
                  id="current-password"
                  type="password"
                  placeholder="Enter current password"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Enter new password"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirm new password"
                />
              </div>

              <Button>Change Password</Button>

              <Separator />

              {/* Two-Factor Authentication */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4" />
                      Two-Factor Authentication
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <Switch
                    checked={twoFactorEnabled}
                    onCheckedChange={setTwoFactorEnabled}
                  />
                </div>

                {twoFactorEnabled && (
                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription>
                      Two-factor authentication is enabled. You'll need to enter a code
                      from your authenticator app when signing in.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Active Sessions */}
          <Card>
            <CardHeader>
              <CardTitle>Active Sessions</CardTitle>
              <CardDescription>
                Manage devices where you're signed in
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockSessions.map((session) => (
                <div
                  key={session.id}
                  className={cn(
                    "flex items-start justify-between p-4 rounded-lg border",
                    session.isCurrent && "bg-primary/5 border-primary/20"
                  )}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4" />
                      <span className="font-medium">{session.device}</span>
                      {session.isCurrent && (
                        <Badge className="bg-green-50 text-green-600">
                          Current
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {session.browser} • {session.location}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {session.ipAddress} • Last active {
                        session.isCurrent
                          ? 'now'
                          : `${Math.round((Date.now() - session.lastActive.getTime()) / (1000 * 60 * 60))} hours ago`
                      }
                    </p>
                  </div>
                  {!session.isCurrent && (
                    <Button size="sm" variant="ghost">
                      Sign Out
                    </Button>
                  )}
                </div>
              ))}

              <div className="flex justify-end">
                <Button variant="outline">
                  Sign Out All Other Sessions
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Security Alerts */}
          <Card>
            <CardHeader>
              <CardTitle>Security Alerts</CardTitle>
              <CardDescription>
                Recent security-related activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Password changed successfully</p>
                    <p className="text-xs text-muted-foreground">2 days ago from New York, US</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">New device sign-in</p>
                    <p className="text-xs text-muted-foreground">5 days ago from iPhone, Brooklyn</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Two-factor authentication enabled</p>
                    <p className="text-xs text-muted-foreground">1 week ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Add missing import for Calendar
import { Calendar } from 'lucide-react'