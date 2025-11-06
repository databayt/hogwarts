import { EventsTable } from '@/components/platform/events/table'
import { type EventRow } from '@/components/platform/events/columns'
import { SearchParams } from 'nuqs/server'
import { eventsSearchParams } from '@/components/platform/events/list-params'
import { db } from '@/lib/db'
import { getTenantContext } from '@/lib/tenant-context'
import { type Locale } from '@/components/internationalization/config'
import { type Dictionary } from '@/components/internationalization/dictionaries'

interface Props {
  searchParams: Promise<SearchParams>
  dictionary: Dictionary['school']
  lang: Locale
}

export default async function EventsContent({ searchParams, dictionary, lang }: Props) {
  const sp = await eventsSearchParams.parse(await searchParams)
  const { schoolId } = await getTenantContext()
  let data: EventRow[] = []
  let total = 0
  
  if (schoolId && (db as any).event) {
    const where: any = {
      schoolId,
      ...(sp.title ? { title: { contains: sp.title, mode: 'insensitive' } } : {}),
      ...(sp.eventType ? { eventType: sp.eventType } : {}),
      ...(sp.status ? { status: sp.status } : {}),
      ...(sp.eventDate ? { eventDate: new Date(sp.eventDate) } : {}),
      ...(sp.location ? { location: { contains: sp.location, mode: 'insensitive' } } : {}),
    }
    
    const skip = (sp.page - 1) * sp.perPage
    const take = sp.perPage
    const orderBy = (sp.sort && Array.isArray(sp.sort) && sp.sort.length)
      ? sp.sort.map((s: any) => ({ [s.id]: s.desc ? 'desc' : 'asc' }))
      : [{ eventDate: 'desc' }, { startTime: 'asc' }]
      
    const [rows, count] = await Promise.all([
      (db as any).event.findMany({ 
        where, 
        orderBy, 
        skip, 
        take,
      }),
      (db as any).event.count({ where }),
    ])
    
    data = rows.map((e: any) => ({ 
      id: e.id, 
      title: e.title, 
      eventType: e.eventType, 
      eventDate: (e.eventDate as Date).toISOString(), 
      startTime: e.startTime, 
      endTime: e.endTime, 
      location: e.location || dictionary?.events?.locationTBD || 'TBD',
      organizer: e.organizer || dictionary?.events?.organizerTBD || 'TBD',
      targetAudience: e.targetAudience || dictionary?.events?.audienceTBD || 'All', 
      maxAttendees: e.maxAttendees, 
      currentAttendees: e.currentAttendees, 
      status: e.status, 
      isPublic: e.isPublic, 
      createdAt: (e.createdAt as Date).toISOString() 
    }))
    total = count as number
  }
  
  return (
    <div className="space-y-6">
      <EventsTable initialData={data} total={total} perPage={sp.perPage} />
    </div>
  )
}
