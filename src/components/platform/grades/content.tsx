import { ResultsTable } from "@/components/platform/grades/table";
import { type ResultRow } from "@/components/platform/grades/columns";
import { SearchParams } from "nuqs/server";
import { resultsSearchParams } from "@/components/platform/grades/list-params";
import { getTenantContext } from "@/lib/tenant-context";
import { Shell as PageContainer } from "@/components/table/shell";
import { type Locale } from "@/components/internationalization/config";
import { type Dictionary } from "@/components/internationalization/dictionaries";
import { getResultsList, formatResultRow } from "@/components/platform/grades/queries";

interface Props {
  searchParams: Promise<SearchParams>;
  dictionary: Dictionary;
  lang: Locale;
}

export default async function ResultsContent({
  searchParams,
  dictionary,
  lang,
}: Props) {
  const sp = await resultsSearchParams.parse(await searchParams);
  const { schoolId } = await getTenantContext();

  let data: ResultRow[] = [];
  let total = 0;

  if (schoolId) {
    try {
      // Use centralized query builder from queries.ts
      const { rows, count } = await getResultsList(schoolId, {
        studentId: sp.studentId || undefined,
        assignmentId: sp.assignmentId || undefined,
        classId: sp.classId || undefined,
        grade: sp.grade || undefined,
        page: sp.page,
        perPage: sp.perPage,
        sort: sp.sort,
      });

      // Map results using helper function from queries.ts
      data = rows.map((r) => formatResultRow(r));
      total = count;
    } catch (error) {
      // Log error for debugging but don't crash the page
      console.error("[ResultsContent] Error fetching results:", error);
      // Return empty data - page will show "No results" instead of crashing
      data = [];
      total = 0;
    }
  }

  return (
    <PageContainer>
      <div className="flex flex-1 flex-col gap-4">
        <ResultsTable
          initialData={data}
          total={total}
          dictionary={dictionary}
          lang={lang}
          perPage={sp.perPage}
        />
      </div>
    </PageContainer>
  );
}
