'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { type Dictionary } from '@/components/internationalization/dictionaries'
import { type Locale } from '@/components/internationalization/config'

interface Props {
  dictionary: Dictionary
  lang: Locale
}

export default function LessonSettingsContent({ dictionary, lang }: Props) {
  const d = dictionary?.lessons

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{d?.settings?.title || 'Lesson Settings'}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="muted">{d?.settings?.description || 'Template defaults, sharing permissions, and module configurations will be available here.'}</p>
        </CardContent>
      </Card>
    </div>
  )
}
