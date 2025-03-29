const { Pool } = require("pg");
const bcrypt = require("bcrypt");

const otpStore = new Map();
const pool = new Pool({
	host: process.env.DB_HOST,
	port: process.env.DB_PORT,
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_NAME,
	ssl: { rejectUnauthorized: false }, // Required for Render or other cloud services
});

exports.verifyOTP = async (req, res) => {
	const { email, otp } = req.body;

	if (!email || !otp) {
		return res.status(400).json({ message: "Email and OTP are required" });
	}

	const storedData = otpStore.get(email);
	if (!storedData) {
		return res.status(400).json({ message: "OTP not found or expired" });
	}

	const { otp: storedOTP, expirationTime } = storedData;

	if (Date.now() > expirationTime) {
		otpStore.delete(email);
		return res.status(400).json({ message: "OTP has expired" });
	}

	if (storedOTP !== otp) {
		return res.status(400).json({ message: "Invalid OTP" });
	}

	try {
		const userQuery = "SELECT * FROM users WHERE email = $1";
		const userResult = await pool.query(userQuery, [email]);
		let user = userResult.rows[0];

		if (!user) {
			const randomPassword = Math.random().toString(36).slice(-8);
			const hashedPassword = await bcrypt.hash(randomPassword, 10);

			const insertUserQuery =
				"INSERT INTO users (email, password, username) VALUES ($1, $2, NULL) RETURNING id, email";
			const insertResult = await pool.query(insertUserQuery, [
				email,
				hashedPassword,
			]);

			user = insertResult.rows[0];
		}

		otpStore.delete(email);
		res.json({
			message: "OTP verified successfully",
			userId: user.id,
			username: user.username,
		});
	} catch (error) {
		console.error("Database error:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

exports.otpStore = otpStore;
