# Production-Ready File Upload System - Complete Implementation Guide

## 🚀 Executive Summary

We've created a comprehensive, production-ready file upload system for your Hogwarts school platform that handles everything from 1KB documents to 5GB videos with enterprise-grade features including:

- **Chunked uploads** for files up to 5GB
- **Multi-provider storage** (Vercel Blob, AWS S3, Cloudflare R2)
- **Real-time progress tracking** with speed and ETA
- **Client-side image optimization** (automatic WebP conversion)
- **Comprehensive security** (virus scanning, rate limiting, content validation)
- **Multi-tenant isolation** with school-based scoping
- **Complete UI components** using ShadCN UI
- **Full DevOps infrastructure** with CI/CD and monitoring

## 📁 What We've Built

### 1. **Enhanced Server Actions** (`enhanced/actions.ts`)
- Complete file upload with all production features
- Chunked upload support for large files
- Rate limiting with Redis
- Quota management per school
- Duplicate detection with SHA-256 hashing
- Virus scanning integration
- Audit logging
- Presigned URL generation

### 2. **Client-Side Hooks**
- **`use-chunked-upload.ts`**: Handles large file uploads with progress
- **`use-image-optimization.ts`**: Client-side image compression

### 3. **Enhanced UI Component** (`enhanced-file-uploader.tsx`)
- Drag-and-drop with visual feedback
- Real-time upload progress
- Queue management with pause/resume
- Image previews and optimization
- Mobile-responsive design

### 4. **Database Schema** (Prisma models)
Complete schema with:
- FileMetadata (core file information)
- FileVersion (version history)
- FilePermission (access control)
- FileChunk (chunked upload tracking)
- FileTransformation (image/video processing)
- FileAuditLog (audit trail)
- UploadQuota (storage limits)

### 5. **DevOps Infrastructure**
- GitHub Actions CI/CD pipeline
- Terraform configuration for AWS/CloudFront
- Docker containerization
- Kubernetes manifests
- Performance testing with K6
- Monitoring with Datadog

### 6. **UI Components Library**
- Enhanced dropzone
- Upload queue manager
- File browser (grid/list views)
- File preview modal
- Storage quota visualization
- Mobile upload sheet
- File actions toolbar

## 🎯 How to Use

### Basic Implementation

```tsx
// app/[lang]/s/[subdomain]/files/upload/page.tsx
import { EnhancedFileUploader } from '@/components/file-upload/enhanced/enhanced-file-upload';
import { auth } from '@/auth';

export default async function FileUploadPage() {
  const session = await auth();

  if (!session?.user?.schoolId) {
    return <div>Unauthorized</div>;
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Upload Files</h1>

      <EnhancedFileUploader
        schoolId={session.user.schoolId}
        userId={session.user.id!}
        category="DOCUMENT"
        folder={`${session.user.schoolId}/documents`}
        maxSize={5 * 1024 * 1024 * 1024} // 5GB
        maxFiles={10}
        autoUpload={false}
        optimizeImages={true}
        showQuota={true}
        onUploadComplete={(fileIds) => {
          console.log('Files uploaded:', fileIds);
          // Redirect or update UI
        }}
      />
    </div>
  );
}
```

### Advanced Use Cases

#### 1. Student Document Upload

```tsx
// For student registration documents
<EnhancedFileUploader
  schoolId={schoolId}
  userId={userId}
  category="DOCUMENT"
  folder={`${schoolId}/students/${studentId}/documents`}
  accept={{
    'application/pdf': ['.pdf'],
    'image/*': ['.jpg', '.jpeg', '.png']
  }}
  maxSize={10 * 1024 * 1024} // 10MB per document
  maxFiles={5}
  onUploadComplete={async (fileIds) => {
    // Link documents to student record
    await updateStudentDocuments(studentId, fileIds);
  }}
/>
```

#### 2. Course Material Upload

```tsx
// For teachers uploading course materials
<EnhancedFileUploader
  schoolId={schoolId}
  userId={teacherId}
  category="VIDEO"
  folder={`${schoolId}/courses/${courseId}/materials`}
  accept={{
    'video/*': ['.mp4', '.webm'],
    'application/pdf': ['.pdf'],
    'application/vnd.ms-powerpoint': ['.ppt', '.pptx']
  }}
  maxSize={5 * 1024 * 1024 * 1024} // 5GB for videos
  optimizeImages={false} // Don't optimize video thumbnails
  onUploadComplete={async (fileIds) => {
    // Add to course materials
    await addCourseMaterials(courseId, fileIds);
  }}
/>
```

