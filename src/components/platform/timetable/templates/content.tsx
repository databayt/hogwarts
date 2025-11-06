import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SearchParams } from 'nuqs/server'
import { type Dictionary } from '@/components/internationalization/dictionaries'

interface Props {
  searchParams: Promise<SearchParams>
  dictionary: Dictionary['school']
}

export default async function TimetableTemplatesContent({ searchParams, dictionary }: Props) {
  const d = dictionary?.timetable

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{d?.templates?.title || 'Timetable Templates'}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="muted">{d?.templates?.description || 'Save and reuse timetable patterns.'}</p>
        </CardContent>
      </Card>
    </div>
  )
}
