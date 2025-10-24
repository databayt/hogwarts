/**
 * FileActionsToolbar Component
 * Advanced toolbar for file operations with batch actions
 */

'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  Trash2,
  Share2,
  Copy,
  Move,
  Archive,
  Tag,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  CheckSquare,
  Square,
  MoreHorizontal,
  Filter,
  SortAsc,
  FolderPlus,
  Upload,
  RefreshCw,
  Settings,
  ChevronDown,
  X,
  Info
} from 'lucide-react';
import type { FileMetadata } from '../types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { cn, formatBytes } from '@/lib/utils';
import { toast } from 'sonner';

interface FileActionsToolbarProps {
  selectedFiles: FileMetadata[];
  totalFiles: number;
  onAction: (action: string, files: FileMetadata[]) => Promise<void> | void;
  onSelectAll?: () => void;
  onClearSelection?: () => void;
  onRefresh?: () => void;
  onUpload?: () => void;
  onCreateFolder?: () => void;
  allowedActions?: string[];
  position?: 'top' | 'bottom' | 'floating';
  variant?: 'default' | 'compact' | 'minimal';
  showSelectionInfo?: boolean;
  dictionary?: any;
  className?: string;
}

interface ActionButton {
  id: string;
  icon: React.ElementType;
  label: string;
  shortcut?: string;
  destructive?: boolean;
  requiresSelection?: boolean;
  minSelection?: number;
  maxSelection?: number;
}

const actionButtons: ActionButton[] = [
  {
    id: 'download',
    icon: Download,
    label: 'Download',
    shortcut: 'Ctrl+D',
    requiresSelection: true,
  },
  {
    id: 'share',
    icon: Share2,
    label: 'Share',
    shortcut: 'Ctrl+S',
    requiresSelection: true,
  },
  {
    id: 'copy',
    icon: Copy,
    label: 'Copy',
    shortcut: 'Ctrl+C',
    requiresSelection: true,
  },
  {
    id: 'move',
    icon: Move,
    label: 'Move',
    shortcut: 'Ctrl+M',
    requiresSelection: true,
  },
  {
    id: 'archive',
    icon: Archive,
    label: 'Archive',
    requiresSelection: true,
  },
  {
    id: 'tag',
    icon: Tag,
    label: 'Add tags',
    requiresSelection: true,
  },
  {
    id: 'lock',
    icon: Lock,
    label: 'Lock',
    requiresSelection: true,
  },
  {
    id: 'delete',
    icon: Trash2,
    label: 'Delete',
    shortcut: 'Delete',
    destructive: true,
    requiresSelection: true,
  },
];

