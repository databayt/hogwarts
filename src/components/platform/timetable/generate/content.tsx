'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { type Dictionary } from '@/components/internationalization/dictionaries'
import { type Locale } from '@/components/internationalization/config'

interface Props {
  dictionary: Dictionary['school']
  lang: Locale
}

export default function GenerateTimetableContent({ dictionary, lang }: Props) {
  const d = dictionary?.timetable

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{d?.generate?.title || 'Generate Timetable'}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="muted">{d?.generate?.description || 'Automated timetable generation with conflict detection.'}</p>
        </CardContent>
      </Card>
    </div>
  )
}
