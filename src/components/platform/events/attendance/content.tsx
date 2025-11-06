import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SearchParams } from 'nuqs/server'
import { type Dictionary } from '@/components/internationalization/dictionaries'

interface Props {
  searchParams: Promise<SearchParams>
  dictionary: Dictionary
}

export default async function EventAttendanceContent({ searchParams, dictionary }: Props) {
  const d = dictionary?.events

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{d?.attendance?.title || 'Event Attendance'}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="muted">{d?.attendance?.description || 'Track event attendance and RSVP status.'}</p>
        </CardContent>
      </Card>
    </div>
  )
}
