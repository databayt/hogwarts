import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SearchParams } from 'nuqs/server'
import { type Dictionary } from '@/components/internationalization/dictionaries'

interface Props {
  searchParams: Promise<SearchParams>
  dictionary: Dictionary['school']
}

export default async function ClassSubjectsContent({ searchParams, dictionary }: Props) {
  const d = dictionary?.classes

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{d?.subjects?.title || 'Classes by Subject'}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="muted">{d?.subjects?.description || 'Classes organized by subject will be displayed here.'}</p>
        </CardContent>
      </Card>
    </div>
  )
}
