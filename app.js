const express = require("express");
const mysql = require("mysql2");
const nodemailer = require("nodemailer");
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');

const sendOTPController = require("./controllers/send-otp");
const verifyOTPController = require("./controllers/verify-otp");
const signupController = require("./controllers/signup");
const loginController = require("./controllers/login");
const locationController = require("./controllers/location-access");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const port = process.env.PORT || 3000;

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
});

// Store db and transporter in app.locals for use in controllers
app.locals.db = db;
app.locals.transporter = transporter;

// Initialize location controller with Socket.IO
locationController.initialize(io);

// Routes
app.post("/api/send-otp", sendOTPController.sendOTP);
app.post("/api/verify-otp", verifyOTPController.verifyOTP);
app.post("/api/register", signupController.signup);
app.post("/api/login", loginController.login);

app.get("/test", (req, res) => {
  res.json({ message: "Test route working" });
});

// Route to receive location updates
app.post('/api/location', (req, res) => {
  const { latitude, longitude } = req.body;
  console.log(`Received location: ${latitude}, ${longitude}`);
  // Broadcast the location to all connected clients
  io.emit('locationUpdate', { latitude, longitude });
  res.json({ message: 'Location received and broadcasted' });
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
