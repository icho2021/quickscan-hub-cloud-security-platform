# ──────────────────────────────────────────────────────────────
# Application Load Balancer
# ──────────────────────────────────────────────────────────────
resource "aws_lb" "main" {
  name               = "${var.project_name}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  tags = { Name = "${var.project_name}-alb" }
}

# ──────────────────────────────────────────────────────────────
# Target Group — NGINX (frontend static files)
# ──────────────────────────────────────────────────────────────
resource "aws_lb_target_group" "nginx" {
  name        = "${var.project_name}-nginx-tg"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  health_check {
    path                = "/nginx-health"
    protocol            = "HTTP"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 3
    matcher             = "200"
  }

  tags = { Name = "${var.project_name}-nginx-tg" }
}

# ──────────────────────────────────────────────────────────────
# Target Group — API Backend
# ALB sends /api/* and /health directly to the API service.
# This replaces Cloud Map (not available in Learner Lab).
# ──────────────────────────────────────────────────────────────
resource "aws_lb_target_group" "api" {
  name        = "${var.project_name}-api-tg"
  port        = 3000
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  health_check {
    path                = "/health"
    protocol            = "HTTP"
    port                = "3000"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 3
    matcher             = "200"
  }

  tags = { Name = "${var.project_name}-api-tg" }
}

# ──────────────────────────────────────────────────────────────
# Listener — HTTP on port 80
# Default action → NGINX (frontend)
# ──────────────────────────────────────────────────────────────
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.nginx.arn
  }
}

# ──────────────────────────────────────────────────────────────
# Listener Rule — /api/* → API Backend target group
# ──────────────────────────────────────────────────────────────
resource "aws_lb_listener_rule" "api_routes" {
  listener_arn = aws_lb_listener.http.arn
  priority     = 100

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api.arn
  }

  condition {
    path_pattern {
      values = ["/api/*"]
    }
  }
}

# ──────────────────────────────────────────────────────────────
# Listener Rule — /health → API Backend target group
# ──────────────────────────────────────────────────────────────
resource "aws_lb_listener_rule" "health_route" {
  listener_arn = aws_lb_listener.http.arn
  priority     = 101

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api.arn
  }

  condition {
    path_pattern {
      values = ["/health"]
    }
  }
}
