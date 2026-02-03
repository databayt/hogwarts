"use client"

import * as React from "react"
import { Database } from "lucide-react"
import { useSession } from "next-auth/react"

import { cn } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { type Locale } from "@/components/internationalization/config"
import { type Dictionary } from "@/components/internationalization/dictionaries"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"
import { useSchool } from "@/components/school-dashboard/context/school-context"

// Lazy load heavy components for better initial page load performance
const BasicSettings = React.lazy(() =>
  import("./content").then((m) => ({ default: m.SettingsContent }))
)
const RoleManagement = React.lazy(() =>
  import("./role-management").then((m) => ({ default: m.RoleManagement }))
)
const RoleSwitcher = React.lazy(() =>
  import("./role-switcher").then((m) => ({ default: m.RoleSwitcher }))
)
const PermissionsPanel = React.lazy(() =>
  import("./permissions-panel").then((m) => ({ default: m.PermissionsPanel }))
)
const NotificationSettings = React.lazy(() =>
  import("./notification-settings").then((m) => ({
    default: m.NotificationSettings,
  }))
)
const AppearanceSettings = React.lazy(() =>
  import("./appearance-settings").then((m) => ({
    default: m.AppearanceSettings,
  }))
)

interface Props {
  dictionary: Dictionary
  lang: Locale
}

