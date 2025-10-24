# AWS WAF Configuration for CloudFront
# Protects against common web exploits and DDoS attacks

# IP set for rate limiting per school
resource "aws_wafv2_ip_set" "rate_limit_whitelist" {
  name               = "${local.name_prefix}-rate-limit-whitelist"
  description        = "IP addresses exempt from rate limiting"
  scope              = "CLOUDFRONT"
  ip_address_version = "IPV4"
  addresses          = var.whitelisted_ips

  tags = local.common_tags
}

# Regex pattern set for malicious patterns
resource "aws_wafv2_regex_pattern_set" "malicious_patterns" {
  name        = "${local.name_prefix}-malicious-patterns"
  description = "Patterns for detecting malicious requests"
  scope       = "CLOUDFRONT"

  regular_expression {
    regex_string = "(?i)(union.*select|select.*from|insert.*into|delete.*from|drop.*table|script.*src|onclick|onerror|onload)"
  }

  regular_expression {
    regex_string = "(?i)(eval\\(|javascript:|vbscript:|onmouseover|onerror|onload|alert\\(|prompt\\(|confirm\\()"
  }

  regular_expression {
    regex_string = "(?i)(<script|<iframe|<object|<embed|<form|javascript:|vbscript:)"
  }

  tags = local.common_tags
}

