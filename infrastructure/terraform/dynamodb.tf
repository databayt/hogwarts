# DynamoDB Tables for File Metadata and Upload Tracking

# DynamoDB table for file metadata
resource "aws_dynamodb_table" "upload_metadata" {
  name           = "${local.name_prefix}-upload-metadata"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "fileId"
  range_key      = "schoolId"

  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  # Enable point-in-time recovery
  point_in_time_recovery {
    enabled = var.database_config.enable_point_in_time_recovery
  }

  # Enable deletion protection for production
  deletion_protection_enabled = var.environment == "production" ? true : var.database_config.enable_deletion_protection

  # File ID attribute
  attribute {
    name = "fileId"
    type = "S"
  }

  # School ID attribute for multi-tenancy
  attribute {
    name = "schoolId"
    type = "S"
  }

  # User ID attribute
  attribute {
    name = "userId"
    type = "S"
  }

  # Upload timestamp
  attribute {
    name = "uploadedAt"
    type = "N"
  }

  # File status
  attribute {
    name = "status"
    type = "S"
  }

  # File category
  attribute {
    name = "category"
    type = "S"
  }

  # Storage tier
  attribute {
    name = "storageTier"
    type = "S"
  }

  # Last accessed timestamp
  attribute {
    name = "lastAccessedAt"
    type = "N"
  }

  # Global secondary index for querying by school
  global_secondary_index {
    name            = "SchoolIdIndex"
    hash_key        = "schoolId"
    range_key       = "uploadedAt"
    projection_type = "ALL"
  }

  # Global secondary index for querying by user
  global_secondary_index {
    name            = "UserIdIndex"
    hash_key        = "userId"
    range_key       = "uploadedAt"
    projection_type = "ALL"
  }

  # Global secondary index for status queries
  global_secondary_index {
    name            = "StatusIndex"
    hash_key        = "status"
    range_key       = "uploadedAt"
    projection_type = "ALL"
  }

  # Global secondary index for category queries
  global_secondary_index {
    name            = "CategoryIndex"
    hash_key        = "category"
    range_key       = "uploadedAt"
    projection_type = "INCLUDE"
    non_key_attributes = ["fileId", "schoolId", "fileName", "fileSize", "mimeType"]
  }

  # Global secondary index for storage tier management
  global_secondary_index {
    name            = "StorageTierIndex"
    hash_key        = "storageTier"
    range_key       = "lastAccessedAt"
    projection_type = "INCLUDE"
    non_key_attributes = ["fileId", "schoolId", "fileSize"]
  }

  # Time to live for temporary files
  ttl {
    enabled        = true
    attribute_name = "expirationTime"
  }

  # Server-side encryption
  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.dynamodb.arn
  }

  tags = merge(local.common_tags, {
    Name    = "${local.name_prefix}-upload-metadata"
    Purpose = "File metadata storage"
  })
}

# DynamoDB table for upload chunks (for resumable uploads)
resource "aws_dynamodb_table" "upload_chunks" {
  name           = "${local.name_prefix}-upload-chunks"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "uploadId"
  range_key      = "chunkNumber"

  # Upload ID attribute
  attribute {
    name = "uploadId"
    type = "S"
  }

  # Chunk number attribute
  attribute {
    name = "chunkNumber"
    type = "N"
  }

  # School ID for multi-tenancy
  attribute {
    name = "schoolId"
    type = "S"
  }

  # Global secondary index for school queries
  global_secondary_index {
    name            = "SchoolChunksIndex"
    hash_key        = "schoolId"
    projection_type = "ALL"
  }

  # TTL for cleanup of incomplete uploads
  ttl {
    enabled        = true
    attribute_name = "expirationTime"
  }

  # Server-side encryption
  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.dynamodb.arn
  }

  tags = merge(local.common_tags, {
    Name    = "${local.name_prefix}-upload-chunks"
    Purpose = "Chunked upload tracking"
  })
}

# DynamoDB table for access logs and analytics
resource "aws_dynamodb_table" "file_access_logs" {
  name           = "${local.name_prefix}-file-access-logs"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "logId"
  range_key      = "timestamp"

  # Log ID attribute
  attribute {
    name = "logId"
    type = "S"
  }

  # Timestamp attribute
  attribute {
    name = "timestamp"
    type = "N"
  }

  # School ID attribute
  attribute {
    name = "schoolId"
    type = "S"
  }

  # File ID attribute
  attribute {
    name = "fileId"
    type = "S"
  }

  # User ID attribute
  attribute {
    name = "userId"
    type = "S"
  }

  # Action type attribute
  attribute {
    name = "actionType"
    type = "S"
  }

  # Global secondary index for school analytics
  global_secondary_index {
    name            = "SchoolAccessIndex"
    hash_key        = "schoolId"
    range_key       = "timestamp"
    projection_type = "ALL"
  }

  # Global secondary index for file access patterns
  global_secondary_index {
    name            = "FileAccessIndex"
    hash_key        = "fileId"
    range_key       = "timestamp"
    projection_type = "INCLUDE"
    non_key_attributes = ["userId", "actionType", "ipAddress"]
  }

  # Global secondary index for user activity
  global_secondary_index {
    name            = "UserActivityIndex"
    hash_key        = "userId"
    range_key       = "timestamp"
    projection_type = "ALL"
  }

  # Global secondary index for action type analysis
  global_secondary_index {
    name            = "ActionTypeIndex"
    hash_key        = "actionType"
    range_key       = "timestamp"
    projection_type = "INCLUDE"
    non_key_attributes = ["schoolId", "fileId", "userId"]
  }

  # TTL for log retention (90 days)
  ttl {
    enabled        = true
    attribute_name = "expirationTime"
  }

  # Server-side encryption
  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.dynamodb.arn
  }

  tags = merge(local.common_tags, {
    Name    = "${local.name_prefix}-file-access-logs"
    Purpose = "File access analytics"
  })
}

