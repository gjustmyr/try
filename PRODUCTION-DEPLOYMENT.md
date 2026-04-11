# Production Deployment Guide

## Overview

This guide covers building and deploying your marketplace system to production.

## Prerequisites

### Required Software

- Node.js 18+ and npm
- PostgreSQL 14+
- Git
- PM2 (for process management)
- Nginx (for reverse proxy)

### Server Requirements

- Minimum 2GB RAM
- 20GB storage
- Ubuntu 20.04+ or similar Linux distribution

## Step 1: Prepare Environment

### 1.1 Clone Repository

```bash
git clone <your-repo-url>
cd <project-directory>
```

### 1.2 Install Dependencies

#### Backend

```bash
cd server
npm install --production
```

#### Frontend

```bash
cd client
npm install
```

## Step 2: Configure Environment Variables

### 2.1 Backend Environment (.env)

```bash
cd server
cp .env.example .env
nano .env
```

Update with production values:

```env
# Server
NODE_ENV=production
PORT=8000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=marketplace_prod
DB_USER=your_db_user
DB_PASSWORD=your_secure_password

# JWT
JWT_SECRET=your_very_long_random_secret_key_here
JWT_EXPIRES_IN=7d

# Email (Production SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@yourmarketplace.com

# Frontend URL
FRONTEND_URL=https://yourmarketplace.com

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_DIR=./uploads

# CORS
CORS_ORIGIN=https://yourmarketplace.com
```

### 2.2 Frontend Environment

```bash
cd client/src/environments
```

Create `environment.prod.ts`:

```typescript
export const environment = {
  production: true,
  apiUrl: "https://api.yourmarketplace.com/api",
  // or if same domain: '/api'
};
```

## Step 3: Build Frontend for Production

### 3.1 Build Angular Application

```bash
cd client
npm run build
```

This creates optimized files in `client/dist/client/browser/`

### 3.2 Verify Build

```bash
ls -lh dist/client/browser/
# Should see index.html, main-*.js, styles-*.css, etc.
```

## Step 4: Setup Database

### 4.1 Create Production Database

```bash
sudo -u postgres psql
```

```sql
CREATE DATABASE marketplace_prod;
CREATE USER marketplace_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE marketplace_prod TO marketplace_user;
\q
```

### 4.2 Run Migrations

```bash
cd server
npm run migrate
# or if you have a migration script
node scripts/migrate.js
```

## Step 5: Setup Backend with PM2

### 5.1 Install PM2 Globally

```bash
sudo npm install -g pm2
```

### 5.2 Create PM2 Ecosystem File

```bash
cd server
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [
    {
      name: "marketplace-api",
      script: "./server.js",
      instances: 2, // or 'max' for all CPU cores
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 8000,
      },
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      autorestart: true,
      max_memory_restart: "1G",
      watch: false,
    },
  ],
};
```

### 5.3 Start Backend with PM2

```bash
# Create logs directory
mkdir -p logs

# Start application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
# Follow the command it outputs
```

### 5.4 Verify Backend is Running

```bash
pm2 status
pm2 logs marketplace-api
curl http://localhost:8000/api/health
```

## Step 6: Setup Nginx

### 6.1 Install Nginx

```bash
sudo apt update
sudo apt install nginx
```

### 6.2 Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/marketplace
```

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name yourmarketplace.com www.yourmarketplace.com;

    return 301 https://$server_name$request_uri;
}

# HTTPS Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yourmarketplace.com www.yourmarketplace.com;

    # SSL Configuration (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/yourmarketplace.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourmarketplace.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Root directory for Angular build
    root /var/www/marketplace/client/dist/client/browser;
    index index.html;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;

    # API Proxy
    location /api/ {
        proxy_pass http://localhost:8000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Uploads directory
    location /uploads/ {
        alias /var/www/marketplace/server/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Angular routing - serve index.html for all routes
    location / {
        try_files $uri $uri/ /index.html;
        expires -1;
        add_header Cache-Control "no-store, no-cache, must-revalidate";
    }

    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Deny access to hidden files
    location ~ /\. {
        deny all;
    }
}
```

### 6.3 Enable Site and Test Configuration

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/marketplace /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

## Step 7: Setup SSL with Let's Encrypt

### 7.1 Install Certbot

```bash
sudo apt install certbot python3-certbot-nginx
```

### 7.2 Obtain SSL Certificate

```bash
sudo certbot --nginx -d yourmarketplace.com -d www.yourmarketplace.com
```

### 7.3 Auto-renewal

```bash
# Test renewal
sudo certbot renew --dry-run

# Certbot automatically sets up a cron job for renewal
```

## Step 8: Copy Files to Server

### 8.1 Create Directory Structure

```bash
sudo mkdir -p /var/www/marketplace
sudo chown -R $USER:$USER /var/www/marketplace
```

### 8.2 Copy Backend Files

```bash
# From your local machine
rsync -avz --exclude 'node_modules' --exclude '.git' \
  server/ user@yourserver:/var/www/marketplace/server/

# On server, install dependencies
cd /var/www/marketplace/server
npm install --production
```

