# AWS Free Tier Deployment Guide

This guide explains how to deploy the Emergency Location application on AWS Free Tier using an EC2 instance.

## Prerequisites

1. AWS account with Free Tier access
2. GitHub repository with your application code
3. Basic knowledge of SSH and command line

## Step 1: Launch EC2 Instance

1. Sign in to the AWS Management Console
2. Navigate to EC2 Service
3. Click "Launch Instance"
4. Choose "Amazon Linux 2023 AMI" or "Ubuntu Server 22.04 LTS"
5. Select "t2.micro" instance type (Free Tier eligible)
6. Configure instance details (use defaults for free tier)
7. Add storage (defaults are fine for Free Tier)
8. Add tags (optional)
9. Configure Security Group:
   - Allow SSH (port 22) from your IP
   - Allow HTTP (port 80) from anywhere
   - Allow HTTPS (port 443) from anywhere
10. Review and launch
11. Create or select an existing key pair and download it
12. Launch instance

## Step 2: Connect to Your Instance

1. Open a terminal or command prompt
2. Navigate to where your key pair file (.pem) is saved
3. Set proper permissions for your key:
   ```
   chmod 400 yourkey.pem
   ```
4. Connect to your instance:
   ```
   ssh -i yourkey.pem ec2-user@your-instance-public-dns
   ```
   (Note: Use `ubuntu` instead of `ec2-user` if you launched an Ubuntu instance)

## Step 3: Deploy Your Application

1. Upload the `deploy.sh` script to your EC2 instance:
   ```
   scp -i yourkey.pem deploy.sh ec2-user@your-instance-public-dns:~
   ```

2. Make the script executable:
   ```
   chmod +x deploy.sh
   ```

3. Edit the script to update:
   - GitHub repository URL
   - Database credentials
   - Email service settings

4. Run the script:
   ```
   ./deploy.sh
   ```

## Step 4: Configure Domain Name (Optional)

1. Register a domain or use an existing one
2. Navigate to Route 53 in AWS Console
3. Create a hosted zone for your domain
4. Add an A record pointing to your EC2 instance's public IP

## Important Notes

1. **Free Tier Limits**: The AWS Free Tier includes 750 hours of t2.micro instance usage per month. This is enough to run one instance continuously for a month.

2. **Database Backup**: Regularly backup your PostgreSQL database to prevent data loss.

3. **Security Updates**: Regularly update your server with security patches:
   ```
   sudo apt-get update && sudo apt-get upgrade -y
   ```

4. **Monitoring**: Monitor your AWS usage to avoid exceeding Free Tier limits.

5. **Environment Variables**: Make sure to update the .env file with your actual credentials.

## Troubleshooting

- If your application doesn't start, check the PM2 logs:
  ```
  pm2 logs
  ```

- If you can't connect to the website, verify that:
  1. The Nginx service is running: `sudo systemctl status nginx`
  2. The security group allows HTTP traffic
  3. The application is running: `pm2 status`

- For database issues, check PostgreSQL logs:
  ```
  sudo tail -f /var/log/postgresql/postgresql-*.log
  ``` 