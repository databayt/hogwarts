# Lambda@Edge Functions for CloudFront
# Handles authentication, tenant isolation, and image optimization

# IAM role for Lambda@Edge execution
resource "aws_iam_role" "lambda_edge" {
  name = "${local.name_prefix}-lambda-edge"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = [
            "lambda.amazonaws.com",
            "edgelambda.amazonaws.com"
          ]
        }
      }
    ]
  })

  tags = local.common_tags
}

# IAM policy for Lambda@Edge
resource "aws_iam_role_policy" "lambda_edge" {
  name = "${local.name_prefix}-lambda-edge-policy"
  role = aws_iam_role.lambda_edge.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = aws_secretsmanager_secret.auth_keys.arn
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt"
        ]
        Resource = aws_kms_key.secrets.arn
      }
    ]
  })
}

# Lambda@Edge function for authentication
resource "aws_lambda_function" "edge_auth" {
  filename         = data.archive_file.edge_auth.output_path
  function_name    = "${local.name_prefix}-edge-auth"
  role            = aws_iam_role.lambda_edge.arn
  handler         = "index.handler"
  source_code_hash = data.archive_file.edge_auth.output_base64sha256
  runtime         = "nodejs20.x"
  timeout         = 5
  memory_size     = 128
  publish         = true

  environment {
    variables = {
      JWT_SECRET = aws_secretsmanager_secret_version.auth_keys.secret_string
    }
  }

  tags = local.common_tags
}

# Lambda@Edge function for tenant isolation
resource "aws_lambda_function" "edge_tenant_isolation" {
  filename         = data.archive_file.edge_tenant.output_path
  function_name    = "${local.name_prefix}-edge-tenant"
  role            = aws_iam_role.lambda_edge.arn
  handler         = "index.handler"
  source_code_hash = data.archive_file.edge_tenant.output_base64sha256
  runtime         = "nodejs20.x"
  timeout         = 5
  memory_size     = 128
  publish         = true

  tags = local.common_tags
}

# Lambda@Edge function for security headers
resource "aws_lambda_function" "edge_headers" {
  filename         = data.archive_file.edge_headers.output_path
  function_name    = "${local.name_prefix}-edge-headers"
  role            = aws_iam_role.lambda_edge.arn
  handler         = "index.handler"
  source_code_hash = data.archive_file.edge_headers.output_base64sha256
  runtime         = "nodejs20.x"
  timeout         = 5
  memory_size     = 128
  publish         = true

  tags = local.common_tags
}

# Archive file for edge auth function
data "archive_file" "edge_auth" {
  type        = "zip"
  output_path = "${path.module}/lambda/edge-auth.zip"

  source {
    content  = file("${path.module}/lambda/edge-auth/index.js")
    filename = "index.js"
  }
}

# Archive file for edge tenant function
data "archive_file" "edge_tenant" {
  type        = "zip"
  output_path = "${path.module}/lambda/edge-tenant.zip"

  source {
    content  = file("${path.module}/lambda/edge-tenant/index.js")
    filename = "index.js"
  }
}

# Archive file for edge headers function
data "archive_file" "edge_headers" {
  type        = "zip"
  output_path = "${path.module}/lambda/edge-headers.zip"

  source {
    content  = file("${path.module}/lambda/edge-headers/index.js")
    filename = "index.js"
  }
}

# IAM role for upload processing Lambda
resource "aws_iam_role" "upload_lambda" {
  name = "${local.name_prefix}-upload-lambda"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = local.common_tags
}

# IAM policy for upload processing Lambda
resource "aws_iam_role_policy" "upload_lambda" {
  name = "${local.name_prefix}-upload-lambda-policy"
  role = aws_iam_role.upload_lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.uploads.arn,
          "${aws_s3_bucket.uploads.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "rekognition:DetectModerationLabels",
          "rekognition:DetectText"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "textract:AnalyzeDocument",
          "textract:DetectDocumentText"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "comprehend:DetectPiiEntities",
          "comprehend:DetectSentiment"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage",
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage"
        ]
        Resource = aws_sqs_queue.upload_processing.arn
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query"
        ]
        Resource = [
          aws_dynamodb_table.upload_metadata.arn,
          "${aws_dynamodb_table.upload_metadata.arn}/index/*"
        ]
      }
    ]
  })
}

