import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SearchParams } from 'nuqs/server'
import { type Dictionary } from '@/components/internationalization/dictionaries'

interface Props {
  searchParams: Promise<SearchParams>
  dictionary: Dictionary['school']
}

export default async function TeacherScheduleContent({ searchParams, dictionary }: Props) {
  const d = dictionary?.teachers

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{d?.schedule?.title || 'Teacher Schedule'}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="muted">{d?.schedule?.description || 'Teacher schedules and workload overview will be displayed here.'}</p>
        </CardContent>
      </Card>
    </div>
  )
}
