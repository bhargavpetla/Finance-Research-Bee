# EC2 Deployment Guide

This guide provides step-by-step instructions for deploying the Finance Research Bee application on AWS EC2.

## Port Configuration

- **Backend**: Port 3001
- **Frontend**: Port 9999
- **Nginx**: Port 80 (HTTP) / 443 (HTTPS)

---

## Prerequisites

- AWS EC2 instance (Recommended: t3.medium with Ubuntu 22.04 LTS)
- SSH key pair for EC2 access
- Domain name (optional, for SSL)
- Security group configured to allow:
  - Port 22 (SSH)
  - Port 80 (HTTP)
  - Port 443 (HTTPS)
  - Port 3001 (Backend - for testing)
  - Port 9999 (Frontend - for testing)

---

## Step 1: Launch and Connect to EC2 Instance

```bash
# SSH into your EC2 instance
ssh -i "your-key.pem" ubuntu@your-ec2-public-ip
```

---

## Step 2: Initial Server Setup

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js (v18 or higher)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify Node.js installation
node --version
npm --version

# Install pnpm globally
sudo npm install -g pnpm

# Install MySQL Server
sudo apt install -y mysql-server

# Install Nginx (reverse proxy)
sudo apt install -y nginx

# Install PM2 (process manager for Node.js)
sudo npm install -g pm2

# Install Git
sudo apt install -y git

# Install build essentials (may be needed for some npm packages)
sudo apt install -y build-essential
```

---

## Step 3: Configure MySQL Database

```bash
# Secure MySQL installation
sudo mysql_secure_installation
# Answer the prompts:
# - Set root password: YES (choose a strong password)
# - Remove anonymous users: YES
# - Disallow root login remotely: YES
# - Remove test database: YES
# - Reload privilege tables: YES

# Login to MySQL
sudo mysql -u root -p

# Create database and user (run these SQL commands)
CREATE DATABASE financial_data_scraper;
CREATE USER 'appuser'@'localhost' IDENTIFIED BY 'your_strong_password_here';
GRANT ALL PRIVILEGES ON financial_data_scraper.* TO 'appuser'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

---

## Step 4: Clone and Setup Application

```bash
# Create application directory
sudo mkdir -p /var/www/finance-research-bee
sudo chown -R $USER:$USER /var/www/finance-research-bee

# Navigate to directory
cd /var/www/finance-research-bee

# Clone your repository (replace with your repo URL)
git clone https://github.com/your-username/Finance-Research-Bee.git .

# Verify files
ls -la
```

---

## Step 5: Configure Backend Environment

```bash
# Navigate to backend directory
cd /var/www/finance-research-bee/backend

# Copy environment example
cp .env.example .env

# Edit environment file
nano .env
```

**Update `.env` with these values:**

```env
# Database Configuration
DATABASE_URL=mysql://appuser:your_strong_password_here@localhost:3306/financial_data_scraper

# JWT Secret (generate using: openssl rand -base64 32)
JWT_SECRET=<paste_generated_secret_here>

# Perplexity API
PERPLEXITY_API_KEY=pplx-your-actual-key

# AWS S3 (if using)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
AWS_S3_BUCKET=

# Server Configuration
PORT=3001
NODE_ENV=production

# CORS Configuration
CORS_ORIGIN=http://your-ec2-public-ip
```

**Generate JWT Secret:**

```bash
openssl rand -base64 32
```

---

## Step 6: Configure Frontend Environment

```bash
# Navigate to frontend directory
cd /var/www/finance-research-bee/frontend

# Copy environment example
cp .env.example .env

# Edit environment file
nano .env
```

**Update `.env` with:**

```env
# Backend API URL
VITE_API_URL=http://your-ec2-public-ip/api
```

---

## Step 7: Install Dependencies and Build

