# Main Terraform Configuration for Hogwarts File Upload Infrastructure
# Production-ready multi-region setup with high availability

terraform {
  required_version = ">= 1.7.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
    datadog = {
      source  = "DataDog/datadog"
      version = "~> 3.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }

  backend "s3" {
    # Backend config provided via CLI flags
    encrypt        = true
    dynamodb_table = "terraform-state-locks"
  }
}

# Provider configurations
provider "aws" {
  region = var.primary_region

  default_tags {
    tags = {
      Project     = "Hogwarts"
      Environment = var.environment
      ManagedBy   = "Terraform"
      Service     = "FileUpload"
      CostCenter  = "Platform"
    }
  }
}

provider "aws" {
  alias  = "us_west"
  region = "us-west-2"

  default_tags {
    tags = {
      Project     = "Hogwarts"
      Environment = var.environment
      ManagedBy   = "Terraform"
      Service     = "FileUpload"
      Region      = "us-west-2"
    }
  }
}

provider "aws" {
  alias  = "eu_central"
  region = "eu-central-1"

  default_tags {
    tags = {
      Project     = "Hogwarts"
      Environment = var.environment
      ManagedBy   = "Terraform"
      Service     = "FileUpload"
      Region      = "eu-central-1"
    }
  }
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

provider "datadog" {
  api_key = var.datadog_api_key
  app_key = var.datadog_app_key
}

# Local variables
locals {
  name_prefix = "hogwarts-${var.environment}"

  common_tags = {
    Project     = "Hogwarts"
    Environment = var.environment
    Terraform   = "true"
  }

  # Storage tiers configuration
  storage_tiers = {
    hot = {
      transition_days = 0
      storage_class   = "STANDARD"
      retrieval_tier  = "Expedited"
    }
    warm = {
      transition_days = 30
      storage_class   = "STANDARD_IA"
      retrieval_tier  = "Standard"
    }
    cold = {
      transition_days = 90
      storage_class   = "GLACIER_IR"
      retrieval_tier  = "Bulk"
    }
    archive = {
      transition_days = 365
      storage_class   = "DEEP_ARCHIVE"
      retrieval_tier  = "Bulk"
    }
  }

  # CORS configuration for file uploads
  cors_rules = {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "DELETE", "HEAD"]
    allowed_origins = var.environment == "production" ? [
      "https://ed.databayt.org",
      "https://*.databayt.org"
    ] : [
      "https://ed.databayt.org",
      "https://*.databayt.org",
      "http://localhost:3000",
      "http://localhost:3001"
    ]
    expose_headers  = ["ETag", "x-amz-server-side-encryption", "x-amz-request-id"]
    max_age_seconds = 3600
  }

  # Regions for replication
  replication_regions = ["us-west-2", "eu-central-1", "ap-southeast-1"]
}