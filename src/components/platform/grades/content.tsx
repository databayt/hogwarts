import { ResultsTable } from "@/components/platform/grades/table";
import { type ResultRow } from "@/components/platform/grades/columns";
import { SearchParams } from "nuqs/server";
import { resultsSearchParams } from "@/components/platform/grades/list-params";
import { getTenantContext } from "@/lib/tenant-context";
import { type Locale } from "@/components/internationalization/config";
import { type Dictionary } from "@/components/internationalization/dictionaries";
import { getResultsList, formatResultRow } from "@/components/platform/grades/queries";

interface Props {
  searchParams: Promise<SearchParams>;
  dictionary: Dictionary["school"];
  lang: Locale;
}

export default async function GradesContent({
  searchParams,
  dictionary,
  lang,
}: Props) {
  const sp = await resultsSearchParams.parse(await searchParams);
  const { schoolId } = await getTenantContext();
  const t = dictionary.grades;

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
      console.error("[GradesContent] Error fetching results:", error);
      // Return empty data - page will show "No results" instead of crashing
      data = [];
      total = 0;
    }
  }

  return (
    <div className="space-y-6">
      <ResultsTable
        initialData={data}
        total={total}
        dictionary={t}
        lang={lang}
        perPage={sp.perPage}
      />
    </div>
  );
}
