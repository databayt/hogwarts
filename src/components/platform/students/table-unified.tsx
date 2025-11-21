'use client';

import { useMemo, useState, useCallback, useTransition } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/table/data-table/data-table-column-header';
import { UnifiedDataTable } from '@/components/table/UnifiedDataTable';
import { CrudModal, CrudForm, useCrudModal } from '@/components/crud-modal';
import { useDataTable } from '@/components/table/hooks/use-data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, MoreHorizontal, Eye, Edit, Trash2, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ExportButton } from '@/components/export';
import { ViewToggle, useViewMode } from '@/components/view-toggle';
import { showSuccess, showError, showDelete, confirmDelete } from '@/lib/toast-utils';
import { useDictionary } from '@/components/internationalization/use-dictionary';
import { StudentCreateForm } from './form';
import { getStudents, deleteStudent, getStudentsCSV } from './actions';
import { createStudentCreateSchema, createStudentUpdateSchema } from './validation';
import type { Dictionary } from '@/components/internationalization/dictionaries';

export type StudentRow = {
  id: string;
  userId: string | null;
  name: string;
  className: string;
  status: string;
  createdAt: string;
  email?: string;
  phone?: string;
  gender?: string;
  dateOfBirth?: string;
};

interface StudentsUnifiedTableProps {
  initialData: StudentRow[];
  total: number;
  dictionary?: Dictionary['school']['students'];
  perPage?: number;
}

