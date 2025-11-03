/**
 * MobileUploadSheet Component
 * Mobile-optimized file upload interface with bottom sheet
 */

'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  Camera,
  FileText,
  Image as ImageIcon,
  Video,
  Mic,
  FolderOpen,
  X,
  Check,
  ChevronDown,
  Smartphone,
  Cloud,
  History,
  Grid3x3
} from 'lucide-react';
import type { FileUploaderProps, FileUploadState } from '../types';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from '@/components/ui/drawer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { cn, formatBytes } from '@/lib/utils';
import { useMediaQuery } from '@/hooks/use-media-query';
import { toast } from 'sonner';

interface MobileUploadSheetProps extends FileUploaderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  uploads?: FileUploadState[];
  recentFiles?: File[];
  onCameraCapture?: () => void;
  onFilePick?: (source: 'gallery' | 'files' | 'drive') => void;
  variant?: 'sheet' | 'drawer';
  dictionary?: any;
  className?: string;
}

interface UploadOption {
  id: string;
  icon: React.ElementType;
  label: string;
  description: string;
  color: string;
  accept?: string;
  capture?: 'user' | 'environment';
}

const uploadOptions: UploadOption[] = [
  {
    id: 'camera',
    icon: Camera,
    label: 'Take Photo',
    description: 'Use your camera',
    color: 'bg-chart-1',
    accept: 'image/*',
    capture: 'environment',
  },
  {
    id: 'gallery',
    icon: ImageIcon,
    label: 'Photo Library',
    description: 'Choose from gallery',
    color: 'bg-chart-2',
    accept: 'image/*',
  },
  {
    id: 'video',
    icon: Video,
    label: 'Record Video',
    description: 'Capture video',
    color: 'bg-chart-3',
    accept: 'video/*',
    capture: 'environment',
  },
  {
    id: 'document',
    icon: FileText,
    label: 'Documents',
    description: 'PDFs and docs',
    color: 'bg-chart-1',
    accept: '.pdf,.doc,.docx,.txt',
  },
  {
    id: 'audio',
    icon: Mic,
    label: 'Audio',
    description: 'Record or select',
    color: 'bg-destructive',
    accept: 'audio/*',
  },
  {
    id: 'files',
    icon: FolderOpen,
    label: 'Browse Files',
    description: 'All file types',
    color: 'bg-muted-foreground',
    accept: '*',
  },
];

