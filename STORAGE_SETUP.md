# Storage Setup Guide for Large Video Files

## 📊 Current Situation

Your Stream LMS needs to support **40-minute lesson videos** at high quality:

| Quality | 40-min Size | Storage Needed |
|---------|-------------|----------------|
| 720p HD | 1.5 GB | ✅ Extended storage required |
| 1080p Full HD | 2.4 GB | ✅ Extended storage required |
| 4K Ultra HD | 6 GB | ⚠️ Maximum file size limit |

**Current Vercel Blob limit**: 500 MB (insufficient for your needs)

---

## 🎯 Recommended Solution: Cloudflare R2

**Why R2 is best for educational videos:**
- ✅ **No egress fees** - Unlimited bandwidth at no extra cost
- ✅ **$0.015/GB storage** - Very affordable
- ✅ **5 GB file limit** - Supports up to 40-min 4K videos
- ✅ **S3-compatible API** - Easy to integrate
- ✅ **Global CDN** - Fast delivery worldwide

### Cost Comparison (100 students, 50 courses, avg 10 videos/course)

**Total data**: ~500 videos × 2 GB average = 1 TB storage

| Provider | Storage Cost | Bandwidth Cost | Total/Month |
|----------|--------------|----------------|-------------|
| **Cloudflare R2** | $15/mo | **$0** | **$15/mo** ⭐ |
| AWS S3 + CloudFront | $23/mo | $85/mo | $108/mo |
| Vercel Blob Pro | Included in Pro | Included | $20/mo* |

*Limited to 100GB on Pro plan, would need Enterprise for 1TB

---

## 🚀 Setup Instructions

### Option 1: Cloudflare R2 (Recommended)

