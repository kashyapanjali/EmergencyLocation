require("dotenv").config();

const express = require("express");
const { Pool } = require("pg"); // PostgreSQL client
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
const locationAccessController = require("./controllers/location-access"); // new

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 5000;
app.options('*', cors());


app.use(cors({
	origin: ['https://brainbrief.in/', 'http://localhost:3000'],
	methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
	credentials: true
}));
app.use(express.json());

// PostgreSQL Database Connection
const pool = new Pool({
	host: process.env.DB_HOST,
	port: process.env.DB_PORT,
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_NAME,
	ssl: false, // disable SSL completely
	// ssl: { rejectUnauthorized: false }, 
});

// Test database connection
(async () => {
	try {
		const client = await pool.connect();
		console.log("Connected to PostgreSQL database");
		client.release();
	} catch (err) {
		console.error("PostgreSQL connection error:", err);
	}
})();

// WebSocket Server
const wss = new WebSocket.Server({ server });

if (typeof locationAccessController.initializeWebSocket === "function") {
	locationAccessController.initializeWebSocket(wss, pool);
} else {
	console.warn(
		"WebSocket initialization function is missing in locationAccessController"
	);
}

// Email transporter
const transporter = nodemailer.createTransport({
	service: process.env.EMAIL_SERVICE,
	auth: {
		user: process.env.EMAIL_USER,
		pass: process.env.EMAIL_PASSWORD,
	},
	tls: {
		rejectUnauthorized: false,
	},
});

// Store db and transporter in app.locals for controllers
app.locals.db = pool;
app.locals.transporter = transporter;

// Routes
app.post("/api/send-otp", sendOTPController.sendOTP);
app.post("/api/verify-otp", verifyOTPController.verifyOTP);
app.post("/api/register", signupController.signup);
app.post("/api/login", loginController.login);
app.post("/api/forget-password", forgetPasswordController.forgetPassword);
app.post("/api/reset-password/:token", resetPasswordController.resetPassword);

app.post("/api/token", locationAccessController.generateToken);
app.post("/api/location", locationAccessController.updateUserLocation);
app.get("/api/location/:token", locationAccessController.getLocationByToken);

server.listen(port, () => {
	console.log(`Server running on port ${port}`);
});
