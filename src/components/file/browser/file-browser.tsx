/**
 * Unified File Block - File Browser Component
 * Grid/List view file browser with selection and actions
 */

"use client";

import * as React from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Folder,
  File,
  Image,
  Video,
  Music,
  FileText,
  Archive,
  ChevronRight,
  Grid,
  List,
  LayoutList,
  Search,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  MoreVertical,
  Check,
  ArrowUpDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { BrowserConfig, FileItem, FolderItem, ViewMode } from "./types";
import type { FileCategory } from "../types";
import { useBrowser } from "./use-browser";
import { formatBytes, formatRelativeTime } from "../formatters";

// ============================================================================
// Types
// ============================================================================

interface FileBrowserProps {
  config?: BrowserConfig;
  onSelect?: (files: FileItem[]) => void;
  onOpen?: (file: FileItem) => void;
  className?: string;
  dictionary?: {
    files?: string;
    folders?: string;
    search?: string;
    upload?: string;
    delete?: string;
    download?: string;
    refresh?: string;
    selectAll?: string;
    deselectAll?: string;
    noFiles?: string;
    confirmDelete?: string;
    deleteMessage?: string;
    cancel?: string;
    name?: string;
    size?: string;
    date?: string;
    type?: string;
  };
}

// ============================================================================
// Category Icons
// ============================================================================

const categoryIcons: Record<FileCategory, React.ReactNode> = {
  image: <Image className="h-5 w-5 text-blue-500" />,
  video: <Video className="h-5 w-5 text-purple-500" />,
  document: <FileText className="h-5 w-5 text-orange-500" />,
  audio: <Music className="h-5 w-5 text-pink-500" />,
  archive: <Archive className="h-5 w-5 text-yellow-600" />,
  other: <File className="h-5 w-5 text-gray-500" />,
};

// ============================================================================
// View Mode Icons
// ============================================================================

const viewModeIcons: Record<ViewMode, React.ReactNode> = {
  grid: <Grid className="h-4 w-4" />,
  list: <List className="h-4 w-4" />,
  compact: <LayoutList className="h-4 w-4" />,
};

// ============================================================================
// File Browser Component
// ============================================================================