# Lambda function for file upload processing
resource "aws_lambda_function" "upload_processor" {
  filename         = data.archive_file.upload_processor.output_path
  function_name    = "${local.name_prefix}-upload-processor"
  role            = aws_iam_role.upload_lambda.arn
  handler         = "index.handler"
  source_code_hash = data.archive_file.upload_processor.output_base64sha256
  runtime         = "nodejs20.x"
  timeout         = 300
  memory_size     = 3008
  reserved_concurrent_executions = 100

  environment {
    variables = {
      S3_BUCKET         = aws_s3_bucket.uploads.id
      DYNAMODB_TABLE    = aws_dynamodb_table.upload_metadata.name
      SQS_QUEUE_URL     = aws_sqs_queue.upload_processing.url
      VIRUS_SCAN_API    = var.virus_scan_api_endpoint
      MAX_FILE_SIZE     = "5368709120" # 5GB
      ALLOWED_MIME_TYPES = jsonencode([
        "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
        "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "text/plain", "text/csv", "application/json", "application/xml",
        "video/mp4", "video/quicktime", "video/x-msvideo",
        "audio/mpeg", "audio/wav", "audio/ogg"
      ])
    }
  }

  dead_letter_config {
    target_arn = aws_sqs_queue.upload_dlq.arn
  }

  tracing_config {
    mode = "Active"
  }

  tags = local.common_tags
}

# Archive file for upload processor
data "archive_file" "upload_processor" {
  type        = "zip"
  output_path = "${path.module}/lambda/upload-processor.zip"

  source {
    content  = file("${path.module}/lambda/upload-processor/index.js")
    filename = "index.js"
  }
}

# Lambda function for image optimization
resource "aws_lambda_function" "image_optimizer" {
  filename         = data.archive_file.image_optimizer.output_path
  function_name    = "${local.name_prefix}-image-optimizer"
  role            = aws_iam_role.upload_lambda.arn
  handler         = "index.handler"
  source_code_hash = data.archive_file.image_optimizer.output_base64sha256
  runtime         = "nodejs20.x"
  timeout         = 60
  memory_size     = 1536
  reserved_concurrent_executions = 50

  layers = [
    "arn:aws:lambda:${var.primary_region}:175033217214:layer:sharp:1"
  ]

  environment {
    variables = {
      S3_BUCKET = aws_s3_bucket.uploads.id
      IMAGE_SIZES = jsonencode({
        thumbnail = { width = 150, height = 150 }
        small     = { width = 320, height = 240 }
        medium    = { width = 640, height = 480 }
        large     = { width = 1024, height = 768 }
        xlarge    = { width = 1920, height = 1080 }
      })
      OUTPUT_FORMATS = jsonencode(["webp", "avif", "jpeg"])
      QUALITY_SETTINGS = jsonencode({
        webp = 85
        avif = 80
        jpeg = 90
      })
    }
  }

  tags = local.common_tags
}

# Archive file for image optimizer
data "archive_file" "image_optimizer" {
  type        = "zip"
  output_path = "${path.module}/lambda/image-optimizer.zip"

  source {
    content  = file("${path.module}/lambda/image-optimizer/index.js")
    filename = "index.js"
  }
}

# EventBridge rule for S3 upload events
resource "aws_cloudwatch_event_rule" "upload_events" {
  name        = "${local.name_prefix}-upload-events"
  description = "Capture S3 upload events for processing"

  event_pattern = jsonencode({
    source      = ["aws.s3"]
    detail-type = ["Object Created"]
    detail = {
      bucket = {
        name = [aws_s3_bucket.uploads.id]
      }
    }
  })

  tags = local.common_tags
}

# EventBridge target for upload processor
resource "aws_cloudwatch_event_target" "upload_processor" {
  rule      = aws_cloudwatch_event_rule.upload_events.name
  target_id = "UploadProcessor"
  arn       = aws_lambda_function.upload_processor.arn
}

# Permission for EventBridge to invoke Lambda
resource "aws_lambda_permission" "upload_processor" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.upload_processor.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.upload_events.arn
}

# SQS queue for upload processing
resource "aws_sqs_queue" "upload_processing" {
  name                       = "${local.name_prefix}-upload-processing"
  delay_seconds              = 0
  max_message_size           = 262144
  message_retention_seconds  = 1209600 # 14 days
  receive_wait_time_seconds  = 10
  visibility_timeout_seconds = 330 # Lambda timeout + 30s

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.upload_dlq.arn
    maxReceiveCount     = 3
  })

  tags = local.common_tags
}

# Dead letter queue for failed uploads
resource "aws_sqs_queue" "upload_dlq" {
  name                      = "${local.name_prefix}-upload-dlq"
  message_retention_seconds = 1209600 # 14 days

  tags = local.common_tags
}

# CloudWatch alarm for DLQ
resource "aws_cloudwatch_metric_alarm" "upload_dlq" {
  alarm_name          = "${local.name_prefix}-upload-dlq-messages"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = "300"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "This metric monitors upload DLQ"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    QueueName = aws_sqs_queue.upload_dlq.name
  }
}