import ClassesContent from '@/components/platform/classes/content'
import { SearchParams } from 'nuqs/server'

export const metadata = { title: 'Dashboard: Classes' }

export default function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return <ClassesContent searchParams={searchParams} />
}