export function FileBrowser({
  config,
  onSelect,
  onOpen,
  className,
  dictionary,
}: FileBrowserProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const {
    files,
    folders,
    breadcrumbs,
    state,
    actions,
    currentPage,
    totalPages,
    totalFiles,
    setPage,
  } = useBrowser(config);

  // Handle file selection change
  React.useEffect(() => {
    const selectedFiles = files.filter((f) => state.selectedIds.has(f.id));
    onSelect?.(selectedFiles);
  }, [files, state.selectedIds, onSelect]);

  // Handle file double click
  const handleFileOpen = (file: FileItem) => {
    onOpen?.(file);
  };

  // Handle folder click
  const handleFolderClick = (folder: FolderItem) => {
    actions.navigateTo(folder.path);
  };

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 p-4 border-b border-border">
        {/* Left: Breadcrumbs */}
        <div className="flex items-center gap-1 text-sm overflow-x-auto">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={crumb.path}>
              {idx > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
              <button
                onClick={() => actions.navigateTo(crumb.path)}
                className={cn(
                  "hover:text-primary transition-colors whitespace-nowrap",
                  idx === breadcrumbs.length - 1 ? "font-medium" : "text-muted-foreground"
                )}
              >
                {crumb.name}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={dictionary?.search || "Search..."}
              value={state.searchQuery}
              onChange={(e) => actions.setSearch(e.target.value)}
              className="pl-8 w-48"
            />
          </div>

          {/* Category Filter */}
          <Select
            value={state.categoryFilter || "all"}
            onValueChange={(v) => actions.setCategoryFilter(v === "all" ? undefined : v as FileCategory)}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="image">Images</SelectItem>
              <SelectItem value="video">Videos</SelectItem>
              <SelectItem value="document">Documents</SelectItem>
              <SelectItem value="audio">Audio</SelectItem>
              <SelectItem value="archive">Archives</SelectItem>
            </SelectContent>
          </Select>

          {/* View Mode */}
          <div className="flex border border-border rounded-md">
            {(["grid", "list", "compact"] as ViewMode[]).map((mode) => (
              <Button
                key={mode}
                variant="ghost"
                size="icon"
                className={cn(
                  "rounded-none first:rounded-l-md last:rounded-r-md h-9 w-9",
                  state.viewMode === mode && "bg-muted"
                )}
                onClick={() => actions.setViewMode(mode)}
              >
                {viewModeIcons[mode]}
              </Button>
            ))}
          </div>

          {/* Refresh */}
          <Button variant="ghost" size="icon" onClick={actions.refresh} disabled={state.isLoading}>
            <RefreshCw className={cn("h-4 w-4", state.isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Selection Bar */}
      {state.selectedIds.size > 0 && (
        <div className="flex items-center justify-between gap-4 px-4 py-2 bg-muted/50 border-b border-border">
          <span className="text-sm text-muted-foreground">
            {state.selectedIds.size} selected
          </span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={actions.selectAll}>
              {dictionary?.selectAll || "Select All"}
            </Button>
            <Button variant="ghost" size="sm" onClick={actions.deselectAll}>
              {dictionary?.deselectAll || "Deselect"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={actions.downloadSelected}
            >
              <Download className="mr-2 h-4 w-4" />
              {dictionary?.download || "Download"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {dictionary?.delete || "Delete"}
            </Button>
          </div>
        </div>
      )}

      {/* Content Area */}
      <ScrollArea className="flex-1">
        {state.isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : files.length === 0 && folders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <Folder className="h-12 w-12 mb-4" />
            <p>{dictionary?.noFiles || "No files found"}</p>
          </div>
        ) : state.viewMode === "grid" ? (
          <GridView
            files={files}
            folders={folders}
            selectedIds={state.selectedIds}
            onToggleSelect={actions.toggleSelection}
            onFolderClick={handleFolderClick}
            onFileOpen={handleFileOpen}
          />
        ) : state.viewMode === "list" ? (
          <ListView
            files={files}
            folders={folders}
            selectedIds={state.selectedIds}
            sortField={state.sortField}
            sortDirection={state.sortDirection}
            onSort={actions.setSort}
            onToggleSelect={actions.toggleSelection}
            onFolderClick={handleFolderClick}
            onFileOpen={handleFileOpen}
            dictionary={dictionary}
          />
        ) : (
          <CompactView
            files={files}
            folders={folders}
            selectedIds={state.selectedIds}
            onToggleSelect={actions.toggleSelection}
            onFolderClick={handleFolderClick}
            onFileOpen={handleFileOpen}
          />
        )}
      </ScrollArea>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-2 border-t border-border">
          <span className="text-sm text-muted-foreground">
            {totalFiles} files
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dictionary?.confirmDelete || "Confirm Delete"}</DialogTitle>
            <DialogDescription>
              {dictionary?.deleteMessage ||
                `Are you sure you want to delete ${state.selectedIds.size} file(s)? This action cannot be undone.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              {dictionary?.cancel || "Cancel"}
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                await actions.deleteSelected();
                setShowDeleteDialog(false);
              }}
              disabled={state.isDeleting}
            >
              {state.isDeleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              {dictionary?.delete || "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================================
// Grid View
// ============================================================================

interface GridViewProps {
  files: FileItem[];
  folders: FolderItem[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onFolderClick: (folder: FolderItem) => void;
  onFileOpen: (file: FileItem) => void;
}

function GridView({
  files,
  folders,
  selectedIds,
  onToggleSelect,
  onFolderClick,
  onFileOpen,
}: GridViewProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4">
      {/* Folders */}
      {folders.map((folder) => (
        <button
          key={folder.path}
          onClick={() => onFolderClick(folder)}
          className="flex flex-col items-center p-4 rounded-lg hover:bg-muted transition-colors text-center"
        >
          <Folder className="h-12 w-12 text-yellow-500 mb-2" />
          <span className="text-sm font-medium truncate w-full">{folder.name}</span>
          <span className="text-xs text-muted-foreground">
            {folder.fileCount} files
          </span>
        </button>
      ))}

      {/* Files */}
      {files.map((file) => (
        <div
          key={file.id}
          className={cn(
            "relative flex flex-col items-center p-4 rounded-lg transition-colors cursor-pointer group",
            selectedIds.has(file.id) ? "bg-primary/10 ring-2 ring-primary" : "hover:bg-muted"
          )}
          onClick={() => onToggleSelect(file.id)}
          onDoubleClick={() => onFileOpen(file)}
        >
          {/* Selection Checkbox */}
          <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Checkbox checked={selectedIds.has(file.id)} />
          </div>

          {/* Thumbnail or Icon */}
          {file.category === "image" && file.url ? (
            <div className="h-16 w-16 rounded-lg overflow-hidden mb-2">
              <img
                src={file.thumbnailUrl || file.url}
                alt={file.originalName}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="h-16 w-16 flex items-center justify-center mb-2">
              {categoryIcons[file.category]}
            </div>
          )}

          <span className="text-sm font-medium truncate w-full text-center">
            {file.originalName}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatBytes(file.size)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// List View
// ============================================================================

interface ListViewProps extends GridViewProps {
  sortField: string;
  sortDirection: "asc" | "desc";
  onSort: (field: "name" | "size" | "date" | "type") => void;
  dictionary?: FileBrowserProps["dictionary"];
}

function ListView({
  files,
  folders,
  selectedIds,
  sortField,
  sortDirection,
  onSort,
  onToggleSelect,
  onFolderClick,
  onFileOpen,
  dictionary,
}: ListViewProps) {
  const SortHeader = ({ field, label }: { field: "name" | "size" | "date" | "type"; label: string }) => (
    <button
      className="flex items-center gap-1 hover:text-primary"
      onClick={() => onSort(field)}
    >
      {label}
      {sortField === field && (
        <ChevronUp
          className={cn("h-4 w-4 transition-transform", sortDirection === "desc" && "rotate-180")}
        />
      )}
    </button>
  );

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-2 text-sm font-medium text-muted-foreground border-b border-border">
        <div className="w-8"></div>
        <div className="flex-1">
          <SortHeader field="name" label={dictionary?.name || "Name"} />
        </div>
        <div className="w-24 text-right">
          <SortHeader field="size" label={dictionary?.size || "Size"} />
        </div>
        <div className="w-32">
          <SortHeader field="date" label={dictionary?.date || "Modified"} />
        </div>
        <div className="w-24">
          <SortHeader field="type" label={dictionary?.type || "Type"} />
        </div>
        <div className="w-8"></div>
      </div>

      {/* Folders */}
      {folders.map((folder) => (
        <button
          key={folder.path}
          onClick={() => onFolderClick(folder)}
          className="flex items-center gap-4 w-full px-4 py-3 hover:bg-muted transition-colors text-left"
        >
          <div className="w-8"></div>
          <div className="flex items-center gap-3 flex-1">
            <Folder className="h-5 w-5 text-yellow-500" />
            <span className="font-medium">{folder.name}</span>
          </div>
          <div className="w-24 text-right text-sm text-muted-foreground">-</div>
          <div className="w-32 text-sm text-muted-foreground">-</div>
          <div className="w-24 text-sm text-muted-foreground">Folder</div>
          <div className="w-8"></div>
        </button>
      ))}

      {/* Files */}
      {files.map((file) => (
        <div
          key={file.id}
          className={cn(
            "flex items-center gap-4 px-4 py-3 cursor-pointer transition-colors",
            selectedIds.has(file.id) ? "bg-primary/10" : "hover:bg-muted"
          )}
          onClick={() => onToggleSelect(file.id)}
          onDoubleClick={() => onFileOpen(file)}
        >
          <div className="w-8">
            <Checkbox checked={selectedIds.has(file.id)} />
          </div>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {categoryIcons[file.category]}
            <span className="font-medium truncate">{file.originalName}</span>
          </div>
          <div className="w-24 text-right text-sm text-muted-foreground">
            {formatBytes(file.size)}
          </div>
          <div className="w-32 text-sm text-muted-foreground">
            {formatRelativeTime(file.uploadedAt, "en")}
          </div>
          <div className="w-24 text-sm text-muted-foreground capitalize">
            {file.category}
          </div>
          <div className="w-8">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onFileOpen(file)}>
                  Open
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Compact View
// ============================================================================

function CompactView({
  files,
  folders,
  selectedIds,
  onToggleSelect,
  onFolderClick,
  onFileOpen,
}: GridViewProps) {
  return (
    <div className="p-2">
      {/* Folders */}
      {folders.map((folder) => (
        <button
          key={folder.path}
          onClick={() => onFolderClick(folder)}
          className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-muted transition-colors text-left text-sm"
        >
          <Folder className="h-4 w-4 text-yellow-500" />
          <span>{folder.name}</span>
        </button>
      ))}

      {/* Files */}
      {files.map((file) => (
        <div
          key={file.id}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 cursor-pointer transition-colors text-sm",
            selectedIds.has(file.id) ? "bg-primary/10" : "hover:bg-muted"
          )}
          onClick={() => onToggleSelect(file.id)}
          onDoubleClick={() => onFileOpen(file)}
        >
          <Checkbox checked={selectedIds.has(file.id)} className="h-3.5 w-3.5" />
          {categoryIcons[file.category]}
          <span className="flex-1 truncate">{file.originalName}</span>
          <span className="text-muted-foreground">{formatBytes(file.size)}</span>
        </div>
      ))}
    </div>
  );
}

export type { FileBrowserProps };
