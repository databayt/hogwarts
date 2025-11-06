import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SearchParams } from 'nuqs/server'
import { type Dictionary } from '@/components/internationalization/dictionaries'

interface Props {
  searchParams: Promise<SearchParams>
  dictionary: Dictionary['school']
}

export default async function LessonAnalyticsContent({ searchParams, dictionary }: Props) {
  const d = dictionary?.lessons

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{d?.analytics?.title || 'Lesson Analytics'}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="muted">{d?.analytics?.description || 'Usage analytics and lesson effectiveness metrics will be displayed here.'}</p>
        </CardContent>
      </Card>
    </div>
  )
}
