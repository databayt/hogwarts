import { SearchParams } from "nuqs/server"

import { getTenantContext } from "@/lib/tenant-context"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import type { EnrollmentRow } from "@/components/platform/admission/enrollment-columns"
import { EnrollmentTable } from "@/components/platform/admission/enrollment-table"
import { enrollmentSearchParams } from "@/components/platform/admission/list-params"
import {
  getEnrollmentList,
  getEnrollmentStats,
} from "@/components/platform/admission/queries"

interface Props {
  searchParams: Promise<SearchParams>
  dictionary: Dictionary["school"]
  lang: Locale
}

export default async function EnrollmentContent({
  searchParams,
  dictionary,
  lang,
}: Props) {
  const sp = await enrollmentSearchParams.parse(await searchParams)
  const { schoolId } = await getTenantContext()
  const t = dictionary.admission

  let data: EnrollmentRow[] = []
  let total = 0
  let stats = {
    awaitingEnrollment: 0,
    enrolled: 0,
    feesPending: 0,
    documentsPending: 0,
  }

  if (schoolId) {
    try {
      const [listResult, statsResult] = await Promise.all([
        getEnrollmentList(schoolId, {
          campaignId: sp.campaignId,
          offerStatus: sp.offerStatus,
          feeStatus: sp.feeStatus,
          documentStatus: sp.documentStatus,
          page: sp.page,
          perPage: sp.perPage,
          sort: sp.sort,
        }),
        getEnrollmentStats(schoolId, sp.campaignId || undefined),
      ])

      data = listResult.rows.map((a) => ({
        id: a.id,
        applicationNumber: a.applicationNumber,
        applicantName: `${a.firstName} ${a.lastName}`,
        firstName: a.firstName,
        lastName: a.lastName,
        applyingForClass: a.applyingForClass,
        status: a.status,
        meritRank: a.meritRank,
        admissionOffered: a.admissionOffered,
        offerDate: a.offerDate ? new Date(a.offerDate).toISOString() : null,
        offerExpiryDate: a.offerExpiryDate
          ? new Date(a.offerExpiryDate).toISOString()
          : null,
        admissionConfirmed: a.admissionConfirmed,
        confirmationDate: a.confirmationDate
          ? new Date(a.confirmationDate).toISOString()
          : null,
        applicationFeePaid: a.applicationFeePaid,
        paymentDate: a.paymentDate
          ? new Date(a.paymentDate).toISOString()
          : null,
        hasDocuments:
          a.documents != null &&
          (Array.isArray(a.documents) ? a.documents.length > 0 : true),
        campaignName: a.campaign.name,
        campaignId: a.campaign.id,
      }))

      total = listResult.count
      stats = statsResult
    } catch (error) {
      console.error(
        "[EnrollmentContent] Error fetching enrollment data:",
        error
      )
      data = []
      total = 0
    }
  }

  return (
    <div className="space-y-6">
      <EnrollmentTable
        initialData={data}
        total={total}
        dictionary={t}
        lang={lang}
        perPage={sp.perPage}
        campaignId={sp.campaignId || undefined}
        stats={stats}
      />
    </div>
  )
}
