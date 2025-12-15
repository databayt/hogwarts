/**
 * useBrowser Hook - File Browser State Management
 *
 * Manages complete file browser functionality including:
 * - File/folder navigation with history (back/forward support)
 * - Multi-select with ctrl+click support
 * - Sorting by name/date/size
 * - Search filtering
 * - Category filtering
 * - Pagination across loaded files
 * - Delete/download operations
 *
 * KEY PATTERNS:
 * - LAZY LOADING: fetchFiles() called on init and whenever path/filter/sort/page changes
 * - OPTIMISTIC UPDATES: Selection changes immediately, delete refetches after success
 * - HISTORY TRACKING: Maintains browser-like navigation history for back/forward
 * - CONFIGURATION: All features can be disabled via config (deletable, downloadable, etc.)
 *
 * GOTCHAS:
 * - Search is client-side only - filters loaded files (not server-side search)
 * - Folder extraction is simplified - assumes flat folder structure in file paths
 * - moveSelected is a stub - requires backend API implementation
 * - Download uses DOM methods - won't work with CORS-protected files
 */

"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import type {
  FileItem,
  FolderItem,
  BrowserState,
  BrowserActions,
  BrowserConfig,
  UseBrowserReturn,
  ViewMode,
  SortField,
  SortDirection,
} from "./types";
import type { FileCategory } from "../types";
import { getFiles, deleteFiles } from "../upload/actions";

// ============================================================================
// Default Configuration
// ============================================================================

const defaultConfig: BrowserConfig = {
  selectable: true,
  multiSelect: true,
  deletable: true,
  downloadable: true,
  navigable: true,
  showHidden: false,
  pageSize: 24,
  defaultViewMode: "grid",
  defaultSort: {
    field: "date",
    direction: "desc",
  },
};

// ============================================================================
// Hook Implementation
// ============================================================================

