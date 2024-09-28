const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

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

// Store OTPs temporarily (in production, use a more robust solution like Redis)
const otpStore = new Map();

// Generate OTP
function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

// Send OTP
app.post("/api/send-otp", async (req, res) => {
  console.log("Send OTP route hit");
  console.log("Request body:", req.body);

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  const otp = generateOTP();
  otpStore.set(email, otp);

  const mailOptions = {
    from: "your-email@gmail.com",
    to: email,
    subject: "Your OTP for registration",
    text: `Your OTP is: ${otp}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ message: "Error sending OTP" });
  }
});

// User registration with OTP verification
app.post("/api/register", async (req, res) => {
  console.log("Register route hit");
  console.log("Request body:", req.body);

  const { email, password, otp } = req.body;

  if (!email || !password || !otp) {
    return res
      .status(400)
      .json({ message: "Email, password, and OTP are required" });
  }

  // Verify OTP
  const storedOTP = otpStore.get(email);
  if (!storedOTP || storedOTP !== otp) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = "INSERT INTO users (email, password) VALUES (?, ?)";

    db.query(query, [email, hashedPassword], (err, result) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(409).json({ message: "Email already exists" });
        }
        return res.status(500).json({ message: "Error registering user" });
      }
      // Remove the OTP from storage after successful registration
      otpStore.delete(email);
      res.status(201).json({ message: "User registered successfully" });
    });
  } catch (error) {
    res.status(500).json({ message: "Error registering user" });
  }
});

// User login
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const query = "SELECT * FROM users WHERE email = ?";

  db.query(query, [email], async (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Error logging in" });
    }

    if (results.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const user = results[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    res.json({ message: "Login successful", userId: user.id });
  });
});

// ... rest of your code ...

app.get("/test", (req, res) => {
  res.json({ message: "Test route working" });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
