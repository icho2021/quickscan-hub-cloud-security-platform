terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project   = var.project_name
      ManagedBy = "Terraform"
    }
  }
}

data "aws_iam_role" "lab_role" {
  name = "LabRole"
}

data "aws_caller_identity" "current" {}

locals {
  api_instances = {
    for key, cfg in var.api_instances : key => merge(cfg, {
      normalized_path_prefix = startswith(cfg.path_prefix, "/") ? cfg.path_prefix : "/${cfg.path_prefix}"
    })
  }
}

# -----------------------------
# Network (simple public VPC)
# -----------------------------
resource "aws_vpc" "vpc" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = { Name = "${var.project_name}-vulnerable-api-vpc" }
}

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.vpc.id
  tags   = { Name = "${var.project_name}-vulnerable-api-igw" }
}

data "aws_availability_zones" "available" {
  state = "available"
}

resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.vpc.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = { Name = "${var.project_name}-vulnerable-api-public-${count.index}" }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.vpc.id
  tags   = { Name = "${var.project_name}-vulnerable-api-public-rt" }
}

resource "aws_route" "public_internet" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.igw.id
}

resource "aws_route_table_association" "public" {
  count          = 2
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# -----------------------------
# ECR (store both vulnerable APIs)
# -----------------------------
resource "aws_ecr_repository" "vulnerable_api" {
  for_each             = local.api_instances
  name                 = each.value.ecr_repo_name
  image_tag_mutability = "MUTABLE"
  force_delete         = true

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = { Name = "${var.project_name}-${each.key}-ecr" }
}

# -----------------------------
# ALB + Target Group
# -----------------------------
resource "aws_security_group" "alb_sg" {
  name        = "${var.project_name}-vulnerable-api-alb-sg"
  description = "Vulnerable API ALB SG"
  vpc_id      = aws_vpc.vpc.id

  ingress {
    description = "HTTP from internet"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "task_sg" {
  name        = "${var.project_name}-vulnerable-api-task-sg"
  description = "Vulnerable API task SG"
  vpc_id      = aws_vpc.vpc.id

  ingress {
    description     = "Allow ALB to reach API"
    from_port       = 4000
    to_port         = 4000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_lb" "alb" {
  name               = "${var.project_name}-vulnerable-api-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_sg.id]
  subnets            = aws_subnet.public[*].id

  tags = { Name = "${var.project_name}-vulnerable-api-alb" }
}

resource "aws_lb_target_group" "tg" {
  for_each    = local.api_instances
  # ALB target group names: alphanumeric and hyphens only (no underscores).
  name        = substr("${var.project_name}-${replace(each.key, "_", "-")}-tg", 0, 32)
  port        = 4000
  protocol    = "HTTP"
  vpc_id      = aws_vpc.vpc.id
  target_type = "ip"

  health_check {
    path                = "/vuln-health"
    protocol            = "HTTP"
    port                = "4000"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 3
    matcher             = "200"
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.alb.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type = "fixed-response"

    fixed_response {
      content_type = "application/json"
      status_code  = "404"
      message_body = "{\"error\":\"path not mapped\",\"message\":\"Use /a/* or /b/* routes\"}"
    }
  }
}

resource "aws_lb_listener_rule" "api_path_routes" {
  for_each     = local.api_instances
  listener_arn = aws_lb_listener.http.arn
  priority     = each.value.listener_priority

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.tg[each.key].arn
  }

  condition {
    path_pattern {
      values = [format("%s/*", each.value.normalized_path_prefix)]
    }
  }
}

# -----------------------------
# ECS Fargate
# -----------------------------
resource "aws_ecs_cluster" "cluster" {
  name = "${var.project_name}-vulnerable-api-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

resource "aws_cloudwatch_log_group" "logs" {
  for_each          = local.api_instances
  name              = "/ecs/${var.project_name}-${each.key}"
  retention_in_days = 14
}

resource "aws_ecs_task_definition" "task" {
  for_each                 = local.api_instances
  family                   = "${var.project_name}-${each.key}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"

  execution_role_arn = data.aws_iam_role.lab_role.arn
  task_role_arn      = data.aws_iam_role.lab_role.arn

  container_definitions = jsonencode([
    {
      name      = each.value.container_name
      image     = "${aws_ecr_repository.vulnerable_api[each.key].repository_url}:${var.container_image_tag}"
      essential = true

      portMappings = [
        {
          containerPort = 4000
          protocol      = "tcp"
        }
      ]

      environment = [
        { name = "PORT", value = "4000" },
        { name = "API_PREFIX", value = each.value.path_prefix }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.logs[each.key].name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])
}

resource "aws_ecs_service" "service" {
  for_each        = local.api_instances
  name            = "${var.project_name}-${each.key}-service"
  cluster         = aws_ecs_cluster.cluster.id
  task_definition = aws_ecs_task_definition.task[each.key].arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.public[*].id
    security_groups  = [aws_security_group.task_sg.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.tg[each.key].arn
    container_name   = each.value.container_name
    container_port   = 4000
  }

  depends_on = [aws_lb_listener_rule.api_path_routes]
}

