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
import { Shield, Lock, LockOpen, Eye, Pencil, Trash, Plus, Users, FileText, DollarSign, Calendar, Settings, TriangleAlert, CircleCheck, CircleX,  } from "lucide-react";
import { SuccessToast, ErrorToast } from "@/components/atom/toast";
import type { UserRole } from "./role-management";
import { type Dictionary } from "@/components/internationalization/dictionaries";

// Permission categories and their permissions - now returns function for i18n
const getPermissionCategories = (dictionary?: Dictionary["school"]) => ({
  users: {
    label: dictionary?.settings?.permissionsPanel?.categories?.users || "User Management",
    icon: Users,
    permissions: {
      "users.view": dictionary?.settings?.permissionsPanel?.users?.view || "View users",
      "users.create": dictionary?.settings?.permissionsPanel?.users?.create || "Create users",
      "users.edit": dictionary?.settings?.permissionsPanel?.users?.edit || "Edit users",
      "users.delete": dictionary?.settings?.permissionsPanel?.users?.delete || "Delete users",
      "users.roles": dictionary?.settings?.permissionsPanel?.users?.roles || "Manage user roles",
      "users.permissions": dictionary?.settings?.permissionsPanel?.users?.permissions || "Manage permissions",
    },
  },
  students: {
    label: dictionary?.settings?.permissionsPanel?.categories?.students || "Student Management",
    icon: Users,
    permissions: {
      "students.view": dictionary?.settings?.permissionsPanel?.students?.view || "View students",
      "students.create": dictionary?.settings?.permissionsPanel?.students?.create || "Add students",
      "students.edit": dictionary?.settings?.permissionsPanel?.students?.edit || "Edit student info",
      "students.delete": dictionary?.settings?.permissionsPanel?.students?.delete || "Remove students",
      "students.grades": dictionary?.settings?.permissionsPanel?.students?.grades || "Manage grades",
      "students.attendance": dictionary?.settings?.permissionsPanel?.students?.attendance || "Track attendance",
    },
  },
  teachers: {
    label: dictionary?.settings?.permissionsPanel?.categories?.teachers || "Teacher Management",
    icon: Users,
    permissions: {
      "teachers.view": dictionary?.settings?.permissionsPanel?.teachers?.view || "View teachers",
      "teachers.create": dictionary?.settings?.permissionsPanel?.teachers?.create || "Add teachers",
      "teachers.edit": dictionary?.settings?.permissionsPanel?.teachers?.edit || "Edit teacher info",
      "teachers.delete": dictionary?.settings?.permissionsPanel?.teachers?.delete || "Remove teachers",
      "teachers.schedule": dictionary?.settings?.permissionsPanel?.teachers?.schedule || "Manage schedules",
      "teachers.evaluate": dictionary?.settings?.permissionsPanel?.teachers?.evaluate || "Performance evaluation",
    },
  },
  academics: {
    label: dictionary?.settings?.permissionsPanel?.categories?.academics || "Academic Management",
    icon: FileText,
    permissions: {
      "classes.view": dictionary?.settings?.permissionsPanel?.academics?.classesView || "View classes",
      "classes.create": dictionary?.settings?.permissionsPanel?.academics?.classesCreate || "Create classes",
      "classes.edit": dictionary?.settings?.permissionsPanel?.academics?.classesEdit || "Edit classes",
      "classes.delete": dictionary?.settings?.permissionsPanel?.academics?.classesDelete || "Delete classes",
      "assignments.manage": dictionary?.settings?.permissionsPanel?.academics?.assignments || "Manage assignments",
      "exams.manage": dictionary?.settings?.permissionsPanel?.academics?.exams || "Manage exams",
      "curriculum.manage": dictionary?.settings?.permissionsPanel?.academics?.curriculum || "Manage curriculum",
    },
  },
  finance: {
    label: dictionary?.settings?.permissionsPanel?.categories?.finance || "Financial Management",
    icon: DollarSign,
    permissions: {
      "finance.view": dictionary?.settings?.permissionsPanel?.finance?.view || "View financial data",
      "finance.edit": dictionary?.settings?.permissionsPanel?.finance?.edit || "Edit financial records",
      "finance.create": dictionary?.settings?.permissionsPanel?.finance?.create || "Create transactions",
      "finance.delete": dictionary?.settings?.permissionsPanel?.finance?.delete || "Delete transactions",
      "fees.manage": dictionary?.settings?.permissionsPanel?.finance?.fees || "Manage fees",
      "payments.process": dictionary?.settings?.permissionsPanel?.finance?.payments || "Process payments",
      "reports.financial": dictionary?.settings?.permissionsPanel?.finance?.reports || "Generate financial reports",
    },
  },
  system: {
    label: dictionary?.settings?.permissionsPanel?.categories?.settings || "System Settings",
    icon: Settings,
    permissions: {
      "settings.view": dictionary?.settings?.permissionsPanel?.settingsPerms?.view || "View settings",
      "settings.edit": dictionary?.settings?.permissionsPanel?.settingsPerms?.edit || "Edit settings",
      "system.backup": dictionary?.settings?.permissionsPanel?.settingsPerms?.system || "Backup system",
      "system.restore": dictionary?.settings?.permissionsPanel?.settingsPerms?.system || "Restore system",
      "system.audit": dictionary?.settings?.permissionsPanel?.settingsPerms?.system || "View audit logs",
      "system.developer": dictionary?.settings?.permissionsPanel?.settingsPerms?.system || "Developer tools",
    },
  },
});

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
  dictionary?: Dictionary["school"];
}

