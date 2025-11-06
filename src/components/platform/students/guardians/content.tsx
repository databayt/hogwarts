import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SearchParams } from 'nuqs/server'
import { type Dictionary } from '@/components/internationalization/dictionaries'

interface Props {
  searchParams: Promise<SearchParams>
  dictionary: Dictionary['school']
}

export default async function GuardiansContent({ searchParams, dictionary }: Props) {
  const d = dictionary?.students

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{d?.guardians?.title || 'Guardians'}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="muted">{d?.guardians?.description || 'Guardian management and relationships will be managed here.'}</p>
        </CardContent>
      </Card>
    </div>
  )
}
