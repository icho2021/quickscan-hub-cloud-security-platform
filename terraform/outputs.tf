output "alb_dns_name" {
  description = "Public DNS name of the ALB — open this in a browser"
  value       = aws_lb.main.dns_name
}

output "alb_url" {
  description = "Full URL to access the dashboard"
  value       = "http://${aws_lb.main.dns_name}"
}

output "sqs_queue_url" {
  description = "SQS scan job queue URL"
  value       = aws_sqs_queue.scan_jobs.url
}

output "sqs_dlq_url" {
  description = "SQS dead-letter queue URL"
  value       = aws_sqs_queue.scan_dlq.url
}

output "dynamodb_table_name" {
  description = "DynamoDB scan history table name"
  value       = aws_dynamodb_table.scans.name
}

output "s3_bucket_name" {
  description = "S3 report storage bucket name"
  value       = aws_s3_bucket.reports.id
}

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = aws_ecs_cluster.main.name
}

output "cloudwatch_dashboard_url" {
  description = "CloudWatch dashboard URL"
  value       = "https://${var.aws_region}.console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${var.project_name}-dashboard"
}
