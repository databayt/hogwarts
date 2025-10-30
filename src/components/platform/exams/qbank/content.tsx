import { QuestionBankTable } from "./table";
import type { QuestionBankRow } from "./columns";
import { SearchParams } from "nuqs/server";
import { questionBankSearchParams } from "./list-params";
import { db } from "@/lib/db";
import { getTenantContext } from "@/lib/tenant-context";
import { Shell as PageContainer } from "@/components/table/shell";
import PageHeader from "@/components/atom/page-header";
import type { Locale } from "@/components/internationalization/config";
import type { Dictionary } from "@/components/internationalization/dictionaries";
import type { Prisma, QuestionType, DifficultyLevel, BloomLevel, QuestionSource } from "@prisma/client";

interface Props {
  searchParams: Promise<SearchParams>;
  dictionary: Dictionary;
  lang: Locale;
}

export default async function QuestionBankContent({
  searchParams,
  dictionary,
  lang,
}: Props) {
  const sp = await questionBankSearchParams.parse(await searchParams);
  const { schoolId } = await getTenantContext();
  let data: QuestionBankRow[] = [];
  let total = 0;

  if (schoolId) {
    const where: Prisma.QuestionBankWhereInput = {
      schoolId, // CRITICAL: Multi-tenant scope
      ...(sp.subjectId ? { subjectId: sp.subjectId } : {}),
      ...(sp.questionType ? { questionType: sp.questionType as QuestionType } : {}),
      ...(sp.difficulty ? { difficulty: sp.difficulty as DifficultyLevel } : {}),
      ...(sp.bloomLevel ? { bloomLevel: sp.bloomLevel as BloomLevel } : {}),
      ...(sp.source ? { source: sp.source as QuestionSource } : {}),
      ...(sp.search
        ? {
            questionText: {
              contains: sp.search,
              mode: "insensitive",
            },
          }
        : {}),
    };

    const skip = (sp.page - 1) * sp.perPage;
    const take = sp.perPage;
    const orderBy: Prisma.QuestionBankOrderByWithRelationInput[] =
      sp.sort && Array.isArray(sp.sort) && sp.sort.length
        ? [{ [sp.sort[0]]: sp.sort[1] === "desc" ? "desc" : "asc" } as Prisma.QuestionBankOrderByWithRelationInput]
        : [{ createdAt: "desc" as const }];

    const [rows, count] = await Promise.all([
      db.questionBank.findMany({
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
          analytics: {
            select: {
              timesUsed: true,
              successRate: true,
            },
          },
        },
      }),
      db.questionBank.count({ where }),
    ]);

    data = rows.map((q) => ({
      id: q.id,
      questionText: q.questionText,
      questionType: q.questionType,
      difficulty: q.difficulty,
      bloomLevel: q.bloomLevel,
      subjectName: q.subject?.subjectName || "Unknown",
      points: Number(q.points),
      source: q.source,
      timesUsed: q.analytics?.timesUsed || 0,
      successRate: q.analytics?.successRate || null,
      createdAt: q.createdAt.toISOString(),
    }));
    total = count;
  }

  return (
    <PageContainer>
      <div className="flex flex-1 flex-col gap-6">
        <PageHeader
          title={dictionary.generate.questionBank.title}
          description={dictionary.generate.cards.questionBank.description}
          className="text-start max-w-none"
        />
        <QuestionBankTable
          initialData={data}
          total={total}
          perPage={sp.perPage}
          dictionary={dictionary}
        />
      </div>
    </PageContainer>
  );
}
