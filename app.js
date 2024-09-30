const express = require("express");
const mysql = require("mysql2");
const nodemailer = require("nodemailer");

const sendOTPController = require("./controllers/send-otp");
const verifyOTPController = require("./controllers/verify-otp");
const signupController = require("./controllers/signup");
const loginController = require("./controllers/login");

const app = express();
const port = process.env.PORT || 3000;

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

// Routes
app.post("/api/send-otp", sendOTPController.sendOTP);
app.post("/api/verify-otp", verifyOTPController.verifyOTP);
app.post("/api/register", signupController.signup);
app.post("/api/login", loginController.login);

app.get("/test", (req, res) => {
  res.json({ message: "Test route working" });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
