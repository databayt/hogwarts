"use client";

import * as React from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
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
import { type Locale } from "@/components/internationalization/config";
import { type Dictionary } from "@/components/internationalization/dictionaries";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

// Lazy load heavy components for better initial page load performance
const BasicSettings = React.lazy(() => import("./content").then(m => ({ default: m.SettingsContent })));
const RoleManagement = React.lazy(() => import("./role-management").then(m => ({ default: m.RoleManagement })));
const RoleSwitcher = React.lazy(() => import("./role-switcher").then(m => ({ default: m.RoleSwitcher })));
const PermissionsPanel = React.lazy(() => import("./permissions-panel").then(m => ({ default: m.PermissionsPanel })));
const NotificationSettings = React.lazy(() => import("./notification-settings").then(m => ({ default: m.NotificationSettings })));

interface Props {
  dictionary: Dictionary;
  lang: Locale;
}

export function EnhancedSettingsContent({ dictionary, lang }: Props) {
  const { school } = useSchool();
  const { data: session } = useSession();

  // Active tab state
  const [activeTab, setActiveTab] = React.useState("general");

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

  // Tab configuration
  const tabs = React.useMemo(() => [
    {
      value: "general",
      label: dictionary?.school?.settings?.general || "General",
      icon: School,
    },
    {
      value: "users",
      label: dictionary?.school?.settings?.users || "Users",
      icon: Users,
    },
    {
      value: "roles",
      label: dictionary?.school?.settings?.roles || "Roles",
      icon: UserCog,
    },
    {
      value: "permissions",
      label: dictionary?.school?.settings?.permissionsPanel?.title || "Permissions",
      icon: Shield,
    },
    {
      value: "notifications",
      label: dictionary?.school?.settings?.notifications?.title || "Notifications",
      icon: Bell,
    },
    {
      value: "advanced",
      label: dictionary?.school?.settings?.advanced || "Advanced",
      icon: Database,
    },
  ], [dictionary]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2>{dictionary?.school?.settings?.title || 'Settings'}</h2>
        <p className="text-muted-foreground">
          {dictionary?.school?.settings?.description || 'Manage your school settings, users, roles, and permissions'}
        </p>
      </div>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        {/* Custom Tab Navigation */}
        <div className="relative">
          <ScrollArea className="max-w-[600px] lg:max-w-none">
            <nav className="flex items-center gap-2 rtl:flex-row-reverse">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.value}
                    onClick={() => setActiveTab(tab.value)}
                    className={cn(
                      "flex h-7 items-center justify-center gap-2 rounded-full px-4 text-center text-sm transition-colors hover:text-primary",
                      activeTab === tab.value
                        ? "bg-muted text-primary"
                        : "text-muted-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
            <ScrollBar orientation="horizontal" className="invisible" />
          </ScrollArea>
        </div>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <React.Suspense fallback={<LoadingFallback />}>
            <BasicSettings dictionary={dictionary} lang={lang} />
          </React.Suspense>
        </TabsContent>

        {/* User Management */}
        <TabsContent value="users" className="space-y-6">
          <React.Suspense fallback={<LoadingFallback />}>
            <RoleManagement
              dictionary={dictionary.school}
              currentUserId={session?.user?.id}
              isDeveloperMode={isDeveloperMode || isDeveloper}
            />
          </React.Suspense>
        </TabsContent>

        {/* Role Switcher */}
        <TabsContent value="roles" className="space-y-6">
          <React.Suspense fallback={<LoadingFallback />}>
            <RoleSwitcher
              currentRole={(session?.user?.role || "USER") as import("./role-management").UserRole}
              currentUserId={session?.user?.id}
              schoolId={school?.id}
              dictionary={dictionary.school}
            />
          </React.Suspense>
        </TabsContent>

        {/* Permissions Management */}
        <TabsContent value="permissions" className="space-y-6">
          <React.Suspense fallback={<LoadingFallback />}>
            <PermissionsPanel
              currentRole={(session?.user?.role || "USER") as import("./role-management").UserRole}
              isDeveloperMode={isDeveloperMode || isDeveloper}
              dictionary={dictionary.school}
            />
          </React.Suspense>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <React.Suspense fallback={<LoadingFallback />}>
            <NotificationSettings dictionary={dictionary.school} />
          </React.Suspense>
        </TabsContent>

        {/* Advanced Settings */}
        <TabsContent value="advanced" className="space-y-6">
          <AdvancedSettings
            isDeveloper={isDeveloper}
            isAdmin={isAdmin}
            schoolId={school?.id}
            dictionary={dictionary}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Loading Fallback Component
function LoadingFallback() {
  return (
    <div className="space-y-4">
      <div className="h-32 bg-muted animate-pulse rounded-lg" />
      <div className="h-32 bg-muted animate-pulse rounded-lg" />
      <div className="h-32 bg-muted animate-pulse rounded-lg" />
    </div>
  );
}

// Advanced Settings Component
function AdvancedSettings({
  isDeveloper,
  isAdmin,
  schoolId,
  dictionary,
}: {
  isDeveloper: boolean;
  isAdmin: boolean;
  schoolId?: string;
  dictionary: Dictionary;
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
            {dictionary?.school?.settings?.databaseOperations || 'Database Operations'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {dictionary?.school?.settings?.manageDatabaseOperations || 'Manage database and system operations'}
          </p>
        </div>

        <div className="space-y-4">
          {/* Data Export */}
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div>
              <p className="font-medium">{dictionary?.school?.settings?.exportSchoolData || 'Export School Data'}</p>
              <p className="text-sm text-muted-foreground">
                {dictionary?.school?.settings?.downloadAllData || 'Download all school data in CSV/Excel format'}
              </p>
            </div>
            <button
              onClick={handleDataExport}
              disabled={dataExportLoading}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              {dataExportLoading ? (dictionary?.school?.settings?.exporting || 'Exporting...') : (dictionary?.school?.settings?.exportData || 'Export Data')}
            </button>
          </div>

          {/* Cache Management */}
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div>
              <p className="font-medium">{dictionary?.school?.settings?.clearCache || 'Clear Cache'}</p>
              <p className="text-sm text-muted-foreground">
                {dictionary?.school?.settings?.clearBrowserCache || 'Clear browser cache and temporary data'}
              </p>
            </div>
            <button
              onClick={handleCacheClear}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
            >
              {cacheCleared ? (dictionary?.school?.settings?.cacheCleared || 'Cache Cleared!') : (dictionary?.school?.settings?.clearCache || 'Clear Cache')}
            </button>
          </div>

          {/* System Info */}
          <div className="p-4 rounded-lg border bg-muted/50">
            <p className="font-medium mb-2">System Information</p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{dictionary?.school?.settings?.schoolId || 'School ID:'}</span>
                <span className="font-mono">{schoolId || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{dictionary?.school?.settings?.version || 'Version:'}</span>
                <span>v1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{dictionary?.school?.settings?.environment || 'Environment:'}</span>
                <span>{process.env.NODE_ENV}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{dictionary?.school?.settings?.apiStatus || 'API Status:'}</span>
                <span className="text-green-600">{dictionary?.school?.settings?.operational || 'Operational'}</span>
              </div>
            </div>
          </div>

          {/* Developer Tools (Only for developers) */}
          {isDeveloper && (
            <div className="p-4 rounded-lg border border-purple-200 bg-purple-50 dark:bg-purple-950/20">
              <p className="font-medium mb-2 text-purple-700 dark:text-purple-400">
                {dictionary?.school?.settings?.developerTools || 'Developer Tools'}
              </p>
              <div className="space-y-2">
                <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm">
                  {dictionary?.school?.settings?.runDatabaseMigrations || 'Run Database Migrations'}
                </button>
                <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm">
                  {dictionary?.school?.settings?.seedTestData || 'Seed Test Data'}
                </button>
                <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm">
                  {dictionary?.school?.settings?.viewDebugLogs || 'View Debug Logs'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* API Settings */}
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div>
          <h3 className="mb-1">{dictionary?.school?.settings?.apiSettings || 'API Settings'}</h3>
          <p className="text-sm text-muted-foreground">
            {dictionary?.school?.settings?.configureApiAccess || 'Configure API access and webhooks'}
          </p>
        </div>

        <div className="space-y-4">
          {/* API Key */}
          <div className="p-4 rounded-lg border">
            <p className="font-medium mb-2">{dictionary?.school?.settings?.apiKey || 'API Key'}</p>
            <div className="flex items-center gap-2">
              <input
                type="password"
                value="sk_live_••••••••••••••••"
                className="flex-1 px-3 py-2 border rounded-md bg-background"
                readOnly
              />
              <button className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90">
                {dictionary?.school?.settings?.regenerate || 'Regenerate'}
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {dictionary?.school?.settings?.useKeyToAuthenticate || 'Use this key to authenticate API requests'}
            </p>
          </div>

          {/* Webhooks */}
          <div className="p-4 rounded-lg border">
            <p className="font-medium mb-2">{dictionary?.school?.settings?.webhooks || 'Webhooks'}</p>
            <p className="text-sm text-muted-foreground mb-3">
              {dictionary?.school?.settings?.configureWebhooks || 'Configure webhook endpoints for real-time events'}
            </p>
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
              {dictionary?.school?.settings?.configureWebhooksButton || 'Configure Webhooks'}
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone (Admin/Developer only) */}
      {(isDeveloper || isAdmin) && (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 p-6 space-y-4">
          <div>
            <h3 className="text-red-700 dark:text-red-400 mb-1">{dictionary?.school?.settings?.dangerZone || 'Danger Zone'}</h3>
            <p className="text-sm text-red-600 dark:text-red-500">
              {dictionary?.school?.settings?.irreversibleActions || 'These actions are irreversible. Please proceed with caution.'}
            </p>
          </div>

          <div className="space-y-4">
            {/* Reset School Data */}
            <div className="flex items-center justify-between p-4 rounded-lg border border-red-200">
              <div>
                <p className="font-medium text-red-700 dark:text-red-400">
                  {dictionary?.school?.settings?.resetSchoolData || 'Reset School Data'}
                </p>
                <p className="text-sm text-red-600 dark:text-red-500">
                  {dictionary?.school?.settings?.deleteAllData || 'Delete all school data and start fresh'}
                </p>
              </div>
              <button className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
                {dictionary?.school?.settings?.resetData || 'Reset Data'}
              </button>
            </div>

            {/* Delete School */}
            {isDeveloper && (
              <div className="flex items-center justify-between p-4 rounded-lg border border-red-200">
                <div>
                  <p className="font-medium text-red-700 dark:text-red-400">
                    {dictionary?.school?.settings?.deleteSchool || 'Delete School'}
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-500">
                    {dictionary?.school?.settings?.permanentlyDelete || 'Permanently delete this school and all associated data'}
                  </p>
                </div>
                <button className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
                  {dictionary?.school?.settings?.deleteSchool || 'Delete School'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}