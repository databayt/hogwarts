/**
 * Appearance Settings Component
 *
 * Theme customization settings for the platform.
 * Integrated into main settings page as a tab.
 *
 * Features:
 * - Preset theme gallery
 * - Custom theme builder
 * - Import/export themes
 * - Live preview
 * - WCAG contrast checking
 */

'use client'

import * as React from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Palette, Settings, Download, Eye } from "lucide-react"
import type { Locale } from '@/components/internationalization/config'
import type { Dictionary } from '@/components/internationalization/dictionaries'

// Lazy load heavy components for better performance
const PresetGallery = React.lazy(() =>
  import('@/components/theme/preset-gallery').then(m => ({ default: m.PresetGallery }))
)
const ThemeImportExport = React.lazy(() =>
  import('@/components/theme/import-export').then(m => ({ default: m.ThemeImportExport }))
)

interface AppearanceSettingsProps {
  dictionary: Dictionary
  lang: Locale
}

export function AppearanceSettings({ dictionary, lang }: AppearanceSettingsProps) {
  const [activeTab, setActiveTab] = React.useState('presets')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h3>{dictionary?.school?.settings?.appearanceTitle || 'Appearance Settings'}</h3>
        <p className="muted">
          {dictionary?.school?.settings?.appearanceDescription ||
            'Customize your platform appearance with beautiful preset themes or create your own.'}
        </p>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="presets" className="gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">
              {dictionary?.school?.settings?.presets || 'Presets'}
            </span>
          </TabsTrigger>
          <TabsTrigger value="custom" className="gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">
              {dictionary?.school?.settings?.custom || 'Custom'}
            </span>
          </TabsTrigger>
          <TabsTrigger value="import-export" className="gap-2">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">
              {dictionary?.school?.settings?.importExport || 'Import/Export'}
            </span>
          </TabsTrigger>
        </TabsList>

        {/* Preset Themes Tab */}
        <TabsContent value="presets" className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <h4>{dictionary?.school?.settings?.presetThemes || 'Preset Themes'}</h4>
              <p className="muted">
                {dictionary?.school?.settings?.presetThemesDescription ||
                  'Choose from our curated collection of beautiful themes. Click on any theme to apply it instantly.'}
              </p>
            </div>
            <React.Suspense fallback={<PresetGalleryLoading />}>
              <PresetGallery />
            </React.Suspense>
          </div>
        </TabsContent>

        {/* Custom Theme Tab */}
        <TabsContent value="custom" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                {dictionary?.school?.settings?.customThemeBuilder || 'Custom Theme Builder'}
              </CardTitle>
              <CardDescription>
                {dictionary?.school?.settings?.customThemeBuilderDescription ||
                  'Create your own custom theme by adjusting colors, typography, and spacing.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-dashed p-12 text-center">
                <Palette className="mx-auto h-12 w-12 text-muted-foreground" />
                <h4 className="mt-4">
                  {dictionary?.school?.settings?.customThemeBuilderTitle || 'Custom Theme Builder'}
                </h4>
                <p className="muted mt-2">
                  {dictionary?.school?.settings?.customThemeBuilderComingSoon ||
                    'Advanced theme customization coming soon. For now, you can import/export themes or use our preset collection.'}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Import/Export Tab */}
        <TabsContent value="import-export" className="space-y-6">
          <React.Suspense fallback={<ImportExportLoading />}>
            <ThemeImportExport />
          </React.Suspense>

          <Card>
            <CardHeader>
              <CardTitle>
                {dictionary?.school?.settings?.themeFormat || 'Theme Format'}
              </CardTitle>
              <CardDescription>
                {dictionary?.school?.settings?.themeFormatDescription ||
                  'Themes are exported as JSON files containing all color, spacing, and typography configurations.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg bg-muted p-4 font-mono text-sm">
                <pre className="overflow-x-auto">
                  {JSON.stringify(
                    {
                      version: '1.0',
                      name: 'My Theme',
                      config: {
                        light: { background: 'oklch(...)', primary: 'oklch(...)' },
                        dark: { background: 'oklch(...)', primary: 'oklch(...)' }
                      }
                    },
                    null,
                    2
                  )}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

/**
 * Loading Skeleton for Preset Gallery
 */
function PresetGalleryLoading() {
  return (
    <div className="flex flex-wrap gap-3">
      {Array.from({ length: 16 }).map((_, i) => (
        <div key={i} className="h-[88px] w-[140px] animate-pulse rounded-lg bg-muted" />
      ))}
    </div>
  )
}

/**
 * Loading Skeleton for Import/Export
 */
function ImportExportLoading() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="h-[200px] animate-pulse rounded-lg bg-muted" />
      <div className="h-[200px] animate-pulse rounded-lg bg-muted" />
    </div>
  )
}