```bash
# Install backend dependencies
cd /var/www/finance-research-bee/backend
pnpm install

# Install frontend dependencies
cd /var/www/finance-research-bee/frontend
pnpm install

# Build frontend
pnpm run build

# Build backend
cd /var/www/finance-research-bee/backend
pnpm run build
```

---

## Step 8: Run Database Migrations

```bash
cd /var/www/finance-research-bee/backend
pnpm run db:push
```

---

## Step 9: Start Backend with PM2

```bash
cd /var/www/finance-research-bee/backend

# Start the backend application
pm2 start dist/index.js --name "finance-backend" --env production

# Check status
pm2 status

# View logs
pm2 logs finance-backend

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
# Copy and run the command it outputs (starts with 'sudo env PATH=...')
```

---

## Step 10: Configure Nginx as Reverse Proxy

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/finance-research-bee
```

**Add this configuration:**

```nginx
server {
    listen 80;
    server_name your-ec2-public-ip;  # Replace with your domain or IP

    # Increase client body size for file uploads
    client_max_body_size 50M;

    # Frontend (static files)
    location / {
        root /var/www/finance-research-bee/frontend/dist;
        try_files $uri $uri/ /index.html;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts for long-running scraping operations
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }

    # Uploads directory (if needed)
    location /uploads {
        alias /var/www/finance-research-bee/backend/uploads;
        autoindex off;
    }
}
```

**Enable the site:**

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/finance-research-bee /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Enable Nginx to start on boot
sudo systemctl enable nginx
```

---

## Step 11: Configure Firewall (UFW)

```bash
# Allow SSH (IMPORTANT: Do this first!)
sudo ufw allow OpenSSH

# Allow Nginx
sudo ufw allow 'Nginx Full'

# Allow backend port (for testing)
sudo ufw allow 3001

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

---

## Step 12: (Optional) Setup SSL with Let's Encrypt

**Only if you have a domain name:**

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow the prompts:
# - Enter email address
# - Agree to terms
# - Choose whether to redirect HTTP to HTTPS (recommended: YES)

# Test auto-renewal
sudo certbot renew --dry-run
```

**Update backend .env CORS_ORIGIN:**

```bash
cd /var/www/finance-research-bee/backend
nano .env
# Change CORS_ORIGIN to: https://yourdomain.com
```

**Restart backend:**

```bash
pm2 restart finance-backend
```

---

## Step 13: Verify Deployment

```bash
# Check PM2 status
pm2 status

# View backend logs
pm2 logs finance-backend --lines 50

# Check Nginx status
sudo systemctl status nginx

# Test backend API
curl http://localhost:3001/api/health

# Test from outside (replace with your IP)
curl http://your-ec2-public-ip/api/health

# Check disk space
df -h

# Check memory usage
free -h
```

**Open in browser:**

- Frontend: `http://your-ec2-public-ip`
- Backend API: `http://your-ec2-public-ip/api/health`

---

## Maintenance Commands

### Update Application

```bash
# Navigate to app directory
cd /var/www/finance-research-bee

# Pull latest changes
git pull origin main

# Update backend
cd backend
pnpm install
pnpm run build
pm2 restart finance-backend

# Update frontend
cd ../frontend
pnpm install
pnpm run build

# No need to restart Nginx (static files updated)
```

### View Logs

```bash
# Backend application logs
pm2 logs finance-backend

# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log

# MySQL logs
sudo tail -f /var/log/mysql/error.log
```

### Restart Services

```bash
# Restart backend
pm2 restart finance-backend

# Restart Nginx
sudo systemctl restart nginx

# Restart MySQL
sudo systemctl restart mysql

# Restart all PM2 processes
pm2 restart all
```

### Database Backup

```bash
# Create backup
mysqldump -u appuser -p financial_data_scraper > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup
mysql -u appuser -p financial_data_scraper < backup_20231223_120000.sql
```

---

## Monitoring

### Setup CloudWatch (Optional)

```bash
# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
sudo dpkg -i -E ./amazon-cloudwatch-agent.deb
```

### Monitor Resources

