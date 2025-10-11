"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  UserCog,
  ArrowRight,
  Eye,
  Shield,
  AlertTriangle,
  Sparkles,
  Users,
  GraduationCap,
  BookOpen,
  DollarSign,
  UserCheck,
  Code,
} from "lucide-react";
import { SuccessToast, ErrorToast, InfoToast } from "@/components/atom/toast";
import type { UserRole } from "./role-management";

interface RoleSwitcherProps {
  currentRole?: UserRole;
  currentUserId?: string;
  schoolId?: string;
}

const ROLE_CONFIGS = [
  {
    value: "DEVELOPER",
    label: "Developer",
    icon: Code,
    description: "Platform admin with full system access",
    dashboardUrl: "/dashboard",
    features: ["Full system access", "All school data", "Platform settings", "Debug tools"],
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
    features: ["View grades", "Submit assignments", "Timetable", "Announcements"],
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
    features: ["Fee management", "Financial reports", "Budgets", "Transactions"],
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
];

export function RoleSwitcher({
  currentRole = "USER",
  currentUserId,
  schoolId,
}: RoleSwitcherProps) {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<UserRole>(currentRole);
  const [isDeveloperMode, setIsDeveloperMode] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  // Load developer mode preference
  useEffect(() => {
    const devMode = localStorage.getItem("developer-mode") === "true";
    setIsDeveloperMode(devMode);
  }, []);

  // Save developer mode preference
  const handleDeveloperModeToggle = (enabled: boolean) => {
    setIsDeveloperMode(enabled);
    localStorage.setItem("developer-mode", enabled.toString());

    if (enabled) {
      InfoToast("Developer mode enabled - You now have access to all roles");
    } else {
      InfoToast("Developer mode disabled");
    }
  };

  // Handle role switch
  const handleRoleSwitch = async () => {
    if (!selectedRole || selectedRole === currentRole) {
      ErrorToast("Please select a different role");
      return;
    }

    setIsSwitching(true);

    try {
      // In production, this would call a server action to switch roles
      // For now, we'll simulate the switch with localStorage
      localStorage.setItem("preview-role", selectedRole);
      localStorage.setItem("preview-mode", "true");

      SuccessToast(`Switched to ${selectedRole} role`);

      // Redirect to dashboard with the new role
      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 1000);
    } catch (error) {
      ErrorToast("Failed to switch role");
    } finally {
      setIsSwitching(false);
    }
  };

  // Exit preview mode
  const handleExitPreview = () => {
    localStorage.removeItem("preview-role");
    localStorage.removeItem("preview-mode");
    setIsPreviewMode(false);
    router.refresh();
    SuccessToast("Exited preview mode");
  };

  const currentConfig = ROLE_CONFIGS.find((r) => r.value === currentRole);
  const selectedConfig = ROLE_CONFIGS.find((r) => r.value === selectedRole);

  return (
    <div className="space-y-6">
      {/* Developer Mode Toggle */}
      <Card className="border-purple-200 dark:border-purple-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            Developer Mode
          </CardTitle>
          <CardDescription>
            Enable developer mode to access all roles and features for testing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="developer-mode">Enable Developer Mode</Label>
              <p className="text-xs text-muted-foreground">
                This will give you access to all system roles and permissions
              </p>
            </div>
            <Switch
              id="developer-mode"
              checked={isDeveloperMode}
              onCheckedChange={handleDeveloperModeToggle}
            />
          </div>

          {isDeveloperMode && (
            <Alert className="mt-4 border-purple-200 bg-purple-50 dark:bg-purple-950/20">
              <AlertTriangle className="h-4 w-4 text-purple-600" />
              <AlertTitle>Developer Mode Active</AlertTitle>
              <AlertDescription>
                You can now switch between all roles to test different dashboard views and features.
                Changes are temporary and for testing purposes only.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Role Switcher */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            Role Switcher
          </CardTitle>
          <CardDescription>
            Switch between different roles to test dashboard views and features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Role Display */}
          <div className="space-y-2">
            <Label>Current Role</Label>
            <div className={`rounded-lg p-4 ${currentConfig?.bgColor}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {currentConfig && (
                    <currentConfig.icon className={`h-6 w-6 ${currentConfig.color}`} />
                  )}
                  <div>
                    <p className="font-semibold">{currentConfig?.label}</p>
                    <p className="text-sm text-muted-foreground">
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
            <Label htmlFor="role-select">Switch to Role</Label>
            <Select
              value={selectedRole}
              onValueChange={(value) => setSelectedRole(value as UserRole)}
              disabled={!isDeveloperMode && currentRole !== "ADMIN"}
            >
              <SelectTrigger id="role-select">
                <SelectValue placeholder="Select a role to preview" />
              </SelectTrigger>
              <SelectContent>
                {ROLE_CONFIGS.map((role) => {
                  const isAccessible =
                    isDeveloperMode ||
                    currentRole === "DEVELOPER" ||
                    currentRole === "ADMIN";

                  return (
                    <SelectItem
                      key={role.value}
                      value={role.value}
                      disabled={!isAccessible && role.value !== currentRole}
                    >
                      <div className="flex items-center gap-2">
                        <role.icon className={`h-4 w-4 ${role.color}`} />
                        <span>{role.label}</span>
                        {!isAccessible && role.value !== currentRole && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            Locked
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Selected Role Preview */}
          {selectedRole && selectedRole !== currentRole && (
            <div className="space-y-2">
              <Label>Preview</Label>
              <div className={`rounded-lg p-4 ${selectedConfig?.bgColor}`}>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    {selectedConfig && (
                      <selectedConfig.icon className={`h-6 w-6 ${selectedConfig.color}`} />
                    )}
                    <div>
                      <p className="font-semibold">{selectedConfig?.label}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedConfig?.description}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">Features:</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedConfig?.features.map((feature) => (
                        <Badge key={feature} variant="outline" className="text-xs">
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
          <div className="flex gap-2">
            <Button
              onClick={handleRoleSwitch}
              disabled={
                isSwitching ||
                !selectedRole ||
                selectedRole === currentRole ||
                (!isDeveloperMode && currentRole !== "ADMIN" && currentRole !== "DEVELOPER")
              }
              className="flex items-center gap-2"
            >
              {isSwitching ? (
                "Switching..."
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  Preview as {selectedConfig?.label}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>

            {isPreviewMode && (
              <Button variant="outline" onClick={handleExitPreview}>
                Exit Preview
              </Button>
            )}
          </div>

          {/* Permissions Note */}
          {!isDeveloperMode && currentRole !== "ADMIN" && currentRole !== "DEVELOPER" && (
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertTitle>Limited Access</AlertTitle>
              <AlertDescription>
                Enable Developer Mode or have Admin/Developer role to switch between roles.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Role Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Role Comparison</CardTitle>
          <CardDescription>
            Compare features and permissions across different roles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {ROLE_CONFIGS.map((role) => {
              const Icon = role.icon;
              return (
                <div
                  key={role.value}
                  className={`rounded-lg border p-4 ${
                    role.value === currentRole ? role.bgColor : ""
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Icon className={`h-5 w-5 ${role.color}`} />
                      {role.value === currentRole && (
                        <Badge variant="default" className="text-xs">
                          Current
                        </Badge>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{role.label}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {role.description}
                      </p>
                    </div>
                    <div className="space-y-1">
                      {role.features.slice(0, 3).map((feature) => (
                        <div key={feature} className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                          <span className="text-xs">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}