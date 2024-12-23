const express = require("express");
const mysql = require("mysql2");
const nodemailer = require("nodemailer");
const cors = require("cors");
const http = require("http");
const WebSocket = require("ws");

const sendOTPController = require("./controllers/send-otp");
const verifyOTPController = require("./controllers/verify-otp");
const signupController = require("./controllers/signup");
const loginController = require("./controllers/login");
const locationController = require("./controllers/location-access");
const forgetPasswordController = require("./controllers/forgetpassword");
const resetPasswordController = require("./controllers/resetpassword");

const app = express();
const server = http.createServer(app);

// WebSocket server
const wss = new WebSocket.Server({ server });

// Initialize WebSocket in location controller
locationController.initialize(wss);

const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Database connection
const db = mysql.createConnection({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "anjalisql123@#*",
  database: "locationproject",
});

db.connect((err) => {
  if (err) {
    console.error("Error connecting to the database:", err);
    return;
  }
  console.log("Connected to the database");
});

// Email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "niteshalexa@gmail.com",
    pass: "tojd sanw xrbn oxur",
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Store db and transporter in app.locals for use in controllers
app.locals.db = db;
app.locals.transporter = transporter;

// Routes
app.post("/api/send-otp", sendOTPController.sendOTP);
app.post("/api/verify-otp", verifyOTPController.verifyOTP);
app.post("/api/register", signupController.signup);
app.post("/api/login", loginController.login);
app.post("/api/forget-password", forgetPasswordController.forgetPassword);
app.post("/api/reset-password", resetPasswordController.resetPassword);

// Route to receive location updates
// app.get("/api/frontendcall", (req, res) => {
//   console.log("frontend call");
// Call the function to send WebSocket message
//   locationController.sendLocationUpdate();
//   res.json({ message: "hello" });
// });

// call frontend to save or update location
app.post("/api/location", (req, res) => {
  const { latitude, longitude, userid } = req.body;

  if (!latitude || !longitude || !userid) {
    return res
      .status(400)
      .json({ message: "Latitude, longitude, and user ID are required." });
  }

  // Use INSERT ... ON DUPLICATE KEY UPDATE to insert or update location
  const query = `
    INSERT INTO userslocation (userid, latitude, longitude)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE
      latitude = VALUES(latitude),
      longitude = VALUES(longitude),
      updated_at = CURRENT_TIMESTAMP
  `;

  req.app.locals.db.query(
    query,
    [userid, latitude, longitude],
    (err, result) => {
      if (err) {
        console.error("Error saving location:", err);
        return res.status(500).json({ message: "Error saving location" });
      }
      res.json({ message: "Location saved or updated successfully" });
    }
  );
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
