import TeachersContent from '@/components/platform/teachers/content'
import { SearchParams } from 'nuqs/server'

export const metadata = { title: 'Dashboard: Teachers' }

export default function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return <TeachersContent searchParams={searchParams} />
}


