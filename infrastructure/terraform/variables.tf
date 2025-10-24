# Terraform Variables for Hogwarts File Upload Infrastructure

variable "environment" {
  description = "Environment name (production, staging, development)"
  type        = string
  default     = "production"

  validation {
    condition     = contains(["production", "staging", "development"], var.environment)
    error_message = "Environment must be production, staging, or development."
  }
}

variable "primary_region" {
  description = "Primary AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "cloudflare_api_token" {
  description = "Cloudflare API token for R2 and CDN management"
  type        = string
  sensitive   = true
}

variable "datadog_api_key" {
  description = "Datadog API key for monitoring"
  type        = string
  sensitive   = true
}

variable "datadog_app_key" {
  description = "Datadog application key"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "JWT secret for authentication"
  type        = string
  sensitive   = true
}

variable "api_key" {
  description = "API key for internal services"
  type        = string
  sensitive   = true
}

variable "virus_scan_api_endpoint" {
  description = "Endpoint for virus scanning service"
  type        = string
  default     = "https://api.virustotal.com/v3"
}

variable "pagerduty_endpoint" {
  description = "PagerDuty integration endpoint for critical alerts"
  type        = string
  sensitive   = true
}

variable "slack_webhook_url" {
  description = "Slack webhook URL for notifications"
  type        = string
  sensitive   = true
}

variable "whitelisted_ips" {
  description = "IP addresses exempt from rate limiting"
  type        = list(string)
  default     = []
}

variable "allowed_countries" {
  description = "Country codes allowed for admin access"
  type        = list(string)
  default     = ["US", "GB", "DE", "SA", "AE", "EG", "JO", "KW", "QA", "BH", "OM"]
}

variable "storage_tiers" {
  description = "Storage tier configurations"
  type = object({
    hot_retention_days     = number
    warm_retention_days    = number
    cold_retention_days    = number
    archive_retention_days = number
  })
  default = {
    hot_retention_days     = 30
    warm_retention_days    = 90
    cold_retention_days    = 365
    archive_retention_days = 2555 # 7 years
  }
}

variable "upload_limits" {
  description = "Upload limit configurations"
  type = object({
    max_file_size_mb     = number
    max_files_per_upload = number
    max_total_size_gb    = number
    rate_limit_per_ip    = number
    rate_limit_per_school = number
  })
  default = {
    max_file_size_mb     = 5120  # 5GB
    max_files_per_upload = 100
    max_total_size_gb    = 100   # Per school
    rate_limit_per_ip    = 2000  # Per 5 minutes
    rate_limit_per_school = 10000 # Per 5 minutes
  }
}

variable "image_processing" {
  description = "Image processing configuration"
  type = object({
    max_width         = number
    max_height        = number
    quality           = number
    auto_orient       = bool
    strip_metadata    = bool
    progressive       = bool
    formats           = list(string)
  })
  default = {
    max_width      = 4096
    max_height     = 4096
    quality        = 85
    auto_orient    = true
    strip_metadata = true
    progressive    = true
    formats        = ["webp", "avif", "jpeg", "png"]
  }
}

variable "backup_configuration" {
  description = "Backup and disaster recovery settings"
  type = object({
    enable_cross_region_backup = bool
    backup_retention_days      = number
    point_in_time_recovery     = bool
    backup_regions            = list(string)
  })
  default = {
    enable_cross_region_backup = true
    backup_retention_days      = 30
    point_in_time_recovery     = true
    backup_regions            = ["us-west-2", "eu-central-1"]
  }
}

variable "monitoring_config" {
  description = "Monitoring and alerting configuration"
  type = object({
    enable_detailed_monitoring = bool
    log_retention_days        = number
    metric_namespace          = string
    alarm_email              = string
  })
  default = {
    enable_detailed_monitoring = true
    log_retention_days        = 30
    metric_namespace          = "Hogwarts/FileUpload"
    alarm_email              = "platform-alerts@databayt.org"
  }
}

variable "tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}

variable "school_storage_quotas" {
  description = "Storage quotas per subscription tier (in GB)"
  type = object({
    free       = number
    starter    = number
    professional = number
    enterprise = number
  })
  default = {
    free         = 10
    starter      = 50
    professional = 200
    enterprise   = 1000
  }
}

variable "cdn_cache_behaviors" {
  description = "CDN cache behavior configurations"
  type = map(object({
    min_ttl     = number
    default_ttl = number
    max_ttl     = number
    compress    = bool
  }))
  default = {
    images = {
      min_ttl     = 0
      default_ttl = 86400    # 1 day
      max_ttl     = 31536000 # 1 year
      compress    = true
    }
    documents = {
      min_ttl     = 0
      default_ttl = 604800   # 7 days
      max_ttl     = 31536000 # 1 year
      compress    = true
    }
    videos = {
      min_ttl     = 0
      default_ttl = 604800   # 7 days
      max_ttl     = 31536000 # 1 year
      compress    = false
    }
  }
}

variable "security_config" {
  description = "Security configuration settings"
  type = object({
    enable_waf              = bool
    enable_shield_advanced  = bool
    enable_guardduty       = bool
    enable_macie           = bool
    enable_security_hub    = bool
    minimum_tls_version    = string
  })
  default = {
    enable_waf             = true
    enable_shield_advanced = true
    enable_guardduty      = true
    enable_macie          = true
    enable_security_hub   = true
    minimum_tls_version   = "TLSv1.2"
  }
}

variable "database_config" {
  description = "Database configuration for file metadata"
  type = object({
    enable_point_in_time_recovery = bool
    enable_deletion_protection    = bool
    read_capacity                = number
    write_capacity               = number
    enable_auto_scaling          = bool
  })
  default = {
    enable_point_in_time_recovery = true
    enable_deletion_protection    = true
    read_capacity                = 5
    write_capacity               = 5
    enable_auto_scaling          = true
  }
}