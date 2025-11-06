import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SearchParams } from 'nuqs/server'
import { type Dictionary } from '@/components/internationalization/dictionaries'

interface Props {
  searchParams: Promise<SearchParams>
  dictionary: Dictionary
}

export default async function TeacherPerformanceContent({ searchParams, dictionary }: Props) {
  const d = dictionary?.teachers

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{d?.performance?.title || 'Teacher Performance'}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="muted">{d?.performance?.description || 'Performance analytics and metrics will be displayed here.'}</p>
        </CardContent>
      </Card>
    </div>
  )
}
