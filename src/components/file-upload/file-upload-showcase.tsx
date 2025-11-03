/**
 * FileUploadShowcase Component
 * Complete implementation example with all file upload UI components
 */

'use client';

import * as React from 'react';
import {
  EnhancedDropzone,
  UploadQueue,
  EnhancedFileBrowser,
  FilePreview,
  StorageQuota,
  MobileUploadSheet,
  FileActionsToolbar,
  useFileUpload,
  useFileProgress,
  useFileBrowser
} from './index';
import type { FileMetadata, FileUploadState } from './types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMediaQuery } from '@/hooks/use-media-query';
import { toast } from 'sonner';

interface FileUploadShowcaseProps {
  schoolId: string;
  userId: string;
  dictionary?: any;
  className?: string;
}

// Mock data for demonstration
const mockFiles: FileMetadata[] = [
  {
    id: '1',
    filename: 'student-records.pdf',
    originalName: 'Student Records 2024.pdf',
    size: 2485760,
    mimeType: 'application/pdf',
    category: 'document',
    type: 'pdf',
    url: '/files/student-records.pdf',
    uploadedAt: new Date('2024-01-15'),
    uploadedBy: 'Admin User',
    schoolId: 'school-1',
    folder: '/documents',
    storageProvider: 'vercel_blob',
    storageTier: 'hot',
  },
  {
    id: '2',
    filename: 'school-logo.png',
    originalName: 'Hogwarts Logo.png',
    size: 524288,
    mimeType: 'image/png',
    category: 'image',
    type: 'logo',
    url: '/files/school-logo.png',
    dimensions: { width: 512, height: 512 },
    uploadedAt: new Date('2024-01-10'),
    uploadedBy: 'Admin User',
    schoolId: 'school-1',
    folder: '/images',
    storageProvider: 'vercel_blob',
    storageTier: 'hot',
  },
  {
    id: '3',
    filename: 'lecture-01.mp4',
    originalName: 'Introduction to Magic.mp4',
    size: 104857600,
    mimeType: 'video/mp4',
    category: 'video',
    type: 'lesson',
    url: '/files/lecture-01.mp4',
    duration: 3600,
    uploadedAt: new Date('2024-01-20'),
    uploadedBy: 'Professor McGonagall',
    schoolId: 'school-1',
    folder: '/videos',
    storageProvider: 'cloudflare_r2',
    storageTier: 'warm',
  },
];

