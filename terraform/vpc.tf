# ──────────────────────────────────────────────────────────────
# VPC
# ──────────────────────────────────────────────────────────────
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = { Name = "${var.project_name}-vpc" }
}

# ──────────────────────────────────────────────────────────────
# Internet Gateway
# ──────────────────────────────────────────────────────────────
resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id
  tags   = { Name = "${var.project_name}-igw" }
}

# ──────────────────────────────────────────────────────────────
# Public Subnets (2 AZs) — ALB + NAT Gateway
# ──────────────────────────────────────────────────────────────
resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index) # 10.0.0.0/24, 10.0.1.0/24
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = { Name = "${var.project_name}-public-${count.index}" }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  tags   = { Name = "${var.project_name}-public-rt" }
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

# ──────────────────────────────────────────────────────────────
# NAT Gateway (single, in first public subnet)
# ──────────────────────────────────────────────────────────────
resource "aws_eip" "nat" {
  domain = "vpc"
  tags   = { Name = "${var.project_name}-nat-eip" }
}

resource "aws_nat_gateway" "nat" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public[0].id

  tags = { Name = "${var.project_name}-nat-gw" }

  depends_on = [aws_internet_gateway.igw]
}

# ──────────────────────────────────────────────────────────────
# Private Subnets — App Tier (2 AZs)
# ──────────────────────────────────────────────────────────────
resource "aws_subnet" "app_private" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 10) # 10.0.10.0/24, 10.0.11.0/24
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = { Name = "${var.project_name}-app-private-${count.index}" }
}

resource "aws_route_table" "app_private" {
  vpc_id = aws_vpc.main.id
  tags   = { Name = "${var.project_name}-app-private-rt" }
}

resource "aws_route" "app_private_nat" {
  route_table_id         = aws_route_table.app_private.id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.nat.id
}

resource "aws_route_table_association" "app_private" {
  count          = 2
  subnet_id      = aws_subnet.app_private[count.index].id
  route_table_id = aws_route_table.app_private.id
}

# ──────────────────────────────────────────────────────────────
# Private Subnets — Scanner Tier (2 AZs)
# ──────────────────────────────────────────────────────────────
resource "aws_subnet" "scanner_private" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 20) # 10.0.20.0/24, 10.0.21.0/24
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = { Name = "${var.project_name}-scanner-private-${count.index}" }
}

resource "aws_route_table" "scanner_private" {
  vpc_id = aws_vpc.main.id
  tags   = { Name = "${var.project_name}-scanner-private-rt" }
}

resource "aws_route" "scanner_private_nat" {
  route_table_id         = aws_route_table.scanner_private.id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.nat.id
}

resource "aws_route_table_association" "scanner_private" {
  count          = 2
  subnet_id      = aws_subnet.scanner_private[count.index].id
  route_table_id = aws_route_table.scanner_private.id
}
