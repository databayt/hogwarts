import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SearchParams } from 'nuqs/server'
import { type Dictionary } from '@/components/internationalization/dictionaries'

interface Props {
  searchParams: Promise<SearchParams>
  dictionary: Dictionary
}

export default async function TimetableByRoomContent({ searchParams, dictionary }: Props) {
  const d = dictionary?.timetable

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{d?.byRoom?.title || 'Timetable by Room'}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="muted">{d?.byRoom?.description || 'View room allocation and timetables filtered by room.'}</p>
        </CardContent>
      </Card>
    </div>
  )
}
