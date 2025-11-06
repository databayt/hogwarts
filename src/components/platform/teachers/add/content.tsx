'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { type Dictionary } from '@/components/internationalization/dictionaries'
import { type Locale } from '@/components/internationalization/config'

interface Props {
  dictionary: Dictionary['school']
  lang: Locale
}

export default function AddTeacherContent({ dictionary, lang }: Props) {
  const d = dictionary?.teachers

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{d?.add?.title || 'Add New Teacher'}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="muted">{d?.add?.description || 'Teacher creation form will be implemented here.'}</p>
        </CardContent>
      </Card>
    </div>
  )
}
