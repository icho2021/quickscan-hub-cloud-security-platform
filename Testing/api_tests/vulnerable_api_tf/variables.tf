variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-west-2"
}

variable "project_name" {
  description = "Project name prefix"
  type        = string
  default     = "quickscan"
}

variable "environment" {
  description = "Environment label"
  type        = string
  default     = "dev"
}

variable "container_image_tag" {
  description = "Docker image tag to run from ECR"
  type        = string
  default     = "latest"
}

variable "vpc_cidr" {
  description = "CIDR block for the isolated VPC"
  type        = string
  default     = "10.50.0.0/16"
}

variable "api_instances" {
  description = "Two vulnerable API instances to deploy and route by ALB path prefix"
  type = map(object({
    ecr_repo_name     = string
    container_name    = string
    path_prefix       = string
    listener_priority = number
  }))

  default = {
    vuln_a = {
      ecr_repo_name     = "quickscan-vulnerable-api-auth-injection"
      container_name    = "vulnerable-api-auth-injection"
      path_prefix       = "/a"
      listener_priority = 100
    }
    vuln_b = {
      ecr_repo_name     = "quickscan-vulnerable-api-config-exposure"
      container_name    = "vulnerable-api-config-exposure"
      path_prefix       = "/b"
      listener_priority = 110
    }
  }
}

