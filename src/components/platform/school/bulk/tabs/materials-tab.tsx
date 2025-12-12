'use client'

import type { Locale } from '@/components/internationalization/config'
import type { Dictionary } from '@/components/internationalization/dictionaries'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Upload, Download, BookOpen } from 'lucide-react'

interface Props {
  dictionary: Dictionary
  lang: Locale
}

export function MaterialsTab({ dictionary, lang }: Props) {
  function downloadTemplate() {
    const template = 'Title,Type,Subject,Grade,Description,URL\nAlgebra Basics,Video,Mathematics,Grade 10,Introduction to algebraic expressions,https://example.com/video1\nPhysics Lab Manual,PDF,Physics,Grade 11,Laboratory experiments guide,https://example.com/doc1'
    const blob = new Blob([template], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'materials-template.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle>Bulk Materials Import</CardTitle>
              <CardDescription>
                Import learning materials and resources from CSV.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={downloadTemplate}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download Template
            </Button>
            <div className="flex-1">
              <Input
                type="file"
                accept=".csv"
                disabled
              />
            </div>
            <Button disabled>
              <Upload className="mr-2 h-4 w-4" />
              Coming Soon
            </Button>
          </div>

          <div className="rounded-md border p-4">
            <h4 className="font-medium mb-2">CSV Format</h4>
            <code className="text-sm text-muted-foreground block">
              Title,Type,Subject,Grade,Description,URL
            </code>
            <p className="text-xs text-muted-foreground mt-2">
              Type options: Video, PDF, Document, Link, Image
            </p>
          </div>

          <div className="rounded-md bg-muted p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Bulk materials import will be available in a future update.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