export function EnhancedSettingsContent({ dictionary, lang }: Props) {
  const { school } = useSchool()
  const { data: session } = useSession()

  // Active tab state
  const [activeTab, setActiveTab] = React.useState("general")

  // Check if user has developer or admin access
  const isDeveloper = session?.user?.role === "DEVELOPER"
  const isAdmin = session?.user?.role === "ADMIN"
  const hasFullAccess = isDeveloper || isAdmin

  // Check for developer mode from localStorage
  const [isDeveloperMode, setIsDeveloperMode] = React.useState(false)

  React.useEffect(() => {
    const devMode = localStorage.getItem("developer-mode") === "true"
    setIsDeveloperMode(devMode)
  }, [])

  // Tab configuration
  const tabs = React.useMemo(
    () => [
      {
        value: "general",
        label: dictionary?.school?.settings?.general || "General",
      },
      {
        value: "users",
        label: dictionary?.school?.settings?.users || "Users",
      },
      {
        value: "roles",
        label: dictionary?.school?.settings?.roles || "Roles",
      },
      {
        value: "permissions",
        label: dictionary?.school?.settings?.permissions || "Permissions",
      },
      {
        value: "notifications",
        label: dictionary?.school?.settings?.notifications || "Notifications",
      },
      {
        value: "appearance",
        label: dictionary?.school?.settings?.appearance || "Appearance",
      },
      {
        value: "advanced",
        label: dictionary?.school?.settings?.advanced || "Advanced",
      },
    ],
    [dictionary]
  )

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeadingSetter
        title={dictionary?.school?.settings?.title || "Settings"}
      />

      {/* Settings Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        {/* Tab Navigation with Bottom Border Indicator */}
        <div className="border-b">
          <ScrollArea className="max-w-[600px] lg:max-w-none">
            <nav className="flex items-center gap-6 rtl:flex-row-reverse">
              {tabs.map((tab) => {
                return (
                  <button
                    key={tab.value}
                    onClick={() => setActiveTab(tab.value)}
                    className={cn(
                      "hover:text-primary relative px-1 pb-3 text-sm font-medium whitespace-nowrap transition-colors",
                      activeTab === tab.value
                        ? "text-primary"
                        : "text-muted-foreground"
                    )}
                  >
                    {tab.label}
                    {activeTab === tab.value && (
                      <span className="bg-primary absolute right-0 bottom-0 left-0 h-0.5" />
                    )}
                  </button>
                )
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
              currentRole={
                (session?.user?.role ||
                  "USER") as import("./role-management").UserRole
              }
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
              currentRole={
                (session?.user?.role ||
                  "USER") as import("./role-management").UserRole
              }
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

        {/* Appearance Settings */}
        <TabsContent value="appearance" className="space-y-6">
          <React.Suspense fallback={<LoadingFallback />}>
            <AppearanceSettings dictionary={dictionary} lang={lang} />
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
  )
}

// Loading Fallback Component
function LoadingFallback() {
  return (
    <div className="space-y-4">
      <div className="bg-muted h-32 animate-pulse rounded-lg" />
      <div className="bg-muted h-32 animate-pulse rounded-lg" />
      <div className="bg-muted h-32 animate-pulse rounded-lg" />
    </div>
  )
}

// Advanced Settings Component
function AdvancedSettings({
  isDeveloper,
  isAdmin,
  schoolId,
  dictionary,
}: {
  isDeveloper: boolean
  isAdmin: boolean
  schoolId?: string
  dictionary: Dictionary
}) {
  const [dataExportLoading, setDataExportLoading] = React.useState(false)
  const [cacheCleared, setCacheCleared] = React.useState(false)

  const handleDataExport = async () => {
    setDataExportLoading(true)
    try {
      // In production, this would trigger a data export
      await new Promise((resolve) => setTimeout(resolve, 2000))
      alert("Data export initiated. You will receive an email when ready.")
    } finally {
      setDataExportLoading(false)
    }
  }

  const handleCacheClear = async () => {
    localStorage.clear()
    sessionStorage.clear()
    setCacheCleared(true)
    setTimeout(() => setCacheCleared(false), 3000)
  }

  return (
    <div className="space-y-6">
      {/* Database Operations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 rtl:flex-row-reverse">
            <Database className="h-5 w-5" />
            {dictionary?.school?.settings?.databaseOperations ||
              "Database Operations"}
          </CardTitle>
          <CardDescription>
            {dictionary?.school?.settings?.manageDatabaseOperations ||
              "Manage database and system operations"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Data Export */}
          <div className="bg-background flex items-center justify-between rounded-xl p-4 rtl:flex-row-reverse">
            <div>
              <p className="font-medium">
                {dictionary?.school?.settings?.exportSchoolData ||
                  "Export School Data"}
              </p>
              <p className="text-muted-foreground text-sm">
                {dictionary?.school?.settings?.downloadAllData ||
                  "Download all school data in CSV/Excel format"}
              </p>
            </div>
            <button
              onClick={handleDataExport}
              disabled={dataExportLoading}
              className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0 rounded-md px-4 py-2 disabled:opacity-50"
            >
              {dataExportLoading
                ? dictionary?.school?.settings?.exporting || "Exporting..."
                : dictionary?.school?.settings?.exportData || "Export Data"}
            </button>
          </div>

          {/* Cache Management */}
          <div className="bg-background flex items-center justify-between rounded-xl p-4 rtl:flex-row-reverse">
            <div>
              <p className="font-medium">
                {dictionary?.school?.settings?.clearCache || "Clear Cache"}
              </p>
              <p className="text-muted-foreground text-sm">
                {dictionary?.school?.settings?.clearBrowserCache ||
                  "Clear browser cache and temporary data"}
              </p>
            </div>
            <button
              onClick={handleCacheClear}
              className="bg-secondary text-secondary-foreground hover:bg-secondary/90 shrink-0 rounded-md px-4 py-2"
            >
              {cacheCleared
                ? dictionary?.school?.settings?.cacheCleared || "Cache Cleared!"
                : dictionary?.school?.settings?.clearCache || "Clear Cache"}
            </button>
          </div>

          {/* System Info */}
          <div className="bg-background rounded-xl p-4">
            <p className="mb-2 font-medium">System Information</p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between rtl:flex-row-reverse">
                <span className="text-muted-foreground">
                  {dictionary?.school?.settings?.schoolId || "School ID:"}
                </span>
                <span className="font-mono">{schoolId || "N/A"}</span>
              </div>
              <div className="flex justify-between rtl:flex-row-reverse">
                <span className="text-muted-foreground">
                  {dictionary?.school?.settings?.version || "Version:"}
                </span>
                <span>v1.0.0</span>
              </div>
              <div className="flex justify-between rtl:flex-row-reverse">
                <span className="text-muted-foreground">
                  {dictionary?.school?.settings?.environment || "Environment:"}
                </span>
                <span>{process.env.NODE_ENV}</span>
              </div>
              <div className="flex justify-between rtl:flex-row-reverse">
                <span className="text-muted-foreground">
                  {dictionary?.school?.settings?.apiStatus || "API Status:"}
                </span>
                <span className="text-chart-2">
                  {dictionary?.school?.settings?.operational || "Operational"}
                </span>
              </div>
            </div>
          </div>

          {/* Developer Tools (Only for developers) */}
          {isDeveloper && (
            <div className="bg-chart-3/10 rounded-xl p-4">
              <p className="text-chart-3 mb-2 font-medium">
                {dictionary?.school?.settings?.developerTools ||
                  "Developer Tools"}
              </p>
              <div className="space-y-2">
                <button className="bg-chart-3 hover:bg-chart-3/90 w-full rounded-md px-4 py-2 text-sm text-white">
                  {dictionary?.school?.settings?.runDatabaseMigrations ||
                    "Run Database Migrations"}
                </button>
                <button className="bg-chart-3 hover:bg-chart-3/90 w-full rounded-md px-4 py-2 text-sm text-white">
                  {dictionary?.school?.settings?.seedTestData ||
                    "Seed Test Data"}
                </button>
                <button className="bg-chart-3 hover:bg-chart-3/90 w-full rounded-md px-4 py-2 text-sm text-white">
                  {dictionary?.school?.settings?.viewDebugLogs ||
                    "View Debug Logs"}
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* API Settings */}
      <Card>
        <CardHeader>
          <CardTitle>
            {dictionary?.school?.settings?.apiSettings || "API Settings"}
          </CardTitle>
          <CardDescription>
            {dictionary?.school?.settings?.configureApiAccess ||
              "Configure API access and webhooks"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* API Key */}
          <div className="bg-background rounded-xl p-4">
            <p className="mb-2 font-medium">
              {dictionary?.school?.settings?.apiKey || "API Key"}
            </p>
            <div className="flex items-center gap-2 rtl:flex-row-reverse">
              <input
                type="password"
                value="sk_live_••••••••••••••••"
                className="bg-background flex-1 rounded-md border px-3 py-2"
                readOnly
              />
              <button className="bg-secondary text-secondary-foreground hover:bg-secondary/90 shrink-0 rounded-md px-4 py-2">
                {dictionary?.school?.settings?.regenerate || "Regenerate"}
              </button>
            </div>
            <p className="text-muted-foreground mt-2 text-xs">
              {dictionary?.school?.settings?.useKeyToAuthenticate ||
                "Use this key to authenticate API requests"}
            </p>
          </div>

          {/* Webhooks */}
          <div className="bg-background rounded-xl p-4">
            <p className="mb-2 font-medium">
              {dictionary?.school?.settings?.webhooks || "Webhooks"}
            </p>
            <p className="text-muted-foreground mb-3 text-sm">
              {dictionary?.school?.settings?.configureWebhooks ||
                "Configure webhook endpoints for real-time events"}
            </p>
            <button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2">
              {dictionary?.school?.settings?.configureWebhooksButton ||
                "Configure Webhooks"}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone (Admin/Developer only) */}
      {(isDeveloper || isAdmin) && (
        <Card className="bg-destructive/10">
          <CardHeader>
            <CardTitle className="text-destructive">
              {dictionary?.school?.settings?.dangerZone || "Danger Zone"}
            </CardTitle>
            <CardDescription className="text-destructive/80">
              {dictionary?.school?.settings?.irreversibleActions ||
                "These actions are irreversible. Please proceed with caution."}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Reset School Data */}
            <div className="bg-background flex items-center justify-between rounded-xl p-4 rtl:flex-row-reverse">
              <div>
                <p className="text-destructive font-medium">
                  {dictionary?.school?.settings?.resetSchoolData ||
                    "Reset School Data"}
                </p>
                <p className="text-destructive/80 text-sm">
                  {dictionary?.school?.settings?.deleteAllData ||
                    "Delete all school data and start fresh"}
                </p>
              </div>
              <button className="bg-destructive text-destructive-foreground hover:bg-destructive/90 shrink-0 rounded-md px-4 py-2">
                {dictionary?.school?.settings?.resetData || "Reset Data"}
              </button>
            </div>

            {/* Delete School */}
            {isDeveloper && (
              <div className="bg-background flex items-center justify-between rounded-xl p-4 rtl:flex-row-reverse">
                <div>
                  <p className="text-destructive font-medium">
                    {dictionary?.school?.settings?.deleteSchool ||
                      "Delete School"}
                  </p>
                  <p className="text-destructive/80 text-sm">
                    {dictionary?.school?.settings?.permanentlyDelete ||
                      "Permanently delete this school and all associated data"}
                  </p>
                </div>
                <button className="bg-destructive text-destructive-foreground hover:bg-destructive/90 shrink-0 rounded-md px-4 py-2">
                  {dictionary?.school?.settings?.deleteSchool ||
                    "Delete School"}
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
