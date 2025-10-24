/**
 * FilePreview Component
 * Advanced file preview with type-specific rendering and controls
 */

'use client';

import * as React from 'react';
import Image from 'next/image';
import {
  X,
  Download,
  Share2,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Play,
  Pause,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  FileText,
  ExternalLink,
  Copy,
  Info,
  Edit3,
  Trash2,
  MoreVertical,
  FileIcon
} from 'lucide-react';
import type { FileMetadata } from '../types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn, formatBytes } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface FilePreviewProps {
  file: FileMetadata | File;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAction?: (action: string, file: FileMetadata | File) => void;
  variant?: 'dialog' | 'sheet';
  showDetails?: boolean;
  showActions?: boolean;
  dictionary?: any;
  className?: string;
}

interface PreviewState {
  zoom: number;
  rotation: number;
  isPlaying: boolean;
  isMuted: boolean;
  currentTime: number;
  duration: number;
  volume: number;
}

export function FilePreview({
  file,
  open,
  onOpenChange,
  onAction,
  variant = 'dialog',
  showDetails = true,
  showActions = true,
  dictionary,
  className,
}: FilePreviewProps) {
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [previewState, setPreviewState] = React.useState<PreviewState>({
    zoom: 100,
    rotation: 0,
    isPlaying: false,
    isMuted: false,
    currentTime: 0,
    duration: 0,
    volume: 100,
  });

  const videoRef = React.useRef<HTMLVideoElement>(null);
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const isFile = file instanceof File;
  const metadata = isFile ? null : (file as FileMetadata);
  const fileName = isFile ? file.name : metadata?.originalName || metadata?.filename || '';
  const fileSize = isFile ? file.size : metadata?.size || 0;
  const fileType = isFile ? file.type : metadata?.mimeType || '';
  const fileUrl = isFile ? URL.createObjectURL(file) : metadata?.url || '';

  // Cleanup object URL
  React.useEffect(() => {
    return () => {
      if (isFile && fileUrl) {
        URL.revokeObjectURL(fileUrl);
      }
    };
  }, [isFile, fileUrl]);

  // Handle keyboard shortcuts
  React.useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (!open) return;

      switch (e.key) {
        case 'Escape':
          if (isFullscreen) {
            setIsFullscreen(false);
          } else {
            onOpenChange(false);
          }
          break;
        case 'f':
        case 'F':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            setIsFullscreen(!isFullscreen);
          }
          break;
        case '+':
        case '=':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleZoomIn();
          }
          break;
        case '-':
        case '_':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleZoomOut();
          }
          break;
        case 'r':
        case 'R':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleRotate();
          }
          break;
        case ' ':
          if (fileType.startsWith('video/') || fileType.startsWith('audio/')) {
            e.preventDefault();
            handlePlayPause();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [open, isFullscreen, fileType]);

  const handleZoomIn = () => {
    setPreviewState((prev) => ({
      ...prev,
      zoom: Math.min(prev.zoom + 25, 200),
    }));
  };

  const handleZoomOut = () => {
    setPreviewState((prev) => ({
      ...prev,
      zoom: Math.max(prev.zoom - 25, 50),
    }));
  };

  const handleRotate = () => {
    setPreviewState((prev) => ({
      ...prev,
      rotation: (prev.rotation + 90) % 360,
    }));
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (previewState.isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
    if (audioRef.current) {
      if (previewState.isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
    }
    setPreviewState((prev) => ({
      ...prev,
      isPlaying: !prev.isPlaying,
    }));
  };

  const handleVolumeChange = (value: number[]) => {
    const volume = value[0];
    setPreviewState((prev) => ({
      ...prev,
      volume,
      isMuted: volume === 0,
    }));
    if (videoRef.current) {
      videoRef.current.volume = volume / 100;
    }
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  };

  const handleCopyLink = async () => {
    if (metadata?.url) {
      await navigator.clipboard.writeText(metadata.url);
      toast.success(dictionary?.linkCopied || 'Link copied to clipboard');
    }
  };

  const renderPreviewContent = () => {
    // Image preview
    if (fileType.startsWith('image/')) {
      return (
        <div className="relative flex items-center justify-center h-full bg-muted">
          <div
            className="relative transition-all duration-200"
            style={{
              transform: `scale(${previewState.zoom / 100}) rotate(${previewState.rotation}deg)`,
            }}
          >
            <img
              src={fileUrl}
              alt={fileName}
              className="max-w-full max-h-[600px] object-contain"
            />
          </div>

          {/* Image controls */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-background/80 backdrop-blur rounded-lg p-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleZoomOut}
                    disabled={previewState.zoom <= 50}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{dictionary?.zoomOut || 'Zoom out'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <span className="text-sm font-medium px-2">
              {previewState.zoom}%
            </span>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleZoomIn}
                    disabled={previewState.zoom >= 200}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{dictionary?.zoomIn || 'Zoom in'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Separator orientation="vertical" className="h-6" />

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={handleRotate}>
                    <RotateCw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{dictionary?.rotate || 'Rotate'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      );
    }

    // Video preview
    if (fileType.startsWith('video/')) {
      return (
        <div className="relative bg-black">
          <video
            ref={videoRef}
            src={fileUrl}
            className="w-full h-full max-h-[600px]"
            controls
            onPlay={() => setPreviewState((prev) => ({ ...prev, isPlaying: true }))}
            onPause={() => setPreviewState((prev) => ({ ...prev, isPlaying: false }))}
            onLoadedMetadata={(e) => {
              const video = e.target as HTMLVideoElement;
              setPreviewState((prev) => ({
                ...prev,
                duration: video.duration,
              }));
            }}
            onTimeUpdate={(e) => {
              const video = e.target as HTMLVideoElement;
              setPreviewState((prev) => ({
                ...prev,
                currentTime: video.currentTime,
              }));
            }}
          />

          {/* Video controls overlay */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-background/80 backdrop-blur rounded-lg p-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePlayPause}
            >
              {previewState.isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setPreviewState((prev) => ({ ...prev, isMuted: !prev.isMuted }));
                  if (videoRef.current) {
                    videoRef.current.muted = !videoRef.current.muted;
                  }
                }}
              >
                {previewState.isMuted ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
              <Slider
                value={[previewState.volume]}
                onValueChange={handleVolumeChange}
                max={100}
                step={1}
                className="w-24"
              />
            </div>
          </div>
        </div>
      );
    }

    // Audio preview
    if (fileType.startsWith('audio/')) {
      return (
        <div className="flex flex-col items-center justify-center p-8">
          <div className="w-32 h-32 bg-muted rounded-full flex items-center justify-center mb-6">
            <Volume2 className="h-12 w-12 text-muted-foreground" />
          </div>
          <audio
            ref={audioRef}
            src={fileUrl}
            controls
            className="w-full max-w-md"
            onPlay={() => setPreviewState((prev) => ({ ...prev, isPlaying: true }))}
            onPause={() => setPreviewState((prev) => ({ ...prev, isPlaying: false }))}
          />
        </div>
      );
    }

    // PDF preview
    if (fileType.includes('pdf')) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8">
          <FileText className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">{fileName}</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {dictionary?.pdfPreviewNotAvailable || 'PDF preview not available'}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="default"
              onClick={() => window.open(fileUrl, '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              {dictionary?.openInNewTab || 'Open in new tab'}
            </Button>
            <Button
              variant="outline"
              onClick={() => onAction?.('download', file)}
            >
              <Download className="h-4 w-4 mr-2" />
              {dictionary?.download || 'Download'}
            </Button>
          </div>
        </div>
      );
    }

    // Default preview for other files
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <FileIcon className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">{fileName}</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {dictionary?.previewNotAvailable || 'Preview not available for this file type'}
        </p>
        <div className="flex items-center gap-2">
          {metadata?.url && (
            <Button
              variant="default"
              onClick={() => window.open(metadata.url, '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              {dictionary?.openInNewTab || 'Open in new tab'}
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => onAction?.('download', file)}
          >
            <Download className="h-4 w-4 mr-2" />
            {dictionary?.download || 'Download'}
          </Button>
        </div>
      </div>
    );
  };

  const renderDetails = () => {
    if (!showDetails || !metadata) return null;

    return (
      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="details">
            {dictionary?.details || 'Details'}
          </TabsTrigger>
          <TabsTrigger value="metadata">
            {dictionary?.metadata || 'Metadata'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {dictionary?.fileName || 'File name'}
              </p>
              <p className="text-sm mt-1">{metadata.originalName || metadata.filename}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {dictionary?.fileSize || 'File size'}
              </p>
              <p className="text-sm mt-1">{formatBytes(metadata.size)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {dictionary?.fileType || 'File type'}
              </p>
              <p className="text-sm mt-1">
                <Badge variant="secondary">{metadata.category}</Badge>
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {dictionary?.mimeType || 'MIME type'}
              </p>
              <p className="text-sm mt-1">{metadata.mimeType}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {dictionary?.uploadedBy || 'Uploaded by'}
              </p>
              <p className="text-sm mt-1">{metadata.uploadedBy}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {dictionary?.uploadedAt || 'Uploaded at'}
              </p>
              <p className="text-sm mt-1">
                {format(new Date(metadata.uploadedAt), 'PPpp')}
              </p>
            </div>
            {metadata.dimensions && (
              <>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {dictionary?.dimensions || 'Dimensions'}
                  </p>
                  <p className="text-sm mt-1">
                    {metadata.dimensions.width} × {metadata.dimensions.height} px
                  </p>
                </div>
              </>
            )}
            {metadata.duration && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {dictionary?.duration || 'Duration'}
                </p>
                <p className="text-sm mt-1">
                  {Math.floor(metadata.duration / 60)}:
                  {String(Math.floor(metadata.duration % 60)).padStart(2, '0')}
                </p>
              </div>
            )}
          </div>

          {metadata.url && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">
                {dictionary?.fileUrl || 'File URL'}
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-muted p-2 rounded truncate">
                  {metadata.url}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyLink}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="metadata" className="space-y-4">
          <ScrollArea className="h-[300px] w-full rounded-md border p-4">
            <pre className="text-xs">
              {JSON.stringify(metadata.metadata || {}, null, 2)}
            </pre>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    );
  };

  const content = (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold truncate max-w-[300px]">
            {fileName}
          </h2>
          <Badge variant="secondary" className="text-xs">
            {formatBytes(fileSize)}
          </Badge>
        </div>

        {showActions && (
          <div className="flex items-center gap-1">
            {metadata?.url && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onAction?.('share', file)}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{dictionary?.share || 'Share'}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onAction?.('download', file)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{dictionary?.download || 'Download'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsFullscreen(!isFullscreen)}
                  >
                    {isFullscreen ? (
                      <Minimize2 className="h-4 w-4" />
                    ) : (
                      <Maximize2 className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {isFullscreen
                      ? dictionary?.exitFullscreen || 'Exit fullscreen'
                      : dictionary?.enterFullscreen || 'Enter fullscreen'}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onAction?.('rename', file)}>
                  <Edit3 className="h-4 w-4 mr-2" />
                  {dictionary?.rename || 'Rename'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAction?.('copy', file)}>
                  <Copy className="h-4 w-4 mr-2" />
                  {dictionary?.copy || 'Copy'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAction?.('info', file)}>
                  <Info className="h-4 w-4 mr-2" />
                  {dictionary?.fileInfo || 'File info'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onAction?.('delete', file)}
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

      <div
        ref={containerRef}
        className={cn(
          'relative overflow-hidden rounded-lg border bg-background',
          isFullscreen && 'fixed inset-0 z-50 rounded-none',
          className
        )}
      >
        {renderPreviewContent()}
      </div>

      {showDetails && metadata && (
        <div className="mt-4">
          {renderDetails()}
        </div>
      )}
    </>
  );

  if (variant === 'sheet') {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-2xl p-6">
          <SheetHeader className="sr-only">
            <SheetTitle>{fileName}</SheetTitle>
            <SheetDescription>
              {dictionary?.filePreview || 'File preview'}
            </SheetDescription>
          </SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader className="sr-only">
          <DialogTitle>{fileName}</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}