"use client";

import { useMemo, useState, useCallback, useTransition } from "react";
import { DataTable } from "@/components/table/data-table";
import { useDataTable } from "@/components/table/use-data-table";
import { getLessonColumns, type LessonRow } from "./columns";
import { useModal } from "@/components/atom/modal/context";
import Modal from "@/components/atom/modal/modal";
import { LessonCreateForm } from "@/components/platform/lessons/form";
import type { Dictionary } from "@/components/internationalization/dictionaries";
import type { Locale } from "@/components/internationalization/config";
import { getLessons, getLessonsCSV, deleteLesson } from "./actions";
import { usePlatformView } from "@/hooks/use-platform-view";
import { usePlatformData } from "@/hooks/use-platform-data";
import {
  PlatformToolbar,
  GridCard,
  GridContainer,
  GridEmptyState,
} from "@/components/platform/shared";
import { BookOpen, Clock, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { DeleteToast, ErrorToast, confirmDeleteDialog } from "@/components/atom/toast";
import { Badge } from "@/components/ui/badge";

interface LessonsTableProps {
  initialData: LessonRow[];
  total: number;
  dictionary?: Dictionary['school']['lessons'];
  lang: Locale;
  perPage?: number;
}

export function LessonsTable({ initialData, total, dictionary, lang, perPage = 20 }: LessonsTableProps) {
  const router = useRouter();
  const { openModal } = useModal();
  const [isPending, startTransition] = useTransition();

  // Translations with fallbacks
  const t = {
    title: dictionary?.title || (lang === 'ar' ? 'العنوان' : 'Title'),
    class: dictionary?.class || (lang === 'ar' ? 'الفصل' : 'Class'),
    teacher: dictionary?.teacher || (lang === 'ar' ? 'المعلم' : 'Teacher'),
    subject: dictionary?.subject || (lang === 'ar' ? 'المادة' : 'Subject'),
    date: dictionary?.date || (lang === 'ar' ? 'التاريخ' : 'Date'),
    time: dictionary?.time || (lang === 'ar' ? 'الوقت' : 'Time'),
    status: dictionary?.status || (lang === 'ar' ? 'الحالة' : 'Status'),
    actions: lang === 'ar' ? 'إجراءات' : 'Actions',
    view: lang === 'ar' ? 'عرض' : 'View',
    edit: lang === 'ar' ? 'تعديل' : 'Edit',
    delete: lang === 'ar' ? 'حذف' : 'Delete',
    allLessons: dictionary?.allLessons || (lang === 'ar' ? 'جميع الدروس' : 'All Lessons'),
    addNewLesson: dictionary?.addNewLesson || (lang === 'ar' ? 'خطط درسًا جديدًا لفصلك' : 'Plan a new lesson for your class'),
    search: dictionary?.search || (lang === 'ar' ? 'بحث في الدروس...' : 'Search lessons...'),
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
  } = usePlatformData<LessonRow, { title?: string }>({
    initialData,
    total,
    perPage,
    fetcher: async (params) => {
      const result = await getLessons(params);
      if (!result.success || !result.data) {
        return { rows: [], total: 0 };
      }
      return { rows: result.data.rows as LessonRow[], total: result.data.total };
    },
    filters: searchValue ? { title: searchValue } : undefined,
  });

  // Generate columns on the client side with dictionary and lang
  const columns = useMemo(() => getLessonColumns(dictionary, lang), [dictionary, lang]);

  // Table instance
  const { table } = useDataTable<LessonRow>({
    data,
    columns,
    pageCount: 1,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: data.length || perPage,
      },
      columnVisibility: {
        // Default visible: title, className, teacherName, lessonDate, status
        subjectName: false,
        startTime: false,
        endTime: false,
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
  const handleDelete = useCallback(async (lesson: LessonRow) => {
    try {
      const deleteMsg = lang === 'ar' ? `حذف "${lesson.title}"؟` : `Delete "${lesson.title}"?`;
      const ok = await confirmDeleteDialog(deleteMsg);
      if (!ok) return;

      // Optimistic remove
      optimisticRemove(lesson.id);

      const result = await deleteLesson({ id: lesson.id });
      if (result.success) {
        DeleteToast();
      } else {
        // Revert on error
        refresh();
        ErrorToast(lang === 'ar' ? 'فشل حذف الدرس' : 'Failed to delete lesson');
      }
    } catch (e) {
      refresh();
      ErrorToast(e instanceof Error ? e.message : (lang === 'ar' ? 'فشل الحذف' : 'Failed to delete'));
    }
  }, [optimisticRemove, refresh, lang]);

  // Handle edit
  const handleEdit = useCallback((id: string) => {
    openModal(id);
  }, [openModal]);

  // Handle view
  const handleView = useCallback((id: string) => {
    router.push(`/lessons/${id}`);
  }, [router]);

  // Export CSV wrapper
  const handleExportCSV = useCallback(async (filters?: Record<string, unknown>) => {
    const result = await getLessonsCSV(filters);
    if (!result.success || !result.data) {
      throw new Error('error' in result ? result.error : 'Export failed');
    }
    return result.data;
  }, []);

  // Get status badge variant
  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      PLANNED: "default",
      IN_PROGRESS: "secondary",
      COMPLETED: "outline",
      CANCELLED: "destructive",
    };
    const labels: Record<string, { en: string; ar: string }> = {
      PLANNED: { en: 'Planned', ar: 'مخطط' },
      IN_PROGRESS: { en: 'In Progress', ar: 'قيد التنفيذ' },
      COMPLETED: { en: 'Completed', ar: 'مكتمل' },
      CANCELLED: { en: 'Cancelled', ar: 'ملغي' },
    };
    return { label: labels[status]?.[lang] || status.replace("_", " "), variant: variants[status] || "default" };
  };

  // Toolbar translations
  const toolbarTranslations = {
    search: t.search,
    create: typeof t.create === 'string' ? t.create : t.addNewLesson,
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
        entityName="lessons"
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
              title={t.allLessons}
              description={t.addNewLesson}
              icon={<BookOpen className="h-12 w-12" />}
            />
          ) : (
            <GridContainer columns={3}>
              {data.map((lesson) => {
                const initials = lesson.title
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .substring(0, 2)
                  .toUpperCase();
                const statusBadge = getStatusBadge(lesson.status);

                return (
                  <GridCard
                    key={lesson.id}
                    title={lesson.title}
                    subtitle={lesson.className}
                    avatarFallback={initials}
                    status={statusBadge}
                    metadata={[
                      {
                        label: t.teacher,
                        value: (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {lesson.teacherName}
                          </span>
                        ),
                      },
                      { label: t.subject, value: lesson.subjectName },
                      { label: t.date, value: new Date(lesson.lessonDate).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US') },
                    ]}
                    actions={[
                      { label: t.view, onClick: () => handleView(lesson.id) },
                      { label: t.edit, onClick: () => handleEdit(lesson.id) },
                      {
                        label: t.delete,
                        onClick: () => handleDelete(lesson),
                        variant: "destructive",
                      },
                    ]}
                    actionsLabel={t.actions}
                    onClick={() => handleView(lesson.id)}
                  >
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{lesson.startTime} - {lesson.endTime}</span>
                    </div>
                  </GridCard>
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
                {isLoading ? (lang === 'ar' ? 'جاري التحميل...' : 'Loading...') : (lang === 'ar' ? 'تحميل المزيد' : 'Load More')}
              </button>
            </div>
          )}
        </>
      )}

      <Modal content={<LessonCreateForm onSuccess={refresh} />} />
    </>
  );
}
