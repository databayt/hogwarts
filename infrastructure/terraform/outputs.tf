# Terraform Outputs for Hogwarts File Upload Infrastructure

# S3 Outputs
output "s3_bucket_name" {
  description = "Name of the primary S3 bucket for uploads"
  value       = aws_s3_bucket.uploads.id
}

output "s3_bucket_arn" {
  description = "ARN of the primary S3 bucket"
  value       = aws_s3_bucket.uploads.arn
}

output "s3_bucket_domain_name" {
  description = "Domain name of the S3 bucket"
  value       = aws_s3_bucket.uploads.bucket_domain_name
}

output "s3_replica_bucket_name" {
  description = "Name of the replica S3 bucket"
  value       = aws_s3_bucket.uploads_replica.id
}

# CloudFront Outputs
output "cdn_distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.uploads.id
}

output "cdn_domain_name" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.uploads.domain_name
}

output "cdn_hosted_zone_id" {
  description = "CloudFront distribution hosted zone ID"
  value       = aws_cloudfront_distribution.uploads.hosted_zone_id
}

# Lambda Function Outputs
output "upload_processor_function_arn" {
  description = "ARN of the upload processor Lambda function"
  value       = aws_lambda_function.upload_processor.arn
}

output "upload_processor_function_name" {
  description = "Name of the upload processor Lambda function"
  value       = aws_lambda_function.upload_processor.function_name
}

output "image_optimizer_function_arn" {
  description = "ARN of the image optimizer Lambda function"
  value       = aws_lambda_function.image_optimizer.arn
}

output "image_optimizer_function_name" {
  description = "Name of the image optimizer Lambda function"
  value       = aws_lambda_function.image_optimizer.function_name
}

# DynamoDB Outputs
output "upload_metadata_table_name" {
  description = "Name of the DynamoDB table for upload metadata"
  value       = aws_dynamodb_table.upload_metadata.name
}

output "upload_metadata_table_arn" {
  description = "ARN of the DynamoDB table for upload metadata"
  value       = aws_dynamodb_table.upload_metadata.arn
}

output "upload_chunks_table_name" {
  description = "Name of the DynamoDB table for upload chunks"
  value       = aws_dynamodb_table.upload_chunks.name
}

output "file_access_logs_table_name" {
  description = "Name of the DynamoDB table for file access logs"
  value       = aws_dynamodb_table.file_access_logs.name
}

output "storage_quotas_table_name" {
  description = "Name of the DynamoDB table for storage quotas"
  value       = aws_dynamodb_table.storage_quotas.name
}

# SQS Outputs
output "upload_processing_queue_url" {
  description = "URL of the SQS queue for upload processing"
  value       = aws_sqs_queue.upload_processing.url
}

output "upload_processing_queue_arn" {
  description = "ARN of the SQS queue for upload processing"
  value       = aws_sqs_queue.upload_processing.arn
}

output "upload_dlq_url" {
  description = "URL of the dead letter queue for failed uploads"
  value       = aws_sqs_queue.upload_dlq.url
}

# WAF Outputs
output "waf_web_acl_id" {
  description = "ID of the WAF web ACL"
  value       = aws_wafv2_web_acl.cdn.id
}

output "waf_web_acl_arn" {
  description = "ARN of the WAF web ACL"
  value       = aws_wafv2_web_acl.cdn.arn
}

# KMS Key Outputs
output "s3_kms_key_arn" {
  description = "ARN of the KMS key for S3 encryption"
  value       = aws_kms_key.s3_encryption.arn
}

output "dynamodb_kms_key_arn" {
  description = "ARN of the KMS key for DynamoDB encryption"
  value       = aws_kms_key.dynamodb.arn
}

output "logs_kms_key_arn" {
  description = "ARN of the KMS key for CloudWatch Logs encryption"
  value       = aws_kms_key.logs.arn
}

# ALB Outputs
output "image_processor_alb_dns" {
  description = "DNS name of the image processor ALB"
  value       = aws_lb.image_processor.dns_name
}

output "image_processor_alb_zone_id" {
  description = "Zone ID of the image processor ALB"
  value       = aws_lb.image_processor.zone_id
}

# SNS Topic Outputs
output "alerts_topic_arn" {
  description = "ARN of the SNS topic for alerts"
  value       = aws_sns_topic.alerts.arn
}

