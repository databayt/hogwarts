/**
 * EnhancedFileBrowser Component
 * Advanced file browser with grid/list views, filtering, and batch operations
 */

'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Grid3x3,
  List,
  Search,
  Filter,
  Download,
  Trash2,
  Share2,
  MoreVertical,
  Folder,
  FolderOpen,
  ChevronRight,
  Calendar,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  Archive,
  FileIcon,
  Check,
  SortAsc,
  SortDesc,
  Eye,
  Copy,
  Edit,
  Info
} from 'lucide-react';
import type { FileMetadata, FileBrowserView, FileBrowserFilter, FileBrowserSort } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Toggle } from '@/components/ui/toggle';
import { cn, formatBytes } from '@/lib/utils';
import { format } from 'date-fns';

interface EnhancedFileBrowserProps {
  files: FileMetadata[];
  folders?: string[];
  currentFolder?: string;
  view?: FileBrowserView;
  onViewChange?: (view: FileBrowserView) => void;
  onFileSelect?: (file: FileMetadata) => void;
  onFilesSelect?: (files: FileMetadata[]) => void;
  onFolderChange?: (folder: string) => void;
  onFileAction?: (action: string, file: FileMetadata) => void;
  onBatchAction?: (action: string, files: FileMetadata[]) => void;
  allowSelection?: boolean;
  allowMultiSelect?: boolean;
  allowActions?: boolean;
  showSearch?: boolean;
  showFilters?: boolean;
  showSort?: boolean;
  dictionary?: any;
  className?: string;
}

const fileTypeIcons: Record<string, React.ElementType> = {
  'image': ImageIcon,
  'video': Video,
  'audio': Music,
  'document': FileText,
  'archive': Archive,
  'other': FileIcon,
};

