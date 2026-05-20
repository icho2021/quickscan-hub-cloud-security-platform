terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Optional: Store state in S3 (uncomment after creating the bucket manually)
  # backend "s3" {
  #   bucket = "quickscan-terraform-state-ACCOUNT_ID"
  #   key    = "quickscan-hub/terraform.tfstate"
  #   region = "us-west-2"
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "QuickScan-Hub"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# Look up the LabRole
data "aws_iam_role" "lab_role" {
  name = "LabRole"
}

# Current AWS account ID
data "aws_caller_identity" "current" {}

# Available AZs in the region
data "aws_availability_zones" "available" {
  state = "available"
}