# Web ACL for CloudFront distribution
resource "aws_wafv2_web_acl" "cdn" {
  name        = "${local.name_prefix}-cdn-waf"
  description = "WAF for Hogwarts CDN with file upload protection"
  scope       = "CLOUDFRONT"

  default_action {
    allow {}
  }

  # Rule 1: Rate limiting per IP
  rule {
    name     = "RateLimitRule"
    priority = 1

    override_action {
      none {}
    }

    statement {
      rate_based_statement {
        limit              = 2000
        aggregate_key_type = "IP"

        scope_down_statement {
          not_statement {
            statement {
              ip_set_reference_statement {
                arn = aws_wafv2_ip_set.rate_limit_whitelist.arn
              }
            }
          }
        }
      }
    }

    action {
      block {
        custom_response {
          response_code = 429
          custom_response_body_key = "rate_limit_error"
        }
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "RateLimitRule"
      sampled_requests_enabled   = true
    }
  }

  # Rule 2: AWS Managed Core Rule Set
  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 2

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"

        rule_action_override {
          name = "SizeRestrictions_BODY"
          action_to_use {
            count {}
          }
        }

        rule_action_override {
          name = "GenericRFI_BODY"
          action_to_use {
            count {}
          }
        }
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSManagedRulesCommonRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }

  # Rule 3: AWS Managed Known Bad Inputs Rule Set
  rule {
    name     = "AWSManagedRulesKnownBadInputsRuleSet"
    priority = 3

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSManagedRulesKnownBadInputsRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }

  # Rule 4: SQL Injection Protection
  rule {
    name     = "SQLiProtection"
    priority = 4

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesSQLiRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "SQLiProtectionMetric"
      sampled_requests_enabled   = true
    }
  }

  # Rule 5: File Upload Size Limit
  rule {
    name     = "FileSizeLimit"
    priority = 5

    action {
      block {
        custom_response {
          response_code = 413
          custom_response_body_key = "size_limit_error"
        }
      }
    }

    statement {
      size_constraint_statement {
        field_to_match {
          body {
            oversize_handling = "MATCH"
          }
        }

        text_transformation {
          priority = 0
          type     = "NONE"
        }

        comparison_operator = "GT"
        size                = 5368709120 # 5GB in bytes
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "FileSizeLimitMetric"
      sampled_requests_enabled   = true
    }
  }

  # Rule 6: Geo-blocking for specific endpoints
  rule {
    name     = "GeoBlockingRule"
    priority = 6

    action {
      block {
        custom_response {
          response_code = 403
          custom_response_body_key = "geo_block_error"
        }
      }
    }

    statement {
      and_statement {
        statement {
          byte_match_statement {
            search_string = "/admin/"
            field_to_match {
              uri_path {}
            }
            text_transformation {
              priority = 0
              type     = "LOWERCASE"
            }
            positional_constraint = "CONTAINS"
          }
        }

        statement {
          not_statement {
            statement {
              geo_match_statement {
                country_codes = var.allowed_countries
              }
            }
          }
        }
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "GeoBlockingMetric"
      sampled_requests_enabled   = true
    }
  }

  # Rule 7: Custom malicious pattern detection
  rule {
    name     = "MaliciousPatternDetection"
    priority = 7

    action {
      block {
        custom_response {
          response_code = 403
          custom_response_body_key = "malicious_pattern_error"
        }
      }
    }

    statement {
      regex_pattern_set_reference_statement {
        arn = aws_wafv2_regex_pattern_set.malicious_patterns.arn

        field_to_match {
          all_query_arguments {}
        }

        text_transformation {
          priority = 0
          type     = "URL_DECODE"
        }

        text_transformation {
          priority = 1
          type     = "HTML_ENTITY_DECODE"
        }
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "MaliciousPatternMetric"
      sampled_requests_enabled   = true
    }
  }

  # Rule 8: School-specific rate limiting
  rule {
    name     = "SchoolRateLimit"
    priority = 8

    action {
      block {
        custom_response {
          response_code = 429
          custom_response_body_key = "school_rate_limit_error"
        }
      }
    }

    statement {
      rate_based_statement {
        limit              = 10000
        aggregate_key_type = "CUSTOM_KEYS"

        custom_keys {
          header {
            name = "X-School-Id"
            text_transformation {
              priority = 0
              type     = "NONE"
            }
          }
        }
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "SchoolRateLimitMetric"
      sampled_requests_enabled   = true
    }
  }

  # Rule 9: Prevent directory traversal
  rule {
    name     = "DirectoryTraversalPrevention"
    priority = 9

    action {
      block {
        custom_response {
          response_code = 403
          custom_response_body_key = "directory_traversal_error"
        }
      }
    }

    statement {
      byte_match_statement {
        search_string = "../"
        field_to_match {
          uri_path {}
        }
        text_transformation {
          priority = 0
          type     = "URL_DECODE"
        }
        positional_constraint = "CONTAINS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "DirectoryTraversalMetric"
      sampled_requests_enabled   = true
    }
  }

  # Custom response bodies
  custom_response_body {
    key          = "rate_limit_error"
    content      = jsonencode({ error = "Rate limit exceeded. Please try again later." })
    content_type = "APPLICATION_JSON"
  }

  custom_response_body {
    key          = "size_limit_error"
    content      = jsonencode({ error = "File size exceeds maximum limit of 5GB." })
    content_type = "APPLICATION_JSON"
  }

  custom_response_body {
    key          = "geo_block_error"
    content      = jsonencode({ error = "Access denied from your location." })
    content_type = "APPLICATION_JSON"
  }

  custom_response_body {
    key          = "malicious_pattern_error"
    content      = jsonencode({ error = "Malicious pattern detected in request." })
    content_type = "APPLICATION_JSON"
  }

  custom_response_body {
    key          = "school_rate_limit_error"
    content      = jsonencode({ error = "School rate limit exceeded." })
    content_type = "APPLICATION_JSON"
  }

  custom_response_body {
    key          = "directory_traversal_error"
    content      = jsonencode({ error = "Invalid file path." })
    content_type = "APPLICATION_JSON"
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "CDNWebACL"
    sampled_requests_enabled   = true
  }

  tags = local.common_tags
}

# CloudWatch dashboard for WAF metrics
resource "aws_cloudwatch_dashboard" "waf" {
  dashboard_name = "${local.name_prefix}-waf-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/WAFV2", "AllowedRequests", { stat = "Sum" }],
            [".", "BlockedRequests", { stat = "Sum" }],
            [".", "CountedRequests", { stat = "Sum" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = "us-east-1"
          title   = "WAF Request Metrics"
          period  = 300
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/WAFV2", "RateLimitRule", { stat = "Sum" }],
            [".", "SQLiProtectionMetric", { stat = "Sum" }],
            [".", "MaliciousPatternMetric", { stat = "Sum" }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = "us-east-1"
          title   = "Security Rule Triggers"
          period  = 300
        }
      }
    ]
  })
}

# CloudWatch alarms for WAF
resource "aws_cloudwatch_metric_alarm" "waf_blocked_requests" {
  alarm_name          = "${local.name_prefix}-waf-blocked-requests"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "BlockedRequests"
  namespace           = "AWS/WAFV2"
  period              = "300"
  statistic           = "Sum"
  threshold           = "1000"
  alarm_description   = "Alert when too many requests are blocked"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    WebACL = aws_wafv2_web_acl.cdn.name
    Region = "us-east-1"
    Rule   = "ALL"
  }
}

resource "aws_cloudwatch_metric_alarm" "waf_rate_limit" {
  alarm_name          = "${local.name_prefix}-waf-rate-limit-triggered"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "BlockedRequests"
  namespace           = "AWS/WAFV2"
  period              = "60"
  statistic           = "Sum"
  threshold           = "100"
  alarm_description   = "Alert when rate limiting is triggered heavily"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    WebACL = aws_wafv2_web_acl.cdn.name
    Region = "us-east-1"
    Rule   = "RateLimitRule"
  }
}

# WAF logging configuration
resource "aws_cloudwatch_log_group" "waf" {
  name              = "/aws/wafv2/${local.name_prefix}"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.logs.arn

  tags = local.common_tags
}

resource "aws_wafv2_web_acl_logging_configuration" "cdn" {
  resource_arn            = aws_wafv2_web_acl.cdn.arn
  log_destination_configs = [aws_cloudwatch_log_group.waf.arn]

  redacted_fields {
    single_header {
      name = "authorization"
    }
  }

  redacted_fields {
    single_header {
      name = "cookie"
    }
  }

  redacted_fields {
    single_header {
      name = "x-api-key"
    }
  }
}