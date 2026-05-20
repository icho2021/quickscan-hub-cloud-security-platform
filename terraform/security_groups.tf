# ──────────────────────────────────────────────────────────────
# ALB Security Group
# ──────────────────────────────────────────────────────────────
resource "aws_security_group" "alb" {
  name        = "${var.project_name}-alb-sg"
  description = "ALB - allow HTTP from internet"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTP from internet"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS from internet"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.project_name}-alb-sg" }
}

# ──────────────────────────────────────────────────────────────
# App Tier Security Group (NGINX + API Backend)
# ──────────────────────────────────────────────────────────────
resource "aws_security_group" "app" {
  name        = "${var.project_name}-app-sg"
  description = "App tier - ALB inbound, outbound to AWS services + NAT"
  vpc_id      = aws_vpc.main.id

  # NGINX port from ALB
  ingress {
    description     = "HTTP from ALB"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  # API port from ALB (health checks)
  ingress {
    description     = "API from ALB"
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  # Internal traffic within the app tier (NGINX → API)
  ingress {
    description = "Internal app-to-app"
    from_port   = 0
    to_port     = 65535
    protocol    = "tcp"
    self        = true
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.project_name}-app-sg" }
}

# ──────────────────────────────────────────────────────────────
# Scanner Tier Security Group (SAST + Pentest workers)
# ──────────────────────────────────────────────────────────────
resource "aws_security_group" "scanner" {
  name        = "${var.project_name}-scanner-sg"
  description = "Scanner tier - outbound only to SQS/S3/NAT, NO DynamoDB"
  vpc_id      = aws_vpc.main.id

  # No inbound rules — scanners accept no incoming connections

  egress {
    description = "Outbound to all (NAT for pentest, VPC endpoints for SQS/S3)"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.project_name}-scanner-sg" }
}

# ──────────────────────────────────────────────────────────────
# VPC Endpoints Security Group
# ──────────────────────────────────────────────────────────────
resource "aws_security_group" "vpc_endpoints" {
  name        = "${var.project_name}-vpce-sg"
  description = "VPC interface endpoints - HTTPS from app and scanner tiers"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "HTTPS from app tier"
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
  }

  ingress {
    description     = "HTTPS from scanner tier"
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.scanner.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.project_name}-vpce-sg" }
}
