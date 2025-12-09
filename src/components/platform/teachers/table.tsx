"use client";

import { useMemo, useState, useCallback, useTransition } from "react";
import { DataTable } from "@/components/table/data-table";
import { useDataTable } from "@/components/table/use-data-table";
import { getTeacherColumns, type TeacherRow } from "./columns";
import { useModal } from "@/components/atom/modal/context";
import Modal from "@/components/atom/modal/modal";
import { TeacherCreateForm } from "@/components/platform/teachers/form";
import type { Dictionary } from "@/components/internationalization/dictionaries";
import type { Locale } from "@/components/internationalization/config";
import { getTeachers, getTeachersCSV, deleteTeacher } from "./actions";
import { usePlatformView } from "@/hooks/use-platform-view";
import { usePlatformData } from "@/hooks/use-platform-data";
import {
  PlatformToolbar,
  GridCard,
  GridContainer,
  GridEmptyState,
} from "@/components/platform/shared";
import { Badge } from "@/components/ui/badge";
import { Users, User, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { DeleteToast, ErrorToast, confirmDeleteDialog } from "@/components/atom/toast";

interface TeachersTableProps {
  initialData: TeacherRow[];
  total: number;
  dictionary?: Dictionary['school']['teachers'];
  lang: Locale;
  perPage?: number;
}

export function TeachersTable({ initialData, total, dictionary, lang, perPage = 20 }: TeachersTableProps) {
  const router = useRouter();
  const { openModal } = useModal();
  const [isPending, startTransition] = useTransition();

  // Translations with fallbacks
  const t = {
    fullName: dictionary?.fullName || (lang === 'ar' ? 'الاسم' : 'Name'),
    email: dictionary?.email || (lang === 'ar' ? 'البريد الإلكتروني' : 'Email'),
    status: dictionary?.status || (lang === 'ar' ? 'الحالة' : 'Status'),
    created: dictionary?.created || (lang === 'ar' ? 'تاريخ الإنشاء' : 'Created'),
    actions: lang === 'ar' ? 'إجراءات' : 'Actions',
    view: lang === 'ar' ? 'عرض' : 'View',
    edit: lang === 'ar' ? 'تعديل' : 'Edit',
    delete: lang === 'ar' ? 'حذف' : 'Delete',
    allTeachers: dictionary?.allTeachers || (lang === 'ar' ? 'جميع المعلمين' : 'All Teachers'),
    addNewTeacher: dictionary?.addNewTeacher || (lang === 'ar' ? 'أضف معلماً جديداً إلى مدرستك' : 'Add a new teacher to your school'),
    active: dictionary?.active || (lang === 'ar' ? 'نشط' : 'Active'),
    inactive: dictionary?.inactive || (lang === 'ar' ? 'غير نشط' : 'Inactive'),
    search: dictionary?.search || (lang === 'ar' ? 'بحث في المعلمين...' : 'Search teachers...'),
    create: dictionary?.create || (lang === 'ar' ? 'إنشاء' : 'Create'),
    export: dictionary?.export || (lang === 'ar' ? 'تصدير' : 'Export'),
    reset: dictionary?.reset || (lang === 'ar' ? 'إعادة تعيين' : 'Reset'),
    noAccount: lang === 'ar' ? 'لا يوجد حساب' : 'No Account',
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
  } = usePlatformData<TeacherRow, { name?: string }>({
    initialData,
    total,
    perPage,
    fetcher: async (params) => {
      const result = await getTeachers(params);
      if (!result.success || !result.data) {
        return { rows: [], total: 0 };
      }
      return { rows: result.data.rows as TeacherRow[], total: result.data.total };
    },
    filters: searchValue ? { name: searchValue } : undefined,
  });

  // Handle search
  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);
    startTransition(() => {
      router.refresh();
    });
  }, [router]);

  // Handle delete with optimistic update (must be before columns useMemo)
  const handleDelete = useCallback(async (teacher: TeacherRow) => {
    try {
      const deleteMsg = lang === 'ar' ? `حذف ${teacher.name}؟` : `Delete ${teacher.name}?`;
      const ok = await confirmDeleteDialog(deleteMsg);
      if (!ok) return;

      // Optimistic remove
      optimisticRemove(teacher.id);

      const result = await deleteTeacher({ id: teacher.id });
      if (result.success) {
        DeleteToast();
      } else {
        // Revert on error
        refresh();
        ErrorToast(lang === 'ar' ? 'فشل حذف المعلم' : 'Failed to delete teacher');
      }
    } catch (e) {
      refresh();
      ErrorToast(e instanceof Error ? e.message : (lang === 'ar' ? 'فشل الحذف' : 'Failed to delete'));
    }
  }, [optimisticRemove, refresh, lang]);

  // Generate columns on the client side with dictionary, lang, and callbacks
  const columns = useMemo(() => getTeacherColumns(dictionary, lang, {
    onDelete: handleDelete,
  }), [dictionary, lang, handleDelete]);

  // Table instance
  const { table } = useDataTable<TeacherRow>({
    data,
    columns,
    pageCount: 1,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: data.length || perPage,
      },
      columnVisibility: {
        // Default visible: name, emailAddress, status
        createdAt: false,
      },
    },
  });

  // Handle edit
  const handleEdit = useCallback((id: string) => {
    openModal(id);
  }, [openModal]);

  // Handle view
  const handleView = useCallback((teacher: TeacherRow) => {
    if (!teacher.userId) {
      ErrorToast(lang === 'ar' ? 'هذا المعلم ليس لديه حساب مستخدم' : 'This teacher does not have a user account');
      return;
    }
    router.push(`/profile/${teacher.userId}`);
  }, [router, lang]);

  // Get status badge
  const getStatusBadge = (status: string) => {
    return status === "active"
      ? { label: t.active || "Active", variant: "default" as const }
      : { label: t.inactive || "Inactive", variant: "outline" as const };
  };

  // Export CSV wrapper
  const handleExportCSV = useCallback(async (filters?: Record<string, unknown>) => {
    const result = await getTeachersCSV(filters);
    if (!result.success || !result.data) {
      throw new Error('error' in result ? result.error : 'Export failed');
    }
    return result.data;
  }, []);

  // Toolbar translations
  const toolbarTranslations = {
    search: t.search,
    create: t.create,
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
        entityName="teachers"
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
              title={t.allTeachers}
              description={t.addNewTeacher}
              icon={<Users className="h-12 w-12" />}
            />
          ) : (
            <GridContainer columns={3}>
              {data.map((teacher) => {
                const statusBadge = getStatusBadge(teacher.status);
                const initials = teacher.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .substring(0, 2)
                  .toUpperCase();

                return (
                  <GridCard
                    key={teacher.id}
                    title={teacher.name}
                    subtitle={teacher.emailAddress !== "-" ? teacher.emailAddress : undefined}
                    avatarFallback={initials}
                    status={statusBadge}
                    metadata={[
                      { label: t.email, value: teacher.emailAddress },
                      { label: t.created, value: new Date(teacher.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US') },
                    ]}
                    actions={[
                      ...(teacher.userId
                        ? [{ label: t.view, onClick: () => handleView(teacher) }]
                        : []),
                      { label: t.edit, onClick: () => handleEdit(teacher.id) },
                      {
                        label: t.delete,
                        onClick: () => handleDelete(teacher),
                        variant: "destructive" as const,
                      },
                    ]}
                    actionsLabel={t.actions}
                    onClick={() => teacher.userId && handleView(teacher)}
                  >
                    <div className="flex flex-col gap-1 mt-2">
                      {teacher.emailAddress !== "-" && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          <span className="truncate">{teacher.emailAddress}</span>
                        </div>
                      )}
                      {!teacher.userId && (
                        <Badge variant="outline" className="gap-1 text-xs w-fit">
                          <User className="h-3 w-3" />
                          {t.noAccount}
                        </Badge>
                      )}
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

      <Modal content={<TeacherCreateForm onSuccess={refresh} />} />
    </>
  );
}