export function StudentsUnifiedTable({
  initialData,
  total,
  dictionary,
  perPage = 20,
}: StudentsUnifiedTableProps) {
  const { dictionary: fullDict } = useDictionary();
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState<StudentRow[]>(initialData);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // View mode management
  const viewMode = useViewMode({
    defaultMode: 'list',
    storageKey: 'students-view-mode',
  });

  // CRUD modal management
  const crudModal = useCrudModal<StudentRow>({
    onSuccess: async (mode) => {
      if (mode === 'delete') {
        showDelete(dictionary?.deleteStudent || 'Student deleted');
      } else {
        showSuccess(
          mode === 'create'
            ? dictionary?.createStudent || 'Student created successfully'
            : dictionary?.editStudent || 'Student updated successfully'
        );
      }
      await refreshData();
    },
    onError: (error) => {
      showError(error.message || fullDict?.common?.operation_failed || 'Operation failed');
    },
  });

  // Column definitions
  const columns = useMemo<ColumnDef<StudentRow>[]>(() => {
    const dict = dictionary || {
      fullName: 'Name',
      class: 'Class',
      status: 'Status',
      created: 'Created',
      actions: 'Actions',
      editStudent: 'Edit Student',
      deleteStudent: 'Delete Student',
    };

    return [
      {
        accessorKey: 'name',
        id: 'name',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={dict.fullName || 'Name'} />
        ),
        cell: ({ row }) => {
          const student = row.original;
          const initials = student.name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase();

          return (
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={`/api/avatar/${student.id}`} alt={student.name} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <span className="font-medium">{student.name}</span>
            </div>
          );
        },
        meta: {
          label: dict.fullName || 'Name',
          variant: 'text',
        },
        enableColumnFilter: true,
      },
      {
        accessorKey: 'className',
        id: 'className',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={dict.class || 'Class'} />
        ),
        meta: {
          label: dict.class || 'Class',
          variant: 'text',
        },
      },
      {
        accessorKey: 'status',
        id: 'status',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={'Status'} />
        ),
        cell: ({ getValue }) => {
          const status = getValue<string>();
          const variant = status === 'active' ? 'default' : 'secondary';
          return (
            <Badge variant={variant}>
              {status === 'active' ? 'Active' : 'Inactive'}
            </Badge>
          );
        },
        meta: {
          label: 'Status',
          variant: 'select',
          options: [
            { label: 'Active', value: 'active' },
            { label: 'Inactive', value: 'inactive' },
          ],
        },
        enableColumnFilter: true,
      },
      {
        accessorKey: 'createdAt',
        id: 'createdAt',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={'Created'} />
        ),
        cell: ({ getValue }) => (
          <span className="text-xs tabular-nums text-muted-foreground">
            {new Date(getValue<string>()).toLocaleDateString()}
          </span>
        ),
        meta: {
          label: 'Created',
          variant: 'text',
        },
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => {
          const student = row.original;

          const handleView = () => {
            if (!student.userId) {
              showError('This student does not have a user account');
              return;
            }
            const qs = typeof window !== 'undefined' ? window.location.search || '' : '';
            window.location.href = `/profile/${student.userId}${qs}`;
          };

          const handleEdit = () => {
            crudModal.openEdit(student);
          };

          const handleDelete = async () => {
            const confirmed = await confirmDelete(
              `Delete ${student.name}?`,
              fullDict
            );
            if (!confirmed) return;

            startTransition(async () => {
              try {
                await deleteStudent({ id: student.id });
                showDelete(dictionary?.deleteStudent || 'Student deleted');
                await refreshData();
              } catch (error) {
                showError(
                  error instanceof Error ? error.message : 'Failed to delete'
                );
              }
            });
          };

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleView}>
                  <Eye className="h-4 w-4 me-2" />
                  View
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleEdit}>
                  <Edit className="h-4 w-4 me-2" />
                  {dict.editStudent || 'Edit'}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 me-2" />
                  {dict.deleteStudent || 'Delete'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
        enableSorting: false,
        enableColumnFilter: false,
      },
    ];
  }, [dictionary, fullDict, crudModal]);

  // Data refresh
  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getStudents({ page: 1, perPage: currentPage * perPage });
      setData(result.rows as StudentRow[]);
    } catch (error) {
      console.error('Failed to refresh students:', error);
      showError('Failed to refresh data');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, perPage]);

  // Load more handler
  const handleLoadMore = useCallback(async () => {
    if (isLoading || data.length >= total) return;

    setIsLoading(true);
    try {
      const nextPage = currentPage + 1;
      const result = await getStudents({ page: nextPage, perPage });

      if (result.rows.length > 0) {
        setData(prev => [...prev, ...result.rows as StudentRow[]]);
        setCurrentPage(nextPage);
      }
    } catch (error) {
      console.error('Failed to load more students:', error);
      showError('Failed to load more data');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, perPage, isLoading, data.length, total]);

  // Export handler
  const handleExport = useCallback(async () => {
    // Return all student data for export
    return data;
  }, [data]);

  // Grid card renderer
  const renderStudentCard = useCallback((student: StudentRow) => {
    const initials = student.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();

    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <Avatar className="h-12 w-12">
              <AvatarImage src={`/api/avatar/${student.id}`} alt={student.name} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <Badge variant={student.status === 'active' ? 'default' : 'secondary'}>
              {student.status === 'active' ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <CardTitle className="text-base">{student.name}</CardTitle>
          <CardDescription className="mt-1">
            <div className="space-y-1 text-sm">
              <div>Class: {student.className}</div>
              {student.email && <div>Email: {student.email}</div>}
              {student.phone && <div>Phone: {student.phone}</div>}
            </div>
          </CardDescription>
          <div className="flex gap-1 mt-3">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                if (student.userId) {
                  window.location.href = `/profile/${student.userId}`;
                } else {
                  showError('No user account');
                }
              }}
            >
              <User className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => crudModal.openEdit(student)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={async () => {
                const confirmed = await confirmDelete(`Delete ${student.name}?`);
                if (confirmed) {
                  await deleteStudent({ id: student.id });
                  showDelete('Student deleted');
                  refreshData();
                }
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }, [crudModal, refreshData]);

  // Initialize data table
  const { table } = useDataTable<StudentRow>({
    data,
    columns,
    pageCount: 1,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: data.length,
      },
    },
  });

  const hasMore = data.length < total;

  return (
    <>
      <UnifiedDataTable
        table={table}
        toolbar={{
          searchKey: 'search',
          searchPlaceholder: 'Search students...',
          showViewToggle: true,
          showExport: true,
          customActions: (
            <div className="flex items-center gap-2">
              <ViewToggle
                value={viewMode.mode}
                onChange={viewMode.setMode}
                storageKey="students-view-mode"
              />
              <ExportButton
                fetchData={handleExport}
                columns={['name', 'className', 'status', 'email', 'phone']}
                filename="students"
                entityPath="school.students"
              />
              <Button onClick={crudModal.openCreate}>
                <Plus className="h-4 w-4 me-2" />
                Create Student
              </Button>
            </div>
          ),
        }}
        viewMode={{
          enabled: true,
          defaultMode: viewMode.mode,
          renderCard: renderStudentCard,
        }}
        paginationMode="load-more"
        hasMore={hasMore}
        isLoading={isLoading || isPending}
        onLoadMore={handleLoadMore}
        autoRefresh={{
          enabled: false,
          interval: 30000,
          onRefresh: refreshData,
        }}
        emptyMessage="No students found"
      />

      {/* CRUD Modal */}
      <CrudModal
        open={crudModal.state.open}
        onOpenChange={open => !open && crudModal.close()}
        title={
          crudModal.isCreate
            ? 'Create Student'
            : 'Edit Student'
        }
        loading={crudModal.state.loading || isPending}
        autoCloseDelay={500}
        onSuccess={crudModal.handleSuccess}
        onError={crudModal.handleError}
      >
        <StudentCreateForm
          dictionary={dictionary}
          onSuccess={() => {
            crudModal.handleSuccess();
          }}
        />
      </CrudModal>
    </>
  );
}