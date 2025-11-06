'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { type Dictionary } from '@/components/internationalization/dictionaries'
import { type Locale } from '@/components/internationalization/config'

interface Props {
  dictionary: Dictionary['school']
  lang: Locale
}

export default function EventSettingsContent({ dictionary, lang }: Props) {
  const d = dictionary?.events

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{d?.settings?.title || 'Event Settings'}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="muted">{d?.settings?.description || 'Event types, notification rules, and module configurations will be available here.'}</p>
        </CardContent>
      </Card>
    </div>
  )
}
