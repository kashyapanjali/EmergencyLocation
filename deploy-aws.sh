#!/bin/bash

# This script helps set up and configure your AWS deployment
# It must be run locally before uploading to AWS

# Step 1: Prepare environment
echo "Step 1: Creating .env.production file..."
cat > .env.production << EOL
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USER=appuser
DB_PASSWORD=awspass
DB_NAME=emergencylocation
EMAIL_SERVICE=gmail
EMAIL_USER=anjali.official7061@gmail.com
EMAIL_PASSWORD=neez owhx ujns mpmy
EOL

echo "Please update the .env.production file with your actual values"

# Step 2: Check for AWS CLI
if ! command -v aws &> /dev/null; then
    echo "AWS CLI is not installed. Please install it to continue."
    echo "Visit: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
fi

# Step 3: Check AWS configuration
echo "Step 3: Checking AWS configuration..."
if ! aws configure list &> /dev/null; then
    echo "AWS CLI is not configured. Please run 'aws configure' and set up your credentials."
    exit 1
fi

# Step 4: Prepare deployment files
echo "Step 4: Preparing deployment files..."
echo "Creating deploy.sh script for EC2 instance..."
cat > deploy.sh << EOL
#!/bin/bash

# Update packages
sudo apt-get update
sudo apt-get upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib

# Configure PostgreSQL
sudo -u postgres psql -c "CREATE USER appuser WITH PASSWORD 'awspass';"
sudo -u postgres psql -c "CREATE DATABASE emergencylocation;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE emergencylocation TO appuser;"

# Create tables
sudo -u postgres psql -d emergencylocation -c "
CREATE TABLE IF NOT EXISTS users (
  userid SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tokens (
  token VARCHAR(255) PRIMARY KEY,
  userid INTEGER REFERENCES users(userid),
  expires_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS userslocation (
  userid INTEGER PRIMARY KEY REFERENCES users(userid),
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  updated_at TIMESTAMP NOT NULL
);"

# Install dependencies
cd ~
git clone https://github.com/yourusername/EmergencyLocation.git app
cd app
npm install

# Copy environment variables
cp /home/ubuntu/.env.production .env

# Install PM2 for process management
sudo npm install -g pm2

# Start the application with PM2
pm2 start app.js
pm2 startup
sudo env PATH=\$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu
pm2 save

# Configure Nginx as a reverse proxy
sudo apt-get install -y nginx
sudo tee /etc/nginx/sites-available/default > /dev/null << 'EOL'
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOL

# Restart Nginx
sudo systemctl restart nginx
EOL

echo "Step 5: Finalize preparations"
echo "Review deploy.sh and modify it as needed, especially:"
echo "1. Your GitHub repository URL"
echo "2. Database credentials"
echo "3. Email service settings"
echo ""
echo "After launching your EC2 instance, use these commands to deploy:"
echo "scp -i yourkey.pem .env.production ubuntu@your-ec2-public-dns:~/"
echo "scp -i yourkey.pem deploy.sh ubuntu@your-ec2-public-dns:~/"
echo "ssh -i yourkey.pem ubuntu@your-ec2-public-dns 'chmod +x deploy.sh && ./deploy.sh'"
echo ""
echo "All done! Follow the DEPLOYMENT.md guide for full instructions." 