export function FileActionsToolbar({
  selectedFiles,
  totalFiles,
  onAction,
  onSelectAll,
  onClearSelection,
  onRefresh,
  onUpload,
  onCreateFolder,
  allowedActions = ['download', 'share', 'copy', 'move', 'archive', 'delete'],
  position = 'top',
  variant = 'default',
  showSelectionInfo = true,
  dictionary,
  className,
}: FileActionsToolbarProps) {
  const [confirmDialog, setConfirmDialog] = React.useState<{
    open: boolean;
    action: string;
    files: FileMetadata[];
  }>({
    open: false,
    action: '',
    files: [],
  });
  const [isProcessing, setIsProcessing] = React.useState<string | null>(null);

  const hasSelection = selectedFiles.length > 0;
  const isAllSelected = selectedFiles.length === totalFiles && totalFiles > 0;

  // Filter allowed actions
  const availableActions = actionButtons.filter((action) =>
    allowedActions.includes(action.id)
  );

  // Calculate selection stats
  const selectionStats = React.useMemo(() => {
    if (selectedFiles.length === 0) {
      return null;
    }

    const totalSize = selectedFiles.reduce((sum, file) => sum + file.size, 0);
    const categories = new Set(selectedFiles.map((file) => file.category));

    return {
      count: selectedFiles.length,
      size: totalSize,
      categories: Array.from(categories),
    };
  }, [selectedFiles]);

  // Handle keyboard shortcuts
  React.useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (!hasSelection) return;

      // Check for ctrl/cmd key
      const isCtrlCmd = e.ctrlKey || e.metaKey;

      if (isCtrlCmd) {
        switch (e.key.toLowerCase()) {
          case 'd':
            e.preventDefault();
            handleAction('download');
            break;
          case 's':
            e.preventDefault();
            handleAction('share');
            break;
          case 'c':
            e.preventDefault();
            handleAction('copy');
            break;
          case 'm':
            e.preventDefault();
            handleAction('move');
            break;
          case 'a':
            e.preventDefault();
            onSelectAll?.();
            break;
        }
      } else if (e.key === 'Delete') {
        e.preventDefault();
        handleAction('delete');
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClearSelection?.();
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [hasSelection, selectedFiles]);

  const handleAction = async (actionId: string) => {
    const action = actionButtons.find((a) => a.id === actionId);
    if (!action) return;

    // Check if action requires confirmation
    if (action.destructive || actionId === 'delete') {
      setConfirmDialog({
        open: true,
        action: actionId,
        files: selectedFiles,
      });
      return;
    }

    // Execute action
    setIsProcessing(actionId);
    try {
      await onAction(actionId, selectedFiles);
      toast.success(
        dictionary?.actionSuccess?.[actionId] ||
        `${action.label} completed successfully`
      );

      // Clear selection after certain actions
      if (['move', 'delete'].includes(actionId)) {
        onClearSelection?.();
      }
    } catch (error) {
      toast.error(
        dictionary?.actionError?.[actionId] ||
        `Failed to ${action.label.toLowerCase()}`
      );
    } finally {
      setIsProcessing(null);
    }
  };

  const handleConfirmedAction = async () => {
    const { action, files } = confirmDialog;
    setConfirmDialog({ open: false, action: '', files: [] });
    setIsProcessing(action);

    try {
      await onAction(action, files);
      toast.success(
        dictionary?.actionSuccess?.[action] ||
        `Action completed successfully`
      );
      if (action === 'delete') {
        onClearSelection?.();
      }
    } catch (error) {
      toast.error(
        dictionary?.actionError?.[action] ||
        `Action failed`
      );
    } finally {
      setIsProcessing(null);
    }
  };

  const renderCompactView = () => (
    <div className={cn(
      'flex items-center justify-between gap-2 p-2 border rounded-lg bg-background',
      position === 'floating' && 'shadow-lg',
      className
    )}>
      {/* Selection controls */}
      <div className="flex items-center gap-2">
        <Checkbox
          checked={isAllSelected}
          onCheckedChange={(checked) => {
            if (checked) {
              onSelectAll?.();
            } else {
              onClearSelection?.();
            }
          }}
        />
        {showSelectionInfo && selectionStats && (
          <Badge variant="secondary" className="text-xs">
            {selectionStats.count} {dictionary?.selected || 'selected'}
          </Badge>
        )}
      </div>

      {/* Actions */}
      {hasSelection ? (
        <div className="flex items-center gap-1">
          {availableActions.slice(0, 3).map((action) => {
            const Icon = action.icon;
            return (
              <TooltipProvider key={action.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={action.destructive ? 'destructive' : 'ghost'}
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleAction(action.id)}
                      disabled={isProcessing !== null}
                    >
                      <Icon className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{dictionary?.[action.id] || action.label}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}

          {availableActions.length > 3 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {availableActions.slice(3).map((action) => {
                  const Icon = action.icon;
                  return (
                    <DropdownMenuItem
                      key={action.id}
                      onClick={() => handleAction(action.id)}
                      className={action.destructive ? 'text-destructive' : ''}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {dictionary?.[action.id] || action.label}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-1">
          {onUpload && (
            <Button variant="ghost" size="sm" onClick={onUpload}>
              <Upload className="h-4 w-4 mr-1" />
              {dictionary?.upload || 'Upload'}
            </Button>
          )}
          {onRefresh && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );

  if (variant === 'compact' || variant === 'minimal') {
    return renderCompactView();
  }

  // Default full toolbar
  return (
    <>
      <motion.div
        className={cn(
          'border rounded-lg bg-background',
          position === 'floating' && 'fixed bottom-4 left-1/2 -translate-x-1/2 shadow-xl z-50',
          className
        )}
        initial={position === 'floating' ? { y: 100, opacity: 0 } : undefined}
        animate={position === 'floating' ? { y: hasSelection ? 0 : 100, opacity: hasSelection ? 1 : 0 } : undefined}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="flex items-center justify-between gap-4 p-3">
          {/* Left section - Selection info */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={isAllSelected}
                onCheckedChange={(checked) => {
                  if (checked) {
                    onSelectAll?.();
                  } else {
                    onClearSelection?.();
                  }
                }}
              />
              <span className="text-sm font-medium">
                {isAllSelected
                  ? dictionary?.allSelected || 'All selected'
                  : hasSelection
                  ? `${selectedFiles.length} ${dictionary?.of || 'of'} ${totalFiles}`
                  : dictionary?.selectFiles || 'Select files'}
              </span>
            </div>

            {showSelectionInfo && selectionStats && (
              <>
                <Separator orientation="vertical" className="h-6" />
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {formatBytes(selectionStats.size)}
                  </Badge>
                  {selectionStats.categories.map((category) => (
                    <Badge key={category} variant="outline" className="text-xs">
                      {category}
                    </Badge>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Right section - Actions */}
          <div className="flex items-center gap-2">
            {hasSelection ? (
              <>
                {/* Primary actions */}
                <div className="flex items-center gap-1">
                  {availableActions.map((action) => {
                    const Icon = action.icon;
                    const isDisabled = isProcessing !== null;

                    return (
                      <TooltipProvider key={action.id}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant={action.destructive ? 'destructive' : 'ghost'}
                              size="sm"
                              onClick={() => handleAction(action.id)}
                              disabled={isDisabled}
                              className={cn(
                                'gap-1',
                                isProcessing === action.id && 'opacity-50'
                              )}
                            >
                              {isProcessing === action.id ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <Icon className="h-4 w-4" />
                              )}
                              <span className="hidden sm:inline">
                                {dictionary?.[action.id] || action.label}
                              </span>
                            </Button>
                          </TooltipTrigger>
                          {action.shortcut && (
                            <TooltipContent>
                              <p>{action.shortcut}</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}
                </div>

                <Separator orientation="vertical" className="h-6" />

                {/* Clear selection */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearSelection}
                  disabled={isProcessing !== null}
                >
                  <X className="h-4 w-4 mr-1" />
                  {dictionary?.clear || 'Clear'}
                </Button>
              </>
            ) : (
              <>
                {/* Non-selection actions */}
                {onCreateFolder && (
                  <Button variant="outline" size="sm" onClick={onCreateFolder}>
                    <FolderPlus className="h-4 w-4 mr-1" />
                    {dictionary?.newFolder || 'New folder'}
                  </Button>
                )}
                {onUpload && (
                  <Button variant="default" size="sm" onClick={onUpload}>
                    <Upload className="h-4 w-4 mr-1" />
                    {dictionary?.upload || 'Upload'}
                  </Button>
                )}
                {onRefresh && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={onRefresh}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{dictionary?.refresh || 'Refresh'}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </>
            )}
          </div>
        </div>

        {/* Batch operations info */}
        <AnimatePresence>
          {hasSelection && selectedFiles.length > 1 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t px-3 py-2 bg-muted/50"
            >
              <p className="text-xs text-muted-foreground">
                <Info className="h-3 w-3 inline mr-1" />
                {dictionary?.batchInfo || 'Batch operations will apply to all selected files'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onOpenChange={(open) =>
          setConfirmDialog({ ...confirmDialog, open })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dictionary?.confirmAction || 'Confirm action'}
            </DialogTitle>
            <DialogDescription>
              {dictionary?.confirmDescription ||
                `Are you sure you want to ${confirmDialog.action} ${confirmDialog.files.length} file(s)?`}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              {dictionary?.affectedFiles || 'Affected files:'}
            </p>
            <ul className="mt-2 max-h-32 overflow-auto space-y-1">
              {confirmDialog.files.slice(0, 5).map((file) => (
                <li key={file.id} className="text-sm">
                  • {file.originalName || file.filename}
                </li>
              ))}
              {confirmDialog.files.length > 5 && (
                <li className="text-sm text-muted-foreground">
                  {dictionary?.andMore || `...and ${confirmDialog.files.length - 5} more`}
                </li>
              )}
            </ul>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setConfirmDialog({ open: false, action: '', files: [] })
              }
            >
              {dictionary?.cancel || 'Cancel'}
            </Button>
            <Button
              variant={confirmDialog.action === 'delete' ? 'destructive' : 'default'}
              onClick={handleConfirmedAction}
            >
              {dictionary?.confirm || 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}