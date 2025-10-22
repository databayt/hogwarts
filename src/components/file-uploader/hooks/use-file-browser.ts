/**
 * useFileBrowser Hook
 * Manages file browser state (view, filters, sorting, selection)
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import type {
  UseFileBrowserReturn,
  FileBrowserState,
  FileBrowserView,
  FileBrowserFilter,
  FileBrowserSort,
  FileMetadata,
} from '../types';
import { listFilesAction, deleteFileAction } from '../actions';
import { toast } from 'sonner';

interface UseFileBrowserOptions {
  schoolId: string;
  folder?: string;
  initialView?: FileBrowserView;
  autoLoad?: boolean;
}

export function useFileBrowser(
  options: UseFileBrowserOptions
): UseFileBrowserReturn {
  const [state, setState] = useState<FileBrowserState>({
    files: [],
    view: options.initialView || 'grid',
    filter: {
      folder: options.folder,
    },
    sort: {
      field: 'uploadedAt',
      direction: 'desc',
    },
    selected: [],
    loading: false,
    error: undefined,
  });

  // Load files
  const loadFiles = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: undefined }));

    try {
      const result = await listFilesAction({
        schoolId: options.schoolId,
        folder: state.filter.folder,
        category: state.filter.category,
        type: state.filter.type,
      });

      if (result.success && result.files) {
        // Apply client-side sorting
        const sortedFiles = [...result.files].sort((a, b) => {
          const field = state.sort.field;
          const direction = state.sort.direction === 'asc' ? 1 : -1;

          if (field === 'uploadedAt') {
            return (
              direction *
              (new Date(a.uploadedAt).getTime() -
                new Date(b.uploadedAt).getTime())
            );
          }

          if (field === 'size') {
            return direction * (a.size - b.size);
          }

          if (field === 'name') {
            return direction * a.filename.localeCompare(b.filename);
          }

          if (field === 'type') {
            return direction * (a.type || '').localeCompare(b.type || '');
          }

          return 0;
        });

        // Apply search filter if present
        let filteredFiles = sortedFiles;
        if (state.filter.search) {
          const searchLower = state.filter.search.toLowerCase();
          filteredFiles = sortedFiles.filter(
            (file) =>
              file.filename.toLowerCase().includes(searchLower) ||
              file.originalName.toLowerCase().includes(searchLower)
          );
        }

        // Apply date range filter if present
        if (state.filter.dateRange) {
          filteredFiles = filteredFiles.filter((file) => {
            const uploadDate = new Date(file.uploadedAt);
            return (
              uploadDate >= state.filter.dateRange!.from &&
              uploadDate <= state.filter.dateRange!.to
            );
          });
        }

        setState((prev) => ({
          ...prev,
          files: filteredFiles,
          loading: false,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          error: result.error || 'Failed to load files',
          loading: false,
        }));
        toast.error(result.error || 'Failed to load files');
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to load files';
      setState((prev) => ({
        ...prev,
        error: errorMessage,
        loading: false,
      }));
      toast.error(errorMessage);
    }
  }, [options.schoolId, state.filter, state.sort]);

  // Auto-load on mount if enabled
  useEffect(() => {
    if (options.autoLoad) {
      loadFiles();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Actions
  const setView = useCallback((view: FileBrowserView) => {
    setState((prev) => ({ ...prev, view }));
  }, []);

  const setFilter = useCallback((filter: Partial<FileBrowserFilter>) => {
    setState((prev) => ({
      ...prev,
      filter: { ...prev.filter, ...filter },
    }));
  }, []);

  const setSort = useCallback((sort: FileBrowserSort) => {
    setState((prev) => ({ ...prev, sort }));
  }, []);

  const toggleSelect = useCallback((fileId: string) => {
    setState((prev) => {
      const isSelected = prev.selected.includes(fileId);
      return {
        ...prev,
        selected: isSelected
          ? prev.selected.filter((id) => id !== fileId)
          : [...prev.selected, fileId],
      };
    });
  }, []);

  const selectAll = useCallback(() => {
    setState((prev) => ({
      ...prev,
      selected: prev.files.map((file) => file.id),
    }));
  }, []);

  const clearSelection = useCallback(() => {
    setState((prev) => ({ ...prev, selected: [] }));
  }, []);

  const refresh = useCallback(async () => {
    await loadFiles();
  }, [loadFiles]);

  const deleteSelected = useCallback(async () => {
    if (state.selected.length === 0) {
      toast.error('No files selected');
      return;
    }

    setState((prev) => ({ ...prev, loading: true }));

    try {
      const deletePromises = state.selected.map(async (fileId) => {
        const file = state.files.find((f) => f.id === fileId);
        if (!file) return { success: false };

        return await deleteFileAction({
          url: file.url,
          schoolId: options.schoolId,
          userId: file.uploadedBy,
        });
      });

      const results = await Promise.all(deletePromises);
      const succeeded = results.filter((r) => r.success).length;
      const failed = results.length - succeeded;

      if (succeeded > 0) {
        toast.success(`${succeeded} file(s) deleted successfully`);
      }

      if (failed > 0) {
        toast.error(`Failed to delete ${failed} file(s)`);
      }

      // Clear selection and refresh
      clearSelection();
      await loadFiles();
    } catch (error) {
      toast.error('Failed to delete files');
    } finally {
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, [state.selected, state.files, options.schoolId, clearSelection, loadFiles]);

  return {
    state,
    actions: {
      setView,
      setFilter,
      setSort,
      toggleSelect,
      selectAll,
      clearSelection,
      refresh,
      deleteSelected,
    },
  };
}