### 8.3 Copy Frontend Build

```bash
# From your local machine
rsync -avz client/dist/client/browser/ \
  user@yourserver:/var/www/marketplace/client/dist/client/browser/
```

## Step 9: Setup Firewall

```bash
# Allow SSH
sudo ufw allow OpenSSH

# Allow HTTP and HTTPS
sudo ufw allow 'Nginx Full'

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

## Step 10: Monitoring and Logs

### 10.1 PM2 Monitoring

```bash
# View logs
pm2 logs marketplace-api

# Monitor resources
pm2 monit

# View detailed info
pm2 info marketplace-api
```

### 10.2 Nginx Logs

```bash
# Access logs
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log
```

### 10.3 Application Logs

```bash
# Backend logs
tail -f /var/www/marketplace/server/logs/out.log
tail -f /var/www/marketplace/server/logs/err.log
```

## Step 11: Database Backup

### 11.1 Create Backup Script

```bash
nano /var/www/marketplace/scripts/backup-db.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/marketplace"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="marketplace_prod"

mkdir -p $BACKUP_DIR

pg_dump -U marketplace_user $DB_NAME | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Keep only last 7 days of backups
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete

echo "Backup completed: backup_$DATE.sql.gz"
```

### 11.2 Make Executable and Schedule

```bash
chmod +x /var/www/marketplace/scripts/backup-db.sh

# Add to crontab (daily at 2 AM)
crontab -e
```

Add line:

```
0 2 * * * /var/www/marketplace/scripts/backup-db.sh >> /var/log/db-backup.log 2>&1
```

## Step 12: Performance Optimization

### 12.1 Enable HTTP/2

Already enabled in Nginx config above

### 12.2 Setup Redis (Optional - for caching)

```bash
sudo apt install redis-server
sudo systemctl enable redis-server
```

### 12.3 Database Optimization

```sql
-- Create indexes for frequently queried fields
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_products_seller_id ON products(seller_id);
CREATE INDEX idx_deliveries_driver_id ON deliveries(driver_id);
CREATE INDEX idx_deliveries_status ON deliveries(status);
```

## Step 13: Security Checklist

- [ ] Change all default passwords
- [ ] Use strong JWT secret
- [ ] Enable firewall (UFW)
- [ ] Setup SSL/TLS certificates
- [ ] Configure CORS properly
- [ ] Disable directory listing
- [ ] Set proper file permissions
- [ ] Regular security updates
- [ ] Setup fail2ban for SSH protection
- [ ] Enable database connection encryption
- [ ] Implement rate limiting
- [ ] Regular backups

## Step 14: Deployment Script

Create `deploy.sh` for easy updates:

```bash
#!/bin/bash
set -e

echo "🚀 Starting deployment..."

# Pull latest code
echo "📥 Pulling latest code..."
git pull origin main

# Backend
echo "🔧 Updating backend..."
cd server
npm install --production
pm2 restart marketplace-api

# Frontend
echo "🎨 Building frontend..."
cd ../client
npm install
npm run build

# Copy to web root
echo "📦 Deploying frontend..."
sudo rsync -av --delete dist/client/browser/ /var/www/marketplace/client/dist/client/browser/

# Reload Nginx
echo "🔄 Reloading Nginx..."
sudo systemctl reload nginx

echo "✅ Deployment complete!"
```

Make executable:

```bash
chmod +x deploy.sh
```

## Quick Commands Reference

```bash
# Start services
pm2 start ecosystem.config.js
sudo systemctl start nginx

# Stop services
pm2 stop marketplace-api
sudo systemctl stop nginx

# Restart services
pm2 restart marketplace-api
sudo systemctl restart nginx

# View logs
pm2 logs marketplace-api
sudo tail -f /var/log/nginx/error.log

# Check status
pm2 status
sudo systemctl status nginx

# Deploy updates
./deploy.sh
```

## Troubleshooting

### Backend not starting

```bash
# Check logs
pm2 logs marketplace-api --lines 100

# Check if port is in use
sudo lsof -i :8000

# Check environment variables
pm2 env marketplace-api
```

### Frontend not loading

```bash
# Check Nginx configuration
sudo nginx -t

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log

# Verify files exist
ls -la /var/www/marketplace/client/dist/client/browser/
```

### Database connection issues

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql -U marketplace_user -d marketplace_prod -h localhost
```

## Monitoring Tools (Optional)

### Install PM2 Plus (Advanced Monitoring)

```bash
pm2 plus
# Follow instructions to link account
```

### Setup Uptime Monitoring

- Use services like UptimeRobot, Pingdom, or StatusCake
- Monitor: https://yourmarketplace.com
- Monitor: https://yourmarketplace.com/api/health

## Summary

Your production deployment includes:

- ✅ Optimized Angular build
- ✅ PM2 process management with clustering
- ✅ Nginx reverse proxy with SSL
- ✅ Automatic SSL renewal
- ✅ Database backups
- ✅ Security hardening
- ✅ Monitoring and logging
- ✅ Easy deployment script

Your marketplace is now production-ready! 🎉
