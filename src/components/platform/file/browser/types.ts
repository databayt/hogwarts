/**
 * Unified File Block - Browser Types
 * Type definitions for file browser
 */

import type { FileCategory, FileType, FileMetadata } from "../types";

// ============================================================================
// View Types
// ============================================================================

export type ViewMode = "grid" | "list" | "compact";
export type SortField = "name" | "size" | "date" | "type";
export type SortDirection = "asc" | "desc";

// ============================================================================
// File Item
// ============================================================================

export interface FileItem {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  category: FileCategory;
  type?: FileType;
  url: string;
  pathname?: string;
  folder: string;
  thumbnailUrl?: string;
  uploadedAt: Date;
  uploadedBy: string;
  uploaderName?: string;
  width?: number;
  height?: number;
  duration?: number;
}

// ============================================================================
// Folder Item
// ============================================================================

export interface FolderItem {
  name: string;
  path: string;
  fileCount: number;
  totalSize: number;
  lastModified?: Date;
}

// ============================================================================
// Browser State
// ============================================================================

export interface BrowserState {
  /** Current folder path */
  currentPath: string;

  /** Selected file IDs */
  selectedIds: Set<string>;

  /** View mode */
  viewMode: ViewMode;

  /** Sort configuration */
  sortField: SortField;
  sortDirection: SortDirection;

  /** Filter */
  searchQuery: string;
  categoryFilter?: FileCategory;

  /** Loading states */
  isLoading: boolean;
  isDeleting: boolean;

  /** Error */
  error: string | null;
}

// ============================================================================
// Browser Actions
// ============================================================================

export interface BrowserActions {
  /** Navigation */
  navigateTo: (path: string) => void;
  goUp: () => void;
  goBack: () => void;

  /** Selection */
  selectFile: (id: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
  toggleSelection: (id: string) => void;

  /** View */
  setViewMode: (mode: ViewMode) => void;
  setSort: (field: SortField, direction?: SortDirection) => void;
  setSearch: (query: string) => void;
  setCategoryFilter: (category?: FileCategory) => void;

  /** Actions */
  deleteSelected: () => Promise<void>;
  downloadSelected: () => void;
  moveSelected: (targetFolder: string) => Promise<void>;

  /** Refresh */
  refresh: () => void;
}

// ============================================================================
// Browser Configuration
// ============================================================================

export interface BrowserConfig {
  /** Root folder (cannot navigate above this) */
  rootFolder?: string;

  /** Initial folder */
  initialFolder?: string;

  /** Allowed categories */
  allowedCategories?: FileCategory[];

  /** Enable selection */
  selectable?: boolean;

  /** Single or multiple selection */
  multiSelect?: boolean;

  /** Enable deletion */
  deletable?: boolean;

  /** Enable download */
  downloadable?: boolean;

  /** Enable folder navigation */
  navigable?: boolean;

  /** Show hidden files */
  showHidden?: boolean;

  /** Page size for pagination */
  pageSize?: number;

  /** Default view mode */
  defaultViewMode?: ViewMode;

  /** Default sort */
  defaultSort?: {
    field: SortField;
    direction: SortDirection;
  };
}

// ============================================================================
// Hook Return Types
// ============================================================================

export interface UseBrowserReturn {
  /** Data */
  files: FileItem[];
  folders: FolderItem[];
  breadcrumbs: Array<{ name: string; path: string }>;

  /** State */
  state: BrowserState;

  /** Actions */
  actions: BrowserActions;

  /** Pagination */
  currentPage: number;
  totalPages: number;
  totalFiles: number;
  setPage: (page: number) => void;
}

// ============================================================================
// Context Menu
// ============================================================================

export interface ContextMenuItem {
  label: string;
  labelAr?: string;
  icon?: string;
  action: () => void;
  disabled?: boolean;
  danger?: boolean;
  divider?: boolean;
}

// ============================================================================
// Preview Types
// ============================================================================

export interface PreviewState {
  isOpen: boolean;
  file: FileItem | null;
  canNavigate: boolean;
}

export interface PreviewActions {
  open: (file: FileItem) => void;
  close: () => void;
  next: () => void;
  previous: () => void;
}
