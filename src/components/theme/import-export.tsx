/**
 * Theme Import/Export Component
 *
 * Allows users to export their themes as JSON and import themes from JSON files.
 */

'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Download, Upload, Loader2 } from 'lucide-react'
import { useThemeImportExport, useUserTheme, useThemeOperations } from './use-theme'
import { toast } from 'sonner'

export function ThemeImportExport() {
  const { themeState } = useUserTheme()
  const { exportTheme, importTheme, isExporting, isImporting } = useThemeImportExport()
  const { saveTheme } = useThemeOperations()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importedTheme, setImportedTheme] = useState<any>(null)

  const handleExport = () => {
    if (!themeState) {
      toast.error('No active theme to export')
      return
    }
    exportTheme('my-theme')
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const theme = await importTheme(file)
    if (theme) {
      setImportedTheme(theme)
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSaveImportedTheme = async () => {
    if (!importedTheme) return

    await saveTheme('Imported Theme')
    setImportedTheme(null)
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Export Theme */}
      <Card>
        <CardHeader>
          <CardTitle>Export Theme</CardTitle>
          <CardDescription>Download your current theme as a JSON file</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleExport} disabled={isExporting || !themeState} className="w-full">
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export Theme
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Import Theme */}
      <Card>
        <CardHeader>
          <CardTitle>Import Theme</CardTitle>
          <CardDescription>Upload a theme JSON file to add it to your collection</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            className="hidden"
            id="theme-file-input"
          />

          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            variant="outline"
            className="w-full"
          >
            {isImporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Choose File
              </>
            )}
          </Button>

          {importedTheme && (
            <div className="rounded-lg border bg-muted p-4">
              <h4 className="mb-1 font-medium">{importedTheme.name}</h4>
              {importedTheme.description && (
                <p className="mb-3 text-sm text-muted-foreground">{importedTheme.description}</p>
              )}
              <Button onClick={handleSaveImportedTheme} size="sm" className="w-full">
                Save Imported Theme
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