export function EnhancedFileBrowser({
  files,
  folders = [],
  currentFolder = '/',
  view: viewProp = 'grid',
  onViewChange,
  onFileSelect,
  onFilesSelect,
  onFolderChange,
  onFileAction,
  onBatchAction,
  allowSelection = true,
  allowMultiSelect = true,
  allowActions = true,
  showSearch = true,
  showFilters = true,
  showSort = true,
  dictionary,
  className,
}: EnhancedFileBrowserProps) {
  const [view, setView] = React.useState<FileBrowserView>(viewProp);
  const [selectedFiles, setSelectedFiles] = React.useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filter, setFilter] = React.useState<FileBrowserFilter>({});
  const [sort, setSort] = React.useState<FileBrowserSort>({
    field: 'name',
    direction: 'asc',
  });

  // Update view when prop changes
  React.useEffect(() => {
    if (viewProp) {
      setView(viewProp);
    }
  }, [viewProp]);

  // Filter and sort files
  const processedFiles = React.useMemo(() => {
    let result = [...files];

    // Apply search
    if (searchQuery) {
      result = result.filter((file) =>
        file.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.originalName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply filters
    if (filter.category) {
      result = result.filter((file) => file.category === filter.category);
    }
    if (filter.type) {
      result = result.filter((file) => file.type === filter.type);
    }
    if (filter.uploadedBy) {
      result = result.filter((file) => file.uploadedBy === filter.uploadedBy);
    }
    if (filter.dateRange) {
      result = result.filter((file) => {
        const uploadDate = new Date(file.uploadedAt);
        return uploadDate >= filter.dateRange!.from && uploadDate <= filter.dateRange!.to;
      });
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      switch (sort.field) {
        case 'name':
          comparison = a.filename.localeCompare(b.filename);
          break;
        case 'size':
          comparison = a.size - b.size;
          break;
        case 'uploadedAt':
          comparison = new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
          break;
        case 'type':
          comparison = (a.mimeType || '').localeCompare(b.mimeType || '');
          break;
      }
      return sort.direction === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [files, searchQuery, filter, sort]);

  const handleViewChange = (newView: FileBrowserView) => {
    setView(newView);
    onViewChange?.(newView);
  };

  const handleFileSelect = (file: FileMetadata, event?: React.MouseEvent) => {
    if (event?.ctrlKey || event?.metaKey) {
      // Multi-select with Ctrl/Cmd
      if (allowMultiSelect) {
        const newSelection = new Set(selectedFiles);
        if (newSelection.has(file.id)) {
          newSelection.delete(file.id);
        } else {
          newSelection.add(file.id);
        }
        setSelectedFiles(newSelection);
        const selectedFilesList = processedFiles.filter((f) => newSelection.has(f.id));
        onFilesSelect?.(selectedFilesList);
      }
    } else if (event?.shiftKey && selectedFiles.size > 0 && allowMultiSelect) {
      // Range select with Shift
      const lastSelected = Array.from(selectedFiles).pop();
      const lastIndex = processedFiles.findIndex((f) => f.id === lastSelected);
      const currentIndex = processedFiles.findIndex((f) => f.id === file.id);
      const start = Math.min(lastIndex, currentIndex);
      const end = Math.max(lastIndex, currentIndex);
      const newSelection = new Set(selectedFiles);
      for (let i = start; i <= end; i++) {
        newSelection.add(processedFiles[i].id);
      }
      setSelectedFiles(newSelection);
      const selectedFilesList = processedFiles.filter((f) => newSelection.has(f.id));
      onFilesSelect?.(selectedFilesList);
    } else {
      // Single select
      setSelectedFiles(new Set([file.id]));
      onFileSelect?.(file);
    }
  };

  const handleSelectAll = () => {
    if (selectedFiles.size === processedFiles.length) {
      setSelectedFiles(new Set());
      onFilesSelect?.([]);
    } else {
      const allIds = new Set(processedFiles.map((f) => f.id));
      setSelectedFiles(allIds);
      onFilesSelect?.(processedFiles);
    }
  };

  const getFileIcon = (file: FileMetadata) => {
    const Icon = fileTypeIcons[file.category] || fileTypeIcons.other;
    return <Icon className="h-5 w-5" />;
  };

  const renderToolbar = () => (
    <div className="flex items-center justify-between gap-4 p-4 border-b">
      <div className="flex items-center gap-2">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1 text-sm">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            onClick={() => onFolderChange?.('/')}
          >
            <Folder className="h-4 w-4 mr-1" />
            {dictionary?.root || 'Root'}
          </Button>
          {currentFolder !== '/' && (
            <>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
              >
                <FolderOpen className="h-4 w-4 mr-1" />
                {currentFolder}
              </Button>
            </>
          )}
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Selection info */}
        {selectedFiles.size > 0 && (
          <>
            <Badge variant="secondary">
              {selectedFiles.size} {dictionary?.selected || 'selected'}
            </Badge>
            {allowActions && onBatchAction && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onBatchAction('download', Array.from(selectedFiles).map(id =>
                    processedFiles.find(f => f.id === id)!
                  ))}
                >
                  <Download className="h-4 w-4 mr-1" />
                  {dictionary?.download || 'Download'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onBatchAction('delete', Array.from(selectedFiles).map(id =>
                    processedFiles.find(f => f.id === id)!
                  ))}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  {dictionary?.delete || 'Delete'}
                </Button>
              </>
            )}
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Search */}
        {showSearch && (
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={dictionary?.searchFiles || 'Search files...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 w-64 pl-8"
            />
          </div>
        )}

        {/* Filter */}
        {showFilters && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <Filter className="h-4 w-4 mr-1" />
                {dictionary?.filter || 'Filter'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>{dictionary?.filterBy || 'Filter by'}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={filter.category === 'image'}
                onCheckedChange={(checked) =>
                  setFilter((prev) => ({
                    ...prev,
                    category: checked ? 'image' : undefined,
                  }))
                }
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                {dictionary?.images || 'Images'}
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filter.category === 'video'}
                onCheckedChange={(checked) =>
                  setFilter((prev) => ({
                    ...prev,
                    category: checked ? 'video' : undefined,
                  }))
                }
              >
                <Video className="h-4 w-4 mr-2" />
                {dictionary?.videos || 'Videos'}
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filter.category === 'document'}
                onCheckedChange={(checked) =>
                  setFilter((prev) => ({
                    ...prev,
                    category: checked ? 'document' : undefined,
                  }))
                }
              >
                <FileText className="h-4 w-4 mr-2" />
                {dictionary?.documents || 'Documents'}
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Sort */}
        {showSort && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                {sort.direction === 'asc' ? (
                  <SortAsc className="h-4 w-4 mr-1" />
                ) : (
                  <SortDesc className="h-4 w-4 mr-1" />
                )}
                {dictionary?.sort || 'Sort'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>{dictionary?.sortBy || 'Sort by'}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={sort.field}
                onValueChange={(value) =>
                  setSort((prev) => ({ ...prev, field: value as any }))
                }
              >
                <DropdownMenuRadioItem value="name">
                  {dictionary?.name || 'Name'}
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="size">
                  {dictionary?.size || 'Size'}
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="uploadedAt">
                  {dictionary?.dateUploaded || 'Date uploaded'}
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="type">
                  {dictionary?.type || 'Type'}
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() =>
                  setSort((prev) => ({
                    ...prev,
                    direction: prev.direction === 'asc' ? 'desc' : 'asc',
                  }))
                }
              >
                {sort.direction === 'asc'
                  ? dictionary?.descending || 'Descending'
                  : dictionary?.ascending || 'Ascending'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <Separator orientation="vertical" className="h-6" />

        {/* View Toggle */}
        <div className="flex items-center gap-1 border rounded-md p-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle
                  size="sm"
                  pressed={view === 'grid'}
                  onPressedChange={() => handleViewChange('grid')}
                  className="h-7 w-7"
                >
                  <Grid3x3 className="h-4 w-4" />
                </Toggle>
              </TooltipTrigger>
              <TooltipContent>
                <p>{dictionary?.gridView || 'Grid view'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle
                  size="sm"
                  pressed={view === 'list'}
                  onPressedChange={() => handleViewChange('list')}
                  className="h-7 w-7"
                >
                  <List className="h-4 w-4" />
                </Toggle>
              </TooltipTrigger>
              <TooltipContent>
                <p>{dictionary?.listView || 'List view'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );

  const renderGridView = () => (
    <div className="p-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        <AnimatePresence mode="popLayout">
          {processedFiles.map((file, index) => (
            <motion.div
              key={file.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.02 }}
            >
              <Card
                className={cn(
                  'group cursor-pointer transition-all hover:shadow-lg',
                  selectedFiles.has(file.id) && 'ring-2 ring-primary'
                )}
                onClick={(e) => handleFileSelect(file, e)}
              >
                {/* Thumbnail/Icon */}
                <div className="relative aspect-square p-4">
                  {file.category === 'image' && file.url ? (
                    <div className="relative w-full h-full rounded-md overflow-hidden bg-muted">
                      <img
                        src={file.url}
                        alt={file.filename}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center w-full h-full bg-muted rounded-md">
                      {getFileIcon(file)}
                    </div>
                  )}

                  {/* Selection checkbox */}
                  {allowSelection && (
                    <div className={cn(
                      'absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity',
                      selectedFiles.has(file.id) && 'opacity-100'
                    )}>
                      <Checkbox
                        checked={selectedFiles.has(file.id)}
                        onCheckedChange={(checked) => {
                          const newSelection = new Set(selectedFiles);
                          if (checked) {
                            newSelection.add(file.id);
                          } else {
                            newSelection.delete(file.id);
                          }
                          setSelectedFiles(newSelection);
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  )}

                  {/* Actions */}
                  {allowActions && (
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="secondary"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => onFileAction?.('view', file)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            {dictionary?.view || 'View'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onFileAction?.('download', file)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            {dictionary?.download || 'Download'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onFileAction?.('share', file)}
                          >
                            <Share2 className="h-4 w-4 mr-2" />
                            {dictionary?.share || 'Share'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onFileAction?.('rename', file)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            {dictionary?.rename || 'Rename'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onFileAction?.('copy', file)}
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            {dictionary?.copy || 'Copy'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onFileAction?.('delete', file)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {dictionary?.delete || 'Delete'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </div>

                {/* File info */}
                <CardFooter className="p-3 pt-0">
                  <div className="w-full">
                    <p className="text-sm font-medium truncate">
                      {file.originalName || file.filename}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-muted-foreground">
                        {formatBytes(file.size)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(file.uploadedAt), 'MMM d')}
                      </span>
                    </div>
                  </div>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );

  const renderListView = () => (
    <div className="p-4">
      <Table>
        <TableHeader>
          <TableRow>
            {allowSelection && (
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={selectedFiles.size === processedFiles.length && processedFiles.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
            )}
            <TableHead>{dictionary?.name || 'Name'}</TableHead>
            <TableHead>{dictionary?.size || 'Size'}</TableHead>
            <TableHead>{dictionary?.type || 'Type'}</TableHead>
            <TableHead>{dictionary?.uploadedBy || 'Uploaded by'}</TableHead>
            <TableHead>{dictionary?.uploadedAt || 'Uploaded at'}</TableHead>
            {allowActions && <TableHead className="text-right">{dictionary?.actions || 'Actions'}</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          <AnimatePresence mode="popLayout">
            {processedFiles.map((file, index) => (
              <motion.tr
                key={file.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.02 }}
                className={cn(
                  'cursor-pointer hover:bg-muted/50',
                  selectedFiles.has(file.id) && 'bg-primary/5'
                )}
                onClick={(e: any) => handleFileSelect(file, e)}
              >
                {allowSelection && (
                  <TableCell>
                    <Checkbox
                      checked={selectedFiles.has(file.id)}
                      onCheckedChange={(checked) => {
                        const newSelection = new Set(selectedFiles);
                        if (checked) {
                          newSelection.add(file.id);
                        } else {
                          newSelection.delete(file.id);
                        }
                        setSelectedFiles(newSelection);
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </TableCell>
                )}
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getFileIcon(file)}
                    <span className="font-medium">
                      {file.originalName || file.filename}
                    </span>
                  </div>
                </TableCell>
                <TableCell>{formatBytes(file.size)}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-xs">
                    {file.category}
                  </Badge>
                </TableCell>
                <TableCell>{file.uploadedBy}</TableCell>
                <TableCell>
                  {format(new Date(file.uploadedAt), 'MMM d, yyyy h:mm a')}
                </TableCell>
                {allowActions && (
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => onFileAction?.('view', file)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          {dictionary?.view || 'View'}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onFileAction?.('download', file)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          {dictionary?.download || 'Download'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onFileAction?.('delete', file)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {dictionary?.delete || 'Delete'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
              </motion.tr>
            ))}
          </AnimatePresence>
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className={cn('rounded-lg border bg-card', className)}>
      {renderToolbar()}
      <ScrollArea className="h-[600px]">
        {view === 'grid' ? renderGridView() : renderListView()}
      </ScrollArea>
    </div>
  );
}