"use client";

import { useMemo, useState, useCallback } from "react";
import { DataTable } from "@/components/table/data-table/data-table";
import { DataTableToolbar } from "@/components/table/data-table/data-table-toolbar";
import { useDataTable } from "@/components/table/hooks/use-data-table";
import { questionBankColumns, type QuestionBankRow } from "./columns";
import { Button } from "@/components/ui/button";
import { Plus, Sparkles } from "lucide-react";
import { useModal } from "@/components/atom/modal/context";
import Modal from "@/components/atom/modal/modal";
import { QuestionBankForm } from "./form";
import { getQuestions } from "./actions";
import type { Dictionary } from "@/components/internationalization/dictionaries";

interface QuestionBankTableProps {
  initialData: QuestionBankRow[];
  total: number;
  perPage?: number;
  dictionary?: Dictionary;
}

export function QuestionBankTable({
  initialData,
  total,
  perPage = 20,
  dictionary,
}: QuestionBankTableProps) {
  const columns = useMemo(() => questionBankColumns, []);

  // State for incremental loading
  const [data, setData] = useState<QuestionBankRow[]>(initialData);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const hasMore = data.length < total;

  const handleLoadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const nextPage = currentPage + 1;
      const questions = await getQuestions({});

      if (questions.length > 0) {
        const newRows: QuestionBankRow[] = questions
          .slice(currentPage * perPage, (currentPage + 1) * perPage)
          .map((q: any) => ({
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

        setData((prev) => [...prev, ...newRows]);
        setCurrentPage(nextPage);
      }
    } catch (error) {
      console.error("Failed to load more questions:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, perPage, isLoading, hasMore]);

  // Use pageCount of 1 since we're handling all data client-side
  const { table } = useDataTable<QuestionBankRow>({
    data,
    columns,
    pageCount: 1,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: data.length, // Show all loaded data
      },
    },
  });

  const { openModal } = useModal();

  const handleAIGenerate = () => {
    const qs =
      typeof window !== "undefined" ? window.location.search || "" : "";
    window.location.href = `/generate/questions/ai-generate${qs}`;
  };

  return (
    <div className="w-full">
      <DataTable
        table={table}
        paginationMode="load-more"
        hasMore={hasMore}
        isLoading={isLoading}
        onLoadMore={handleLoadMore}
      >
        <DataTableToolbar table={table}>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-2"
              onClick={() => openModal()}
              aria-label={dictionary?.generate?.actions?.addQuestion || "Add Question"}
              title={dictionary?.generate?.actions?.addQuestion || "Add Question"}
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">{dictionary?.generate?.actions?.addQuestion || "Add Question"}</span>
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="h-8 gap-2"
              onClick={handleAIGenerate}
              aria-label={dictionary?.generate?.actions?.generateWithAI || "AI Generate"}
              title={dictionary?.generate?.actions?.generateWithAI || "AI Generate"}
            >
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">{dictionary?.generate?.actions?.generateWithAI || "AI Generate"}</span>
            </Button>
          </div>
        </DataTableToolbar>
        <Modal content={<QuestionBankForm dictionary={dictionary} />} />
      </DataTable>
    </div>
  );
}
