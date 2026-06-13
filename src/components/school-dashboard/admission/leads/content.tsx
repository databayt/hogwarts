// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * LeadsContent — server component for the Leads tab.
 * Fetches initial page of inquiries and tour bookings server-side,
 * then hands off to client tables for load-more pagination.
 */

import { getTenantContext } from "@/lib/tenant-context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import type {
  InquiryRow,
  LeadsAdmissionDict,
  TourBookingRow,
} from "./leads-columns"
import { getInquiriesList, getTourBookingsList } from "./leads-queries"
import { InquiriesTable, TourBookingsTable } from "./leads-table"

interface Props {
  dictionary: Dictionary["school"]
  lang: Locale
}

export default async function LeadsContent({ dictionary, lang }: Props) {
  const { schoolId } = await getTenantContext()
  // Cast to include the `leads` namespace (keys tracked in dict_keys output)
  const t = dictionary.admission as LeadsAdmissionDict

  let inquiries: InquiryRow[] = []
  let inquiriesTotal = 0
  let tourBookings: TourBookingRow[] = []
  let tourBookingsTotal = 0

  if (schoolId) {
    try {
      const [inqResult, tourResult] = await Promise.all([
        getInquiriesList(schoolId, { page: 1, perPage: 20 }),
        getTourBookingsList(schoolId, { page: 1, perPage: 20 }),
      ])

      inquiries = inqResult.rows.map((r) => ({
        id: r.id,
        parentName: r.parentName,
        email: r.email,
        phone: r.phone,
        studentName: r.studentName,
        interestedGrade: r.interestedGrade,
        source: r.source,
        status: r.status,
        followUpDate: r.followUpDate
          ? new Date(r.followUpDate).toISOString()
          : null,
        assignedTo: r.assignedTo,
        notes: r.notes,
        convertedToApplicationId: r.convertedToApplicationId,
        createdAt: r.createdAt
          ? new Date(r.createdAt).toISOString()
          : new Date().toISOString(),
      }))
      inquiriesTotal = inqResult.count

      tourBookings = tourResult.rows.map((r) => ({
        id: r.id,
        bookingNumber: r.bookingNumber,
        parentName: r.parentName,
        email: r.email,
        phone: r.phone,
        studentName: r.studentName,
        interestedGrade: r.interestedGrade,
        status: r.status,
        numberOfAttendees: r.numberOfAttendees,
        attendedAt: r.attendedAt ? new Date(r.attendedAt).toISOString() : null,
        cancelledAt: r.cancelledAt
          ? new Date(r.cancelledAt).toISOString()
          : null,
        slotDate: r.slot?.date ? new Date(r.slot.date).toISOString() : null,
        slotStartTime: r.slot?.startTime
          ? new Date(r.slot.startTime).toISOString()
          : null,
        slotEndTime: r.slot?.endTime
          ? new Date(r.slot.endTime).toISOString()
          : null,
        slotLocation: r.slot?.location ?? null,
        slotType: r.slot?.slotType ? String(r.slot.slotType) : null,
        createdAt: r.createdAt
          ? new Date(r.createdAt).toISOString()
          : new Date().toISOString(),
      }))
      tourBookingsTotal = tourResult.count
    } catch (error) {
      console.error("[LeadsContent] Failed to fetch leads data:", error)
    }
  }

  const leads = t?.leads

  return (
    <div className="space-y-6">
      <Tabs defaultValue="inquiries">
        <TabsList>
          <TabsTrigger value="inquiries">
            {leads?.tabs?.inquiries || "Inquiries"}
            {inquiriesTotal > 0 && (
              <span className="bg-muted ml-2 rounded-full px-1.5 py-0.5 text-xs tabular-nums">
                {inquiriesTotal}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="tours">
            {leads?.tabs?.tours || "Tour Bookings"}
            {tourBookingsTotal > 0 && (
              <span className="bg-muted ml-2 rounded-full px-1.5 py-0.5 text-xs tabular-nums">
                {tourBookingsTotal}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inquiries" className="mt-6">
          <InquiriesTable
            initialData={inquiries}
            total={inquiriesTotal}
            dictionary={t}
            lang={lang}
          />
        </TabsContent>

        <TabsContent value="tours" className="mt-6">
          <TourBookingsTable
            initialData={tourBookings}
            total={tourBookingsTotal}
            dictionary={t}
            lang={lang}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
