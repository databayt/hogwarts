import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SearchParams } from 'nuqs/server'
import { type Dictionary } from '@/components/internationalization/dictionaries'

interface Props {
  searchParams: Promise<SearchParams>
  dictionary: Dictionary
}

export default async function EventCalendarContent({ searchParams, dictionary }: Props) {
  const d = dictionary?.events

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{d?.calendar?.title || 'Event Calendar'}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="muted">{d?.calendar?.description || 'Monthly and weekly calendar view of all events will be displayed here.'}</p>
        </CardContent>
      </Card>
    </div>
  )
}
