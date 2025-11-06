import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SearchParams } from 'nuqs/server'
import { type Dictionary } from '@/components/internationalization/dictionaries'

interface Props {
  searchParams: Promise<SearchParams>
  dictionary: Dictionary['school']
}

export default async function TimetableByClassContent({ searchParams, dictionary }: Props) {
  const d = dictionary?.timetable

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{d?.byClass?.title || 'Timetable by Class'}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="muted">{d?.byClass?.description || 'View timetables filtered by class.'}</p>
        </CardContent>
      </Card>
    </div>
  )
}