export function FileUploadShowcase({
  schoolId,
  userId,
  dictionary,
  className,
}: FileUploadShowcaseProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');

  // State management
  const [files, setFiles] = React.useState<File[]>([]);
  const [uploadQueue, setUploadQueue] = React.useState<FileUploadState[]>([]);
  const [browserFiles, setBrowserFiles] = React.useState<FileMetadata[]>(mockFiles);
  const [selectedBrowserFiles, setSelectedBrowserFiles] = React.useState<FileMetadata[]>([]);
  const [previewFile, setPreviewFile] = React.useState<FileMetadata | null>(null);
  const [mobileUploadOpen, setMobileUploadOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('upload');

  // Hooks
  const { upload, uploadMultiple, progress, isUploading } = useFileUpload({
    schoolId,
    // @ts-ignore - userId property may not exist in UseFileUploadOptions type
    userId,
  });

  // Storage calculation
  const storageUsed = browserFiles.reduce((sum, file) => sum + file.size, 0);
  const storageTotal = 10 * 1024 * 1024 * 1024; // 10GB
  const storageBreakdown = React.useMemo(() => {
    const breakdown: Record<string, { size: number; count: number }> = {};

    browserFiles.forEach((file) => {
      if (!breakdown[file.category]) {
        breakdown[file.category] = { size: 0, count: 0 };
      }
      breakdown[file.category].size += file.size;
      breakdown[file.category].count += 1;
    });

    return Object.entries(breakdown).map(([category, data]) => ({
      category: category as any,
      size: data.size,
      count: data.count,
      percentage: Math.round((data.size / storageUsed) * 100),
    }));
  }, [browserFiles, storageUsed]);

  // Handle file upload
  const handleUpload = async (filesToUpload: File[]) => {
    // Create upload states
    const newUploads: FileUploadState[] = filesToUpload.map((file) => ({
      file,
      progress: 0,
      status: 'pending' as const,
    }));

    setUploadQueue((prev) => [...prev, ...newUploads]);

    // Simulate upload progress
    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i];
      const uploadIndex = uploadQueue.length + i;

      // Update to uploading status
      setUploadQueue((prev) => {
        const updated = [...prev];
        updated[uploadIndex] = { ...updated[uploadIndex], status: 'uploading' };
        return updated;
      });

      // Simulate progress
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        setUploadQueue((prev) => {
          const updated = [...prev];
          updated[uploadIndex] = { ...updated[uploadIndex], progress };
          return updated;
        });
      }

      // Complete upload
      setUploadQueue((prev) => {
        const updated = [...prev];
        updated[uploadIndex] = { ...updated[uploadIndex], status: 'success' };
        return updated;
      });

      // Add to browser files
      const metadata: FileMetadata = {
        id: `new-${Date.now()}-${i}`,
        filename: file.name,
        originalName: file.name,
        size: file.size,
        mimeType: file.type,
        category: file.type.startsWith('image/') ? 'image' : 'document',
        url: URL.createObjectURL(file),
        uploadedAt: new Date(),
        uploadedBy: 'Current User',
        schoolId,
        folder: '/uploads',
        storageProvider: 'vercel_blob',
        storageTier: 'hot',
      };

      setBrowserFiles((prev) => [metadata, ...prev]);
    }

    toast.success(`Successfully uploaded ${filesToUpload.length} file(s)`);
    setFiles([]);
  };

  // Handle file actions
  const handleFileAction = async (action: string, files: FileMetadata | FileMetadata[]) => {
    const fileArray = Array.isArray(files) ? files : [files];

    switch (action) {
      case 'view':
        if (!Array.isArray(files)) {
          setPreviewFile(files);
        }
        break;

      case 'download':
        fileArray.forEach((file) => {
          const link = document.createElement('a');
          link.href = file.url;
          link.download = file.originalName || file.filename;
          link.click();
        });
        toast.success(`Downloaded ${fileArray.length} file(s)`);
        break;

      case 'delete':
        setBrowserFiles((prev) =>
          prev.filter((f) => !fileArray.some((del) => del.id === f.id))
        );
        setSelectedBrowserFiles([]);
        toast.success(`Deleted ${fileArray.length} file(s)`);
        break;

      case 'share':
        // Simulate share
        await navigator.clipboard.writeText(fileArray[0].url);
        toast.success('File link copied to clipboard');
        break;

      default:
        toast.info(`Action "${action}" not implemented in demo`);
    }
  };

  // Handle batch actions
  const handleBatchAction = async (action: string, files: FileMetadata[]) => {
    await handleFileAction(action, files);
  };

  return (
    <div className={className}>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="browse">Browse</TabsTrigger>
          <TabsTrigger value="queue">Queue</TabsTrigger>
          <TabsTrigger value="storage">Storage</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>File Upload</CardTitle>
              <CardDescription>
                Drag and drop files or click to browse. Maximum 5 files, 10MB each.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <EnhancedDropzone
                value={files}
                onValueChange={setFiles}
                onUpload={handleUpload}
                progresses={progress}
                maxFiles={5}
                maxSize={10 * 1024 * 1024}
                multiple
                variant="default"
                showStats
                dictionary={dictionary}
              />

              {files.length > 0 && (
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setFiles([])}
                  >
                    Clear All
                  </Button>
                  <Button
                    onClick={() => handleUpload(files)}
                    disabled={isUploading}
                  >
                    Upload {files.length} File(s)
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Mobile upload button */}
          {isMobile && (
            <Button
              className="w-full"
              size="lg"
              onClick={() => setMobileUploadOpen(true)}
            >
              Open Mobile Uploader
            </Button>
          )}
        </TabsContent>

        <TabsContent value="browse" className="space-y-4">
          <FileActionsToolbar
            selectedFiles={selectedBrowserFiles}
            totalFiles={browserFiles.length}
            onAction={handleBatchAction}
            onSelectAll={() => setSelectedBrowserFiles(browserFiles)}
            onClearSelection={() => setSelectedBrowserFiles([])}
            onRefresh={() => toast.info('Refreshing files...')}
            onUpload={() => setActiveTab('upload')}
            position="top"
            showSelectionInfo
            dictionary={dictionary}
          />

          <EnhancedFileBrowser
            files={browserFiles}
            view="grid"
            onFileSelect={(file) => setPreviewFile(file)}
            onFilesSelect={setSelectedBrowserFiles}
            onFileAction={handleFileAction}
            onBatchAction={handleBatchAction}
            allowSelection
            allowMultiSelect
            allowActions
            showSearch
            showFilters
            showSort
            dictionary={dictionary}
          />
        </TabsContent>

        <TabsContent value="queue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload Queue</CardTitle>
              <CardDescription>
                Monitor and manage your file uploads
              </CardDescription>
            </CardHeader>
            <CardContent>
              {uploadQueue.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No active uploads. Start uploading files to see them here.
                </div>
              ) : (
                <UploadQueue
                  uploads={uploadQueue}
                  onCancel={(fileId) => {
                    setUploadQueue((prev) =>
                      prev.filter((u) => u.file.name !== fileId)
                    );
                  }}
                  onRemove={(fileId) => {
                    setUploadQueue((prev) =>
                      prev.filter((u) => u.file.name !== fileId)
                    );
                  }}
                  onClearCompleted={() => {
                    setUploadQueue((prev) =>
                      prev.filter((u) => u.status !== 'success')
                    );
                  }}
                  variant="default"
                  dictionary={dictionary}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="storage" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <StorageQuota
              used={storageUsed}
              total={storageTotal}
              breakdown={storageBreakdown}
              tier="pro"
              growthRate={1024 * 1024 * 10} // 10MB per day
              onUpgrade={() => toast.info('Upgrade to Enterprise for unlimited storage')}
              onManage={() => setActiveTab('browse')}
              variant="detailed"
              showBreakdown
              showAlerts
              dictionary={dictionary}
            />

            <Card>
              <CardHeader>
                <CardTitle>Storage Statistics</CardTitle>
                <CardDescription>
                  Detailed breakdown of your storage usage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">File Types</h4>
                    <div className="space-y-2">
                      {storageBreakdown.map((item) => (
                        <div key={item.category} className="flex justify-between text-sm">
                          <span className="capitalize">{item.category}</span>
                          <span className="text-muted-foreground">
                            {item.count} files ({item.percentage}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">Recent Activity</h4>
                    <div className="space-y-2">
                      {browserFiles.slice(0, 3).map((file) => (
                        <div key={file.id} className="flex justify-between text-sm">
                          <span className="truncate flex-1 mr-2">
                            {file.originalName}
                          </span>
                          <span className="text-muted-foreground text-xs">
                            {new Date(file.uploadedAt).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* File Preview Dialog/Sheet */}
      {previewFile && (
        <FilePreview
          file={previewFile}
          open={!!previewFile}
          onOpenChange={(open) => !open && setPreviewFile(null)}
          onAction={handleFileAction as any}
          variant={isMobile ? 'sheet' : 'dialog'}
          showDetails
          showActions
          dictionary={dictionary}
        />
      )}

      {/* Mobile Upload Sheet */}
      <MobileUploadSheet
        open={mobileUploadOpen}
        onOpenChange={setMobileUploadOpen}
        value={files}
        onValueChange={setFiles}
        onUpload={handleUpload}
        uploads={uploadQueue}
        progresses={progress}
        variant="drawer"
        dictionary={dictionary}
      />
    </div>
  );
}