# ──────────────────────────────────────────────────────────────
# CloudWatch Log Groups (one per service)
# ──────────────────────────────────────────────────────────────
resource "aws_cloudwatch_log_group" "api" {
  name              = "/ecs/${var.project_name}-api"
  retention_in_days = 14
  tags              = { Name = "${var.project_name}-api-logs" }
}

resource "aws_cloudwatch_log_group" "nginx" {
  name              = "/ecs/${var.project_name}-nginx"
  retention_in_days = 14
  tags              = { Name = "${var.project_name}-nginx-logs" }
}

resource "aws_cloudwatch_log_group" "sast_worker" {
  name              = "/ecs/${var.project_name}-sast-worker"
  retention_in_days = 14
  tags              = { Name = "${var.project_name}-sast-worker-logs" }
}

resource "aws_cloudwatch_log_group" "pentest_worker" {
  name              = "/ecs/${var.project_name}-pentest-worker"
  retention_in_days = 14
  tags              = { Name = "${var.project_name}-pentest-worker-logs" }
}

# ──────────────────────────────────────────────────────────────
# CloudWatch Alarm — SQS Queue Depth
# ──────────────────────────────────────────────────────────────
resource "aws_cloudwatch_metric_alarm" "sqs_queue_depth" {
  alarm_name          = "${var.project_name}-sqs-queue-depth-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = 300
  statistic           = "Average"
  threshold           = 100
  alarm_description   = "SQS queue depth is high — scanners may be overloaded"

  dimensions = {
    QueueName = aws_sqs_queue.scan_jobs.name
  }

  tags = { Name = "${var.project_name}-sqs-alarm" }
}

# ──────────────────────────────────────────────────────────────
# CloudWatch Alarm — ALB 5xx Errors
# ──────────────────────────────────────────────────────────────
resource "aws_cloudwatch_metric_alarm" "alb_5xx" {
  alarm_name          = "${var.project_name}-alb-5xx-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "HTTPCode_ELB_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "ALB returning too many 5xx errors"
  treat_missing_data  = "notBreaching"

  dimensions = {
    LoadBalancer = aws_lb.main.arn_suffix
  }

  tags = { Name = "${var.project_name}-alb-5xx-alarm" }
}

# ──────────────────────────────────────────────────────────────
# CloudWatch Dashboard
# ──────────────────────────────────────────────────────────────
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.project_name}-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          title   = "ECS CPU Utilization"
          metrics = [
            ["AWS/ECS", "CPUUtilization", "ServiceName", "${var.project_name}-api", "ClusterName", "${var.project_name}-cluster", { stat = "Average" }],
            ["AWS/ECS", "CPUUtilization", "ServiceName", "${var.project_name}-nginx", "ClusterName", "${var.project_name}-cluster", { stat = "Average" }],
            ["AWS/ECS", "CPUUtilization", "ServiceName", "${var.project_name}-sast-worker", "ClusterName", "${var.project_name}-cluster", { stat = "Average" }],
            ["AWS/ECS", "CPUUtilization", "ServiceName", "${var.project_name}-pentest-worker", "ClusterName", "${var.project_name}-cluster", { stat = "Average" }]
          ]
          region = var.aws_region
          period = 300
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          title   = "ECS Memory Utilization"
          metrics = [
            ["AWS/ECS", "MemoryUtilization", "ServiceName", "${var.project_name}-api", "ClusterName", "${var.project_name}-cluster", { stat = "Average" }],
            ["AWS/ECS", "MemoryUtilization", "ServiceName", "${var.project_name}-nginx", "ClusterName", "${var.project_name}-cluster", { stat = "Average" }],
            ["AWS/ECS", "MemoryUtilization", "ServiceName", "${var.project_name}-sast-worker", "ClusterName", "${var.project_name}-cluster", { stat = "Average" }],
            ["AWS/ECS", "MemoryUtilization", "ServiceName", "${var.project_name}-pentest-worker", "ClusterName", "${var.project_name}-cluster", { stat = "Average" }]
          ]
          region = var.aws_region
          period = 300
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6
        properties = {
          title   = "SQS Queue Metrics"
          metrics = [
            ["AWS/SQS", "ApproximateNumberOfMessagesVisible", "QueueName", aws_sqs_queue.scan_jobs.name, { stat = "Average" }],
            ["AWS/SQS", "ApproximateNumberOfMessagesNotVisible", "QueueName", aws_sqs_queue.scan_jobs.name, { stat = "Average" }],
            ["AWS/SQS", "NumberOfMessagesSent", "QueueName", aws_sqs_queue.scan_jobs.name, { stat = "Sum" }],
            ["AWS/SQS", "NumberOfMessagesReceived", "QueueName", aws_sqs_queue.scan_jobs.name, { stat = "Sum" }]
          ]
          region = var.aws_region
          period = 300
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 6
        width  = 12
        height = 6
        properties = {
          title   = "ALB Request Count & Errors"
          metrics = [
            ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", aws_lb.main.arn_suffix, { stat = "Sum" }],
            ["AWS/ApplicationELB", "HTTPCode_ELB_5XX_Count", "LoadBalancer", aws_lb.main.arn_suffix, { stat = "Sum" }],
            ["AWS/ApplicationELB", "HTTPCode_Target_2XX_Count", "LoadBalancer", aws_lb.main.arn_suffix, { stat = "Sum" }]
          ]
          region = var.aws_region
          period = 300
        }
      }
    ]
  })
}
