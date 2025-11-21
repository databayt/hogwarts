'use client';

import { useCallback, useMemo, useState, useTransition } from 'react';
import { useDataTable } from '@/components/table/hooks/use-data-table';
import { UnifiedDataTable } from '@/components/table/UnifiedDataTable';
import { CrudModal, CrudForm, useCrudModal } from '@/components/crud-modal';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { showCrudToast, confirmDelete } from '@/lib/toast-utils';
import { useDictionary } from '@/components/internationalization/use-dictionary';
import type { ColumnDef } from '@tanstack/react-table';
import type { z } from 'zod';
import type { FieldValues } from 'react-hook-form';
import { cn } from '@/lib/utils';

export interface ListingConfig<TData, TFormValues extends FieldValues = FieldValues> {
  /** Entity name for display */
  entityName: string;
  /** Entity path in dictionary */
  entityPath?: string;
  /** Column definitions */
  columns: ColumnDef<TData>[];
  /** Validation schema for forms */
  schema?: z.ZodType<TFormValues>;
  /** Server actions */
  actions: {
    /** Fetch initial data */
    fetchData?: (params?: any) => Promise<TData[]>;
    /** Create new item */
    create?: (data: TFormValues) => Promise<any>;
    /** Update existing item */
    update?: (id: string, data: TFormValues) => Promise<any>;
    /** Delete item */
    delete?: (id: string) => Promise<any>;
    /** Export data */
    exportData?: () => Promise<TData[]>;
  };
  /** Form configuration */
  form?: {
    /** Render form fields */
    renderFields?: (form: any) => React.ReactNode;
    /** Default values for create */
    defaultValues?: Partial<TFormValues>;
    /** Transform data before submit */
    transformData?: (data: TFormValues, mode: 'create' | 'edit') => TFormValues;
  };
  /** Table configuration */
  table?: {
    /** Enable row selection */
    enableRowSelection?: boolean;
    /** Enable sorting */
    enableSorting?: boolean;
    /** Enable column filters */
    enableColumnFilters?: boolean;
    /** Enable global filter */
    enableGlobalFilter?: boolean;
    /** Pagination mode */
    paginationMode?: 'pagination' | 'load-more';
    /** Page size */
    pageSize?: number;
  };
  /** View mode configuration */
  viewMode?: {
    /** Enable view toggle */
    enabled?: boolean;
    /** Default mode */
    defaultMode?: 'list' | 'grid';
    /** Render card for grid view */
    renderCard?: (item: TData) => React.ReactNode;
  };
  /** Export configuration */
  export?: {
    /** Enable export */
    enabled?: boolean;
    /** Export columns */
    columns?: string[];
    /** Column formatters */
    formatters?: Record<string, (value: any) => any>;
  };
  /** Auto-refresh configuration */
  autoRefresh?: {
    /** Enable auto-refresh */
    enabled?: boolean;
    /** Refresh interval in ms */
    interval?: number;
  };
  /** Permissions */
  permissions?: {
    /** Can create new items */
    canCreate?: boolean;
    /** Can edit items */
    canEdit?: boolean;
    /** Can delete items */
    canDelete?: boolean;
    /** Can export data */
    canExport?: boolean;
  };
  /** Custom components */
  components?: {
    /** Custom toolbar actions */
    toolbarActions?: React.ReactNode;
    /** Custom empty state */
    emptyState?: React.ReactNode;
  };
}

export interface ListingTemplateProps<TData, TFormValues extends FieldValues = FieldValues> {
  /** Initial data */
  initialData: TData[];
  /** Listing configuration */
  config: ListingConfig<TData, TFormValues>;
  /** Search params for filters */
  searchParams?: Record<string, any>;
  /** Additional class names */
  className?: string;
}

