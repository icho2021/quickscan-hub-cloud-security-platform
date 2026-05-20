# ──────────────────────────────────────────────────────────────
# VPC Gateway Endpoint — S3 (free, no hourly charge)
# ──────────────────────────────────────────────────────────────
resource "aws_vpc_endpoint" "s3" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${var.aws_region}.s3"
  vpc_endpoint_type = "Gateway"

  route_table_ids = [
    aws_route_table.app_private.id,
    aws_route_table.scanner_private.id
  ]

  tags = { Name = "${var.project_name}-s3-endpoint" }
}

# ──────────────────────────────────────────────────────────────
# VPC Gateway Endpoint — DynamoDB (free, no hourly charge)
# Only associated with app-tier route table (NOT scanner tier)
# This is the KEY network isolation mechanism
# ──────────────────────────────────────────────────────────────
resource "aws_vpc_endpoint" "dynamodb" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${var.aws_region}.dynamodb"
  vpc_endpoint_type = "Gateway"

  # Both tiers need DynamoDB access:
  # - App tier: API reads/writes scan records
  # - Scanner tier: Workers update scan status to COMPLETED/FAILED
  # Network isolation for scanners is still enforced by security groups
  # preventing inbound connections — scanners can only write outbound.
  route_table_ids = [
    aws_route_table.app_private.id,
    aws_route_table.scanner_private.id
  ]

  tags = { Name = "${var.project_name}-dynamodb-endpoint" }
}

# ──────────────────────────────────────────────────────────────
# VPC Interface Endpoint — SQS
# ──────────────────────────────────────────────────────────────
resource "aws_vpc_endpoint" "sqs" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.${var.aws_region}.sqs"
  vpc_endpoint_type   = "Interface"
  private_dns_enabled = true

  # Use only app-tier subnets (one per AZ) to avoid DuplicateSubnetsInSameZone.
  # Scanner-tier traffic reaches SQS via the same AZ's endpoint through VPC routing.
  subnet_ids = aws_subnet.app_private[*].id

  security_group_ids = [aws_security_group.vpc_endpoints.id]

  tags = { Name = "${var.project_name}-sqs-endpoint" }
}
