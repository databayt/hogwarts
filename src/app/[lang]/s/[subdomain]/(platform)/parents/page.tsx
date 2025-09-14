import ParentsContent from '@/components/platform/parents/content'
import { SearchParams } from 'nuqs/server'

export const metadata = { title: 'Dashboard: Parents' }

export default function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return <ParentsContent searchParams={searchParams} />
}
