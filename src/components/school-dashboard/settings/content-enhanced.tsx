"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import * as React from "react"

import { cn } from "@/lib/utils"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { type Locale } from "@/components/internationalization/config"
import { type Dictionary } from "@/components/internationalization/dictionaries"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"

import { ChangePasswordForm } from "./password/form"

// Lazy load heavy components for better initial page load performance
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
  hasPassword: boolean
}

export function EnhancedSettingsContent({
  dictionary,
  lang,
  hasPassword,
}: Props) {
  const [activeTab, setActiveTab] = React.useState("appearance")

  const tabs = React.useMemo(
    () => [
      {
        value: "appearance",
        label: dictionary?.school?.settings?.appearance || "Appearance",
      },
      {
        value: "notifications",
        label: dictionary?.school?.settings?.notifications || "Notifications",
      },
      {
        value: "password",
        label: dictionary?.school?.settings?.password || "Password",
      },
      {
        value: "language",
        label: dictionary?.school?.settings?.language || "Language",
      },
    ],
    [dictionary]
  )

  return (
    <div className="space-y-6">
      <PageHeadingSetter
        title={dictionary?.school?.settings?.title || "Settings"}
      />

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        {/* Tab Navigation */}
        <div className="border-b">
          <ScrollArea className="max-w-[600px] lg:max-w-none">
            <nav className="flex items-center gap-6">
              {tabs.map((tab) => (
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
                    <span className="bg-primary absolute start-0 end-0 bottom-0 h-0.5" />
                  )}
                </button>
              ))}
            </nav>
            <ScrollBar orientation="horizontal" className="invisible" />
          </ScrollArea>
        </div>

        {/* Appearance */}
        <TabsContent value="appearance" className="space-y-6">
          <React.Suspense fallback={<LoadingFallback />}>
            <AppearanceSettings dictionary={dictionary} lang={lang} />
          </React.Suspense>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-6">
          <React.Suspense fallback={<LoadingFallback />}>
            <NotificationSettings dictionary={dictionary.school} />
          </React.Suspense>
        </TabsContent>

        {/* Password */}
        <TabsContent value="password" className="space-y-6">
          <ChangePasswordForm hasPassword={hasPassword} />
        </TabsContent>

        {/* Language */}
        <TabsContent value="language" className="space-y-6">
          <LanguagePreference lang={lang} dictionary={dictionary} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="space-y-4">
      <div className="bg-muted h-32 animate-pulse rounded-lg" />
      <div className="bg-muted h-32 animate-pulse rounded-lg" />
      <div className="bg-muted h-32 animate-pulse rounded-lg" />
    </div>
  )
}

function LanguagePreference({
  lang,
  dictionary,
}: {
  lang: Locale
  dictionary: Dictionary
}) {
  const d = dictionary?.school?.settings

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3>{d?.languagePreference || "Language Preference"}</h3>
        <p className="text-muted-foreground text-sm">
          {d?.languageDescription ||
            "Choose your preferred display language. This affects the interface language for your account."}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <a
          href={`/ar${typeof window !== "undefined" ? window.location.pathname.replace(/^\/(ar|en)/, "") : ""}`}
          className={cn(
            "flex items-center gap-3 rounded-lg border p-4 transition-colors",
            lang === "ar"
              ? "border-primary bg-primary/5"
              : "hover:border-primary/50"
          )}
        >
          <span className="text-2xl">🇸🇦</span>
          <div>
            <p className="font-medium">العربية</p>
            <p className="text-muted-foreground text-sm">Arabic (RTL)</p>
          </div>
          {lang === "ar" && (
            <span className="bg-primary text-primary-foreground ms-auto rounded-full px-2 py-0.5 text-xs">
              {d?.active || "Active"}
            </span>
          )}
        </a>

        <a
          href={`/en${typeof window !== "undefined" ? window.location.pathname.replace(/^\/(ar|en)/, "") : ""}`}
          className={cn(
            "flex items-center gap-3 rounded-lg border p-4 transition-colors",
            lang === "en"
              ? "border-primary bg-primary/5"
              : "hover:border-primary/50"
          )}
        >
          <span className="text-2xl">🇬🇧</span>
          <div>
            <p className="font-medium">English</p>
            <p className="text-muted-foreground text-sm">English (LTR)</p>
          </div>
          {lang === "en" && (
            <span className="bg-primary text-primary-foreground ms-auto rounded-full px-2 py-0.5 text-xs">
              {d?.active || "Active"}
            </span>
          )}
        </a>
      </div>
    </div>
  )
}
