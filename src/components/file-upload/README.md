# File Upload System

Centralized, reusable file upload system following LMS best practices with multi-tier storage strategy.

## Features

- ✅ **Multi-tier storage** (Hot/Warm/Cold) following LMS best practices
- ✅ **Multiple storage providers** (Vercel Blob, AWS S3, Cloudflare R2)
- ✅ **Drag & drop** with preview support
- ✅ **Progress tracking** for uploads
- ✅ **File validation** (size, type, dimensions, security)
- ✅ **Multi-document management** with checklists
- ✅ **File browser** with grid/table views
- ✅ **Server actions** instead of API routes
- ✅ **Type-safe** throughout
- ✅ **Multi-tenant** with automatic schoolId scoping

## Directory Structure

```
src/components/file-upload/
├── file-uploader/          # UI Components
│   ├── file-uploader.tsx       # Main dropzone component
│   ├── file-upload-button.tsx  # Dialog-based upload
│   ├── file-card.tsx           # File preview card
│   ├── file-list.tsx           # File list view
│   ├── document-manager.tsx    # Multi-document manager
│   └── file-browser.tsx        # Grid/table file browser
├── hooks/                  # React Hooks
│   ├── use-file-upload.ts      # Upload logic hook
│   ├── use-file-progress.ts    # Progress tracking
│   └── use-file-browser.ts     # Browser state management
├── lib/                    # Core Libraries
│   ├── storage.ts              # Unified storage service
│   ├── providers.ts            # Storage provider implementations
│   ├── validation.ts           # File validation utilities
│   └── formatters.ts           # Formatters (sizes, durations)
├── config/                 # Configuration
│   ├── storage-config.ts       # Storage limits & providers
│   └── file-types.ts           # Accepted file types
├── types/                  # TypeScript Types
│   ├── file-upload.ts          # Core types
│   └── index.ts                # Type exports
├── actions.ts              # Server Actions
└── README.md              # This file
```

## Quick Start

### 1. Simple File Upload Button

```tsx
import { FileUploadButton } from '@/components/file-upload/file-upload/file-upload-button';

function MyComponent() {
  const handleUpload = (metadata) => {
    console.log('Uploaded:', metadata.url);
  };

  return (
    <FileUploadButton
      accept="image"
      onUpload={handleUpload}
      label="Upload Image"
    />
  );
}
```

### 2. Drag & Drop Uploader

```tsx
import { useState } from 'react';
import { FileUploader } from '@/components/file-upload/file-upload/file-upload';
import { getAcceptPattern } from '@/components/file-upload/config/file-types';

function MyComponent() {
  const [files, setFiles] = useState<File[]>([]);

  const handleUpload = async (files: File[]) => {
    // Handle upload logic
    console.log('Files to upload:', files);
  };

  return (
    <FileUploader
      value={files}
      onValueChange={setFiles}
      onUpload={handleUpload}
      accept={getAcceptPattern('video')}
      maxSize={500 * 1024 * 1024} // 500MB
      maxFiles={5}
      multiple
    />
  );
}
```

### 3. Multi-Document Manager

```tsx
import { useState } from 'react';
import { DocumentManager } from '@/components/file-upload/file-upload/document-manager';
import type { DocumentRequirement, ManagedDocument } from '@/components/file-upload/types';

function StudentRegistration() {
  const [documents, setDocuments] = useState<ManagedDocument[]>([]);

  const requirements: DocumentRequirement[] = [
    {
      type: 'BIRTH_CERTIFICATE',
      required: true,
      label: 'Birth Certificate',
      description: 'Official birth certificate (PDF or image)',
      maxSize: 10 * 1024 * 1024, // 10MB
      accept: ['.pdf', '.jpg', '.png'],
    },
    {
      type: 'ID_CARD',
      required: true,
      label: 'Student ID Card',
      maxSize: 5 * 1024 * 1024,
    },
    // ... more requirements
  ];

  return (
    <DocumentManager
      requirements={requirements}
      documents={documents}
      onChange={setDocuments}
    />
  );
}
```

### 4. File Browser

```tsx
import { FileBrowser } from '@/components/file-upload/file-upload/file-browser';

function MediaLibrary() {
  const handleSelect = (files) => {
    console.log('Selected files:', files);
  };

  return (
    <FileBrowser
      schoolId="school_123"
      folder="library/books"
      initialView="grid"
      allowUpload
      allowDelete
      allowSelect
      onSelect={handleSelect}
    />
  );
}
```

### 5. Using the Upload Hook

```tsx
import { useFileUpload } from '@/components/file-upload/hooks/use-file-upload';

function MyComponent() {
  const { upload, isUploading, progress, error } = useFileUpload({
    category: 'video',
    folder: 'courses/math-101',
    onSuccess: (result) => {
      console.log('Upload successful:', result.metadata?.url);
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await upload(file);
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} disabled={isUploading} />
      {isUploading && <p>Uploading... {progress['filename']}%</p>}
      {error && <p>Error: {error.message}</p>}
    </div>
  );
}
```

## Storage Configuration

### Multi-Tier Strategy

The system automatically selects the appropriate storage tier:

- **Hot Storage** (Vercel Blob): Frequently accessed files < 30 days, < 100MB
- **Warm Storage** (AWS S3): Regular access 30-90 days, < 500MB
- **Cold Storage** (S3 Glacier/R2): Long-term archival > 90 days, unlimited

### Storage Providers

Configure providers via environment variables:

```env
# Vercel Blob (always available)
BLOB_READ_WRITE_TOKEN=vercel_blob_token

# AWS S3 (optional, for large files)
AWS_S3_BUCKET=your-bucket-name
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# Cloudflare R2 (optional, alternative to S3)
CLOUDFLARE_R2_ACCOUNT_ID=your-account-id
CLOUDFLARE_R2_ACCESS_KEY_ID=your-access-key
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your-secret-key
CLOUDFLARE_R2_BUCKET_NAME=your-bucket-name
CLOUDFLARE_R2_PUBLIC_URL=https://pub.example.com
```

### File Size Limits

Default limits by file type:

```typescript
{
  avatar: 2 MB,
  logo: 5 MB,
  banner: 10 MB,
  lesson_video: 5 GB,
  document: 50 MB,
  certificate: 10 MB,
  receipt: 5 MB,
}
```

## Server Actions

All uploads use server actions instead of API routes:

```typescript
import { uploadFileAction, deleteFileAction, listFilesAction } from '@/components/file-upload/actions';

// Upload file
const formData = new FormData();
formData.append('file', file);
formData.append('folder', 'courses/math');
formData.append('category', 'video');

const result = await uploadFileAction(formData);

// Delete file
await deleteFileAction({
  url: fileUrl,
  schoolId: 'school_123',
  userId: 'user_456',
});

// List files
const files = await listFilesAction({
  schoolId: 'school_123',
  folder: 'courses',
  category: 'video',
});
```

## File Validation

The system includes comprehensive validation:

### Size Validation

```typescript
import { validateFile } from '@/components/file-upload/lib/validation';

const result = validateFile(file, {
  maxSize: 10 * 1024 * 1024, // 10MB
  minSize: 1024, // 1KB
});

if (!result.valid) {
  console.error(result.errors);
}
```

### Image Dimension Validation

```typescript
import { validateImageDimensions } from '@/components/file-upload/lib/validation';

const result = await validateImageDimensions(file, {
  dimensions: {
    maxWidth: 1920,
    maxHeight: 1080,
    minWidth: 800,
    minHeight: 600,
    aspectRatio: 16 / 9,
  },
});
```

### Security Validation

```typescript
import { validateSecurity } from '@/components/file-upload/lib/validation';

// Blocks executable files and dangerous types
const result = validateSecurity(file);
```

## Utilities

### Formatters

```typescript
import {
  formatBytes,
  formatDuration,
  sanitizeFilename,
  generateUniqueFilename,
} from '@/components/file-upload/lib/formatters';

formatBytes(1536000); // "1.46 MB"
formatDuration(125); // "2:05"
sanitizeFilename('my file!.pdf'); // "my_file.pdf"
generateUniqueFilename('document.pdf', 'school_123'); // "school_123_document_1234567890_abc123.pdf"
```

### File Type Detection

```typescript
import { detectCategory, getFileTypeLabel } from '@/components/file-upload/config/file-types';

detectCategory('image/jpeg'); // "image"
getFileTypeLabel('application/pdf'); // "PDF Document"
```

## Best Practices

1. **Always specify category** - Helps with storage tier selection
2. **Use appropriate folder structure** - `{schoolId}/{feature}/{resource}`
3. **Validate on client and server** - Client for UX, server for security
4. **Handle upload errors gracefully** - Show user-friendly messages
5. **Clean up object URLs** - Prevent memory leaks with URL.revokeObjectURL()
6. **Use server actions** - Don't create new API routes
7. **Scope by schoolId** - All uploads must include tenant context

## Migration from Old System

Old code:
```tsx
import { FileUploader } from '@/components/operator/file-upload';

<FileUploader
  value={files}
  onValueChange={setFiles}
  accept={{ 'image/*': [] }}
  maxSize={5 * 1024 * 1024}
/>
```

New code:
```tsx
import { FileUploader } from '@/components/file-upload/file-upload/file-upload';

<FileUploader
  value={files}
  onValueChange={setFiles}
  accept={{ 'image/*': [] }}
  maxSize={5 * 1024 * 1024}
/>
```

Or use the simpler button variant:
```tsx
import { FileUploadButton } from '@/components/file-upload/file-upload/file-upload-button';

<FileUploadButton
  accept="image"
  onUpload={(metadata) => console.log(metadata.url)}
/>
```

## Troubleshooting

### Upload fails with "Unauthorized"
- Ensure user is logged in via `auth()`
- Check session includes `schoolId`

### File too large error
- Check storage configuration
- Ensure extended storage (S3/R2) is configured for large files

### Type errors
- Run `pnpm prisma generate` to regenerate Prisma client
- Ensure FileMetadata model exists in Prisma schema

### Files not showing in browser
- Check `listFilesAction` is called with correct schoolId
- Verify files were uploaded with correct folder path

## License

MIT
