# AWS Academy Infrastructure Documentation - Nexus Control App

**Version:** 1.0  
**Date:** September 2026  
**Status:** Production-Ready  
**Application:** Nexus Control (Node.js/Express + React/Vite + MySQL)

---

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [AWS Services Used](#aws-services-used)
3. [Database Setup (RDS MySQL)](#database-setup-rds-mysql)
4. [Compute (EC2)](#compute-ec2)
5. [Storage (S3)](#storage-s3)
6. [CDN (CloudFront)](#cdn-cloudfront)
7. [Security Configuration](#security-configuration)
8. [Backup & Disaster Recovery](#backup--disaster-recovery)
9. [Monitoring & Logging](#monitoring--logging)
10. [Deployment Guide](#deployment-guide)
11. [Cost Optimization](#cost-optimization)

---

## Architecture Overview

### High-Level Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                        Internet Users                        │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS
                         ▼
        ┌────────────────────────────────────┐
        │      CloudFront (CDN)              │
        │  - Static assets caching          │
        │  - Edge location distribution      │
        └────────────────┬───────────────────┘
                         │
                         ▼
        ┌────────────────────────────────────┐
        │   Application Load Balancer (ALB)  │
        │  - SSL/TLS termination             │
        │  - Health checks                   │
        └────────────────┬───────────────────┘
                         │
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
    ┌────────────┐ ┌────────────┐ ┌────────────┐
    │   EC2      │ │   EC2      │ │   EC2      │
    │ Instance 1 │ │ Instance 2 │ │ Instance 3 │
    │ (Node.js)  │ │ (Node.js)  │ │ (Node.js)  │
    └─────┬──────┘ └─────┬──────┘ └─────┬──────┘
          │              │              │
          └──────────────┼──────────────┘
                         │
                         ▼
        ┌────────────────────────────────────┐
        │   RDS MySQL (Multi-AZ)             │
        │  - Primary database                │
        │  - Automated backups               │
        │  - Failover replica                │
        └────────────────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────────┐
        │   S3 Bucket                        │
        │  - Product images                  │
        │  - Backups                         │
        │  - Static assets                   │
        └────────────────────────────────────┘
```

### Deployment Regions
- **Primary Region:** `us-east-1` (N. Virginia)
- **Multi-AZ Setup:** Distributed across 2-3 availability zones
- **Optional:** CloudFront for global edge distribution

---

## AWS Services Used

### 1. **EC2 (Elastic Compute Cloud)**
- **Purpose:** Host Node.js/Express backend
- **Instance Type:** `t3.medium` (recommended for MVP) or `t3.large` for production
- **Count:** 1-3 instances (minimum 2 for HA)
- **AMI:** Ubuntu 22.04 LTS
- **Storage:** 20-30 GB GP3 EBS volume
- **Security Group:** Custom inbound rules for app traffic

### 2. **RDS (Relational Database Service)**
- **Purpose:** Managed MySQL database
- **Engine:** MySQL 8.0 or MariaDB 10.6
- **Instance Class:** `db.t3.micro` (dev) → `db.t3.small` (prod)
- **Multi-AZ:** Enabled (automatic failover)
- **Storage:** 50 GB (gp2) → 100+ GB (gp3) for production
- **Backup Retention:** 30 days
- **Backup Window:** 03:00-04:00 UTC

### 3. **S3 (Simple Storage Service)**
- **Purpose:** Store product images, backups, static assets
- **Buckets:**
  - `nexus-control-assets` - Product images
  - `nexus-control-backups` - Database backups
  - `nexus-control-static` - Frontend static files
- **Versioning:** Enabled for backups
- **Lifecycle:** 90-day deletion policy for old backups

### 4. **CloudFront (Content Delivery Network)**
- **Purpose:** Cache static assets globally
- **Origins:** S3 + ALB
- **TTL:** 
  - Static assets (CSS/JS): 86400 seconds (1 day)
  - Images: 604800 seconds (7 days)
  - HTML: 3600 seconds (1 hour)
- **HTTPS:** Enforced

### 5. **ALB (Application Load Balancer)**
- **Purpose:** Distribute traffic across EC2 instances
- **Port:** 443 (HTTPS) → 80 (backend)
- **Health Check:** `/api/health` (30s interval, 3s timeout)
- **Stickiness:** Enabled (session affinity)

### 6. **Security Groups**
- **ALB SG:** Inbound 80/443 from internet (0.0.0.0/0)
- **EC2 SG:** Inbound 80 from ALB SG, SSH 22 from admin IP
- **RDS SG:** Inbound 3306 from EC2 SG only

### 7. **CloudWatch**
- **Logs:** Application logs streamed from EC2
- **Metrics:** CPU, Memory, Disk I/O, Network
- **Alarms:** High CPU (>70%), High Memory (>80%), RDS failover

---

## Database Setup (RDS MySQL)

### RDS Instance Configuration

**Step 1: Create RDS Instance**
```bash
# Via AWS Console:
1. Navigate to RDS → Databases → Create Database
2. Engine: MySQL 8.0 Community
3. Instance Class: db.t3.small (production)
4. Multi-AZ: Yes
5. Storage: 100 GB (gp3)
6. Backup Retention: 30 days
7. Enhanced Monitoring: Enabled
```

**Step 2: Configure Security Group**
```
Inbound Rule:
- Type: MySQL/Aurora (3306)
- Source: EC2 Security Group (e.g., sg-xxxxx)
```

**Step 3: Parameter Groups**
```
Key Parameters:
- max_connections: 150
- innodb_buffer_pool_size: 1024M
- slow_query_log: 1
- long_query_time: 2
- time_zone: '+00:00'
- character_set_server: utf8mb4
```

**Step 4: Create Initial Database**
```sql
-- Connect via MySQL client
mysql -h <rds-endpoint> -u admin -p

-- Create database
CREATE DATABASE nexus_control 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- Create backup user
CREATE USER 'backup_user'@'%' IDENTIFIED BY '<strong-password>';
GRANT SELECT, LOCK TABLES ON nexus_control.* TO 'backup_user'@'%';
FLUSH PRIVILEGES;
```

**Step 5: Migrate Schema**
```bash
# From backend directory
npm run migrate:prod
# or manual:
mysql -h <rds-endpoint> -u admin -p nexus_control < database-schema.sql
```

### Database Backup Strategy

**Automated Backups (AWS-managed)**
- Retention: 30 days
- Frequency: Daily
- Window: 03:00-04:00 UTC
- Cost: Included in RDS price

**Manual Backup (daily via cron)**
```bash
#!/bin/bash
# /opt/backup-database.sh
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BUCKET="s3://nexus-control-backups"

mysqldump -h <rds-endpoint> \
  -u backup_user -p<password> \
  --single-transaction \
  --quick \
  nexus_control | \
  gzip > /tmp/nexus_${TIMESTAMP}.sql.gz

aws s3 cp /tmp/nexus_${TIMESTAMP}.sql.gz \
  $BUCKET/daily/ \
  --storage-class GLACIER

rm /tmp/nexus_${TIMESTAMP}.sql.gz
```

**Backup Retention Policy**
- Daily: Keep last 30 days
- Weekly: Keep last 12 weeks
- Monthly: Keep last 24 months
- Transition to Glacier after 90 days

---

## Compute (EC2)

### EC2 Instance Setup

**Step 1: Launch Instance**
```bash
# Via AWS Console or CLI
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t3.medium \
  --key-name nexus-keypair \
  --security-group-ids sg-xxxxx \
  --subnet-id subnet-xxxxx \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=nexus-backend-1}]'
```

**Step 2: Configure Instance**
```bash
# SSH into instance
ssh -i nexus-keypair.pem ubuntu@<public-ip>

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs npm

# Install Git
sudo apt install -y git

# Install PM2 (process manager)
sudo npm install -g pm2

# Clone repository
git clone https://github.com/claytonmarcelo/nexus-control-app.git
cd nexus-control-app/backend

# Install dependencies
npm ci --production

# Set environment variables
cat > .env << EOF
NODE_ENV=production
PORT=80
DATABASE_URL=mysql://admin:password@<rds-endpoint>/nexus_control
JWT_SECRET=$(openssl rand -base64 32)
FRONTEND_URL=https://nexus-control.com
LOG_LEVEL=info
EOF

# Start application
pm2 start "npm start" --name "nexus-backend"
pm2 save
sudo pm2 startup
```

**Step 3: Configure CloudWatch Agent**
```bash
# Install CloudWatch Agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
sudo dpkg -i amazon-cloudwatch-agent.deb

# Configure (logs + metrics)
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-config-wizard
```

**Step 4: Health Check Verification**
```bash
# Verify /api/health endpoint
curl http://localhost/api/health
# Expected response: {"status": "ok", "timestamp": "2026-09-07T..."}
```

### Auto Scaling Configuration

**Launch Template**
```bash
Create with:
- User data script: Install Node.js + clone repo + start PM2
- Security group: nexus-backend-sg
- Key pair: nexus-keypair
```

**Auto Scaling Group**
```
- Min: 1
- Desired: 2
- Max: 4
- Health check: ALB (300s grace period)
- Cooldown: 300s
```

---

## Storage (S3)

### S3 Bucket Configuration

**Bucket: `nexus-control-assets`** (Product Images)
```bash
# Create bucket
aws s3api create-bucket --bucket nexus-control-assets --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket nexus-control-assets \
  --versioning-configuration Status=Enabled

# Block public access (via IAM roles)
aws s3api put-bucket-public-access-block \
  --bucket nexus-control-assets \
  --public-access-block-configuration \
  "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

# Set CORS
cat > cors.json << EOF
{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET"],
      "AllowedOrigins": ["https://nexus-control.com"],
      "MaxAgeSeconds": 3000
    }
  ]
}
EOF

aws s3api put-bucket-cors --bucket nexus-control-assets --cors-configuration file://cors.json

# Lifecycle policy (keep old versions 30 days)
cat > lifecycle.json << EOF
{
  "Rules": [
    {
      "Id": "DeleteOldVersions",
      "NoncurrentVersionExpirationInDays": 30,
      "Status": "Enabled"
    }
  ]
}
EOF

aws s3api put-bucket-lifecycle-configuration \
  --bucket nexus-control-assets \
  --lifecycle-configuration file://lifecycle.json
```

**Bucket: `nexus-control-backups`** (Database Backups)
```bash
# Similar setup with Glacier transition
aws s3api put-bucket-lifecycle-configuration \
  --bucket nexus-control-backups \
  --lifecycle-configuration '{
    "Rules": [{
      "Id": "TransitionToGlacier",
      "Prefix": "daily/",
      "Transitions": [{
        "Days": 90,
        "StorageClass": "GLACIER"
      }],
      "Expiration": {
        "Days": 2555
      },
      "Status": "Enabled"
    }]
  }'
```

### IAM Policies for EC2

**Backend EC2 Role Policy**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "s3:PutObject",
      "Resource": "arn:aws:s3:::nexus-control-assets/*"
    },
    {
      "Effect": "Allow",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::nexus-control-assets/*"
    },
    {
      "Effect": "Allow",
      "Action": "s3:PutObject",
      "Resource": "arn:aws:s3:::nexus-control-backups/*"
    },
    {
      "Effect": "Allow",
      "Action": ["logs:PutLogEvents", "logs:CreateLogStream"],
      "Resource": "arn:aws:logs:*:*:*"
    }
  ]
}
```

---

## CDN (CloudFront)

### CloudFront Distribution Configuration

**Step 1: Create Distribution**
```bash
# Via AWS Console
1. Create distribution
2. Origin Settings:
   - Primary: ALB DNS (nexus-alb-123.us-east-1.elb.amazonaws.com)
   - S3: nexus-control-assets.s3.amazonaws.com
   - Custom Headers: X-Origin-Verify: <secret>
3. Cache Behaviors:
   - Pattern: /static/* → S3 (TTL: 86400s)
   - Pattern: /api/* → ALB (TTL: 0s, no cache)
   - Default → ALB (TTL: 3600s)
```

**Step 2: SSL/TLS Certificate**
```bash
# Request or import certificate in ACM
1. Request new certificate: *.nexus-control.com
2. Validate via DNS
3. Attach to CloudFront distribution
```

**Step 3: Custom Domain**
```bash
# Route53
1. Create record: nexus-control.com → CloudFront distribution
2. Type: CNAME or ALIAS
```

---

## Security Configuration

### SSL/TLS Setup

**Certificate (AWS Certificate Manager)**
```
Domain: *.nexus-control.com
Validation: DNS
Attach to: ALB + CloudFront
```

**ALB HTTPS Configuration**
```bash
# Listener: 443 → 80 (backend)
aws elbv2 create-listener \
  --load-balancer-arn <alb-arn> \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=<acm-cert-arn> \
  --default-actions Type=forward,TargetGroupArn=<tg-arn>

# Redirect HTTP → HTTPS
aws elbv2 create-listener \
  --load-balancer-arn <alb-arn> \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=redirect,RedirectConfig="{Protocol=HTTPS,Port=443,StatusCode=HTTP_301}"
```

### Security Groups

**ALB Security Group**
```
Inbound:
- 80/tcp from 0.0.0.0/0
- 443/tcp from 0.0.0.0/0
Outbound:
- All to EC2 SG
```

**EC2 Security Group**
```
Inbound:
- 80/tcp from ALB SG
- 22/tcp from <admin-ip>/32
Outbound:
- All traffic
```

**RDS Security Group**
```
Inbound:
- 3306/tcp from EC2 SG
Outbound:
- N/A (managed by AWS)
```

### Environment Variables (Secrets Manager)

**Step 1: Store secrets**
```bash
aws secretsmanager create-secret \
  --name nexus/production/env \
  --secret-string '{
    "JWT_SECRET": "...",
    "DATABASE_PASSWORD": "...",
    "FRONTEND_URL": "https://nexus-control.com",
    "NODE_ENV": "production"
  }'
```

**Step 2: Retrieve in EC2**
```bash
# During startup
aws secretsmanager get-secret-value --secret-id nexus/production/env | jq -r '.SecretString' > .env
```

---

## Backup & Disaster Recovery

### Backup Strategy

**Database Backups**
- Automated: RDS managed (30-day retention)
- Manual: Daily S3 backup via cron
- Cross-region: Copy to secondary region monthly

**Application Backups**
- EC2 AMI: Weekly snapshot of instance
- Code: Repository on GitHub (version control)
- Configuration: Secrets Manager + parameter store

### Disaster Recovery Plan

**RTO (Recovery Time Objective):** 2 hours  
**RPO (Recovery Point Objective):** 1 day

**Failover Steps:**
```
1. Detect: CloudWatch alarm triggers on primary failure
2. RDS Failover: Automatic (1-2 minutes)
3. EC2 Failover: Auto Scaling replaces unhealthy instance
4. DNS: Route53 failover (if needed)
5. Verification: Health check validation
```

---

## Monitoring & Logging

### CloudWatch Dashboards

**Real-Time Metrics**
```
- EC2: CPU%, Memory%, Disk I/O, Network
- RDS: CPU%, Database Connections, IOPS
- ALB: Request Count, Target Health, Response Time
- CloudFront: Cache Hit Rate, Requests, Errors
```

**Log Groups**
```
/aws/ec2/nexus-backend
/aws/rds/nexus-mysql
/aws/elbv2/nexus-alb
```

### Alarms

**Critical Alarms**
- EC2 CPU > 80% (Scale up)
- RDS CPU > 70% (Alert)
- RDS Storage > 80% (Alert)
- ALB Unhealthy Targets > 0 (Alert)
- API Response Time > 2s (Alert)

**Action:** SNS → Email/SMS notification

---

## Deployment Guide

### Initial Deployment

**Step 1: VPC Setup**
```bash
# Create VPC
aws ec2 create-vpc --cidr-block 10.0.0.0/16

# Create subnets
aws ec2 create-subnet --vpc-id vpc-xxxxx --cidr-block 10.0.1.0/24 --availability-zone us-east-1a
aws ec2 create-subnet --vpc-id vpc-xxxxx --cidr-block 10.0.2.0/24 --availability-zone us-east-1b

# Create internet gateway & route
```

**Step 2: RDS Setup**
```bash
# Launch RDS instance (see DB Setup section)
# Initialize database schema
# Create backup user
```

**Step 3: EC2 Setup**
```bash
# Launch instances (see Compute section)
# Install dependencies & start app
# Verify health checks
```

**Step 4: Load Balancer**
```bash
# Create ALB
# Register targets (EC2 instances)
# Create listeners (80→443, 443→backend)
```

**Step 5: CloudFront**
```bash
# Create distribution
# Attach ACM certificate
# Point domain to CloudFront
```

### Continuous Deployment

**GitHub Actions**
```yaml
# .github/workflows/deploy-production.yml
name: Deploy to Production
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build
        run: npm run build
      - name: Deploy to EC2
        run: |
          ssh -i ${{ secrets.EC2_KEY }} ubuntu@${{ secrets.EC2_IP }} \
          'cd ~/nexus-control-app && git pull && npm ci --production && pm2 restart all'
```

---

## Cost Optimization

### Recommended Sizing (Monthly Estimate)

| Service | Instance | Quantity | Cost/Month |
|---------|----------|----------|-----------|
| EC2 | t3.medium | 2 | $60 |
| RDS | db.t3.small | 1 | $50 |
| S3 | Storage (100GB) | 1 | $2.30 |
| CloudFront | Data transfer | - | $15 |
| ALB | Load balancer | 1 | $22.50 |
| Data Transfer | Outbound (100GB) | 1 | $9 |
| **Total** | | | **~$158/month** |

### Cost Saving Tips
1. Use Reserved Instances (1-year, ~40% discount)
2. Right-size EC2 (start t3.micro, scale as needed)
3. Enable S3 lifecycle policies (transition to Glacier)
4. Use CloudFront caching aggressively
5. Monitor unused resources via Cost Explorer

---

## Production Checklist

- [ ] RDS backup automated
- [ ] SSL/TLS certificate installed
- [ ] Security groups configured
- [ ] CloudWatch monitoring active
- [ ] Auto Scaling configured
- [ ] Health checks verified
- [ ] DNS records pointing to CloudFront
- [ ] Application environment variables set
- [ ] Database schema migrated
- [ ] Load testing completed (target: 100 req/s)
- [ ] Disaster recovery tested
- [ ] Team trained on operations

---

## Support & Resources

- **AWS Academy:** https://www.awsacademy.com/
- **AWS Documentation:** https://docs.aws.amazon.com/
- **AWS CLI Reference:** https://docs.aws.amazon.com/cli/latest/userguide/
- **RDS Best Practices:** https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/

---

**Last Updated:** September 2026  
**Maintained By:** Development Team  
**Next Review:** December 2026
