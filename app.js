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
const forgetPasswordController = require("./controllers/forgetpassword");
const resetPasswordController = require("./controllers/resetpassword");

const locationAccessController = require("./controllers/location-access");
//new
const locationController = require("./controllers/location-access");

const app = express();
const server = http.createServer(app);

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

// WebSocket server
const wss = new WebSocket.Server({ server });

// Initialize WebSocket in location controller
locationAccessController.initializeWebSocket(wss, db);

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
app.post("/api/reset-password/:token", resetPasswordController.resetPassword);
// Routes
app.post("/api/token", locationAccessController.generateToken);
app.post("/api/location", locationAccessController.updateUserLocation);
app.get("/api/location/:token", locationAccessController.getLocationByToken);

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