export function MobileUploadSheet({
  open,
  onOpenChange,
  value,
  onValueChange,
  onUpload,
  uploads = [],
  recentFiles = [],
  onCameraCapture,
  onFilePick,
  progresses,
  maxSize = 10 * 1024 * 1024,
  maxFiles = 5,
  multiple = true,
  disabled = false,
  variant = 'drawer',
  dictionary,
  className,
}: MobileUploadSheetProps) {
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>(value || []);
  const [activeTab, setActiveTab] = React.useState<'upload' | 'recent' | 'queue'>('upload');
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Use drawer on mobile, sheet on tablet/desktop
  const shouldUseDrawer = variant === 'drawer' && isMobile;

  React.useEffect(() => {
    if (value) {
      setSelectedFiles(value);
    }
  }, [value]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, option: UploadOption) => {
    const files = Array.from(event.target.files || []);

    // Validate file count
    if (selectedFiles.length + files.length > maxFiles) {
      toast.error(
        dictionary?.errors?.maxFilesExceeded ||
        `You can only upload up to ${maxFiles} files`
      );
      return;
    }

    // Validate file sizes
    const oversizedFiles = files.filter((file) => file.size > maxSize);
    if (oversizedFiles.length > 0) {
      oversizedFiles.forEach((file) => {
        toast.error(
          dictionary?.errors?.fileTooLarge ||
          `${file.name} is too large. Maximum size is ${formatBytes(maxSize)}`
        );
      });
      return;
    }

    const newFiles = multiple
      ? [...selectedFiles, ...files]
      : files.slice(0, 1);

    setSelectedFiles(newFiles);
    onValueChange?.(newFiles);

    // Auto-upload if handler provided
    if (onUpload && files.length > 0) {
      toast.promise(
        onUpload(files),
        {
          loading: dictionary?.uploading || 'Uploading files...',
          success: dictionary?.uploadSuccess || 'Files uploaded successfully',
          error: (error) => error instanceof Error ? error.message : 'Upload failed',
        }
      );
    }

    // Reset input
    if (event.target) {
      event.target.value = '';
    }
  };

  const handleOptionClick = (option: UploadOption) => {
    if (option.id === 'camera' && onCameraCapture) {
      onCameraCapture();
    } else if (option.id === 'gallery' && onFilePick) {
      onFilePick('gallery');
    } else if (option.id === 'files' && onFilePick) {
      onFilePick('files');
    } else {
      // Create hidden file input and trigger it
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = option.accept || '*';
      input.multiple = multiple && option.id !== 'camera';
      if (option.capture) {
        input.capture = option.capture;
      }
      input.onchange = (e) => handleFileSelect(e as any, option);
      input.click();
    }
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    onValueChange?.(newFiles);
  };

  const renderUploadOptions = () => (
    <div className="grid grid-cols-2 gap-3 p-4">
      {uploadOptions.map((option) => {
        const Icon = option.icon;
        return (
          <motion.button
            key={option.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleOptionClick(option)}
            disabled={disabled || selectedFiles.length >= maxFiles}
            className={cn(
              'relative flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed transition-all',
              'hover:border-primary hover:bg-muted/50',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
              'disabled:opacity-50 disabled:pointer-events-none',
              className
            )}
          >
            <div
              className={cn(
                'w-12 h-12 rounded-full flex items-center justify-center mb-2',
                option.color,
                'bg-opacity-10'
              )}
            >
              <Icon className={cn('h-6 w-6', option.color.replace('bg-', 'text-'))} />
            </div>
            <span className="text-sm font-medium">{option.label}</span>
            <span className="text-xs text-muted-foreground mt-1">
              {option.description}
            </span>
          </motion.button>
        );
      })}
    </div>
  );

  const renderSelectedFiles = () => (
    <ScrollArea className="h-[200px] px-4">
      <div className="space-y-2">
        {selectedFiles.map((file, index) => {
          const progress = progresses?.[file.name];
          return (
            <motion.div
              key={`${file.name}-${index}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
            >
              <div className="flex-shrink-0">
                {file.type.startsWith('image/') ? (
                  <div className="w-10 h-10 rounded overflow-hidden bg-muted">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-full h-full object-cover"
                      onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
                    />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(file.size)}
                </p>
                {progress !== undefined && (
                  <Progress value={progress} className="h-1 mt-1" />
                )}
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleRemoveFile(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </motion.div>
          );
        })}
      </div>
    </ScrollArea>
  );

  const renderRecentFiles = () => (
    <ScrollArea className="h-[300px] px-4">
      <div className="space-y-2">
        {recentFiles.length === 0 ? (
          <div className="text-center py-8">
            <History className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {dictionary?.noRecentFiles || 'No recent files'}
            </p>
          </div>
        ) : (
          recentFiles.map((file, index) => (
            <motion.div
              key={`recent-${file.name}-${index}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted"
              onClick={() => {
                const newFiles = multiple
                  ? [...selectedFiles, file]
                  : [file];
                setSelectedFiles(newFiles);
                onValueChange?.(newFiles);
                setActiveTab('upload');
              }}
            >
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(file.size)}
                </p>
              </div>
              <Button variant="ghost" size="sm">
                {dictionary?.select || 'Select'}
              </Button>
            </motion.div>
          ))
        )}
      </div>
    </ScrollArea>
  );

  const renderUploadQueue = () => (
    <ScrollArea className="h-[300px] px-4">
      <div className="space-y-2">
        {uploads.length === 0 ? (
          <div className="text-center py-8">
            <Cloud className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {dictionary?.noActiveUploads || 'No active uploads'}
            </p>
          </div>
        ) : (
          uploads.map((upload, index) => (
            <motion.div
              key={`upload-${upload.file.name}-${index}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-3 rounded-lg bg-muted/50"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium truncate flex-1">
                  {upload.file.name}
                </p>
                {upload.status === 'success' && (
                  <Check className="h-4 w-4 text-success" />
                )}
                {upload.status === 'error' && (
                  <X className="h-4 w-4 text-destructive" />
                )}
              </div>
              {upload.status === 'uploading' && (
                <Progress value={upload.progress} className="h-1" />
              )}
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-muted-foreground">
                  {formatBytes(upload.file.size)}
                </span>
                {upload.status === 'uploading' && (
                  <span className="text-xs text-muted-foreground">
                    {upload.progress}%
                  </span>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </ScrollArea>
  );

  const content = (
    <>
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload" className="text-xs">
              <Upload className="h-4 w-4 mr-1" />
              {dictionary?.upload || 'Upload'}
            </TabsTrigger>
            <TabsTrigger value="recent" className="text-xs">
              <History className="h-4 w-4 mr-1" />
              {dictionary?.recent || 'Recent'}
            </TabsTrigger>
            <TabsTrigger value="queue" className="text-xs relative">
              <Cloud className="h-4 w-4 mr-1" />
              {dictionary?.queue || 'Queue'}
              {uploads.filter(u => u.status === 'uploading').length > 0 && (
                <span className="absolute -top-1 -right-1 h-2 w-2 bg-primary rounded-full animate-pulse" />
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="mt-4 space-y-4">
            {renderUploadOptions()}
            {selectedFiles.length > 0 && (
              <>
                <Separator />
                <div className="px-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium">
                      {dictionary?.selectedFiles || 'Selected files'} ({selectedFiles.length})
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedFiles([]);
                        onValueChange?.([]);
                      }}
                    >
                      {dictionary?.clearAll || 'Clear all'}
                    </Button>
                  </div>
                </div>
                {renderSelectedFiles()}
              </>
            )}
          </TabsContent>

          <TabsContent value="recent" className="mt-4">
            {renderRecentFiles()}
          </TabsContent>

          <TabsContent value="queue" className="mt-4">
            {renderUploadQueue()}
          </TabsContent>
        </Tabs>
      </div>

      <div className="border-t p-4 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {dictionary?.storageUsed || 'Storage used'}
          </span>
          <Badge variant="secondary">
            {selectedFiles.length}/{maxFiles} {dictionary?.files || 'files'}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {dictionary?.cancel || 'Cancel'}
          </Button>
          <Button
            onClick={() => {
              if (onUpload && selectedFiles.length > 0) {
                onUpload(selectedFiles);
              }
              onOpenChange(false);
            }}
            disabled={selectedFiles.length === 0}
          >
            {dictionary?.uploadFiles || 'Upload'} ({selectedFiles.length})
          </Button>
        </div>
      </div>
    </>
  );

  if (shouldUseDrawer) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle>{dictionary?.uploadFiles || 'Upload Files'}</DrawerTitle>
            <DrawerDescription>
              {dictionary?.uploadDescription || 'Choose files to upload'}
            </DrawerDescription>
          </DrawerHeader>
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[80vh] flex flex-col">
        <SheetHeader>
          <SheetTitle>{dictionary?.uploadFiles || 'Upload Files'}</SheetTitle>
          <SheetDescription>
            {dictionary?.uploadDescription || 'Choose files to upload'}
          </SheetDescription>
        </SheetHeader>
        {content}
      </SheetContent>
    </Sheet>
  );
}