```bash
# Install htop for better monitoring
sudo apt install -y htop

# Monitor in real-time
htop

# Check CPU and memory
top

# Check disk usage
df -h

# Check disk I/O
iostat

# Check network connections
netstat -tulpn
```

### PM2 Monitoring

```bash
# Monitor with PM2
pm2 monit

# Get detailed info
pm2 info finance-backend

# Check PM2 startup script
pm2 startup
```

---

## Troubleshooting

### Backend Not Starting

```bash
# Check logs
pm2 logs finance-backend --err

# Check if port is in use
sudo lsof -i :3001

# Test backend directly
cd /var/www/finance-research-bee/backend
NODE_ENV=production node dist/index.js
```

### Database Connection Issues

```bash
# Check MySQL status
sudo systemctl status mysql

# Test MySQL connection
mysql -u appuser -p financial_data_scraper

# Check MySQL logs
sudo tail -f /var/log/mysql/error.log
```

### Nginx Issues

```bash
# Test configuration
sudo nginx -t

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log

# Restart Nginx
sudo systemctl restart nginx
```

### CORS Errors

- Ensure `CORS_ORIGIN` in backend `.env` matches your frontend URL
- Check Nginx proxy headers are set correctly
- Restart backend after changing CORS settings: `pm2 restart finance-backend`

### Out of Memory

```bash
# Check memory usage
free -h

# Check swap
swapon --show

# Add swap if needed (2GB example)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## Security Best Practices

1. **Keep system updated:**

   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **Secure .env files:**

   ```bash
   chmod 600 /var/www/finance-research-bee/backend/.env
   chmod 600 /var/www/finance-research-bee/frontend/.env
   ```

3. **Disable root SSH login:**

   ```bash
   sudo nano /etc/ssh/sshd_config
   # Set: PermitRootLogin no
   sudo systemctl restart sshd
   ```

4. **Setup fail2ban (prevent brute force):**

   ```bash
   sudo apt install -y fail2ban
   sudo systemctl enable fail2ban
   sudo systemctl start fail2ban
   ```

5. **Regular backups:**
   - Database backups (daily)
   - Application code (version control)
   - Environment files (secure storage)

6. **Monitor logs regularly:**
   ```bash
   # Check for suspicious activity
   sudo tail -f /var/log/auth.log
   ```

---

## Cost Optimization

- Use **t3.medium** for production (~$30/month)
- Use **gp3** EBS volumes (cheaper than gp2)
- Setup CloudWatch alarms for cost monitoring
- Consider Reserved Instances for long-term savings
- Use Elastic IP to avoid IP changes

---

## Scaling Considerations

### Vertical Scaling (Upgrade Instance)

```bash
# Stop PM2 processes
pm2 stop all

# Stop instance from AWS console
# Change instance type
# Start instance
# SSH back in

# Start PM2 processes
pm2 start all
```

### Horizontal Scaling (Load Balancer)

- Setup Application Load Balancer (ALB)
- Deploy multiple EC2 instances
- Use RDS for shared database
- Use S3 for shared file storage

---

## Quick Reference

| Service  | Port       | URL                |
| -------- | ---------- | ------------------ |
| Frontend | 9999 (dev) | http://your-ip     |
| Backend  | 3001       | http://your-ip/api |
| Nginx    | 80/443     | http://your-ip     |
| MySQL    | 3306       | localhost only     |

**Important Files:**

- Backend config: `/var/www/finance-research-bee/backend/.env`
- Frontend config: `/var/www/finance-research-bee/frontend/.env`
- Nginx config: `/etc/nginx/sites-available/finance-research-bee`
- PM2 logs: `~/.pm2/logs/`

---

## Support

If you encounter issues:

1. Check logs (PM2, Nginx, MySQL)
2. Verify environment variables
3. Test each component individually
4. Check AWS Security Groups
5. Verify firewall rules (UFW)

Good luck with your deployment! 🚀