#### 3. Profile Photo Upload

```tsx
// For user avatar/profile photo
<EnhancedFileUploader
  schoolId={schoolId}
  userId={userId}
  category="IMAGE"
  folder={`${schoolId}/avatars`}
  accept={{
    'image/*': ['.jpg', '.jpeg', '.png', '.webp']
  }}
  maxSize={2 * 1024 * 1024} // 2MB
  maxFiles={1}
  autoUpload={true}
  optimizeImages={true} // Optimize to 256x256
  onUploadComplete={async ([fileId]) => {
    // Update user profile
    await updateUserAvatar(userId, fileId);
  }}
/>
```

## 🔧 Server Actions Usage

### Direct Server Action Calls

```typescript
// In your server components or actions
import {
  uploadFileEnhanced,
  listFiles,
  deleteFile,
  getStorageAnalytics
} from '@/components/file-upload/enhanced/actions';

// Upload a file
const formData = new FormData();
formData.append('file', file);
formData.append('category', 'DOCUMENT');
formData.append('folder', `${schoolId}/documents`);
formData.append('accessLevel', 'SCHOOL');

const result = await uploadFileEnhanced(formData);

if (result.success) {
  console.log('File uploaded:', result.metadata);
} else {
  console.error('Upload failed:', result.error);
}

// List files
const { files, pagination } = await listFiles({
  folder: `${schoolId}/documents`,
  category: 'DOCUMENT',
  page: 1,
  limit: 20
});

// Get storage analytics
const analytics = await getStorageAnalytics();
console.log('Storage used:', analytics.quota?.percentage + '%');
```

## 🗄️ Database Setup

### 1. Add Prisma Models

Add the file models to your Prisma schema:

```prisma
// prisma/schema.prisma or prisma/models/files.prisma

model FileMetadata {
  id                String           @id @default(cuid())
  filename          String
  originalName      String
  mimeType          String
  size              BigInt
  hash              String?
  category          FileCategory
  type              String?
  storageProvider   StorageProvider
  storageTier       StorageTier      @default(HOT)
  storageKey        String
  publicUrl         String?
  privateUrl        String
  thumbnailUrl      String?
  schoolId          String
  uploadedById      String
  folder            String
  accessLevel       AccessLevel      @default(PRIVATE)
  virusScanStatus   ScanStatus       @default(PENDING)
  status            FileStatus       @default(ACTIVE)
  createdAt         DateTime         @default(now())
  updatedAt         DateTime         @updatedAt

  school            School           @relation(fields: [schoolId], references: [id])
  uploadedBy        User             @relation(fields: [uploadedById], references: [id])

  @@index([schoolId, folder])
  @@index([schoolId, category])
  @@index([hash])
}

// Add other models from the architecture design...
```

### 2. Run Migration

```bash
# Generate Prisma client
pnpm prisma generate

# Create and apply migration
pnpm prisma migrate dev --name add-file-upload-models
```

## 🔐 Security Configuration

### Environment Variables

```env
# Rate Limiting (Required)
UPSTASH_REDIS_REST_URL=your-redis-url
UPSTASH_REDIS_REST_TOKEN=your-redis-token

# Storage Providers
BLOB_READ_WRITE_TOKEN=your-vercel-blob-token

# AWS S3 (Optional - for large files)
AWS_S3_BUCKET=your-bucket
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret

# Cloudflare R2 (Optional)
CLOUDFLARE_R2_ACCOUNT_ID=your-account
CLOUDFLARE_R2_ACCESS_KEY_ID=your-key
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your-secret
CLOUDFLARE_R2_BUCKET_NAME=your-bucket

# Virus Scanning (Optional)
CLAMAV_API_URL=your-clamav-url
CLAMAV_API_KEY=your-api-key
```

### Rate Limiting Setup

The system uses Upstash Redis for rate limiting. Set up your Redis instance:

