"use client";

import { useMemo } from "react";
import { DataTable } from "@/components/table/data-table/data-table";
import { DataTableToolbar } from "@/components/table/data-table/data-table-toolbar";
import { useDataTable } from "@/components/table/hooks/use-data-table";
import { resultColumns, type ResultRow } from "./columns";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useModal } from "@/components/atom/modal/context";
import Modal from "@/components/atom/modal/modal";
import { ResultCreateForm } from "@/components/platform/grades/form";
import type { Dictionary } from "@/components/internationalization/dictionaries";
import type { Locale } from "@/components/internationalization/config";

interface ResultsTableProps {
  data: ResultRow[];
  pageCount: number;
  dictionary: Dictionary;
  lang: Locale;
}

export function ResultsTable({ data, pageCount, dictionary, lang }: ResultsTableProps) {
  // Generate columns on the client side with hooks
  const columns = useMemo(() => resultColumns(dictionary, lang), [dictionary, lang]);

  const { table } = useDataTable<ResultRow>({ data, columns, pageCount });
  const { openModal } = useModal();
  return (
    <DataTable table={table}>
      <DataTableToolbar table={table}>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0 rounded-full"
          onClick={() => openModal()}
          aria-label="Create"
          title="Create"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </DataTableToolbar>
      <Modal content={<ResultCreateForm dictionary={dictionary} />} />
    </DataTable>
  );
}
