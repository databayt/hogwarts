import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SearchParams } from 'nuqs/server'
import { type Dictionary } from '@/components/internationalization/dictionaries'

interface Props {
  searchParams: Promise<SearchParams>
  dictionary: Dictionary
}

export default async function TimetableAnalyticsContent({ searchParams, dictionary }: Props) {
  const d = dictionary?.timetable

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{d?.analytics?.title || 'Timetable Analytics'}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="muted">{d?.analytics?.description || 'Teacher workload and room utilization analytics.'}</p>
        </CardContent>
      </Card>
    </div>
  )
}