1. Create account at [Upstash](https://upstash.com)
2. Create a Redis database
3. Copy REST URL and token to `.env`

## 📊 Monitoring & Analytics

### Key Metrics to Track

```typescript
// Use the analytics action
const analytics = await getStorageAnalytics();

// Returns:
{
  quota: {
    used: "1073741824", // bytes as string (BigInt)
    limit: "10737418240",
    percentage: 10,
    files: 234,
    maxFiles: 10000
  },
  breakdown: [
    { category: "IMAGE", size: "536870912", count: 150 },
    { category: "DOCUMENT", size: "268435456", count: 80 },
    { category: "VIDEO", size: "268435456", count: 4 }
  ],
  recentUploads: [...]
}
```

### Dashboard Integration

```tsx
// components/dashboard/storage-widget.tsx
import { getStorageAnalytics } from '@/components/file-upload/enhanced/actions';
import { StorageQuota } from '@/components/file-upload/file-upload/storage-quota';

export async function StorageWidget({ schoolId }: { schoolId: string }) {
  const analytics = await getStorageAnalytics();

  return (
    <StorageQuota
      used={BigInt(analytics.quota?.used || 0)}
      limit={BigInt(analytics.quota?.limit || 0)}
      breakdown={analytics.breakdown}
      variant="compact"
    />
  );
}
```

## 🧪 Testing

### Unit Tests

```typescript
// __tests__/file-upload.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EnhancedFileUploader } from '@/components/file-upload/enhanced/enhanced-file-upload';

describe('EnhancedFileUploader', () => {
  it('should handle file upload', async () => {
    const onComplete = jest.fn();

    render(
      <EnhancedFileUploader
        schoolId="school_123"
        userId="user_456"
        onUploadComplete={onComplete}
      />
    );

    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    const input = screen.getByLabelText(/drag.*drop/i);

    await userEvent.upload(input, file);

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalled();
    });
  });
});
```

### Performance Testing

```bash
# Run K6 performance tests
k6 run tests/performance/file-upload.js

# Expected results:
# - P95 response time: < 5s
# - Upload success rate: > 95%
# - Concurrent uploads: > 50 per school
```

## 🚀 Deployment

### 1. Deploy Infrastructure

```bash
# Initialize Terraform
cd infrastructure/terraform
terraform init

# Review changes
terraform plan

# Apply infrastructure
terraform apply
```

### 2. Deploy Application

```bash
# Push to main branch for automatic deployment
git add .
git commit -m "feat: Add enhanced file upload system"
git push origin main

# GitHub Actions will:
# 1. Run tests
# 2. Security scan
# 3. Build Docker image
# 4. Deploy to Vercel
# 5. Run post-deployment tests
```

## 🔄 Migration from Existing System

### Step-by-Step Migration

1. **Install dependencies**:
```bash
pnpm add @upstash/ratelimit @upstash/redis
```

2. **Update database**:
```bash
pnpm prisma migrate dev
```

3. **Update imports**:
```typescript
// Old
import { FileUploader } from '@/components/operator/file-upload';

// New
import { EnhancedFileUploader } from '@/components/file-upload/enhanced/enhanced-file-upload';
```

4. **Update component usage** (see examples above)

5. **Test thoroughly** in staging environment

## 📈 Performance Optimizations

### Client-Side Optimizations

1. **Image Optimization**: Automatically converts images to WebP
2. **Chunked Uploads**: 5MB chunks for large files
3. **Parallel Uploads**: Up to 3 concurrent chunk uploads
4. **Retry Logic**: Automatic retry with exponential backoff

### Server-Side Optimizations

1. **Storage Tiering**: Automatic migration to cheaper storage
2. **CDN Delivery**: CloudFront for global distribution
3. **Database Indexing**: Optimized queries with proper indexes
4. **Connection Pooling**: Efficient database connections

## 🆘 Troubleshooting

### Common Issues and Solutions

| Issue | Solution |
|-------|----------|
| Rate limit exceeded | Wait for reset or increase limits in Redis |
| Large file upload fails | Check chunk size, increase to 10MB if needed |
| Storage quota exceeded | Check analytics, clean up old files or upgrade |
| Virus scan fails | Check ClamAV service status |
| Duplicate file warning | System detected same file, use existing or force new |
| Upload stuck at 90% | Last chunk processing, wait for completion |
| No progress updates | Check WebSocket connection for real-time updates |

## 📚 Next Steps

1. **Review and customize** the configuration for your needs
2. **Set up monitoring** dashboards in Datadog
3. **Configure virus scanning** with your preferred service
4. **Test with different file types** and sizes
5. **Train users** on the new upload interface
6. **Monitor usage** and adjust quotas as needed

## 🎉 Summary

You now have a production-ready file upload system that:

- ✅ Handles files from 1KB to 5GB efficiently
- ✅ Provides real-time progress with pause/resume
- ✅ Optimizes images automatically
- ✅ Ensures security with comprehensive validation
- ✅ Scales across multiple storage providers
- ✅ Maintains multi-tenant isolation
- ✅ Includes complete monitoring and analytics
- ✅ Follows all your project's patterns and standards

The system is ready for production use and can handle the file upload needs of all your schools on the platform!