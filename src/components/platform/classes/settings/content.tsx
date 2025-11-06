'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { type Dictionary } from '@/components/internationalization/dictionaries'
import { type Locale } from '@/components/internationalization/config'

interface Props {
  dictionary: Dictionary
  lang: Locale
}

export default function ClassSettingsContent({ dictionary, lang }: Props) {
  const d = dictionary?.classes

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{d?.settings?.title || 'Class Settings'}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="muted">{d?.settings?.description || 'Class size limits, assignment rules, and module configurations will be available here.'}</p>
        </CardContent>
      </Card>
    </div>
  )
}
