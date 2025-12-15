"use client"

import React, { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowRight,
  BookOpen,
  Code,
  DollarSign,
  Eye,
  GraduationCap,
  Shield,
  Sparkles,
  TriangleAlert,
  UserCheck,
  UserCog,
  Users,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
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
import { Switch } from "@/components/ui/switch"
import { ErrorToast, InfoToast, SuccessToast } from "@/components/atom/toast"
import { type Dictionary } from "@/components/internationalization/dictionaries"

import type { UserRole } from "./role-management"
import { clearPreviewRole, setPreviewRole } from "./role-preview-actions"

interface RoleSwitcherProps {
  currentRole?: UserRole
  currentUserId?: string
  schoolId?: string
  dictionary?: Dictionary["school"]
}

const getRoleConfigs = (dictionary?: Dictionary["school"]) => [
  {
    value: "DEVELOPER",
    label: "Developer",
    icon: Code,
    description: "Platform admin with full system access",
    dashboardUrl: "/dashboard",
    features: [
      "Full system access",
      "All school data",
      "Platform settings",
      "Debug tools",
    ],
    color: "text-purple-600",
    bgColor: "bg-purple-50 dark:bg-purple-950/20",
  },
  {
    value: "ADMIN",
    label: "School Admin",
    icon: Shield,
    description: "School administrator with management access",
    dashboardUrl: "/dashboard",
    features: ["User management", "School settings", "Reports", "All modules"],
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
  },
  {
    value: "TEACHER",
    label: "Teacher",
    icon: BookOpen,
    description: "Teaching staff with class management",
    dashboardUrl: "/dashboard",
    features: ["Class management", "Grades", "Attendance", "Assignments"],
    color: "text-green-600",
    bgColor: "bg-green-50 dark:bg-green-950/20",
  },
  {
    value: "STUDENT",
    label: "Student",
    icon: GraduationCap,
    description: "Student with academic access",
    dashboardUrl: "/dashboard",
    features: [
      "View grades",
      "Submit assignments",
      "Timetable",
      "Announcements",
    ],
    color: "text-yellow-600",
    bgColor: "bg-yellow-50 dark:bg-yellow-950/20",
  },
  {
    value: "GUARDIAN",
    label: "Parent/Guardian",
    icon: Users,
    description: "Parent with child monitoring access",
    dashboardUrl: "/dashboard",
    features: ["Child progress", "Fee payments", "Attendance", "Communication"],
    color: "text-orange-600",
    bgColor: "bg-orange-50 dark:bg-orange-950/20",
  },
  {
    value: "ACCOUNTANT",
    label: "Accountant",
    icon: DollarSign,
    description: "Finance staff with financial access",
    dashboardUrl: "/dashboard",
    features: [
      "Fee management",
      "Financial reports",
      "Budgets",
      "Transactions",
    ],
    color: "text-emerald-600",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/20",
  },
  {
    value: "STAFF",
    label: "Staff",
    icon: UserCheck,
    description: "General staff with basic access",
    dashboardUrl: "/dashboard",
    features: ["Announcements", "Timetable", "Basic reports"],
    color: "text-gray-600",
    bgColor: "bg-gray-50 dark:bg-gray-950/20",
  },
  {
    value: "USER",
    label: "Basic User",
    icon: Users,
    description: "Basic user with minimal access",
    dashboardUrl: "/dashboard",
    features: ["View announcements", "Basic profile"],
    color: "text-gray-500",
    bgColor: "bg-gray-50 dark:bg-gray-950/20",
  },
]

export function RoleSwitcher({
  currentRole = "USER",
  currentUserId,
  schoolId,
  dictionary,
}: RoleSwitcherProps) {
  const router = useRouter()
  const ROLE_CONFIGS = React.useMemo(
    () => getRoleConfigs(dictionary),
    [dictionary]
  )

  const [selectedRole, setSelectedRole] = useState<UserRole>(currentRole)
  const [isDeveloperMode, setIsDeveloperMode] = useState(false)
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [isSwitching, setIsSwitching] = useState(false)

  // Load developer mode preference and check preview mode
  useEffect(() => {
    const devMode = localStorage.getItem("developer-mode") === "true"
    setIsDeveloperMode(devMode)

    // Check if preview mode is active
    const previewMode = localStorage.getItem("preview-mode") === "true"
    setIsPreviewMode(previewMode)
  }, [])

  // Save developer mode preference
  const handleDeveloperModeToggle = (enabled: boolean) => {
    setIsDeveloperMode(enabled)
    localStorage.setItem("developer-mode", enabled.toString())

    if (enabled) {
      InfoToast("Developer mode enabled - You now have access to all roles")
    } else {
      InfoToast("Developer mode disabled")
    }
  }

  // Handle role switch
  const handleRoleSwitch = async () => {
    if (!selectedRole || selectedRole === currentRole) {
      ErrorToast("Please select a different role")
      return
    }

    setIsSwitching(true)

    try {
      // Call server action to switch roles
      await setPreviewRole(selectedRole)

      // Also store in localStorage for client-side checks
      localStorage.setItem("preview-role", selectedRole)
      localStorage.setItem("preview-mode", "true")
      setIsPreviewMode(true)

      SuccessToast(`Switched to ${selectedRole} role`)

      // Redirect to lab with the new role
      setTimeout(() => {
        router.push("/dashboard")
        router.refresh()
      }, 1000)
    } catch (error) {
      ErrorToast("Failed to switch role")
    } finally {
      setIsSwitching(false)
    }
  }

  // Exit preview mode
  const handleExitPreview = async () => {
    try {
      // Call server action to clear preview role
      await clearPreviewRole()

      // Clear localStorage
      localStorage.removeItem("preview-role")
      localStorage.removeItem("preview-mode")
      setIsPreviewMode(false)

      SuccessToast("Exited preview mode")
      router.refresh()
    } catch (error) {
      ErrorToast("Failed to exit preview mode")
    }
  }

  const currentConfig = ROLE_CONFIGS.find((r) => r.value === currentRole)
  const selectedConfig = ROLE_CONFIGS.find((r) => r.value === selectedRole)

  return (
    <div className="space-y-6">
      {/* Developer Mode Toggle */}
      <Card className="bg-purple-50 dark:bg-purple-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-700 rtl:flex-row-reverse dark:text-purple-400">
            <Sparkles className="h-5 w-5" />
            {dictionary?.settings?.roleSwitcher?.developerMode ||
              "Developer Mode"}
          </CardTitle>
          <CardDescription>
            {dictionary?.settings?.roleSwitcher?.enableDeveloperMode ||
              "Enable developer mode to access all roles and features for testing"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rtl:flex-row-reverse">
            <div className="space-y-1">
              <Label htmlFor="developer-mode">
                {dictionary?.settings?.roleSwitcher?.enableButton ||
                  "Enable Developer Mode"}
              </Label>
              <p className="text-muted-foreground text-xs">
                {dictionary?.settings?.roleSwitcher?.accessNote ||
                  "This will give you access to all system roles and permissions"}
              </p>
            </div>
            <Switch
              id="developer-mode"
              checked={isDeveloperMode}
              onCheckedChange={handleDeveloperModeToggle}
            />
          </div>

          {isDeveloperMode && (
            <Alert className="mt-4 bg-purple-100 dark:bg-purple-900/30">
              <TriangleAlert className="h-4 w-4 text-purple-600" />
              <AlertTitle>
                {dictionary?.settings?.roleSwitcher?.developerModeActive ||
                  "Developer Mode Active"}
              </AlertTitle>
              <AlertDescription>
                {dictionary?.settings?.roleSwitcher?.switchNote ||
                  "You can now switch between all roles to test different lab views and features. Changes are temporary and for testing purposes only."}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Role Switcher */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 rtl:flex-row-reverse">
            <UserCog className="h-5 w-5" />
            {dictionary?.settings?.roleSwitcher?.title || "Role Switcher"}
          </CardTitle>
          <CardDescription>
            {dictionary?.settings?.roleSwitcher?.description ||
              "Switch between different roles to test lab views and features"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Role Display */}
          <div className="space-y-2">
            <Label>
              {dictionary?.settings?.roleSwitcher?.currentRole ||
                "Current Role"}
            </Label>
            <div className={`rounded-lg p-4 ${currentConfig?.bgColor}`}>
              <div className="flex items-center justify-between rtl:flex-row-reverse">
                <div className="flex items-center gap-3 rtl:flex-row-reverse">
                  {currentConfig && (
                    <currentConfig.icon
                      className={`h-6 w-6 ${currentConfig.color}`}
                    />
                  )}
                  <div>
                    <p className="font-semibold">{currentConfig?.label}</p>
                    <p className="text-muted-foreground text-sm">
                      {currentConfig?.description}
                    </p>
                  </div>
                </div>
                <Badge>{currentRole}</Badge>
              </div>
            </div>
          </div>

          {/* Role Selector */}
          <div className="space-y-2">
            <Label htmlFor="role-select">
              {dictionary?.settings?.roleSwitcher?.switchToRole ||
                "Switch to Role"}
            </Label>
            <Select
              value={selectedRole}
              onValueChange={(value) => setSelectedRole(value as UserRole)}
              disabled={!isDeveloperMode && currentRole !== "ADMIN"}
            >
              <SelectTrigger id="role-select">
                <SelectValue
                  placeholder={
                    dictionary?.settings?.roleSwitcher?.selectRole ||
                    "Select a role to preview"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {ROLE_CONFIGS.map((role) => {
                  const isAccessible =
                    isDeveloperMode ||
                    currentRole === "DEVELOPER" ||
                    currentRole === "ADMIN"

                  return (
                    <SelectItem
                      key={role.value}
                      value={role.value}
                      disabled={!isAccessible && role.value !== currentRole}
                    >
                      <div className="flex items-center gap-2 rtl:flex-row-reverse">
                        <role.icon className={`h-4 w-4 ${role.color}`} />
                        <span>{role.label}</span>
                        {!isAccessible && role.value !== currentRole && (
                          <Badge
                            variant="outline"
                            className="ml-2 text-xs rtl:mr-2 rtl:ml-0"
                          >
                            {dictionary?.settings?.roleSwitcher?.locked ||
                              "Locked"}
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Selected Role Preview */}
          {selectedRole && selectedRole !== currentRole && (
            <div className="space-y-2">
              <Label>
                {dictionary?.settings?.roleSwitcher?.preview || "Preview"}
              </Label>
              <div className={`rounded-lg p-4 ${selectedConfig?.bgColor}`}>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 rtl:flex-row-reverse">
                    {selectedConfig && (
                      <selectedConfig.icon
                        className={`h-6 w-6 ${selectedConfig.color}`}
                      />
                    )}
                    <div>
                      <p className="font-semibold">{selectedConfig?.label}</p>
                      <p className="text-muted-foreground text-sm">
                        {selectedConfig?.description}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-medium">
                      {dictionary?.settings?.roleSwitcher?.features ||
                        "Features"}
                      :
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {Array.isArray(selectedConfig?.features) &&
                        selectedConfig.features.map((feature) => (
                          <Badge
                            key={feature}
                            variant="outline"
                            className="text-xs"
                          >
                            {feature}
                          </Badge>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="rtl:gap-x-reverse flex gap-2 rtl:flex-row-reverse">
            <Button
              onClick={handleRoleSwitch}
              disabled={
                isSwitching ||
                !selectedRole ||
                selectedRole === currentRole ||
                (!isDeveloperMode &&
                  currentRole !== "ADMIN" &&
                  currentRole !== "DEVELOPER")
              }
              className="flex items-center gap-2 rtl:flex-row-reverse"
            >
              {isSwitching ? (
                dictionary?.settings?.roleSwitcher?.switching || "Switching..."
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  {dictionary?.settings?.roleSwitcher?.previewAs ||
                    "Preview as"}{" "}
                  {selectedConfig?.label}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>

            {isPreviewMode && (
              <Button variant="outline" onClick={handleExitPreview}>
                {dictionary?.settings?.roleSwitcher?.exitPreview ||
                  "Exit Preview"}
              </Button>
            )}
          </div>

          {/* Permissions Note */}
          {!isDeveloperMode &&
            currentRole !== "ADMIN" &&
            currentRole !== "DEVELOPER" && (
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertTitle>
                  {dictionary?.settings?.roleSwitcher?.limitedAccess ||
                    "Limited Access"}
                </AlertTitle>
                <AlertDescription>
                  {dictionary?.settings?.roleSwitcher?.limitedAccessNote ||
                    "Enable Developer Mode or have Admin/Developer role to switch between roles."}
                </AlertDescription>
              </Alert>
            )}
        </CardContent>
      </Card>

      {/* Role Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>
            {dictionary?.settings?.roleSwitcher?.roleComparison ||
              "Role Comparison"}
          </CardTitle>
          <CardDescription>
            {dictionary?.settings?.roleSwitcher?.compareRoles ||
              "Compare features and permissions across different roles"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {ROLE_CONFIGS.map((role) => {
              const Icon = role.icon
              return (
                <div
                  key={role.value}
                  className={`rounded-xl p-4 ${
                    role.value === currentRole ? role.bgColor : "bg-background"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between rtl:flex-row-reverse">
                      <Icon className={`h-5 w-5 ${role.color}`} />
                      {role.value === currentRole && (
                        <Badge variant="default" className="text-xs">
                          {dictionary?.settings?.roleSwitcher?.current ||
                            "Current"}
                        </Badge>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{role.label}</p>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {role.description}
                      </p>
                    </div>
                    <div className="space-y-1">
                      {Array.isArray(role.features) &&
                        role.features.slice(0, 3).map((feature) => (
                          <div
                            key={feature}
                            className="flex items-center gap-2 rtl:flex-row-reverse"
                          >
                            <div className="bg-muted-foreground h-1.5 w-1.5 rounded-full" />
                            <span className="text-xs">{feature}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
