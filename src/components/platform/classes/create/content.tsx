'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { type Dictionary } from '@/components/internationalization/dictionaries'
import { type Locale } from '@/components/internationalization/config'

interface Props {
  dictionary: Dictionary['school']
  lang: Locale
}

export default function CreateClassContent({ dictionary, lang }: Props) {
  const d = dictionary?.classes

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{d?.create?.title || 'Create New Class'}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="muted">{d?.create?.description || 'Class creation form will be implemented here.'}</p>
        </CardContent>
      </Card>
    </div>
  )
}
