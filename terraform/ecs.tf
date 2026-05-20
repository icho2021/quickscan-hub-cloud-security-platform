# ──────────────────────────────────────────────────────────────
# ECS Cluster
# ──────────────────────────────────────────────────────────────
resource "aws_ecs_cluster" "main" {
  name = "${var.project_name}-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = { Name = "${var.project_name}-cluster" }
}

# ──────────────────────────────────────────────────────────────
# Service Discovery: ALB path-based routing
# Cloud Map is NOT available in Learner Lab (AccessDeniedException).
# Instead, the ALB routes /api/* to the API target group and
# everything else to the NGINX target group. NGINX only serves
# static files — it no longer proxies to the API.
# ──────────────────────────────────────────────────────────────

# ──────────────────────────────────────────────────────────────
# Local values for ECR image URIs
# ──────────────────────────────────────────────────────────────
locals {
  ecr_base         = "${var.aws_account_id}.dkr.ecr.${var.aws_region}.amazonaws.com"
  api_image        = "${local.ecr_base}/quickscan-api:${var.api_image_tag}"
  nginx_image      = "${local.ecr_base}/quickscan-nginx:${var.nginx_image_tag}"
  sast_image       = "${local.ecr_base}/quickscan-sast-worker:${var.sast_worker_image_tag}"
  pentest_image    = "${local.ecr_base}/quickscan-pentest-worker:${var.pentest_worker_image_tag}"
}

# ──────────────────────────────────────────────────────────────
# Task Definition — API Backend
# ──────────────────────────────────────────────────────────────
resource "aws_ecs_task_definition" "api" {
  family                   = "${var.project_name}-api"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "512"
  memory                   = "1024"
  execution_role_arn       = data.aws_iam_role.lab_role.arn
  task_role_arn            = data.aws_iam_role.lab_role.arn

  container_definitions = jsonencode([{
    name      = "api"
    image     = local.api_image
    essential = true

    portMappings = [{
      containerPort = 3000
      protocol      = "tcp"
    }]

    environment = [
      { name = "AWS_REGION",      value = var.aws_region },
      { name = "DYNAMODB_TABLE",  value = aws_dynamodb_table.scans.name },
      { name = "SQS_QUEUE_URL",   value = aws_sqs_queue.scan_jobs.url },
      { name = "S3_BUCKET",       value = aws_s3_bucket.reports.id },
      { name = "PORT",            value = "3000" }
    ]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = "/ecs/${var.project_name}-api"
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "ecs"
      }
    }
  }])

  tags = { Name = "${var.project_name}-api-task" }
}

# ──────────────────────────────────────────────────────────────
# Task Definition — NGINX Frontend
# ──────────────────────────────────────────────────────────────
resource "aws_ecs_task_definition" "nginx" {
  family                   = "${var.project_name}-nginx"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = data.aws_iam_role.lab_role.arn
  task_role_arn            = data.aws_iam_role.lab_role.arn

  container_definitions = jsonencode([{
    name      = "nginx"
    image     = local.nginx_image
    essential = true

    portMappings = [{
      containerPort = 80
      protocol      = "tcp"
    }]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = "/ecs/${var.project_name}-nginx"
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "ecs"
      }
    }
  }])

  tags = { Name = "${var.project_name}-nginx-task" }
}

# ──────────────────────────────────────────────────────────────
# Task Definition — SAST Worker
# ──────────────────────────────────────────────────────────────
resource "aws_ecs_task_definition" "sast_worker" {
  family                   = "${var.project_name}-sast-worker"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = data.aws_iam_role.lab_role.arn
  task_role_arn            = data.aws_iam_role.lab_role.arn

  container_definitions = jsonencode([{
    name      = "sast-worker"
    image     = local.sast_image
    essential = true

    environment = [
      { name = "AWS_REGION",     value = var.aws_region },
      { name = "DYNAMODB_TABLE", value = aws_dynamodb_table.scans.name },
      { name = "SQS_QUEUE_URL",  value = aws_sqs_queue.scan_jobs.url },
      { name = "S3_BUCKET",      value = aws_s3_bucket.reports.id }
    ]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = "/ecs/${var.project_name}-sast-worker"
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "ecs"
      }
    }
  }])

  tags = { Name = "${var.project_name}-sast-worker-task" }
}

# ──────────────────────────────────────────────────────────────
# Task Definition — Pentest Worker
# ──────────────────────────────────────────────────────────────
resource "aws_ecs_task_definition" "pentest_worker" {
  family                   = "${var.project_name}-pentest-worker"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = data.aws_iam_role.lab_role.arn
  task_role_arn            = data.aws_iam_role.lab_role.arn

  container_definitions = jsonencode([{
    name      = "pentest-worker"
    image     = local.pentest_image
    essential = true

    environment = [
      { name = "AWS_REGION",     value = var.aws_region },
      { name = "DYNAMODB_TABLE", value = aws_dynamodb_table.scans.name },
      { name = "SQS_QUEUE_URL",  value = aws_sqs_queue.scan_jobs.url },
      { name = "S3_BUCKET",      value = aws_s3_bucket.reports.id }
    ]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = "/ecs/${var.project_name}-pentest-worker"
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "ecs"
      }
    }
  }])

  tags = { Name = "${var.project_name}-pentest-worker-task" }
}

# ──────────────────────────────────────────────────────────────
# ECS Service — API Backend (behind ALB via path-based routing)
# ──────────────────────────────────────────────────────────────
resource "aws_ecs_service" "api" {
  name            = "${var.project_name}-api"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.api.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.app_private[*].id
    security_groups  = [aws_security_group.app.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.api.arn
    container_name   = "api"
    container_port   = 3000
  }

  depends_on = [aws_lb_listener.http]

  tags = { Name = "${var.project_name}-api-service" }
}

# ──────────────────────────────────────────────────────────────
# ECS Service — NGINX Frontend (behind ALB)
# ──────────────────────────────────────────────────────────────
resource "aws_ecs_service" "nginx" {
  name            = "${var.project_name}-nginx"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.nginx.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.app_private[*].id
    security_groups  = [aws_security_group.app.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.nginx.arn
    container_name   = "nginx"
    container_port   = 80
  }

  depends_on = [aws_lb_listener.http]

  tags = { Name = "${var.project_name}-nginx-service" }
}

# ──────────────────────────────────────────────────────────────
# ECS Service — SAST Worker
# ──────────────────────────────────────────────────────────────
resource "aws_ecs_service" "sast_worker" {
  name            = "${var.project_name}-sast-worker"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.sast_worker.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.scanner_private[*].id
    security_groups  = [aws_security_group.scanner.id]
    assign_public_ip = false
  }

  tags = { Name = "${var.project_name}-sast-worker-service" }
}

# ──────────────────────────────────────────────────────────────
# ECS Service — Pentest Worker
# ──────────────────────────────────────────────────────────────
resource "aws_ecs_service" "pentest_worker" {
  name            = "${var.project_name}-pentest-worker"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.pentest_worker.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.scanner_private[*].id
    security_groups  = [aws_security_group.scanner.id]
    assign_public_ip = false
  }

  tags = { Name = "${var.project_name}-pentest-worker-service" }
}
