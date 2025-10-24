# CloudFront CDN Configuration
# Global content delivery with edge optimization

# Origin Access Identity for S3
resource "aws_cloudfront_origin_access_identity" "uploads" {
  comment = "OAI for ${local.name_prefix} S3 uploads bucket"
}

# ACM Certificate for CDN (must be in us-east-1)
resource "aws_acm_certificate" "cdn" {
  domain_name               = "cdn.databayt.org"
  subject_alternative_names = ["*.cdn.databayt.org"]
  validation_method         = "DNS"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-cdn-cert"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# CloudFront distribution
resource "aws_cloudfront_distribution" "uploads" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "Hogwarts File Upload CDN"
  default_root_object = "index.html"
  price_class         = var.environment == "production" ? "PriceClass_All" : "PriceClass_100"
  aliases             = ["cdn.databayt.org", "*.cdn.databayt.org"]

  # S3 Origin
  origin {
    domain_name = aws_s3_bucket.uploads.bucket_regional_domain_name
    origin_id   = "S3-${aws_s3_bucket.uploads.id}"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.uploads.cloudfront_access_identity_path
    }

    origin_shield {
      enabled              = true
      origin_shield_region = var.primary_region
    }
  }

  # Custom origin for dynamic image processing
  origin {
    domain_name = aws_lb.image_processor.dns_name
    origin_id   = "ImageProcessor"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2", "TLSv1.3"]
    }

    custom_header {
      name  = "X-Origin-Secret"
      value = random_password.origin_secret.result
    }
  }

  # Default cache behavior for S3 content
  default_cache_behavior {
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    target_origin_id = "S3-${aws_s3_bucket.uploads.id}"

    forwarded_values {
      query_string = true
      headers      = ["Origin", "Access-Control-Request-Method", "Access-Control-Request-Headers"]

      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 86400    # 1 day
    max_ttl                = 31536000 # 1 year
    compress               = true

    # Lambda@Edge functions
    lambda_function_association {
      event_type   = "viewer-request"
      lambda_arn   = aws_lambda_function.edge_auth.qualified_arn
      include_body = false
    }

    lambda_function_association {
      event_type   = "origin-response"
      lambda_arn   = aws_lambda_function.edge_headers.qualified_arn
      include_body = false
    }
  }

  # Cache behavior for image processing
  ordered_cache_behavior {
    path_pattern     = "/images/process/*"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    target_origin_id = "ImageProcessor"

    forwarded_values {
      query_string = true
      headers      = ["CloudFront-Viewer-Country", "Accept"]

      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 86400
    max_ttl                = 31536000
    compress               = true

    # Response headers policy for image optimization
    response_headers_policy_id = aws_cloudfront_response_headers_policy.images.id
  }

  # Cache behavior for documents (PDFs, docs, etc.)
  ordered_cache_behavior {
    path_pattern     = "/documents/*"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.uploads.id}"

    forwarded_values {
      query_string = false
      headers      = ["Origin", "Access-Control-Request-Method"]

      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 604800   # 7 days
    max_ttl                = 31536000 # 1 year
    compress               = true

    # Add security headers
    response_headers_policy_id = aws_cloudfront_response_headers_policy.security.id
  }

  # Cache behavior for user uploads
  ordered_cache_behavior {
    path_pattern     = "/schools/*/uploads/*"
    allowed_methods  = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.uploads.id}"

    forwarded_values {
      query_string = true
      headers      = ["Origin", "Access-Control-Request-Method", "Access-Control-Request-Headers", "Authorization"]

      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "https-only"
    min_ttl                = 0
    default_ttl            = 3600     # 1 hour
    max_ttl                = 86400    # 1 day
    compress               = true

    # Tenant isolation via Lambda@Edge
    lambda_function_association {
      event_type   = "viewer-request"
      lambda_arn   = aws_lambda_function.edge_tenant_isolation.qualified_arn
      include_body = true
    }
  }

  # Custom error responses
  custom_error_response {
    error_caching_min_ttl = 10
    error_code            = 403
    response_code         = 404
    response_page_path    = "/404.html"
  }

  custom_error_response {
    error_caching_min_ttl = 10
    error_code            = 404
    response_code         = 404
    response_page_path    = "/404.html"
  }

  custom_error_response {
    error_caching_min_ttl = 0
    error_code            = 500
    response_code         = 500
    response_page_path    = "/500.html"
  }

  # Geographic restrictions
  restrictions {
    geo_restriction {
      restriction_type = var.environment == "production" ? "none" : "whitelist"
      locations        = var.environment == "production" ? [] : ["US", "GB", "DE", "SA", "AE", "EG"]
    }
  }

  # SSL configuration
  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate.cdn.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  # WAF configuration
  web_acl_id = aws_wafv2_web_acl.cdn.arn

  # Logging configuration
  logging_config {
    include_cookies = false
    bucket          = aws_s3_bucket.cdn_logs.bucket_domain_name
    prefix          = "cloudfront/"
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-cdn"
  })

  depends_on = [
    aws_acm_certificate_validation.cdn
  ]
}

