import { ApplicationsTable } from "@/components/platform/admission/applications-table";
import type { ApplicationRow } from "@/components/platform/admission/applications-columns";
import { SearchParams } from "nuqs/server";
import { applicationsSearchParams } from "@/components/platform/admission/list-params";
import { getTenantContext } from "@/lib/tenant-context";
import type { Dictionary } from "@/components/internationalization/dictionaries";
import type { Locale } from "@/components/internationalization/config";
import { getApplicationsList } from "@/components/platform/admission/queries";

interface Props {
  searchParams: Promise<SearchParams>;
  dictionary: Dictionary["school"];
  lang: Locale;
}

export default async function ApplicationsContent({ searchParams, dictionary, lang }: Props) {
  const sp = await applicationsSearchParams.parse(await searchParams);
  const { schoolId } = await getTenantContext();
  const t = dictionary.admission;

  let data: ApplicationRow[] = [];
  let total = 0;

  if (schoolId) {
    try {
      const { rows, count } = await getApplicationsList(schoolId, {
        search: sp.search,
        campaignId: sp.campaignId,
        status: sp.status,
        applyingForClass: sp.applyingForClass,
        page: sp.page,
        perPage: sp.perPage,
        sort: sp.sort,
      });

      data = rows.map((a) => ({
        id: a.id,
        applicationNumber: a.applicationNumber,
        applicantName: `${a.firstName} ${a.lastName}`,
        firstName: a.firstName,
        lastName: a.lastName,
        email: a.email,
        phone: a.phone,
        applyingForClass: a.applyingForClass,
        status: a.status,
        meritScore: a.meritScore?.toString() ?? null,
        meritRank: a.meritRank,
        campaignName: a.campaign.name,
        campaignId: a.campaign.id,
        submittedAt: a.submittedAt ? new Date(a.submittedAt).toISOString() : null,
        createdAt: a.createdAt ? new Date(a.createdAt).toISOString() : new Date().toISOString(),
      }));

      total = count;
    } catch (error) {
      console.error("[ApplicationsContent] Error fetching applications:", error);
      data = [];
      total = 0;
    }
  }

  return (
    <div className="space-y-6">
      <ApplicationsTable
        initialData={data}
        total={total}
        dictionary={t}
        lang={lang}
        perPage={sp.perPage}
        campaignId={sp.campaignId || undefined}
      />
    </div>
  );
}