export function ListingTemplate<TData extends { id: string }, TFormValues extends FieldValues = FieldValues>({
  initialData,
  config,
  searchParams,
  className,
}: ListingTemplateProps<TData, TFormValues>) {
  const { dictionary } = useDictionary();
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState<TData[]>(initialData);

  // CRUD modal state
  const crudModal = useCrudModal<TData>({
    onSuccess: async (mode) => {
      // Only show toast for create/update/delete modes
      if (mode !== 'view') {
        showCrudToast(mode as 'create' | 'update' | 'delete', true, undefined, dictionary);
      }
      await refreshData();
    },
    onError: (error) => {
      showCrudToast('create', false, { error: error.message }, dictionary);
    },
  });

  // Permissions with defaults
  const permissions = useMemo(() => ({
    canCreate: config.permissions?.canCreate ?? true,
    canEdit: config.permissions?.canEdit ?? true,
    canDelete: config.permissions?.canDelete ?? true,
    canExport: config.permissions?.canExport ?? true,
  }), [config.permissions]);

  // Enhanced columns with actions
  const enhancedColumns = useMemo(() => {
    const baseColumns = [...config.columns];

    // Add actions column if any action is permitted
    if (permissions.canEdit || permissions.canDelete) {
      baseColumns.push({
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const item = row.original;

          return (
            <div className="flex items-center gap-1">
              {permissions.canEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => crudModal.openEdit(item)}
                >
                  <span className="sr-only">Edit</span>
                  ✏️
                </Button>
              )}
              {permissions.canDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={async () => {
                    const confirmed = await confirmDelete(undefined, dictionary);
                    if (confirmed) {
                      await handleDelete(item.id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Delete</span>
                </Button>
              )}
            </div>
          );
        },
      } as ColumnDef<TData>);
    }

    return baseColumns;
  }, [config.columns, permissions, dictionary, crudModal]);

  // Table configuration
  const tableConfig = useMemo(() => ({
    enableRowSelection: config.table?.enableRowSelection ?? false,
    enableSorting: config.table?.enableSorting ?? true,
    enableColumnFilters: config.table?.enableColumnFilters ?? true,
    enableGlobalFilter: config.table?.enableGlobalFilter ?? false,
    pageSize: config.table?.pageSize ?? 10,
  }), [config.table]);

  // Initialize data table
  const { table } = useDataTable<TData>({
    data,
    columns: enhancedColumns,
    pageCount: 1, // Single page for client-side data
    ...tableConfig,
  });

  // Refresh data
  const refreshData = useCallback(async () => {
    if (!config.actions.fetchData) return;

    startTransition(async () => {
      try {
        const newData = await config.actions.fetchData!(searchParams);
        setData(newData);
      } catch (error) {
        console.error('Failed to refresh data:', error);
      }
    });
  }, [config.actions, searchParams]);

  // Handle delete
  const handleDelete = useCallback(async (id: string) => {
    if (!config.actions.delete) return;

    startTransition(async () => {
      try {
        await config.actions.delete!(id);
        showCrudToast('delete', true, undefined, dictionary);
        await refreshData();
      } catch (error) {
        showCrudToast('delete', false, { error: (error as Error).message }, dictionary);
      }
    });
  }, [config.actions, dictionary, refreshData]);

  // Handle form submit
  const handleFormSubmit = useCallback(async (formData: TFormValues) => {
    const mode = crudModal.isCreate ? 'create' : 'edit';
    let processedData = formData;

    // Transform data if needed
    if (config.form?.transformData) {
      processedData = config.form.transformData(formData, mode);
    }

    if (mode === 'create' && config.actions.create) {
      return await config.actions.create(processedData);
    } else if (mode === 'edit' && config.actions.update && crudModal.state.data) {
      return await config.actions.update(crudModal.state.data.id, processedData);
    }

    throw new Error('Invalid operation');
  }, [crudModal, config]);

  // Modal title
  const modalTitle = useMemo(() => {
    if (crudModal.isCreate) {
      return `Create ${config.entityName}`;
    } else if (crudModal.isEdit) {
      return `Edit ${config.entityName}`;
    }
    return config.entityName;
  }, [crudModal, config.entityName]);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{config.entityName}</h2>
        {permissions.canCreate && (
          <Button onClick={crudModal.openCreate}>
            <Plus className="h-4 w-4 me-2" />
            Create
          </Button>
        )}
      </div>

      {/* Data Table */}
      <UnifiedDataTable
        table={table}
        toolbar={{
          searchKey: 'search',
          searchPlaceholder: dictionary?.common?.search || 'Search...',
          showViewToggle: config.viewMode?.enabled,
          showExport: permissions.canExport && config.export?.enabled,
          customActions: config.components?.toolbarActions,
        }}
        exportConfig={
          config.export?.enabled && config.actions.exportData
            ? {
                fetchData: config.actions.exportData,
                columns: config.export.columns || [],
                filename: config.entityName.toLowerCase(),
                formatters: config.export.formatters,
                entityPath: config.entityPath,
              }
            : undefined
        }
        viewMode={{
          enabled: config.viewMode?.enabled,
          defaultMode: config.viewMode?.defaultMode,
          renderCard: config.viewMode?.renderCard,
        }}
        paginationMode={config.table?.paginationMode}
        autoRefresh={
          config.autoRefresh?.enabled
            ? {
                enabled: true,
                interval: config.autoRefresh.interval,
                onRefresh: refreshData,
              }
            : undefined
        }
        emptyMessage={config.components?.emptyState as string}
      />

      {/* CRUD Modal */}
      {config.schema && config.form?.renderFields && (
        <CrudModal
          open={crudModal.state.open}
          onOpenChange={(open) => !open && crudModal.close()}
          title={modalTitle}
          loading={crudModal.state.loading || isPending}
          autoCloseDelay={500}
          onSuccess={crudModal.handleSuccess}
          onError={crudModal.handleError}
        >
          <CrudForm
            schema={config.schema}
            defaultValues={
              crudModal.isEdit && crudModal.state.data
                ? (crudModal.state.data as any)
                : config.form.defaultValues
            }
            onSubmit={handleFormSubmit}
            submitLabel={
              crudModal.isCreate
                ? 'Create'
                : 'Save'
            }
            showCancel
            onCancel={crudModal.close}
          >
            {config.form.renderFields}
          </CrudForm>
        </CrudModal>
      )}
    </div>
  );
}