export function useBrowser(config: BrowserConfig = {}): UseBrowserReturn {
  const mergedConfig = { ...defaultConfig, ...config };

  // ============================================================================
  // State
  // ============================================================================

  const [files, setFiles] = useState<FileItem[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [totalFiles, setTotalFiles] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const [state, setState] = useState<BrowserState>({
    currentPath: mergedConfig.initialFolder || mergedConfig.rootFolder || "",
    selectedIds: new Set(),
    viewMode: mergedConfig.defaultViewMode || "grid",
    sortField: mergedConfig.defaultSort?.field || "date",
    sortDirection: mergedConfig.defaultSort?.direction || "desc",
    searchQuery: "",
    categoryFilter: undefined,
    isLoading: false,
    isDeleting: false,
    error: null,
  });

  // Navigation history for back/forward support (like browser navigation)
  // history[historyIndex] = current path, history[historyIndex+1] = forward available
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // ============================================================================
  // Data Fetching
  // ============================================================================

  const fetchFiles = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await getFiles({
        folder: state.currentPath || undefined,
        category: state.categoryFilter,
        limit: mergedConfig.pageSize,
        offset: (currentPage - 1) * (mergedConfig.pageSize || 24),
        orderBy: state.sortField === "date" ? "uploadedAt" : state.sortField === "name" ? "name" : "size",
        order: state.sortDirection,
      });

      // Transform to FileItem
      const fileItems: FileItem[] = result.files.map((f) => ({
        id: f.id,
        filename: f.filename,
        originalName: f.originalName,
        size: f.size,
        mimeType: f.mimeType,
        category: f.category as FileCategory,
        type: f.type as FileItem["type"],
        url: f.url,
        folder: state.currentPath,
        uploadedAt: f.uploadedAt,
        uploadedBy: f.uploadedBy,
      }));

      setFiles(fileItems);
      setTotalFiles(result.total);

      // Extract unique folders from current path files
      // This is a simplified approach - in production you'd have a separate folders endpoint
      const uniqueFolders = new Set<string>();
      fileItems.forEach((f) => {
        if (f.folder && f.folder !== state.currentPath) {
          const relativePath = f.folder.replace(state.currentPath, "").split("/")[1];
          if (relativePath) uniqueFolders.add(relativePath);
        }
      });

      setFolders(
        Array.from(uniqueFolders).map((name) => ({
          name,
          path: `${state.currentPath}/${name}`.replace(/\/+/g, "/"),
          fileCount: 0,
          totalSize: 0,
        }))
      );

      setState((prev) => ({ ...prev, isLoading: false }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : "Failed to load files",
      }));
    }
  }, [state.currentPath, state.categoryFilter, state.sortField, state.sortDirection, currentPage, mergedConfig.pageSize]);

  // Initial fetch and refetch on dependencies change
  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  // ============================================================================
  // Filtered & Sorted Files
  // ============================================================================

  const filteredFiles = useMemo(() => {
    if (!state.searchQuery) return files;

    const query = state.searchQuery.toLowerCase();
    return files.filter(
      (f) =>
        f.originalName.toLowerCase().includes(query) ||
        f.filename.toLowerCase().includes(query)
    );
  }, [files, state.searchQuery]);

  // ============================================================================
  // Breadcrumbs
  // ============================================================================

  const breadcrumbs = useMemo(() => {
    const parts = state.currentPath.split("/").filter(Boolean);
    const crumbs = [{ name: "Files", path: "" }];

    let currentPath = "";
    for (const part of parts) {
      currentPath += `/${part}`;
      crumbs.push({ name: part, path: currentPath });
    }

    return crumbs;
  }, [state.currentPath]);

  // ============================================================================
  // Navigation Actions
  // ============================================================================

  const navigateTo = useCallback((path: string) => {
    // Check root boundary
    if (mergedConfig.rootFolder && !path.startsWith(mergedConfig.rootFolder)) {
      return;
    }

    setHistory((prev) => [...prev.slice(0, historyIndex + 1), path]);
    setHistoryIndex((prev) => prev + 1);
    setState((prev) => ({
      ...prev,
      currentPath: path,
      selectedIds: new Set(),
    }));
    setCurrentPage(1);
  }, [mergedConfig.rootFolder, historyIndex]);

  const goUp = useCallback(() => {
    const parentPath = state.currentPath.split("/").slice(0, -1).join("/");
    if (mergedConfig.rootFolder && !parentPath.startsWith(mergedConfig.rootFolder)) {
      navigateTo(mergedConfig.rootFolder);
    } else {
      navigateTo(parentPath);
    }
  }, [state.currentPath, mergedConfig.rootFolder, navigateTo]);

  const goBack = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex((prev) => prev - 1);
      setState((prev) => ({
        ...prev,
        currentPath: history[historyIndex - 1],
        selectedIds: new Set(),
      }));
      setCurrentPage(1);
    }
  }, [history, historyIndex]);

  // ============================================================================
  // Selection Actions
  // ============================================================================

  const selectFile = useCallback((id: string) => {
    if (!mergedConfig.selectable) return;

    if (mergedConfig.multiSelect) {
      setState((prev) => ({
        ...prev,
        selectedIds: new Set([...prev.selectedIds, id]),
      }));
    } else {
      setState((prev) => ({
        ...prev,
        selectedIds: new Set([id]),
      }));
    }
  }, [mergedConfig.selectable, mergedConfig.multiSelect]);

  const toggleSelection = useCallback((id: string) => {
    if (!mergedConfig.selectable) return;

    setState((prev) => {
      const newSet = new Set(prev.selectedIds);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        if (!mergedConfig.multiSelect) {
          newSet.clear();
        }
        newSet.add(id);
      }
      return { ...prev, selectedIds: newSet };
    });
  }, [mergedConfig.selectable, mergedConfig.multiSelect]);

  const selectAll = useCallback(() => {
    if (!mergedConfig.selectable || !mergedConfig.multiSelect) return;
    setState((prev) => ({
      ...prev,
      selectedIds: new Set(filteredFiles.map((f) => f.id)),
    }));
  }, [mergedConfig.selectable, mergedConfig.multiSelect, filteredFiles]);

  const deselectAll = useCallback(() => {
    setState((prev) => ({ ...prev, selectedIds: new Set() }));
  }, []);

  // ============================================================================
  // View Actions
  // ============================================================================

  const setViewMode = useCallback((mode: ViewMode) => {
    setState((prev) => ({ ...prev, viewMode: mode }));
  }, []);

  const setSort = useCallback((field: SortField, direction?: SortDirection) => {
    setState((prev) => ({
      ...prev,
      sortField: field,
      sortDirection: direction || (prev.sortField === field && prev.sortDirection === "asc" ? "desc" : "asc"),
    }));
  }, []);

  const setSearch = useCallback((query: string) => {
    setState((prev) => ({ ...prev, searchQuery: query }));
  }, []);

  const setCategoryFilter = useCallback((category?: FileCategory) => {
    setState((prev) => ({ ...prev, categoryFilter: category }));
    setCurrentPage(1);
  }, []);

  // ============================================================================
  // File Actions
  // ============================================================================

  const deleteSelected = useCallback(async () => {
    if (!mergedConfig.deletable || state.selectedIds.size === 0) return;

    setState((prev) => ({ ...prev, isDeleting: true }));

    try {
      const result = await deleteFiles(Array.from(state.selectedIds));

      if (result.succeeded > 0) {
        // Refetch files
        fetchFiles();
        deselectAll();
      }

      if (result.failed > 0) {
        setState((prev) => ({
          ...prev,
          error: `Failed to delete ${result.failed} file(s)`,
        }));
      }
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : "Delete failed",
      }));
    } finally {
      setState((prev) => ({ ...prev, isDeleting: false }));
    }
  }, [mergedConfig.deletable, state.selectedIds, fetchFiles, deselectAll]);

  const downloadSelected = useCallback(() => {
    if (!mergedConfig.downloadable) return;

    // Download each selected file via DOM anchor element
    // Browser triggers download if Content-Disposition: attachment header is set
    // Falls back to opening in new tab if header is missing (viewer mode)
    filteredFiles
      .filter((f) => state.selectedIds.has(f.id))
      .forEach((f) => {
        const link = document.createElement("a");
        link.href = f.url;
        link.download = f.originalName;  // Triggers download if allowed by CORS
        link.target = "_blank";  // Fallback: open in new tab
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
  }, [mergedConfig.downloadable, filteredFiles, state.selectedIds]);

  const moveSelected = useCallback(async (targetFolder: string) => {
    // This would require a move endpoint
    console.warn("Move not implemented - requires backend support");
  }, []);

  const refresh = useCallback(() => {
    fetchFiles();
  }, [fetchFiles]);

  // ============================================================================
  // Pagination
  // ============================================================================

  const totalPages = Math.ceil(totalFiles / (mergedConfig.pageSize || 24));

  const setPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  // ============================================================================
  // Return
  // ============================================================================

  const actions: BrowserActions = {
    navigateTo,
    goUp,
    goBack,
    selectFile,
    selectAll,
    deselectAll,
    toggleSelection,
    setViewMode,
    setSort,
    setSearch,
    setCategoryFilter,
    deleteSelected,
    downloadSelected,
    moveSelected,
    refresh,
  };

  return {
    files: filteredFiles,
    folders,
    breadcrumbs,
    state,
    actions,
    currentPage,
    totalPages,
    totalFiles,
    setPage,
  };
}
