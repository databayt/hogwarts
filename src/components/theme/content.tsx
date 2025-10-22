/**
 * Theme Content Component
 *
 * Main composition for the theme customization settings page.
 */

'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PresetGallery } from './preset-gallery'
import { ThemeImportExport } from './import-export'
import { Palette, Settings, Download } from 'lucide-react'
import type { Locale } from '@/components/internationalization/config'

interface ThemeContentProps {
  dictionary: any
  lang: Locale
}

export function ThemeContent({ dictionary, lang }: ThemeContentProps) {
  return (
    <div className="container mx-auto space-y-8 py-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Appearance Settings</h1>
        <p className="text-muted-foreground">
          Customize your platform appearance with beautiful preset themes or create your own.
        </p>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="presets" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="presets" className="gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Presets</span>
          </TabsTrigger>
          <TabsTrigger value="custom" className="gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Custom</span>
          </TabsTrigger>
          <TabsTrigger value="import-export" className="gap-2">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Import/Export</span>
          </TabsTrigger>
        </TabsList>

        {/* Preset Themes Tab */}
        <TabsContent value="presets" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Preset Themes</CardTitle>
              <CardDescription>
                Choose from our curated collection of beautiful themes. Click on any theme to apply
                it instantly.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PresetGallery />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Custom Theme Tab */}
        <TabsContent value="custom" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Custom Theme Builder</CardTitle>
              <CardDescription>
                Create your own custom theme by adjusting colors, typography, and spacing.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-dashed p-12 text-center">
                <Palette className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 font-semibold">Custom Theme Builder</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Advanced theme customization coming soon. For now, you can import/export themes or
                  use our preset collection.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Import/Export Tab */}
        <TabsContent value="import-export" className="space-y-6">
          <ThemeImportExport />

          <Card>
            <CardHeader>
              <CardTitle>Theme Format</CardTitle>
              <CardDescription>
                Themes are exported as JSON files containing all color, spacing, and typography
                configurations.
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
                        dark: { background: 'oklch(...)', primary: 'oklch(...)' },
                      },
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