export function PermissionsPanel({
  currentRole = "USER",
  isDeveloperMode = false,
  dictionary,
}: PermissionsPanelProps) {
  const PERMISSION_CATEGORIES = React.useMemo(() => getPermissionCategories(dictionary), [dictionary]);

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
          <AlertTitle>{dictionary?.settings?.permissionsPanel?.advancedManagement || "Advanced Permission Management"}</AlertTitle>
          <AlertDescription>
            {dictionary?.settings?.permissionsPanel?.modifyAllRoles || "You can modify all role permissions. Changes affect all users with these roles."}
          </AlertDescription>
        </Alert>
      )}

      {/* Role Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 rtl:flex-row-reverse">
            <Shield className="h-5 w-5" />
            {dictionary?.settings?.permissionsPanel?.permissionManagement || "Permission Management"}
          </CardTitle>
          <CardDescription>
            {dictionary?.settings?.permissionsPanel?.configurePermissions || "Configure permissions for each role in the system"}
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
                <div className="rounded-xl p-4 bg-background">
                  <div className="flex items-center justify-between rtl:flex-row-reverse">
                    <div>
                      <p className="font-semibold">{role} {dictionary?.settings?.permissionsPanel?.role || "Role"}</p>
                      <p className="text-sm text-muted-foreground">
                        {role === "DEVELOPER" && (dictionary?.settings?.permissionsPanel?.roleDescriptions?.developer || "Full system access")}
                        {role === "ADMIN" && (dictionary?.settings?.permissionsPanel?.roleDescriptions?.admin || "School administration access")}
                        {role === "TEACHER" && (dictionary?.settings?.permissionsPanel?.roleDescriptions?.teacher || "Teaching and class management")}
                        {role === "STUDENT" && (dictionary?.settings?.permissionsPanel?.roleDescriptions?.student || "Student portal access")}
                        {role === "GUARDIAN" && (dictionary?.settings?.permissionsPanel?.roleDescriptions?.guardian || "Parent/Guardian access")}
                        {role === "ACCOUNTANT" && (dictionary?.settings?.permissionsPanel?.roleDescriptions?.accountant || "Financial management")}
                        {role === "STAFF" && (dictionary?.settings?.permissionsPanel?.roleDescriptions?.staff || "Basic staff access")}
                        {role === "USER" && (dictionary?.settings?.permissionsPanel?.roleDescriptions?.user || "Basic user access")}
                      </p>
                    </div>
                    <Badge variant={role === "DEVELOPER" ? "destructive" : "default"}>
                      {permissions[role as UserRole]?.length || 0} {dictionary?.settings?.permissionsPanel?.permissionsCount || "permissions"}
                    </Badge>
                  </div>
                </div>

                {/* Special case for DEVELOPER */}
                {role === "DEVELOPER" && (
                  <Alert className="border-red-200">
                    <TriangleAlert className="h-4 w-4" />
                    <AlertTitle>{dictionary?.settings?.permissionsPanel?.developerRole || "Developer Role"}</AlertTitle>
                    <AlertDescription>
                      {dictionary?.settings?.permissionsPanel?.developerFullAccess || "Developers have full system access by default. This cannot be modified."}
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
                          <div className="flex items-center justify-between rtl:flex-row-reverse">
                            <div className="flex items-center gap-2 rtl:flex-row-reverse">
                              <Icon className="h-4 w-4" />
                              <CardTitle className="text-base">{category.label}</CardTitle>
                            </div>
                            <div className="flex items-center gap-2 rtl:flex-row-reverse">
                              {hasSome && !hasAll && (
                                <Badge variant="secondary">{dictionary?.settings?.permissionsPanel?.partial || "Partial"}</Badge>
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
                                className="flex items-center justify-between py-2 rtl:flex-row-reverse"
                              >
                                <div className="flex items-center gap-2 rtl:flex-row-reverse">
                                  {hasPermission(role as UserRole, perm) ? (
                                    <CircleCheck className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <CircleX className="h-4 w-4 text-muted-foreground" />
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
            <div className="flex items-center justify-between mt-6 p-4 rounded-lg bg-muted rtl:flex-row-reverse">
              <p className="text-sm text-muted-foreground">
                {dictionary?.settings?.permissionsPanel?.unsavedChanges || "You have unsaved changes"}
              </p>
              <div className="flex gap-2 rtl:flex-row-reverse rtl:gap-x-reverse">
                <Button variant="outline" onClick={handleReset}>
                  {dictionary?.settings?.permissionsPanel?.resetToDefaults || "Reset to Defaults"}
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (dictionary?.settings?.permissionsPanel?.saving || "Saving...") : (dictionary?.settings?.permissionsPanel?.saveChanges || "Save Changes")}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Permission Summary */}
      <Card>
        <CardHeader>
          <CardTitle>{dictionary?.settings?.permissionsPanel?.permissionSummary || "Permission Summary"}</CardTitle>
          <CardDescription>
            {dictionary?.settings?.permissionsPanel?.overviewAllRoles || "Overview of permissions across all roles"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(PERMISSION_CATEGORIES).map(([key, category]) => (
              <div key={key} className="p-3 rounded-xl bg-background">
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