variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-west-2"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "quickscan"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "aws_account_id" {
  description = "AWS Account ID (for ECR image URIs)"
  type        = string
}

variable "api_image_tag" {
  description = "Docker image tag for the API backend"
  type        = string
  default     = "latest"
}

variable "nginx_image_tag" {
  description = "Docker image tag for the NGINX frontend"
  type        = string
  default     = "latest"
}

variable "sast_worker_image_tag" {
  description = "Docker image tag for the SAST worker"
  type        = string
  default     = "latest"
}

variable "pentest_worker_image_tag" {
  description = "Docker image tag for the Pentest worker"
  type        = string
  default     = "latest"
}
