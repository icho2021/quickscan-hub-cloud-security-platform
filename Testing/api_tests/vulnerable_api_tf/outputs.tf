output "alb_url" {
  description = "Base URL of shared ALB"
  value       = "http://${aws_lb.alb.dns_name}"
}

output "vulnerable_api_urls" {
  description = "Routed API base URLs per instance key"
  value = {
    for k, v in var.api_instances : k => "http://${aws_lb.alb.dns_name}${v.path_prefix}"
  }
}

output "vulnerable_api_health_urls" {
  description = "Health endpoints for each routed API"
  value = {
    for k, v in var.api_instances : k => "http://${aws_lb.alb.dns_name}${v.path_prefix}/vuln-health"
  }
}

output "vulnerable_api_ecr_repository_urls" {
  description = "ECR repository URLs keyed by instance"
  value = {
    for k, repo in aws_ecr_repository.vulnerable_api : k => repo.repository_url
  }
}

output "current_account_id" {
  description = "Resolved AWS account ID used by this Terraform apply"
  value       = data.aws_caller_identity.current.account_id
}

