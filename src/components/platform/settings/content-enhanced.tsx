"use client";

import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Settings,
  Users,
  UserCog,
  Shield,
  School,
  Bell,
  Palette,
  Database,
} from "lucide-react";
import { useSchool } from "@/components/platform/context/school-context";
import { SettingsContent as BasicSettings } from "./content";
import { RoleManagement } from "./role-management";
import { RoleSwitcher } from "./role-switcher";
import { PermissionsPanel } from "./permissions-panel";
import { NotificationSettings } from "./notification-settings";
import { type Locale } from "@/components/internationalization/config";
import { type Dictionary } from "@/components/internationalization/dictionaries";
import { useSession } from "next-auth/react";

interface Props {
  dictionary: Dictionary;
  lang: Locale;
}

export function EnhancedSettingsContent({ dictionary, lang }: Props) {
  const { school } = useSchool();
  const { data: session } = useSession();

  // Check if user has developer or admin access
  const isDeveloper = session?.user?.role === "DEVELOPER";
  const isAdmin = session?.user?.role === "ADMIN";
  const hasFullAccess = isDeveloper || isAdmin;

  // Check for developer mode from localStorage
  const [isDeveloperMode, setIsDeveloperMode] = React.useState(false);

  React.useEffect(() => {
    const devMode = localStorage.getItem("developer-mode") === "true";
    setIsDeveloperMode(devMode);
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your school settings, users, roles, and permissions
        </p>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <School className="h-4 w-4" />
            <span className="hidden sm:inline">General</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Users</span>
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <UserCog className="h-4 w-4" />
            <span className="hidden sm:inline">Roles</span>
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Permissions</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <span className="hidden sm:inline">Advanced</span>
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <BasicSettings dictionary={dictionary} lang={lang} />
        </TabsContent>

        {/* User Management */}
        <TabsContent value="users" className="space-y-6">
          <RoleManagement
            dictionary={dictionary.school}
            currentUserId={session?.user?.id}
            isDeveloperMode={isDeveloperMode || isDeveloper}
          />
        </TabsContent>

        {/* Role Switcher */}
        <TabsContent value="roles" className="space-y-6">
          <RoleSwitcher
            currentRole={session?.user?.role as any}
            currentUserId={session?.user?.id}
            schoolId={school?.id}
          />
        </TabsContent>

        {/* Permissions Management */}
        <TabsContent value="permissions" className="space-y-6">
          <PermissionsPanel
            currentRole={session?.user?.role as any}
            isDeveloperMode={isDeveloperMode || isDeveloper}
          />
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <NotificationSettings />
        </TabsContent>

        {/* Advanced Settings */}
        <TabsContent value="advanced" className="space-y-6">
          <AdvancedSettings
            isDeveloper={isDeveloper}
            isAdmin={isAdmin}
            schoolId={school?.id}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Advanced Settings Component
function AdvancedSettings({
  isDeveloper,
  isAdmin,
  schoolId,
}: {
  isDeveloper: boolean;
  isAdmin: boolean;
  schoolId?: string;
}) {
  const [dataExportLoading, setDataExportLoading] = React.useState(false);
  const [cacheCleared, setCacheCleared] = React.useState(false);

  const handleDataExport = async () => {
    setDataExportLoading(true);
    try {
      // In production, this would trigger a data export
      await new Promise((resolve) => setTimeout(resolve, 2000));
      alert("Data export initiated. You will receive an email when ready.");
    } finally {
      setDataExportLoading(false);
    }
  };

  const handleCacheClear = async () => {
    localStorage.clear();
    sessionStorage.clear();
    setCacheCleared(true);
    setTimeout(() => setCacheCleared(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Database Operations */}
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div>
          <h3 className="flex items-center gap-2 mb-1">
            <Database className="h-5 w-5" />
            Database Operations
          </h3>
          <p className="text-sm text-muted-foreground">
            Manage database and system operations
          </p>
        </div>

        <div className="space-y-4">
          {/* Data Export */}
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div>
              <p className="font-medium">Export School Data</p>
              <p className="text-sm text-muted-foreground">
                Download all school data in CSV/Excel format
              </p>
            </div>
            <button
              onClick={handleDataExport}
              disabled={dataExportLoading}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              {dataExportLoading ? "Exporting..." : "Export Data"}
            </button>
          </div>

          {/* Cache Management */}
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div>
              <p className="font-medium">Clear Cache</p>
              <p className="text-sm text-muted-foreground">
                Clear browser cache and temporary data
              </p>
            </div>
            <button
              onClick={handleCacheClear}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
            >
              {cacheCleared ? "Cache Cleared!" : "Clear Cache"}
            </button>
          </div>

          {/* System Info */}
          <div className="p-4 rounded-lg border bg-muted/50">
            <p className="font-medium mb-2">System Information</p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">School ID:</span>
                <span className="font-mono">{schoolId || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Version:</span>
                <span>v1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Environment:</span>
                <span>{process.env.NODE_ENV}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">API Status:</span>
                <span className="text-green-600">Operational</span>
              </div>
            </div>
          </div>

          {/* Developer Tools (Only for developers) */}
          {isDeveloper && (
            <div className="p-4 rounded-lg border border-purple-200 bg-purple-50 dark:bg-purple-950/20">
              <p className="font-medium mb-2 text-purple-700 dark:text-purple-400">
                Developer Tools
              </p>
              <div className="space-y-2">
                <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm">
                  Run Database Migrations
                </button>
                <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm">
                  Seed Test Data
                </button>
                <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm">
                  View Debug Logs
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* API Settings */}
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div>
          <h3 className="mb-1">API Settings</h3>
          <p className="text-sm text-muted-foreground">
            Configure API access and webhooks
          </p>
        </div>

        <div className="space-y-4">
          {/* API Key */}
          <div className="p-4 rounded-lg border">
            <p className="font-medium mb-2">API Key</p>
            <div className="flex items-center gap-2">
              <input
                type="password"
                value="sk_live_••••••••••••••••"
                className="flex-1 px-3 py-2 border rounded-md bg-background"
                readOnly
              />
              <button className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90">
                Regenerate
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Use this key to authenticate API requests
            </p>
          </div>

          {/* Webhooks */}
          <div className="p-4 rounded-lg border">
            <p className="font-medium mb-2">Webhooks</p>
            <p className="text-sm text-muted-foreground mb-3">
              Configure webhook endpoints for real-time events
            </p>
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
              Configure Webhooks
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone (Admin/Developer only) */}
      {(isDeveloper || isAdmin) && (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 p-6 space-y-4">
          <div>
            <h3 className="text-red-700 dark:text-red-400 mb-1">Danger Zone</h3>
            <p className="text-sm text-red-600 dark:text-red-500">
              These actions are irreversible. Please proceed with caution.
            </p>
          </div>

          <div className="space-y-4">
            {/* Reset School Data */}
            <div className="flex items-center justify-between p-4 rounded-lg border border-red-200">
              <div>
                <p className="font-medium text-red-700 dark:text-red-400">
                  Reset School Data
                </p>
                <p className="text-sm text-red-600 dark:text-red-500">
                  Delete all school data and start fresh
                </p>
              </div>
              <button className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
                Reset Data
              </button>
            </div>

            {/* Delete School */}
            {isDeveloper && (
              <div className="flex items-center justify-between p-4 rounded-lg border border-red-200">
                <div>
                  <p className="font-medium text-red-700 dark:text-red-400">
                    Delete School
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-500">
                    Permanently delete this school and all associated data
                  </p>
                </div>
                <button className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
                  Delete School
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}