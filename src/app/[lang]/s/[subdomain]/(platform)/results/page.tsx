import ResultsContent from '@/components/platform/results/content'
import { SearchParams } from 'nuqs/server'

export const metadata = { title: 'Dashboard: Results' }

export default function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return <ResultsContent searchParams={searchParams} />
}
