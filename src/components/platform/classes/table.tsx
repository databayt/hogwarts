"use client";

import { useMemo, useState, useCallback, useTransition } from "react";
import { DataTable } from "@/components/table/data-table";
import { useDataTable } from "@/components/table/use-data-table";
import { getClassColumns, getLocalizedClassName, getLocalizedSubjectName, type ClassRow } from "./columns";
import { useModal } from "@/components/atom/modal/context";
import Modal from "@/components/atom/modal/modal";
import { ClassCreateForm } from "@/components/platform/classes/form";
import type { Dictionary } from "@/components/internationalization/dictionaries";
import type { Locale } from "@/components/internationalization/config";
import { getClasses, getClassesCSV, deleteClass } from "./actions";
import { usePlatformView } from "@/hooks/use-platform-view";
import { usePlatformData } from "@/hooks/use-platform-data";
import {
  PlatformToolbar,
  GridCard,
  GridContainer,
  GridEmptyState,
} from "@/components/platform/shared";
import { BookOpen, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { DeleteToast, ErrorToast, confirmDeleteDialog } from "@/components/atom/toast";

interface ClassesTableProps {
  initialData: ClassRow[];
  total: number;
  dictionary?: Dictionary['school']['classes'];
  lang: Locale;
  perPage?: number;
}

export function ClassesTable({ initialData, total, dictionary, lang, perPage = 20 }: ClassesTableProps) {
  const router = useRouter();
  const { openModal } = useModal();
  const [isPending, startTransition] = useTransition();

  // Translations with fallbacks
  const t = {
    className: dictionary?.className || (lang === 'ar' ? 'اسم الفصل' : 'Class Name'),
    subject: dictionary?.subject || (lang === 'ar' ? 'المادة' : 'Subject'),
    teacher: dictionary?.teacher || (lang === 'ar' ? 'المعلم' : 'Teacher'),
    term: dictionary?.term || (lang === 'ar' ? 'الفصل الدراسي' : 'Term'),
    enrolled: dictionary?.enrolled || (lang === 'ar' ? 'المسجلين' : 'Enrolled'),
    actions: dictionary?.actions || (lang === 'ar' ? 'إجراءات' : 'Actions'),
    editClass: dictionary?.editClass || (lang === 'ar' ? 'تعديل الفصل' : 'Edit Class'),
    deleteClass: dictionary?.deleteClass || (lang === 'ar' ? 'حذف الفصل' : 'Delete Class'),
    viewClass: dictionary?.viewClass || (lang === 'ar' ? 'عرض الفصل' : 'View Class'),
    createClass: dictionary?.createClass || (lang === 'ar' ? 'إنشاء فصل' : 'Create Class'),
    allClasses: dictionary?.allClasses || (lang === 'ar' ? 'جميع الفصول' : 'All Classes'),
    noClasses: dictionary?.noClasses || (lang === 'ar' ? 'لا توجد فصول' : 'No classes found'),
    addNewClass: dictionary?.addNewClass || (lang === 'ar' ? 'أضف فصلاً جديداً' : 'Add a new class to your school'),
    search: dictionary?.search || (lang === 'ar' ? 'بحث في الفصول...' : 'Search classes...'),
    create: dictionary?.create || (lang === 'ar' ? 'إنشاء' : 'Create'),
    export: dictionary?.export || (lang === 'ar' ? 'تصدير' : 'Export'),
    reset: dictionary?.reset || (lang === 'ar' ? 'إعادة تعيين' : 'Reset'),
  };

  // View mode (table/grid)
  const { view, toggleView } = usePlatformView({ defaultView: "table" });

  // Search state
  const [searchValue, setSearchValue] = useState("");

  // Data management with optimistic updates
  const {
    data,
    total: dataTotal,
    isLoading,
    hasMore,
    loadMore,
    refresh,
    optimisticRemove,
  } = usePlatformData<ClassRow, { name?: string }>({
    initialData,
    total,
    perPage,
    fetcher: async (params) => {
      const result = await getClasses(params);
      return { rows: result.rows as ClassRow[], total: result.total };
    },
    filters: searchValue ? { name: searchValue } : undefined,
  });

  // Generate columns on the client side with dictionary and lang
  const columns = useMemo(() => getClassColumns(dictionary, lang), [dictionary, lang]);

  // Table instance
  const { table } = useDataTable<ClassRow>({
    data,
    columns,
    pageCount: 1,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: data.length || perPage,
      },
      columnVisibility: {
        // Default visible: name, subjectName, teacherName, enrolledStudents
        termName: false,
        createdAt: false,
      },
    },
  });

  // Handle search
  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);
    startTransition(() => {
      router.refresh();
    });
  }, [router]);

  // Handle delete with optimistic update
  const handleDelete = useCallback(async (classItem: ClassRow) => {
    const displayName = getLocalizedClassName(classItem, lang);
    try {
      const ok = await confirmDeleteDialog(`${t.deleteClass} ${displayName}?`);
      if (!ok) return;

      // Optimistic remove
      optimisticRemove(classItem.id);

      const result = await deleteClass({ id: classItem.id });
      if (result.success) {
        DeleteToast();
      } else {
        // Revert on error
        refresh();
        ErrorToast("Failed to delete class");
      }
    } catch (e) {
      refresh();
      ErrorToast(e instanceof Error ? e.message : "Failed to delete");
    }
  }, [optimisticRemove, refresh, lang, t.deleteClass]);

  // Handle edit
  const handleEdit = useCallback((id: string) => {
    openModal(id);
  }, [openModal]);

  // Handle view
  const handleView = useCallback((id: string) => {
    router.push(`/classes/${id}`);
  }, [router]);

  // Export CSV wrapper
  const handleExportCSV = useCallback(async (filters?: Record<string, unknown>) => {
    return getClassesCSV(filters);
  }, []);

  // Toolbar translations
  const toolbarTranslations = {
    search: t.search,
    create: typeof t.create === 'string' ? t.create : t.createClass,
    reset: t.reset,
    export: t.export,
    exportCSV: lang === 'ar' ? 'تصدير CSV' : 'Export CSV',
    exporting: lang === 'ar' ? 'جاري التصدير...' : 'Exporting...',
  };

  return (
    <>
      <PlatformToolbar
        table={view === "table" ? table : undefined}
        view={view}
        onToggleView={toggleView}
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
        searchPlaceholder={t.search}
        onCreate={() => openModal()}
        getCSV={handleExportCSV}
        entityName="classes"
        translations={toolbarTranslations}
      />

      {view === "table" ? (
        <DataTable
          table={table}
          paginationMode="load-more"
          hasMore={hasMore}
          isLoading={isLoading || isPending}
          onLoadMore={loadMore}
        />
      ) : (
        <>
          {data.length === 0 ? (
            <GridEmptyState
              title={t.allClasses}
              description={t.addNewClass}
              icon={<BookOpen className="h-12 w-12" />}
            />
          ) : (
            <GridContainer columns={3}>
              {data.map((classItem) => {
                const displayName = getLocalizedClassName(classItem, lang);
                const displaySubject = getLocalizedSubjectName(classItem, lang);
                const initials = displayName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .substring(0, 2)
                  .toUpperCase();

                return (
                  <GridCard
                    key={classItem.id}
                    title={displayName}
                    subtitle={displaySubject}
                    avatarFallback={initials}
                    metadata={[
                      { label: t.teacher, value: classItem.teacherName },
                      { label: t.term, value: classItem.termName },
                      {
                        label: t.enrolled,
                        value: (
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {classItem.enrolledStudents}/{classItem.maxCapacity}
                          </span>
                        ),
                      },
                    ]}
                    actions={[
                      { label: t.viewClass, onClick: () => handleView(classItem.id) },
                      { label: t.editClass, onClick: () => handleEdit(classItem.id) },
                      {
                        label: t.deleteClass,
                        onClick: () => handleDelete(classItem),
                        variant: "destructive",
                      },
                    ]}
                    actionsLabel={t.actions}
                    onClick={() => handleView(classItem.id)}
                  />
                );
              })}
            </GridContainer>
          )}

          {/* Load more for grid view */}
          {hasMore && (
            <div className="flex justify-center mt-4">
              <button
                onClick={loadMore}
                disabled={isLoading}
                className="px-4 py-2 text-sm border rounded-md hover:bg-accent disabled:opacity-50"
              >
                {isLoading ? "Loading..." : "Load More"}
              </button>
            </div>
          )}
        </>
      )}

      <Modal content={<ClassCreateForm onSuccess={refresh} />} />
    </>
  );
}
