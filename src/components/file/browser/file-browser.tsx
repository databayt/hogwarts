/**
 * Unified File Block - File Browser Component
 * Grid/List view file browser with selection and actions
 */

"use client"

import * as React from "react"
import { useState } from "react"
import {
  Archive,
  ArrowUpDown,
  Check,
  ChevronRight,
  ChevronUp,
  Download,
  File,
  FileText,
  Folder,
  Grid,
  Image,
  LayoutList,
  List,
  Loader2,
  MoreVertical,
  Music,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  Video,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { formatBytes, formatRelativeTime } from "../formatters"
import type { FileCategory } from "../types"
import type { BrowserConfig, FileItem, FolderItem, ViewMode } from "./types"
import { useBrowser } from "./use-browser"

// ============================================================================
// Types
// ============================================================================

interface FileBrowserProps {
  config?: BrowserConfig
  onSelect?: (files: FileItem[]) => void
  onOpen?: (file: FileItem) => void
  className?: string
  dictionary?: {
    files?: string
    folders?: string
    search?: string
    upload?: string
    delete?: string
    download?: string
    refresh?: string
    selectAll?: string
    deselectAll?: string
    noFiles?: string
    confirmDelete?: string
    deleteMessage?: string
    cancel?: string
    name?: string
    size?: string
    date?: string
    type?: string
  }
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
}

// ============================================================================
// View Mode Icons
// ============================================================================

const viewModeIcons: Record<ViewMode, React.ReactNode> = {
  grid: <Grid className="h-4 w-4" />,
  list: <List className="h-4 w-4" />,
  compact: <LayoutList className="h-4 w-4" />,
}

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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

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
  } = useBrowser(config)

  // Handle file selection change
  React.useEffect(() => {
    const selectedFiles = files.filter((f) => state.selectedIds.has(f.id))
    onSelect?.(selectedFiles)
  }, [files, state.selectedIds, onSelect])

  // Handle file double click
  const handleFileOpen = (file: FileItem) => {
    onOpen?.(file)
  }

  // Handle folder click
  const handleFolderClick = (folder: FolderItem) => {
    actions.navigateTo(folder.path)
  }

  return (
    <div className={cn("flex h-full flex-col", className)}>
      {/* Toolbar */}
      <div className="border-border flex items-center justify-between gap-4 border-b p-4">
        {/* Left: Breadcrumbs */}
        <div className="flex items-center gap-1 overflow-x-auto text-sm">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={crumb.path}>
              {idx > 0 && (
                <ChevronRight className="text-muted-foreground h-4 w-4 flex-shrink-0" />
              )}
              <button
                onClick={() => actions.navigateTo(crumb.path)}
                className={cn(
                  "hover:text-primary whitespace-nowrap transition-colors",
                  idx === breadcrumbs.length - 1
                    ? "font-medium"
                    : "text-muted-foreground"
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
            <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
            <Input
              placeholder={dictionary?.search || "Search..."}
              value={state.searchQuery}
              onChange={(e) => actions.setSearch(e.target.value)}
              className="w-48 ps-8"
            />
          </div>

          {/* Category Filter */}
          <Select
            value={state.categoryFilter || "all"}
            onValueChange={(v) =>
              actions.setCategoryFilter(
                v === "all" ? undefined : (v as FileCategory)
              )
            }
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
          <div className="border-border flex rounded-md border">
            {(["grid", "list", "compact"] as ViewMode[]).map((mode) => (
              <Button
                key={mode}
                variant="ghost"
                size="icon"
                className={cn(
                  "h-9 w-9 rounded-none first:rounded-s-md last:rounded-e-md",
                  state.viewMode === mode && "bg-muted"
                )}
                onClick={() => actions.setViewMode(mode)}
              >
                {viewModeIcons[mode]}
              </Button>
            ))}
          </div>

          {/* Refresh */}
          <Button
            variant="ghost"
            size="icon"
            onClick={actions.refresh}
            disabled={state.isLoading}
          >
            <RefreshCw
              className={cn("h-4 w-4", state.isLoading && "animate-spin")}
            />
          </Button>
        </div>
      </div>

      {/* Selection Bar */}
      {state.selectedIds.size > 0 && (
        <div className="bg-muted/50 border-border flex items-center justify-between gap-4 border-b px-4 py-2">
          <span className="text-muted-foreground text-sm">
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
              <Download className="me-2 h-4 w-4" />
              {dictionary?.download || "Download"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="me-2 h-4 w-4" />
              {dictionary?.delete || "Delete"}
            </Button>
          </div>
        </div>
      )}

      {/* Content Area */}
      <ScrollArea className="flex-1">
        {state.isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
          </div>
        ) : files.length === 0 && folders.length === 0 ? (
          <div className="text-muted-foreground flex h-64 flex-col items-center justify-center">
            <Folder className="mb-4 h-12 w-12" />
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
        <div className="border-border flex items-center justify-between border-t px-4 py-2">
          <span className="text-muted-foreground text-sm">
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
            <DialogTitle>
              {dictionary?.confirmDelete || "Confirm Delete"}
            </DialogTitle>
            <DialogDescription>
              {dictionary?.deleteMessage ||
                `Are you sure you want to delete ${state.selectedIds.size} file(s)? This action cannot be undone.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              {dictionary?.cancel || "Cancel"}
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                await actions.deleteSelected()
                setShowDeleteDialog(false)
              }}
              disabled={state.isDeleting}
            >
              {state.isDeleting ? (
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="me-2 h-4 w-4" />
              )}
              {dictionary?.delete || "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============================================================================
// Grid View
// ============================================================================

interface GridViewProps {
  files: FileItem[]
  folders: FolderItem[]
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  onFolderClick: (folder: FolderItem) => void
  onFileOpen: (file: FileItem) => void
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
    <div className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {/* Folders */}
      {folders.map((folder) => (
        <button
          key={folder.path}
          onClick={() => onFolderClick(folder)}
          className="hover:bg-muted flex flex-col items-center rounded-lg p-4 text-center transition-colors"
        >
          <Folder className="mb-2 h-12 w-12 text-yellow-500" />
          <span className="w-full truncate text-sm font-medium">
            {folder.name}
          </span>
          <span className="text-muted-foreground text-xs">
            {folder.fileCount} files
          </span>
        </button>
      ))}

      {/* Files */}
      {files.map((file) => (
        <div
          key={file.id}
          className={cn(
            "group relative flex cursor-pointer flex-col items-center rounded-lg p-4 transition-colors",
            selectedIds.has(file.id)
              ? "bg-primary/10 ring-primary ring-2"
              : "hover:bg-muted"
          )}
          onClick={() => onToggleSelect(file.id)}
          onDoubleClick={() => onFileOpen(file)}
        >
          {/* Selection Checkbox */}
          <div className="absolute top-2 left-2 opacity-0 transition-opacity group-hover:opacity-100">
            <Checkbox checked={selectedIds.has(file.id)} />
          </div>

          {/* Thumbnail or Icon */}
          {file.category === "image" && file.url ? (
            <div className="mb-2 h-16 w-16 overflow-hidden rounded-lg">
              <img
                src={file.thumbnailUrl || file.url}
                alt={file.originalName}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="mb-2 flex h-16 w-16 items-center justify-center">
              {categoryIcons[file.category]}
            </div>
          )}

          <span className="w-full truncate text-center text-sm font-medium">
            {file.originalName}
          </span>
          <span className="text-muted-foreground text-xs">
            {formatBytes(file.size)}
          </span>
        </div>
      ))}
    </div>
  )
}

// ============================================================================
// List View
// ============================================================================

interface ListViewProps extends GridViewProps {
  sortField: string
  sortDirection: "asc" | "desc"
  onSort: (field: "name" | "size" | "date" | "type") => void
  dictionary?: FileBrowserProps["dictionary"]
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
  const SortHeader = ({
    field,
    label,
  }: {
    field: "name" | "size" | "date" | "type"
    label: string
  }) => (
    <button
      className="hover:text-primary flex items-center gap-1"
      onClick={() => onSort(field)}
    >
      {label}
      {sortField === field && (
        <ChevronUp
          className={cn(
            "h-4 w-4 transition-transform",
            sortDirection === "desc" && "rotate-180"
          )}
        />
      )}
    </button>
  )

  return (
    <div className="p-4">
      {/* Header */}
      <div className="text-muted-foreground border-border flex items-center gap-4 border-b px-4 py-2 text-sm font-medium">
        <div className="w-8"></div>
        <div className="flex-1">
          <SortHeader field="name" label={dictionary?.name || "Name"} />
        </div>
        <div className="w-24 text-end">
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
          className="hover:bg-muted flex w-full items-center gap-4 px-4 py-3 text-start transition-colors"
        >
          <div className="w-8"></div>
          <div className="flex flex-1 items-center gap-3">
            <Folder className="h-5 w-5 text-yellow-500" />
            <span className="font-medium">{folder.name}</span>
          </div>
          <div className="text-muted-foreground w-24 text-end text-sm">-</div>
          <div className="text-muted-foreground w-32 text-sm">-</div>
          <div className="text-muted-foreground w-24 text-sm">Folder</div>
          <div className="w-8"></div>
        </button>
      ))}

      {/* Files */}
      {files.map((file) => (
        <div
          key={file.id}
          className={cn(
            "flex cursor-pointer items-center gap-4 px-4 py-3 transition-colors",
            selectedIds.has(file.id) ? "bg-primary/10" : "hover:bg-muted"
          )}
          onClick={() => onToggleSelect(file.id)}
          onDoubleClick={() => onFileOpen(file)}
        >
          <div className="w-8">
            <Checkbox checked={selectedIds.has(file.id)} />
          </div>
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {categoryIcons[file.category]}
            <span className="truncate font-medium">{file.originalName}</span>
          </div>
          <div className="text-muted-foreground w-24 text-end text-sm">
            {formatBytes(file.size)}
          </div>
          <div className="text-muted-foreground w-32 text-sm">
            {formatRelativeTime(file.uploadedAt, "en")}
          </div>
          <div className="text-muted-foreground w-24 text-sm capitalize">
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
                  <Download className="me-2 h-4 w-4" />
                  Download
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">
                  <Trash2 className="me-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      ))}
    </div>
  )
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
          className="hover:bg-muted flex w-full items-center gap-2 px-3 py-1.5 text-start text-sm transition-colors"
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
            "flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm transition-colors",
            selectedIds.has(file.id) ? "bg-primary/10" : "hover:bg-muted"
          )}
          onClick={() => onToggleSelect(file.id)}
          onDoubleClick={() => onFileOpen(file)}
        >
          <Checkbox
            checked={selectedIds.has(file.id)}
            className="h-3.5 w-3.5"
          />
          {categoryIcons[file.category]}
          <span className="flex-1 truncate">{file.originalName}</span>
          <span className="text-muted-foreground">
            {formatBytes(file.size)}
          </span>
        </div>
      ))}
    </div>
  )
}

export type { FileBrowserProps }
