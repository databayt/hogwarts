import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SearchParams } from 'nuqs/server'
import { type Dictionary } from '@/components/internationalization/dictionaries'

interface Props {
  searchParams: Promise<SearchParams>
  dictionary: Dictionary['school']
}

export default async function RecurringEventsContent({ searchParams, dictionary }: Props) {
  const d = dictionary?.events

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{d?.recurring?.title || 'Recurring Events'}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="muted">{d?.recurring?.description || 'Manage recurring event patterns and schedules.'}</p>
        </CardContent>
      </Card>
    </div>
  )
}
