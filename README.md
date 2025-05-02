# EmergencyLocation

An Emergency Location sharing application that allows users to share their real-time location with others through secure tokens.

## Features

- User registration and login with email verification
- OTP-based authentication
- Password reset functionality
- Location sharing with secure tokens
- Real-time location updates via WebSockets
- Location tracking for emergency situations

## Tech Stack

- **Backend**: Express.js
- **Database**: PostgreSQL
- **Real-time Communication**: WebSockets
- **Email Service**: Nodemailer
- **Authentication**: JWT and OTP

## Prerequisites

- Node.js (v14+)
- PostgreSQL
- npm or yarn

## Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/EmergencyLocation.git
   cd EmergencyLocation
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables
   ```
   PORT=3000
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   DB_NAME=emergencylocation
   EMAIL_SERVICE=gmail
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASSWORD=your_app_password
   ```

4. Set up PostgreSQL database
   ```sql
   CREATE DATABASE emergencylocation;
   CREATE USER appuser WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE emergencylocation TO appuser;
   ```

5. Create tables
   ```sql
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
   );
   ```

6. Start the server
   ```
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/send-otp` - Send OTP to email
- `POST /api/verify-otp` - Verify OTP
- `POST /api/register` - Register new user
- `POST /api/login` - Login user

### Password Management
- `POST /api/forget-password` - Request password reset
- `POST /api/reset-password/:token` - Reset password

### Location Services
- `POST /api/token` - Generate location sharing token
- `POST /api/location` - Update user location
- `GET /api/location/:token` - Get location by token

## Deployment

This application can be deployed to AWS using the Free Tier. See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

## License

This project is licensed under the ISC License.