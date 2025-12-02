import { CampaignsTable } from "@/components/platform/admission/campaigns-table";
import type { CampaignRow } from "@/components/platform/admission/campaigns-columns";
import { SearchParams } from "nuqs/server";
import { campaignsSearchParams } from "@/components/platform/admission/list-params";
import { getTenantContext } from "@/lib/tenant-context";
import type { Dictionary } from "@/components/internationalization/dictionaries";
import type { Locale } from "@/components/internationalization/config";
import { getCampaignsList } from "@/components/platform/admission/queries";

interface Props {
  searchParams: Promise<SearchParams>;
  dictionary: Dictionary["school"];
  lang: Locale;
}

export default async function CampaignsContent({ searchParams, dictionary, lang }: Props) {
  const sp = await campaignsSearchParams.parse(await searchParams);
  const { schoolId } = await getTenantContext();
  const t = dictionary.admission;

  let data: CampaignRow[] = [];
  let total = 0;

  if (schoolId) {
    try {
      const { rows, count } = await getCampaignsList(schoolId, {
        name: sp.name,
        status: sp.status,
        academicYear: sp.academicYear,
        page: sp.page,
        perPage: sp.perPage,
        sort: sp.sort,
      });

      data = rows.map((c) => ({
        id: c.id,
        name: c.name,
        academicYear: c.academicYear,
        startDate: c.startDate ? new Date(c.startDate).toISOString() : new Date().toISOString(),
        endDate: c.endDate ? new Date(c.endDate).toISOString() : new Date().toISOString(),
        status: c.status,
        totalSeats: c.totalSeats,
        applicationFee: c.applicationFee?.toString() ?? null,
        applicationsCount: c._count.applications,
        createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : new Date().toISOString(),
      }));

      total = count;
    } catch (error) {
      console.error("[CampaignsContent] Error fetching campaigns:", error);
      data = [];
      total = 0;
    }
  }

  return (
    <div className="space-y-6">
      <CampaignsTable
        initialData={data}
        total={total}
        dictionary={t}
        lang={lang}
        perPage={sp.perPage}
      />
    </div>
  );
}
