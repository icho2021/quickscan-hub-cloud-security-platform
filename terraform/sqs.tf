# ──────────────────────────────────────────────────────────────
# Dead-Letter Queue (failed scan jobs)
# ──────────────────────────────────────────────────────────────
resource "aws_sqs_queue" "scan_dlq" {
  name                      = "${var.project_name}-scan-dlq"
  message_retention_seconds = 1209600 # 14 days

  tags = { Name = "${var.project_name}-scan-dlq" }
}

# ──────────────────────────────────────────────────────────────
# Main Scan Job Queue
# ──────────────────────────────────────────────────────────────
resource "aws_sqs_queue" "scan_jobs" {
  name                       = "${var.project_name}-scan-jobs"
  visibility_timeout_seconds = 300      # 5 minutes (must be > worker processing time)
  message_retention_seconds  = 86400    # 1 day
  receive_wait_time_seconds  = 20       # Long polling

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.scan_dlq.arn
    maxReceiveCount     = 3 # After 3 failures, move to DLQ
  })

  tags = { Name = "${var.project_name}-scan-jobs" }
}
