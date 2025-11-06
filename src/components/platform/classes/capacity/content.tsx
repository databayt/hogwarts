import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SearchParams } from 'nuqs/server'
import { type Dictionary } from '@/components/internationalization/dictionaries'

interface Props {
  searchParams: Promise<SearchParams>
  dictionary: Dictionary
}

export default async function ClassCapacityContent({ searchParams, dictionary }: Props) {
  const d = dictionary?.classes

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{d?.capacity?.title || 'Class Capacity Analysis'}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="muted">{d?.capacity?.description || 'Enrollment vs. capacity analytics for all classes will be displayed here.'}</p>
        </CardContent>
      </Card>
    </div>
  )
}