# DynamoDB table for school storage quotas and usage
resource "aws_dynamodb_table" "storage_quotas" {
  name           = "${local.name_prefix}-storage-quotas"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "schoolId"

  # School ID attribute
  attribute {
    name = "schoolId"
    type = "S"
  }

  # Subscription tier attribute
  attribute {
    name = "subscriptionTier"
    type = "S"
  }

  # Global secondary index for tier management
  global_secondary_index {
    name            = "SubscriptionTierIndex"
    hash_key        = "subscriptionTier"
    projection_type = "ALL"
  }

  # Server-side encryption
  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.dynamodb.arn
  }

  tags = merge(local.common_tags, {
    Name    = "${local.name_prefix}-storage-quotas"
    Purpose = "School storage quota management"
  })
}

# KMS key for DynamoDB encryption
resource "aws_kms_key" "dynamodb" {
  description             = "KMS key for DynamoDB table encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-dynamodb-kms"
  })
}

resource "aws_kms_alias" "dynamodb" {
  name          = "alias/${local.name_prefix}-dynamodb"
  target_key_id = aws_kms_key.dynamodb.key_id
}

# DynamoDB auto-scaling for production
resource "aws_appautoscaling_target" "dynamodb_table_read_target" {
  count              = var.database_config.enable_auto_scaling ? 1 : 0
  max_capacity       = 100
  min_capacity       = 5
  resource_id        = "table/${aws_dynamodb_table.upload_metadata.name}"
  scalable_dimension = "dynamodb:table:ReadCapacityUnits"
  service_namespace  = "dynamodb"
}

resource "aws_appautoscaling_policy" "dynamodb_table_read_policy" {
  count              = var.database_config.enable_auto_scaling ? 1 : 0
  name               = "DynamoDBReadCapacityUtilization:${aws_appautoscaling_target.dynamodb_table_read_target[0].resource_id}"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.dynamodb_table_read_target[0].resource_id
  scalable_dimension = aws_appautoscaling_target.dynamodb_table_read_target[0].scalable_dimension
  service_namespace  = aws_appautoscaling_target.dynamodb_table_read_target[0].service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "DynamoDBReadCapacityUtilization"
    }
    target_value = 70
  }
}

resource "aws_appautoscaling_target" "dynamodb_table_write_target" {
  count              = var.database_config.enable_auto_scaling ? 1 : 0
  max_capacity       = 100
  min_capacity       = 5
  resource_id        = "table/${aws_dynamodb_table.upload_metadata.name}"
  scalable_dimension = "dynamodb:table:WriteCapacityUnits"
  service_namespace  = "dynamodb"
}

resource "aws_appautoscaling_policy" "dynamodb_table_write_policy" {
  count              = var.database_config.enable_auto_scaling ? 1 : 0
  name               = "DynamoDBWriteCapacityUtilization:${aws_appautoscaling_target.dynamodb_table_write_target[0].resource_id}"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.dynamodb_table_write_target[0].resource_id
  scalable_dimension = aws_appautoscaling_target.dynamodb_table_write_target[0].scalable_dimension
  service_namespace  = aws_appautoscaling_target.dynamodb_table_write_target[0].service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "DynamoDBWriteCapacityUtilization"
    }
    target_value = 70
  }
}

# CloudWatch alarms for DynamoDB
resource "aws_cloudwatch_metric_alarm" "dynamodb_throttles" {
  alarm_name          = "${local.name_prefix}-dynamodb-throttles"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "ThrottledRequests"
  namespace           = "AWS/DynamoDB"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "This metric monitors DynamoDB throttles"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    TableName = aws_dynamodb_table.upload_metadata.name
  }
}

resource "aws_cloudwatch_metric_alarm" "dynamodb_errors" {
  alarm_name          = "${local.name_prefix}-dynamodb-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "SystemErrors"
  namespace           = "AWS/DynamoDB"
  period              = "300"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "This metric monitors DynamoDB system errors"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    TableName = aws_dynamodb_table.upload_metadata.name
  }
}