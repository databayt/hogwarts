/**
 * Enhanced File Browser Component
 * Browse, filter, and manage uploaded files
 *
 * Features:
 * - Grid and list view modes
 * - Category filtering
 * - Search
 * - Sorting
 * - Pagination
 * - File preview
 * - Download
 * - Delete
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { listFilesEnhanced, deleteFileEnhanced } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Grid3x3,
  List,
  Search,
  MoreVertical,
  Download,
  Trash2,
  Eye,
  Filter,
  Image,
  FileText,
  Film,
  Music,
  Archive,
  File as FileIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { FileCategory, AccessLevel, FileStatus } from "@prisma/client";

// ============================================================================
// Types
// ============================================================================

interface FileBrowserProps {
  /** Initial category filter */
  category?: FileCategory;
  /** Initial folder filter */
  folder?: string;
  /** View mode */
  defaultView?: "grid" | "list";
  /** Enable file selection */
  selectable?: boolean;
  /** Callback when file is selected */
  onFileSelect?: (fileId: string) => void;
  /** Custom class name */
  className?: string;
}

interface FileItem {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: bigint;
  category: FileCategory;
  publicUrl: string;
  cdnUrl?: string;
  uploadedAt: Date;
  uploadedBy: {
    username: string | null;
    email: string | null;
  };
}

type ViewMode = "grid" | "list";
type SortBy = "name" | "date" | "size" | "type";
type SortOrder = "asc" | "desc";

// ============================================================================
// Component
// ============================================================================