# Response headers policy for security
resource "aws_cloudfront_response_headers_policy" "security" {
  name    = "${local.name_prefix}-security-headers"
  comment = "Security headers for Hogwarts CDN"

  security_headers_config {
    content_type_options {
      override = true
    }

    frame_options {
      frame_option = "DENY"
      override     = true
    }

    referrer_policy {
      referrer_policy = "strict-origin-when-cross-origin"
      override        = true
    }

    xss_protection {
      mode_block = true
      protection = true
      override   = true
    }

    strict_transport_security {
      access_control_max_age_sec = 63072000
      include_subdomains         = true
      preload                    = true
      override                   = true
    }

    content_security_policy {
      content_security_policy = "default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-inline' https://cdn.databayt.org; style-src 'self' 'unsafe-inline';"
      override                = true
    }
  }

  cors_config {
    access_control_allow_credentials = false

    access_control_allow_headers {
      items = ["*"]
    }

    access_control_allow_methods {
      items = ["GET", "HEAD", "PUT", "POST", "DELETE", "OPTIONS"]
    }

    access_control_allow_origins {
      items = local.cors_rules.allowed_origins
    }

    access_control_expose_headers {
      items = ["ETag", "Content-Length", "Content-Type"]
    }

    access_control_max_age_sec = 86400
    origin_override            = true
  }
}

# Response headers policy for images
resource "aws_cloudfront_response_headers_policy" "images" {
  name    = "${local.name_prefix}-image-headers"
  comment = "Optimized headers for image delivery"

  custom_headers_config {
    items {
      header   = "Cache-Control"
      value    = "public, max-age=31536000, immutable"
      override = false
    }

    items {
      header   = "Accept-CH"
      value    = "Viewport-Width, Width, DPR"
      override = true
    }

    items {
      header   = "Permissions-Policy"
      value    = "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()"
      override = true
    }
  }
}

# S3 bucket for CDN logs
resource "aws_s3_bucket" "cdn_logs" {
  bucket = "${local.name_prefix}-cdn-logs-${data.aws_caller_identity.current.account_id}"

  tags = merge(local.common_tags, {
    Name    = "${local.name_prefix}-cdn-logs"
    Purpose = "CloudFront access logs"
  })
}

# Lifecycle policy for CDN logs
resource "aws_s3_bucket_lifecycle_configuration" "cdn_logs" {
  bucket = aws_s3_bucket.cdn_logs.id

  rule {
    id     = "delete-old-logs"
    status = "Enabled"

    expiration {
      days = 90
    }
  }
}

# Random password for origin secret
resource "random_password" "origin_secret" {
  length  = 32
  special = true
}

# ACM certificate validation
resource "aws_acm_certificate_validation" "cdn" {
  certificate_arn = aws_acm_certificate.cdn.arn
}

# CloudWatch alarms for CDN
resource "aws_cloudwatch_metric_alarm" "cdn_4xx_errors" {
  alarm_name          = "${local.name_prefix}-cdn-4xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "4xxErrorRate"
  namespace           = "AWS/CloudFront"
  period              = "300"
  statistic           = "Average"
  threshold           = "5"
  alarm_description   = "This metric monitors 4xx errors"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DistributionId = aws_cloudfront_distribution.uploads.id
  }
}

resource "aws_cloudwatch_metric_alarm" "cdn_5xx_errors" {
  alarm_name          = "${local.name_prefix}-cdn-5xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "5xxErrorRate"
  namespace           = "AWS/CloudFront"
  period              = "300"
  statistic           = "Average"
  threshold           = "1"
  alarm_description   = "This metric monitors 5xx errors"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DistributionId = aws_cloudfront_distribution.uploads.id
  }
}

resource "aws_cloudwatch_metric_alarm" "cdn_origin_latency" {
  alarm_name          = "${local.name_prefix}-cdn-origin-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "OriginLatency"
  namespace           = "AWS/CloudFront"
  period              = "300"
  statistic           = "Average"
  threshold           = "1000"
  alarm_description   = "This metric monitors origin latency"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DistributionId = aws_cloudfront_distribution.uploads.id
  }
}