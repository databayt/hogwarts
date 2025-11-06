import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SearchParams } from 'nuqs/server'
import { type Dictionary } from '@/components/internationalization/dictionaries'

interface Props {
  searchParams: Promise<SearchParams>
  dictionary: Dictionary
}

export default async function DepartmentsContent({ searchParams, dictionary }: Props) {
  const d = dictionary?.teachers

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{d?.departments?.title || 'Departments'}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="muted">{d?.departments?.description || 'Department management will be implemented here.'}</p>
        </CardContent>
      </Card>
    </div>
  )
}
