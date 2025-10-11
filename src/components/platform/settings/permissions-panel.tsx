"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Shield,
  Lock,
  Unlock,
  Eye,
  Edit,
  Trash,
  Plus,
  Users,
  FileText,
  DollarSign,
  Calendar,
  Settings,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { SuccessToast, ErrorToast } from "@/components/atom/toast";
import type { UserRole } from "./role-management";

// Permission categories and their permissions
const PERMISSION_CATEGORIES = {
  users: {
    label: "User Management",
    icon: Users,
    permissions: {
      "users.view": "View users",
      "users.create": "Create users",
      "users.edit": "Edit users",
      "users.delete": "Delete users",
      "users.roles": "Manage user roles",
      "users.permissions": "Manage permissions",
    },
  },
  students: {
    label: "Student Management",
    icon: Users,
    permissions: {
      "students.view": "View students",
      "students.create": "Add students",
      "students.edit": "Edit student info",
      "students.delete": "Remove students",
      "students.grades": "Manage grades",
      "students.attendance": "Track attendance",
    },
  },
  teachers: {
    label: "Teacher Management",
    icon: Users,
    permissions: {
      "teachers.view": "View teachers",
      "teachers.create": "Add teachers",
      "teachers.edit": "Edit teacher info",
      "teachers.delete": "Remove teachers",
      "teachers.schedule": "Manage schedules",
      "teachers.evaluate": "Performance evaluation",
    },
  },
  academics: {
    label: "Academic Management",
    icon: FileText,
    permissions: {
      "classes.view": "View classes",
      "classes.create": "Create classes",
      "classes.edit": "Edit classes",
      "classes.delete": "Delete classes",
      "assignments.manage": "Manage assignments",
      "exams.manage": "Manage exams",
      "curriculum.manage": "Manage curriculum",
    },
  },
  finance: {
    label: "Financial Management",
    icon: DollarSign,
    permissions: {
      "finance.view": "View financial data",
      "finance.edit": "Edit financial records",
      "finance.create": "Create transactions",
      "finance.delete": "Delete transactions",
      "fees.manage": "Manage fees",
      "payments.process": "Process payments",
      "reports.financial": "Generate financial reports",
    },
  },
  system: {
    label: "System Settings",
    icon: Settings,
    permissions: {
      "settings.view": "View settings",
      "settings.edit": "Edit settings",
      "system.backup": "Backup system",
      "system.restore": "Restore system",
      "system.audit": "View audit logs",
      "system.developer": "Developer tools",
    },
  },
};

// Default permissions for each role
const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  DEVELOPER: ["*"], // All permissions
  ADMIN: [
    "users.view", "users.create", "users.edit",
    "students.view", "students.create", "students.edit",
    "teachers.view", "teachers.create", "teachers.edit",
    "classes.view", "classes.create", "classes.edit",
    "finance.view", "finance.edit",
    "settings.view", "settings.edit",
  ],
  TEACHER: [
    "students.view", "students.grades", "students.attendance",
    "classes.view", "classes.edit",
    "assignments.manage", "exams.manage",
  ],
  STUDENT: [
    "classes.view",
    "assignments.manage", // Limited to own assignments
  ],
  GUARDIAN: [
    "students.view", // Limited to own children
    "finance.view", // Limited to own fees
  ],
  ACCOUNTANT: [
    "finance.view", "finance.edit", "finance.create",
    "fees.manage", "payments.process", "reports.financial",
  ],
  STAFF: [
    "students.view",
    "classes.view",
  ],
  USER: [], // No permissions by default
};

interface PermissionsPanelProps {
  currentRole?: UserRole;
  isDeveloperMode?: boolean;
}

