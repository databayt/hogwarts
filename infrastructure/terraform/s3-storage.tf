# S3 Storage Configuration with Multi-Tenant Isolation
# Implements tiered storage with lifecycle policies

# KMS key for S3 encryption
resource "aws_kms_key" "s3_encryption" {
  description             = "KMS key for Hogwarts S3 bucket encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-s3-kms"
  })
}

resource "aws_kms_alias" "s3_encryption" {
  name          = "alias/${local.name_prefix}-s3"
  target_key_id = aws_kms_key.s3_encryption.key_id
}

# Primary S3 bucket for file uploads
resource "aws_s3_bucket" "uploads" {
  bucket = "${local.name_prefix}-uploads-${data.aws_caller_identity.current.account_id}"

  tags = merge(local.common_tags, {
    Name        = "${local.name_prefix}-uploads"
    Purpose     = "Primary file upload storage"
    Compliance  = "GDPR,FERPA"
  })
}

# Bucket versioning for data protection
resource "aws_s3_bucket_versioning" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Server-side encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.s3_encryption.arn
    }
    bucket_key_enabled = true
  }
}

# Lifecycle policies for storage tiering
resource "aws_s3_bucket_lifecycle_configuration" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  # Hot to Warm transition
  rule {
    id     = "transition-to-warm"
    status = "Enabled"

    transition {
      days          = local.storage_tiers.warm.transition_days
      storage_class = local.storage_tiers.warm.storage_class
    }

    noncurrent_version_transition {
      noncurrent_days = 30
      storage_class   = "STANDARD_IA"
    }
  }

  # Warm to Cold transition
  rule {
    id     = "transition-to-cold"
    status = "Enabled"

    transition {
      days          = local.storage_tiers.cold.transition_days
      storage_class = local.storage_tiers.cold.storage_class
    }
  }

  # Cold to Archive transition
  rule {
    id     = "transition-to-archive"
    status = "Enabled"

    transition {
      days          = local.storage_tiers.archive.transition_days
      storage_class = local.storage_tiers.archive.storage_class
    }

    # Delete old versions after 2 years
    noncurrent_version_expiration {
      noncurrent_days = 730
    }
  }

  # Cleanup incomplete multipart uploads
  rule {
    id     = "cleanup-incomplete-uploads"
    status = "Enabled"

    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }

  # Auto-delete temporary files
  rule {
    id     = "delete-temp-files"
    status = "Enabled"

    filter {
      prefix = "temp/"
    }

    expiration {
      days = 1
    }
  }
}

# CORS configuration
resource "aws_s3_bucket_cors_configuration" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  cors_rule {
    allowed_headers = local.cors_rules.allowed_headers
    allowed_methods = local.cors_rules.allowed_methods
    allowed_origins = local.cors_rules.allowed_origins
    expose_headers  = local.cors_rules.expose_headers
    max_age_seconds = local.cors_rules.max_age_seconds
  }
}

# Intelligent tiering configuration
resource "aws_s3_bucket_intelligent_tiering_configuration" "uploads" {
  bucket = aws_s3_bucket.uploads.id
  name   = "entire-bucket"

  tiering {
    access_tier = "ARCHIVE_ACCESS"
    days        = 90
  }

  tiering {
    access_tier = "DEEP_ARCHIVE_ACCESS"
    days        = 180
  }
}

# Public access block
resource "aws_s3_bucket_public_access_block" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Bucket policy for multi-tenant isolation
resource "aws_s3_bucket_policy" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "EnforceSSLRequestsOnly"
        Effect = "Deny"
        Principal = "*"
        Action = "s3:*"
        Resource = [
          aws_s3_bucket.uploads.arn,
          "${aws_s3_bucket.uploads.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      },
      {
        Sid    = "EnforceSchoolIdPrefix"
        Effect = "Allow"
        Principal = {
          AWS = aws_iam_role.upload_lambda.arn
        }
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = "${aws_s3_bucket.uploads.arn}/$${aws:PrincipalTag/schoolId}/*"
      },
      {
        Sid    = "DenyUnencryptedObjectUploads"
        Effect = "Deny"
        Principal = "*"
        Action = "s3:PutObject"
        Resource = "${aws_s3_bucket.uploads.arn}/*"
        Condition = {
          StringNotEquals = {
            "s3:x-amz-server-side-encryption" = "aws:kms"
          }
        }
      }
    ]
  })
}

# Replication configuration for disaster recovery
resource "aws_s3_bucket_replication_configuration" "uploads" {
  role   = aws_iam_role.s3_replication.arn
  bucket = aws_s3_bucket.uploads.id

  rule {
    id     = "replicate-all"
    status = "Enabled"

    delete_marker_replication {
      status = "Enabled"
    }

    filter {}

    destination {
      bucket = aws_s3_bucket.uploads_replica.arn

      encryption_configuration {
        replica_kms_key_id = aws_kms_key.s3_encryption_replica.arn
      }

      storage_class = "STANDARD_IA"

      replication_time {
        status = "Enabled"
        time {
          minutes = 15
        }
      }

      metrics {
        status = "Enabled"
        event_threshold {
          minutes = 15
        }
      }
    }
  }

  depends_on = [aws_s3_bucket_versioning.uploads]
}

# Replica bucket in secondary region
resource "aws_s3_bucket" "uploads_replica" {
  provider = aws.us_west
  bucket   = "${local.name_prefix}-uploads-replica-${data.aws_caller_identity.current.account_id}"

  tags = merge(local.common_tags, {
    Name    = "${local.name_prefix}-uploads-replica"
    Purpose = "Disaster recovery replica"
    Region  = "us-west-2"
  })
}

# Versioning for replica bucket
resource "aws_s3_bucket_versioning" "uploads_replica" {
  provider = aws.us_west
  bucket   = aws_s3_bucket.uploads_replica.id

  versioning_configuration {
    status = "Enabled"
  }
}

# KMS key for replica bucket
resource "aws_kms_key" "s3_encryption_replica" {
  provider                = aws.us_west
  description             = "KMS key for Hogwarts S3 replica bucket encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = merge(local.common_tags, {
    Name   = "${local.name_prefix}-s3-kms-replica"
    Region = "us-west-2"
  })
}

# S3 bucket for CloudWatch logs
resource "aws_s3_bucket" "logs" {
  bucket = "${local.name_prefix}-logs-${data.aws_caller_identity.current.account_id}"

  tags = merge(local.common_tags, {
    Name    = "${local.name_prefix}-logs"
    Purpose = "S3 access logs"
  })
}

# Logging configuration
resource "aws_s3_bucket_logging" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  target_bucket = aws_s3_bucket.logs.id
  target_prefix = "s3-access-logs/"
}

# S3 Object Lock for compliance
resource "aws_s3_bucket_object_lock_configuration" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  rule {
    default_retention {
      mode = "GOVERNANCE"
      days = 90
    }
  }
}

# EventBridge notifications for file uploads
resource "aws_s3_bucket_notification" "uploads" {
  bucket      = aws_s3_bucket.uploads.id
  eventbridge = true
}

# Data source for current AWS account
data "aws_caller_identity" "current" {}