import { TemplatesTable } from "./table";
import type { ExamTemplateRow } from "./columns";
import { SearchParams } from "nuqs/server";
import { templateSearchParams } from "./list-params";
import { db } from "@/lib/db";
import { getTenantContext } from "@/lib/tenant-context";
import { Shell as PageContainer } from "@/components/table/shell";
import PageHeader from "@/components/atom/page-header";
import type { Locale } from "@/components/internationalization/config";
import type { Dictionary } from "@/components/internationalization/dictionaries";
import { calculateTotalQuestions } from "./utils";

interface Props {
  searchParams: Promise<SearchParams>;
  dictionary: Dictionary;
  lang: Locale;
}

export default async function TemplatesContent({
  searchParams,
  dictionary,
  lang,
}: Props) {
  const sp = await templateSearchParams.parse(await searchParams);
  const { schoolId } = await getTenantContext();
  let data: ExamTemplateRow[] = [];
  let total = 0;

  if (schoolId) {
    const where: any = {
      schoolId, // CRITICAL: Multi-tenant scope
      ...(sp.subjectId ? { subjectId: sp.subjectId } : {}),
      ...(sp.isActive !== undefined ? { isActive: sp.isActive } : {}),
      ...(sp.search
        ? {
            name: {
              contains: sp.search,
              mode: "insensitive",
            },
          }
        : {}),
    };

    const skip = (sp.page - 1) * sp.perPage;
    const take = sp.perPage;
    const orderBy =
      sp.sort && Array.isArray(sp.sort) && sp.sort.length
        ? sp.sort.map((s: any) => ({ [s.id]: s.desc ? "desc" : "asc" }))
        : [{ createdAt: "desc" }];

    const [rows, count] = await Promise.all([
      db.examTemplate.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          subject: {
            select: {
              id: true,
              subjectName: true,
            },
          },
          _count: {
            select: {
              generatedExams: true,
            },
          },
        },
      }),
      db.examTemplate.count({ where }),
    ]);

    data = rows.map((t) => ({
      id: t.id,
      name: t.name,
      subjectName: t.subject?.subjectName || "Unknown",
      duration: t.duration,
      totalMarks: Number(t.totalMarks),
      totalQuestions: calculateTotalQuestions(t.distribution as any),
      isActive: t.isActive,
      timesUsed: t._count.generatedExams,
      createdAt: t.createdAt.toISOString(),
    }));
    total = count;
  }

  return (
    <PageContainer>
      <div className="flex flex-1 flex-col gap-4">
        <PageHeader
          title="Exam Templates"
          description="Create reusable exam blueprints with question distribution rules"
          className="text-start max-w-none"
        />
        <TemplatesTable initialData={data} total={total} />
      </div>
    </PageContainer>
  );
}
