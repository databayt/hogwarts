# Monitoring and Observability Configuration
# Datadog integration for comprehensive monitoring

# SNS topic for alerts
resource "aws_sns_topic" "alerts" {
  name              = "${local.name_prefix}-alerts"
  kms_master_key_id = aws_kms_key.sns.id

  tags = local.common_tags
}

# SNS topic subscription for critical alerts
resource "aws_sns_topic_subscription" "pagerduty" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "https"
  endpoint  = var.pagerduty_endpoint

  filter_policy = jsonencode({
    severity = ["CRITICAL", "HIGH"]
  })
}

# SNS topic subscription for Slack
resource "aws_sns_topic_subscription" "slack" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "https"
  endpoint  = var.slack_webhook_url
}

# KMS key for SNS encryption
resource "aws_kms_key" "sns" {
  description             = "KMS key for SNS topic encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = local.common_tags
}

# KMS key for CloudWatch logs
resource "aws_kms_key" "logs" {
  description             = "KMS key for CloudWatch logs encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = local.common_tags
}

# KMS key for secrets
resource "aws_kms_key" "secrets" {
  description             = "KMS key for Secrets Manager"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = local.common_tags
}

# Secrets Manager for auth keys
resource "aws_secretsmanager_secret" "auth_keys" {
  name                    = "${local.name_prefix}-auth-keys"
  description            = "Authentication keys for file upload system"
  kms_key_id             = aws_kms_key.secrets.id
  recovery_window_in_days = 7

  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "auth_keys" {
  secret_id = aws_secretsmanager_secret.auth_keys.id
  secret_string = jsonencode({
    jwt_secret     = var.jwt_secret
    api_key        = var.api_key
    webhook_secret = random_password.webhook_secret.result
  })
}

resource "random_password" "webhook_secret" {
  length  = 32
  special = true
}

# Datadog Synthetics for uptime monitoring
resource "datadog_synthetics_test" "upload_api" {
  type    = "api"
  subtype = "http"
  name    = "${local.name_prefix} - Upload API Health"
  message = "Upload API is down! @pagerduty"

  locations = ["aws:us-east-1", "aws:eu-central-1", "aws:ap-southeast-1"]

  request_definition {
    method = "GET"
    url    = "https://ed.databayt.org/api/upload/health"

    timeout = 30
  }

  assertion {
    type     = "statusCode"
    operator = "is"
    target   = "200"
  }

  assertion {
    type     = "responseTime"
    operator = "lessThan"
    target   = "2000"
  }

  options_list {
    tick_every = 300

    retry {
      count    = 2
      interval = 60
    }

    monitor_options {
      renotify_interval = 120
    }
  }

  tags = ["service:file-upload", "env:${var.environment}", "team:platform"]
}

# Datadog monitors
resource "datadog_monitor" "upload_success_rate" {
  name    = "${local.name_prefix} - Upload Success Rate"
  type    = "metric alert"
  message = "Upload success rate is below threshold! Current value: {{value}}% @slack-platform-alerts @pagerduty"

  query = "avg(last_5m):avg:hogwarts.upload.success_rate{env:${var.environment}} < 95"

  monitor_thresholds {
    critical = 95
    warning  = 97
  }

  notify_no_data    = true
  no_data_timeframe = 10
  renotify_interval = 60

  tags = ["service:file-upload", "env:${var.environment}", "team:platform"]
}

resource "datadog_monitor" "upload_latency" {
  name    = "${local.name_prefix} - Upload Latency"
  type    = "metric alert"
  message = "Upload latency is high! P95: {{value}}ms @slack-platform-alerts"

  query = "avg(last_5m):percentile:hogwarts.upload.latency{env:${var.environment}}:95 > 5000"

  monitor_thresholds {
    critical = 5000
    warning  = 3000
  }

  notify_no_data = false

  tags = ["service:file-upload", "env:${var.environment}", "team:platform"]
}

resource "datadog_monitor" "storage_usage" {
  name    = "${local.name_prefix} - Storage Usage per School"
  type    = "metric alert"
  message = "School {{schoolId.name}} storage usage is at {{value}}GB (limit: 100GB) @slack-platform-alerts"

  query = "avg(last_5m):avg:hogwarts.storage.usage{env:${var.environment}} by {schoolId} > 90"

  monitor_thresholds {
    critical = 90
    warning  = 80
  }

  tags = ["service:file-upload", "env:${var.environment}", "team:platform"]
}

resource "datadog_monitor" "malware_detection" {
  name    = "${local.name_prefix} - Malware Detection"
  type    = "event alert"
  message = "Malware detected in uploaded file! School: {{schoolId.name}}, File: {{file.name}} @security @pagerduty"

  query = "events('source:hogwarts tags:malware_detected env:${var.environment}').rollup('count').last('5m') > 0"

  monitor_thresholds {
    critical = 0
  }

  tags = ["service:file-upload", "env:${var.environment}", "team:security"]
}

resource "datadog_monitor" "s3_errors" {
  name    = "${local.name_prefix} - S3 Error Rate"
  type    = "metric alert"
  message = "High S3 error rate detected! {{value}} errors/min @slack-platform-alerts"

  query = "sum(last_5m):sum:aws.s3.4xx_errors{bucketname:${aws_s3_bucket.uploads.id}} + sum:aws.s3.5xx_errors{bucketname:${aws_s3_bucket.uploads.id}} > 10"

  monitor_thresholds {
    critical = 10
    warning  = 5
  }

  tags = ["service:file-upload", "env:${var.environment}", "team:platform"]
}

# Datadog dashboard
resource "datadog_dashboard" "file_upload" {
  title       = "${local.name_prefix} - File Upload System"
  description = "Comprehensive dashboard for file upload monitoring"
  layout_type = "ordered"

  widget {
    group_definition {
      title       = "Upload Metrics"
      layout_type = "ordered"

      widget {
        timeseries_definition {
          title = "Upload Success Rate"

          request {
            q = "avg:hogwarts.upload.success_rate{env:${var.environment}}"

            display_type = "line"

            style {
              palette    = "green"
              line_type  = "solid"
              line_width = "normal"
            }
          }
        }
      }

      widget {
        timeseries_definition {
          title = "Upload Latency (P50, P95, P99)"

          request {
            q = "percentile:hogwarts.upload.latency{env:${var.environment}}:50"
            display_type = "line"
          }

          request {
            q = "percentile:hogwarts.upload.latency{env:${var.environment}}:95"
            display_type = "line"
          }

          request {
            q = "percentile:hogwarts.upload.latency{env:${var.environment}}:99"
            display_type = "line"
          }
        }
      }
    }
  }

  widget {
    group_definition {
      title       = "Storage Metrics"
      layout_type = "ordered"

      widget {
        heatmap_definition {
          title = "Storage Usage by School"

          request {
            q = "avg:hogwarts.storage.usage{env:${var.environment}} by {schoolId}"
          }
        }
      }

      widget {
        toplist_definition {
          title = "Top Schools by Storage"

          request {
            q = "top(sum:hogwarts.storage.usage{env:${var.environment}} by {schoolId}, 10)"
          }
        }
      }
    }
  }

  widget {
    group_definition {
      title       = "Security"
      layout_type = "ordered"

      widget {
        query_value_definition {
          title = "Malware Detections (24h)"

          request {
            q          = "sum:hogwarts.security.malware_detected{env:${var.environment}}.as_count()"
            aggregator = "sum"
          }

          precision = 0
        }
      }

      widget {
        event_stream_definition {
          title = "Security Events"

          query       = "source:hogwarts tags:security env:${var.environment}"
          event_size  = "s"
        }
      }
    }
  }

  widget {
    group_definition {
      title       = "Infrastructure"
      layout_type = "ordered"

      widget {
        timeseries_definition {
          title = "Lambda Invocations"

          request {
            q = "sum:aws.lambda.invocations{functionname:${aws_lambda_function.upload_processor.function_name}}"
            display_type = "bars"
          }
        }
      }

      widget {
        timeseries_definition {
          title = "S3 Request Metrics"

          request {
            q = "sum:aws.s3.all_requests{bucketname:${aws_s3_bucket.uploads.id}}"
            display_type = "line"
          }
        }
      }

      widget {
        timeseries_definition {
          title = "CloudFront Cache Hit Rate"

          request {
            q = "avg:aws.cloudfront.cache_hit_rate{distributionid:${aws_cloudfront_distribution.uploads.id}}"
            display_type = "line"
          }
        }
      }
    }
  }
}

# Datadog logs pipeline
resource "datadog_logs_pipeline" "file_upload" {
  name       = "${local.name_prefix}-file-upload"
  is_enabled = true

  filter {
    query = "service:file-upload env:${var.environment}"
  }

  processor {
    grok_parser {
      name    = "Parse upload logs"
      is_enabled = true
      source  = "message"

      grok {
        support_rules = ""
        match_rules   = "upload_rule %%{data::keyvalue}"
      }
    }
  }

  processor {
    attribute_remapper {
      name           = "Map schoolId"
      is_enabled     = true
      sources        = ["school_id", "schoolId", "tenant_id"]
      target         = "schoolId"
      target_type    = "tag"
      preserve_source = false
      override_on_conflict = true
    }
  }
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "upload_processor" {
  name              = "/aws/lambda/${aws_lambda_function.upload_processor.function_name}"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.logs.arn

  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "image_optimizer" {
  name              = "/aws/lambda/${aws_lambda_function.image_optimizer.function_name}"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.logs.arn

  tags = local.common_tags
}

# CloudWatch Log Metric Filters
resource "aws_cloudwatch_log_metric_filter" "upload_errors" {
  name           = "${local.name_prefix}-upload-errors"
  log_group_name = aws_cloudwatch_log_group.upload_processor.name
  pattern        = "[ERROR]"

  metric_transformation {
    name      = "UploadErrors"
    namespace = "Hogwarts/FileUpload"
    value     = "1"

    dimensions = {
      Environment = var.environment
      Service     = "FileUpload"
    }
  }
}

# X-Ray tracing configuration
resource "aws_xray_sampling_rule" "file_upload" {
  rule_name      = "${local.name_prefix}-file-upload"
  priority       = 1000
  version        = 1
  reservoir_size = 1
  fixed_rate     = 0.1
  url_path       = "/api/upload/*"
  host           = "*"
  http_method    = "*"
  service_type   = "*"
  service_name   = "*"
  resource_arn   = "*"

  attributes = {
    Environment = var.environment
  }
}

# Application Load Balancer for image processing
resource "aws_lb" "image_processor" {
  name               = "${local.name_prefix}-img-proc"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets           = data.aws_subnets.public.ids

  enable_deletion_protection = var.environment == "production"
  enable_http2              = true
  enable_cross_zone_load_balancing = true

  access_logs {
    bucket  = aws_s3_bucket.alb_logs.bucket
    enabled = true
    prefix  = "image-processor"
  }

  tags = local.common_tags
}

# S3 bucket for ALB logs
resource "aws_s3_bucket" "alb_logs" {
  bucket = "${local.name_prefix}-alb-logs-${data.aws_caller_identity.current.account_id}"

  tags = merge(local.common_tags, {
    Name    = "${local.name_prefix}-alb-logs"
    Purpose = "ALB access logs"
  })
}

# Data source for subnets
data "aws_subnets" "public" {
  filter {
    name   = "tag:Type"
    values = ["public"]
  }
}

# Security group for ALB
resource "aws_security_group" "alb" {
  name        = "${local.name_prefix}-alb-sg"
  description = "Security group for image processor ALB"
  vpc_id      = data.aws_vpc.main.id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = local.common_tags
}

# Data source for VPC
data "aws_vpc" "main" {
  default = true
}