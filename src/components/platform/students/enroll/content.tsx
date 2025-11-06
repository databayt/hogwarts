'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { type Dictionary } from '@/components/internationalization/dictionaries'
import { type Locale } from '@/components/internationalization/config'

interface Props {
  dictionary: Dictionary['school']
  lang: Locale
}

export default function EnrollStudentContent({ dictionary, lang }: Props) {
  const d = dictionary?.students

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{d?.enroll?.title || 'Enroll New Student'}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="muted">{d?.enroll?.description || 'Student enrollment form will be implemented here.'}</p>
        </CardContent>
      </Card>
    </div>
  )
}