export function PermissionsPanel({
  currentRole = "USER",
  isDeveloperMode = false,
}: PermissionsPanelProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>(currentRole);
  const [permissions, setPermissions] = useState<Record<UserRole, string[]>>(
    DEFAULT_ROLE_PERMISSIONS
  );
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Toggle permission for a role
  const togglePermission = (role: UserRole, permission: string) => {
    if (!isDeveloperMode && role === "DEVELOPER") {
      ErrorToast("Cannot modify developer permissions");
      return;
    }

    setPermissions((prev) => {
      const rolePerms = prev[role] || [];
      const newPerms = rolePerms.includes(permission)
        ? rolePerms.filter((p) => p !== permission)
        : [...rolePerms, permission];

      return {
        ...prev,
        [role]: newPerms,
      };
    });
    setHasChanges(true);
  };

  // Toggle all permissions in a category
  const toggleCategory = (role: UserRole, category: string, perms: string[]) => {
    if (!isDeveloperMode && role === "DEVELOPER") {
      ErrorToast("Cannot modify developer permissions");
      return;
    }

    setPermissions((prev) => {
      const rolePerms = prev[role] || [];
      const hasAll = perms.every((p) => rolePerms.includes(p));

      const newPerms = hasAll
        ? rolePerms.filter((p) => !perms.includes(p))
        : [...new Set([...rolePerms, ...perms])];

      return {
        ...prev,
        [role]: newPerms,
      };
    });
    setHasChanges(true);
  };

  // Save permissions
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // In production, this would save to the database
      await new Promise((resolve) => setTimeout(resolve, 1000));
      SuccessToast("Permissions saved successfully");
      setHasChanges(false);
    } catch (error) {
      ErrorToast("Failed to save permissions");
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to defaults
  const handleReset = () => {
    setPermissions(DEFAULT_ROLE_PERMISSIONS);
    setHasChanges(false);
    SuccessToast("Permissions reset to defaults");
  };

  const hasPermission = (role: UserRole, permission: string): boolean => {
    const rolePerms = permissions[role] || [];
    return rolePerms.includes("*") || rolePerms.includes(permission);
  };

  return (
    <div className="space-y-6">
      {/* Developer Mode Alert */}
      {isDeveloperMode && (
        <Alert className="border-purple-200 bg-purple-50 dark:bg-purple-950/20">
          <Shield className="h-4 w-4" />
          <AlertTitle>Advanced Permission Management</AlertTitle>
          <AlertDescription>
            You can modify all role permissions. Changes affect all users with these roles.
          </AlertDescription>
        </Alert>
      )}

      {/* Role Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Permission Management
          </CardTitle>
          <CardDescription>
            Configure permissions for each role in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedRole} onValueChange={(v) => setSelectedRole(v as UserRole)}>
            <TabsList className="grid grid-cols-4 lg:grid-cols-8">
              <TabsTrigger value="DEVELOPER">Developer</TabsTrigger>
              <TabsTrigger value="ADMIN">Admin</TabsTrigger>
              <TabsTrigger value="TEACHER">Teacher</TabsTrigger>
              <TabsTrigger value="STUDENT">Student</TabsTrigger>
              <TabsTrigger value="GUARDIAN">Guardian</TabsTrigger>
              <TabsTrigger value="ACCOUNTANT">Accountant</TabsTrigger>
              <TabsTrigger value="STAFF">Staff</TabsTrigger>
              <TabsTrigger value="USER">User</TabsTrigger>
            </TabsList>

            {Object.entries(DEFAULT_ROLE_PERMISSIONS).map(([role]) => (
              <TabsContent key={role} value={role} className="space-y-6">
                {/* Role Info */}
                <div className="rounded-lg border p-4 bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{role} Role</p>
                      <p className="text-sm text-muted-foreground">
                        {role === "DEVELOPER" && "Full system access"}
                        {role === "ADMIN" && "School administration access"}
                        {role === "TEACHER" && "Teaching and class management"}
                        {role === "STUDENT" && "Student portal access"}
                        {role === "GUARDIAN" && "Parent/Guardian access"}
                        {role === "ACCOUNTANT" && "Financial management"}
                        {role === "STAFF" && "Basic staff access"}
                        {role === "USER" && "Basic user access"}
                      </p>
                    </div>
                    <Badge variant={role === "DEVELOPER" ? "destructive" : "default"}>
                      {permissions[role as UserRole]?.length || 0} permissions
                    </Badge>
                  </div>
                </div>

                {/* Special case for DEVELOPER */}
                {role === "DEVELOPER" && (
                  <Alert className="border-red-200">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Developer Role</AlertTitle>
                    <AlertDescription>
                      Developers have full system access by default. This cannot be modified.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Permission Categories */}
                <div className="space-y-4">
                  {Object.entries(PERMISSION_CATEGORIES).map(([key, category]) => {
                    const categoryPerms = Object.keys(category.permissions);
                    const Icon = category.icon;
                    const rolePerms = permissions[role as UserRole] || [];
                    const hasAll = categoryPerms.every((p) =>
                      hasPermission(role as UserRole, p)
                    );
                    const hasSome = categoryPerms.some((p) =>
                      hasPermission(role as UserRole, p)
                    );

                    return (
                      <Card key={key}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              <CardTitle className="text-base">{category.label}</CardTitle>
                            </div>
                            <div className="flex items-center gap-2">
                              {hasSome && !hasAll && (
                                <Badge variant="secondary">Partial</Badge>
                              )}
                              <Switch
                                checked={hasAll}
                                onCheckedChange={() =>
                                  toggleCategory(
                                    role as UserRole,
                                    key,
                                    categoryPerms
                                  )
                                }
                                disabled={role === "DEVELOPER"}
                              />
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid gap-3">
                            {Object.entries(category.permissions).map(([perm, label]) => (
                              <div
                                key={perm}
                                className="flex items-center justify-between py-2"
                              >
                                <div className="flex items-center gap-2">
                                  {hasPermission(role as UserRole, perm) ? (
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-muted-foreground" />
                                  )}
                                  <Label htmlFor={perm} className="text-sm cursor-pointer">
                                    {label}
                                  </Label>
                                </div>
                                <Switch
                                  id={perm}
                                  checked={hasPermission(role as UserRole, perm)}
                                  onCheckedChange={() =>
                                    togglePermission(role as UserRole, perm)
                                  }
                                  disabled={role === "DEVELOPER"}
                                />
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>
            ))}
          </Tabs>

          {/* Action Buttons */}
          {hasChanges && (
            <div className="flex items-center justify-between mt-6 p-4 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground">
                You have unsaved changes
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleReset}>
                  Reset to Defaults
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Permission Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Permission Summary</CardTitle>
          <CardDescription>
            Overview of permissions across all roles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(PERMISSION_CATEGORIES).map(([key, category]) => (
              <div key={key} className="p-3 rounded-lg border">
                <p className="font-medium mb-2">{category.label}</p>
                <div className="flex flex-wrap gap-2">
                  {(["ADMIN", "TEACHER", "STUDENT", "ACCOUNTANT", "STAFF"] as UserRole[]).map(
                    (role) => {
                      const categoryPerms = Object.keys(category.permissions);
                      const hasPerms = categoryPerms.some((p) =>
                        hasPermission(role, p)
                      );
                      return (
                        hasPerms && (
                          <Badge key={role} variant="outline">
                            {role}
                          </Badge>
                        )
                      );
                    }
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}