# Monitoring Outputs
output "datadog_dashboard_url" {
  description = "URL to the Datadog dashboard"
  value       = "https://app.datadoghq.com/dashboard/${datadog_dashboard.file_upload.id}"
}

# Connection Strings for Application
output "connection_config" {
  description = "Connection configuration for the application"
  value = {
    s3_bucket          = aws_s3_bucket.uploads.id
    s3_region          = var.primary_region
    cdn_domain         = "cdn.databayt.org"
    dynamodb_table     = aws_dynamodb_table.upload_metadata.name
    sqs_queue_url      = aws_sqs_queue.upload_processing.url
    lambda_processor   = aws_lambda_function.upload_processor.function_name
    lambda_optimizer   = aws_lambda_function.image_optimizer.function_name
  }
  sensitive = false
}

# Environment Variables for Application
output "env_vars" {
  description = "Environment variables to set in the application"
  value = {
    AWS_REGION                 = var.primary_region
    S3_BUCKET                  = aws_s3_bucket.uploads.id
    S3_REPLICA_BUCKET          = aws_s3_bucket.uploads_replica.id
    CLOUDFRONT_DISTRIBUTION_ID = aws_cloudfront_distribution.uploads.id
    CLOUDFRONT_DOMAIN          = "cdn.databayt.org"
    DYNAMODB_METADATA_TABLE    = aws_dynamodb_table.upload_metadata.name
    DYNAMODB_CHUNKS_TABLE      = aws_dynamodb_table.upload_chunks.name
    DYNAMODB_ACCESS_TABLE      = aws_dynamodb_table.file_access_logs.name
    DYNAMODB_QUOTAS_TABLE      = aws_dynamodb_table.storage_quotas.name
    SQS_PROCESSING_QUEUE       = aws_sqs_queue.upload_processing.url
    SQS_DLQ_QUEUE             = aws_sqs_queue.upload_dlq.url
    UPLOAD_PROCESSOR_ARN       = aws_lambda_function.upload_processor.arn
    IMAGE_OPTIMIZER_ARN        = aws_lambda_function.image_optimizer.arn
    KMS_KEY_ID                 = aws_kms_key.s3_encryption.id
    WAF_WEB_ACL_ARN           = aws_wafv2_web_acl.cdn.arn
  }
  sensitive = false
}

# Cost Estimation
output "estimated_monthly_cost" {
  description = "Estimated monthly cost breakdown (USD)"
  value = {
    s3_storage     = "~$50-200 (based on usage)"
    cloudfront     = "~$50-150 (based on traffic)"
    lambda         = "~$20-100 (based on invocations)"
    dynamodb       = "~$25-50 (on-demand pricing)"
    waf            = "~$35 (fixed + per million requests)"
    monitoring     = "~$50 (Datadog, CloudWatch)"
    data_transfer  = "~$100-500 (based on bandwidth)"
    total_estimate = "~$330-1085/month"
  }
}

# Deployment Information
output "deployment_info" {
  description = "Deployment information and endpoints"
  value = {
    environment        = var.environment
    region            = var.primary_region
    replica_regions   = local.replication_regions
    deployment_time   = timestamp()
    terraform_version = "1.7.0"

    endpoints = {
      cdn_url           = "https://cdn.databayt.org"
      upload_api        = "https://ed.databayt.org/api/upload"
      health_check      = "https://ed.databayt.org/api/upload/health"
      documentation     = "https://ed.databayt.org/docs/file-upload"
    }

    storage_tiers = {
      hot     = "0-30 days (STANDARD)"
      warm    = "30-90 days (STANDARD_IA)"
      cold    = "90-365 days (GLACIER_IR)"
      archive = "365+ days (DEEP_ARCHIVE)"
    }

    upload_limits = {
      max_file_size     = "${var.upload_limits.max_file_size_mb}MB"
      max_files_batch   = var.upload_limits.max_files_per_upload
      max_storage_school = "${var.upload_limits.max_total_size_gb}GB"
      rate_limit_ip     = "${var.upload_limits.rate_limit_per_ip}/5min"
      rate_limit_school = "${var.upload_limits.rate_limit_per_school}/5min"
    }
  }
}