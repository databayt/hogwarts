'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { type Dictionary } from '@/components/internationalization/dictionaries'
import { type Locale } from '@/components/internationalization/config'

interface Props {
  dictionary: Dictionary
  lang: Locale
}

export default function TimetableSettingsContent({ dictionary, lang }: Props) {
  const d = dictionary?.timetable

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{d?.settings?.title || 'Timetable Settings'}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="muted">{d?.settings?.description || 'Configure periods, bells, scheduling constraints, and module settings.'}</p>
        </CardContent>
      </Card>
    </div>
  )
}