export function FileBrowser({
  category,
  folder,
  defaultView = "grid",
  selectable = false,
  onFileSelect,
  className,
}: FileBrowserProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>(defaultView);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<FileCategory | "ALL">(category || "ALL");
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null);

  const limit = viewMode === "grid" ? 12 : 20;

  // ============================================================================
  // Load Files
  // ============================================================================

  const loadFiles = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listFilesEnhanced({
        category: categoryFilter === "ALL" ? undefined : categoryFilter,
        folder,
        status: "ACTIVE",
        page,
        limit,
      });

      setFiles(result.files.map(f => ({
        ...f,
        uploadedAt: f.createdAt,
      })) as FileItem[]);
      setTotal(result.total);
      setHasMore(result.hasMore);
    } catch (error) {
      console.error("Failed to load files:", error);
      toast.error("Failed to load files");
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, folder, page, limit]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  // ============================================================================
  // Filtering and Sorting
  // ============================================================================

  const filteredFiles = files
    .filter((file) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          file.filename.toLowerCase().includes(query) ||
          file.originalName.toLowerCase().includes(query)
        );
      }
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "name":
          comparison = a.filename.localeCompare(b.filename);
          break;
        case "date":
          comparison = new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
          break;
        case "size":
          comparison = Number(a.size) - Number(b.size);
          break;
        case "type":
          comparison = a.mimeType.localeCompare(b.mimeType);
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

  // ============================================================================
  // Actions
  // ============================================================================

  const handleDelete = async (fileId: string) => {
    try {
      const result = await deleteFileEnhanced(fileId);
      if (result.success) {
        toast.success("File deleted successfully");
        loadFiles();
      } else {
        toast.error(result.error || "Failed to delete file");
      }
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error("Failed to delete file");
    } finally {
      setDeleteDialog(null);
    }
  };

  const handleDownload = (file: FileItem) => {
    const url = file.cdnUrl || file.publicUrl;
    const a = document.createElement("a");
    a.href = url;
    a.download = file.originalName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleView = (file: FileItem) => {
    setSelectedFile(file);
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className={cn("space-y-4", className)}>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Category Filter */}
        <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as FileCategory | "ALL")}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Categories</SelectItem>
            <SelectItem value="IMAGE">Images</SelectItem>
            <SelectItem value="DOCUMENT">Documents</SelectItem>
            <SelectItem value="VIDEO">Videos</SelectItem>
            <SelectItem value="AUDIO">Audio</SelectItem>
            <SelectItem value="ARCHIVE">Archives</SelectItem>
            <SelectItem value="OTHER">Other</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Sort by Date</SelectItem>
            <SelectItem value="name">Sort by Name</SelectItem>
            <SelectItem value="size">Sort by Size</SelectItem>
            <SelectItem value="type">Sort by Type</SelectItem>
          </SelectContent>
        </Select>

        {/* View Mode */}
        <div className="flex gap-1 border rounded-lg p-1">
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setViewMode("grid")}
          >
            <Grid3x3 className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setViewMode("list")}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Files Grid/List */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading files...</p>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No files found</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredFiles.map((file) => (
            <FileGridItem
              key={file.id}
              file={file}
              selectable={selectable}
              onView={() => handleView(file)}
              onDownload={() => handleDownload(file)}
              onDelete={() => setDeleteDialog(file.id)}
              onSelect={() => onFileSelect?.(file.id)}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredFiles.map((file) => (
            <FileListItem
              key={file.id}
              file={file}
              selectable={selectable}
              onView={() => handleView(file)}
              onDownload={() => handleDownload(file)}
              onDelete={() => setDeleteDialog(file.id)}
              onSelect={() => onFileSelect?.(file.id)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {(page > 1 || hasMore) && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} • {filteredFiles.length} of {total} files
          </span>
          <Button
            variant="outline"
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasMore}
          >
            Next
          </Button>
        </div>
      )}

      {/* File Preview Dialog */}
      {selectedFile && (
        <FilePreviewDialog
          file={selectedFile}
          open={!!selectedFile}
          onClose={() => setSelectedFile(null)}
          onDownload={() => handleDownload(selectedFile)}
          onDelete={() => setDeleteDialog(selectedFile.id)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete File</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this file? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteDialog && handleDelete(deleteDialog)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================================
// Grid Item Component
// ============================================================================

interface FileItemProps {
  file: FileItem;
  selectable: boolean;
  onView: () => void;
  onDownload: () => void;
  onDelete: () => void;
  onSelect: () => void;
}

function FileGridItem({ file, selectable, onView, onDownload, onDelete, onSelect }: FileItemProps) {
  const Icon = getCategoryIcon(file.category);
  const isImage = file.mimeType.startsWith("image/");

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all hover:shadow-lg",
        selectable && "cursor-pointer"
      )}
      onClick={selectable ? onSelect : undefined}
    >
      {/* Thumbnail */}
      <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
        {isImage ? (
          <img
            src={file.cdnUrl || file.publicUrl}
            alt={file.originalName}
            className="w-full h-full object-cover"
          />
        ) : (
          <Icon className="w-12 h-12 text-muted-foreground" />
        )}
      </div>

      {/* Info */}
      <div className="p-3 space-y-1">
        <p className="text-sm font-medium truncate">{file.originalName}</p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{formatBytes(Number(file.size))}</span>
          <span>{formatDate(file.uploadedAt)}</span>
        </div>
      </div>

      {/* Actions Menu */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon" className="h-8 w-8">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onView}>
              <Eye className="w-4 h-4 mr-2" />
              View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDownload}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  );
}

// ============================================================================
// List Item Component
// ============================================================================

function FileListItem({ file, selectable, onView, onDownload, onDelete, onSelect }: FileItemProps) {
  const Icon = getCategoryIcon(file.category);

  return (
    <Card
      className={cn(
        "flex items-center gap-4 p-4 transition-all hover:shadow-md",
        selectable && "cursor-pointer"
      )}
      onClick={selectable ? onSelect : undefined}
    >
      {/* Icon/Thumbnail */}
      <div className="flex-shrink-0 w-12 h-12 rounded bg-muted flex items-center justify-center">
        {file.mimeType.startsWith("image/") ? (
          <img
            src={file.cdnUrl || file.publicUrl}
            alt={file.originalName}
            className="w-full h-full object-cover rounded"
          />
        ) : (
          <Icon className="w-6 h-6 text-muted-foreground" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{file.originalName}</p>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>{formatBytes(Number(file.size))}</span>
          <span>•</span>
          <span>{formatDate(file.uploadedAt)}</span>
          {file.uploadedBy.username && (
            <>
              <span>•</span>
              <span>{file.uploadedBy.username}</span>
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={onView}>
          <Eye className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onDownload}>
          <Download className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onDelete}>
          <Trash2 className="w-4 h-4 text-destructive" />
        </Button>
      </div>
    </Card>
  );
}

// ============================================================================
// File Preview Dialog
// ============================================================================

interface FilePreviewDialogProps {
  file: FileItem;
  open: boolean;
  onClose: () => void;
  onDownload: () => void;
  onDelete: () => void;
}

function FilePreviewDialog({ file, open, onClose, onDownload, onDelete }: FilePreviewDialogProps) {
  const isImage = file.mimeType.startsWith("image/");
  const isVideo = file.mimeType.startsWith("video/");
  const isAudio = file.mimeType.startsWith("audio/");

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{file.originalName}</DialogTitle>
          <DialogDescription>
            {file.category} • {formatBytes(Number(file.size))} • Uploaded {formatDate(file.uploadedAt)}
          </DialogDescription>
        </DialogHeader>

        {/* Preview */}
        <div className="max-h-96 overflow-auto rounded-lg bg-muted">
          {isImage && (
            <img
              src={file.cdnUrl || file.publicUrl}
              alt={file.originalName}
              className="w-full h-auto"
            />
          )}
          {isVideo && (
            <video
              src={file.cdnUrl || file.publicUrl}
              controls
              className="w-full h-auto"
            />
          )}
          {isAudio && (
            <audio
              src={file.cdnUrl || file.publicUrl}
              controls
              className="w-full"
            />
          )}
          {!isImage && !isVideo && !isAudio && (
            <div className="flex items-center justify-center p-12">
              <p className="text-muted-foreground">Preview not available</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onDelete}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
          <Button onClick={onDownload}>
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

function getCategoryIcon(category: FileCategory) {
  switch (category) {
    case "IMAGE":
      return Image;
    case "VIDEO":
      return Film;
    case "AUDIO":
      return Music;
    case "DOCUMENT":
      return FileText;
    case "ARCHIVE":
      return Archive;
    default:
      return FileIcon;
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}
