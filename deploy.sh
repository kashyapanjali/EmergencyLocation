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
sudo -u postgres psql -c "CREATE USER appuser WITH PASSWORD 'your_password';"
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

# Clone the application
git clone https://github.com/yourusername/EmergencyLocation.git app
cd app

# Install dependencies
npm install

# Create .env file
cat > .env << EOL
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USER=appuser
DB_PASSWORD=your_password
DB_NAME=emergencylocation
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_email_app_password
EOL

# Install PM2 for process management
sudo npm install -g pm2

# Start the application with PM2
pm2 start app.js
pm2 startup
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu
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
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOL

# Restart Nginx
sudo systemctl restart nginx