#### Step 1: Create Cloudflare Account
1. Go to [cloudflare.com](https://cloudflare.com)
2. Sign up (free tier available)
3. Navigate to **R2** in the dashboard

#### Step 2: Create R2 Bucket
1. Click **Create bucket**
2. Name: `hogwarts-stream-videos`
3. Location: Auto (or choose closest to your users)
4. Click **Create bucket**

#### Step 3: Generate API Tokens
1. Go to **R2** → **Manage R2 API Tokens**
2. Click **Create API token**
3. Name: `hogwarts-upload-token`
4. Permissions: **Object Read & Write**
5. TTL: No expiry
6. Click **Create API Token**
7. **Save these values** (you'll only see them once):
   ```
   Access Key ID: xxxxxxxxxxxxx
   Secret Access Key: xxxxxxxxxxxxx
   Account ID: xxxxxxxxxxxxx
   ```

#### Step 4: Add to Vercel Environment Variables
1. Go to your Vercel project: https://vercel.com/osman-abdouts-projects/hogwarts
2. Go to **Settings** → **Environment Variables**
3. Add these variables for all environments (Production, Preview, Development):

```bash
# Cloudflare R2
CLOUDFLARE_R2_ACCOUNT_ID=your_account_id_here
CLOUDFLARE_R2_ACCESS_KEY_ID=your_access_key_here
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_secret_key_here
CLOUDFLARE_R2_BUCKET_NAME=hogwarts-stream-videos
CLOUDFLARE_R2_PUBLIC_URL=https://pub-xxxxx.r2.dev
```

#### Step 5: Enable Public Access (Optional)
1. Go to your bucket settings
2. Enable **Public Access** if you want direct video streaming
3. Or configure **Custom Domain** for branded URLs

#### Step 6: Pull to Local Development
```bash
vercel env pull .env.local
```

---

### Option 2: AWS S3 + CloudFront

If you prefer AWS or already have an AWS account:

#### Step 1: Create S3 Bucket
```bash
# Using AWS CLI
aws s3 mb s3://hogwarts-stream-videos --region us-east-1
```

Or use AWS Console:
1. Go to [S3 Console](https://console.aws.amazon.com/s3)
2. Create bucket: `hogwarts-stream-videos`
3. Region: Choose closest to your users
4. Block public access: Disabled (we'll use CloudFront)

#### Step 2: Create IAM User
1. Go to IAM → Users → Add user
2. Name: `hogwarts-uploader`
3. Access type: Programmatic access
4. Attach policy: `AmazonS3FullAccess` (or create custom policy)
5. Save Access Key ID and Secret Access Key

#### Step 3: Set Up CloudFront CDN
1. Go to CloudFront Console
2. Create Distribution
3. Origin: Your S3 bucket
4. Cache policy: CachingOptimized
5. Price class: Use all edge locations

#### Step 4: Add to Vercel
```bash
AWS_S3_BUCKET=hogwarts-stream-videos
AWS_S3_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_CLOUDFRONT_DOMAIN=dxxxxxxxxxxxxx.cloudfront.net
```

---

### Option 3: Vercel Blob Pro (Simplest, but costly at scale)

#### Step 1: Upgrade Vercel Plan
1. Go to your Vercel project
2. Upgrade to **Pro** or **Enterprise** plan
3. Pro includes 100GB, Enterprise is custom

#### Step 2: Contact Vercel for Increased Limits
1. Email support@vercel.com
2. Request increase to 5GB per file limit
3. This may require Enterprise plan

**Pros:**
- Zero configuration needed
- Your code already supports it
- Simple billing

**Cons:**
- More expensive at scale ($0.40/GB bandwidth)
- Limited to 100GB on Pro plan
- May need Enterprise for file size limits

---

## 🔧 Implementation Status

Your code is **already configured** to support extended storage! Here's what happens:

### Current Behavior (No Extended Storage)
```
Max video size: 500 MB
Error message: "For videos larger than 500MB, please configure AWS S3 or Cloudflare R2"
```

### After Configuring R2 or S3
```
Max video size: 5 GB (5120 MB)
Supports: 40-min 1080p videos, 20-min 4K videos
UI updates automatically to show "up to 5.0 GB"
```

### Automatic Provider Selection
The system automatically chooses the right storage:
- Files < 500MB → Vercel Blob (fast, included)
- Files > 500MB → R2/S3 (configured extended storage)

---

## 📋 Next Steps

### Immediate (Choose One)

**Option A: Quick Start with Cloudflare R2** (15 minutes)
1. Create Cloudflare account
2. Create R2 bucket
3. Generate API tokens
4. Add to Vercel environment variables
5. Deploy and test

**Option B: Use Vercel Blob Pro** (5 minutes)
1. Upgrade Vercel plan to Pro
2. Contact support for 5GB file limit
3. Done - no code changes needed

### After Setup

1. **Test Upload**:
   - Log in as teacher/admin
   - Try uploading a large video (> 500MB)
   - Verify it uploads successfully

2. **Monitor Usage**:
   - Check Cloudflare R2 dashboard for storage stats
   - Monitor bandwidth (should be $0!)

3. **Optimize Videos** (Optional):
   - Consider transcoding to 720p for most lessons
   - Use 1080p only for detailed content
   - Reserve 4K for special presentations

---

## 💰 Cost Projections

### Scenario: 500 videos, 2GB average, 10,000 views/month

| Storage Solution | Setup Time | Monthly Cost | Notes |
|------------------|------------|--------------|-------|
| **Cloudflare R2** | 15 min | **$15** | Best value, no bandwidth fees |
| AWS S3 + CloudFront | 30 min | $108 | Industry standard, more complex |
| Vercel Blob Pro | 5 min | $20-100 | Simplest, but may hit limits |

**Recommendation**: Start with **Cloudflare R2** for the best balance of cost, performance, and ease of use.

---

## 🎓 Video Quality Guidelines

For the best student experience:

### Recommended Settings

**Standard Lessons** (most content):
- Resolution: 720p (1280×720)
- Bitrate: 5 Mbps
- File size: ~1.5 GB for 40 minutes
- Quality: Excellent for most displays

**Detailed Content** (charts, code, fine details):
- Resolution: 1080p (1920×1080)
- Bitrate: 8 Mbps
- File size: ~2.4 GB for 40 minutes
- Quality: Crystal clear on all displays

**Special Presentations** (optional):
- Resolution: 4K (3840×2160)
- Bitrate: 20 Mbps
- File size: ~6 GB for 40 minutes
- Quality: Maximum, for large screens

### Video Encoding Tips

Use **H.264** codec with these ffmpeg settings:

```bash
# 720p HD (recommended for most lessons)
ffmpeg -i input.mp4 -c:v libx264 -preset slow -crf 22 -c:a aac -b:a 128k -vf scale=1280:720 output_720p.mp4

# 1080p Full HD (for detailed content)
ffmpeg -i input.mp4 -c:v libx264 -preset slow -crf 20 -c:a aac -b:a 192k -vf scale=1920:1080 output_1080p.mp4
```

---

## ❓ Troubleshooting

### "File size exceeds limit" Error

**If you see 500MB limit:**
- Extended storage not configured yet
- Add Cloudflare R2 or AWS S3 credentials
- Redeploy your app

**If you see 5GB limit:**
- Extended storage is working!
- This is the maximum file size
- Consider optimizing video quality

### Videos Not Uploading

1. **Check environment variables**: `vercel env ls`
2. **Check API logs**: Vercel → Functions → Recent invocations
3. **Verify credentials**: Try uploading to R2/S3 directly
4. **Check file size**: Must be under 5GB

### Slow Upload Speeds

1. **Check internet connection**: Upload requires good upload speed
2. **Compress video first**: Use ffmpeg to reduce file size
3. **Use wired connection**: WiFi can be slower for large uploads

---

## 📞 Support

Need help? Check these resources:

- **Cloudflare R2 Docs**: https://developers.cloudflare.com/r2/
- **AWS S3 Docs**: https://docs.aws.amazon.com/s3/
- **Vercel Support**: support@vercel.com
- **Your project issues**: Create GitHub issue

---

**Ready to get started? Choose Cloudflare R2 for the best value!** 🚀
