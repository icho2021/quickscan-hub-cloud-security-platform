# ──────────────────────────────────────────────────────────────
# DynamoDB — Scan History Table
# ──────────────────────────────────────────────────────────────
resource "aws_dynamodb_table" "scans" {
  name         = "${var.project_name}-scans"
  billing_mode = "PAY_PER_REQUEST" # Serverless, no capacity planning needed
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  tags = { Name = "${var.project_name}-scans" }
}
