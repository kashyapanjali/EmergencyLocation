const crypto = require("crypto");

function generateOTP() {
	return crypto.randomInt(100000, 999999).toString();
}

exports.sendOTP = async (req, res) => {
	const { email } = req.body;
	if (!email) {
		return res.status(400).json({ message: "Email is required" });
	}

	const otp = generateOTP();
	const expirationTime = new Date(Date.now() + 5 * 60 * 1000); // Expiry: 5 minutes

	try {
		const db = req.app.locals.db;
		const transporter = req.app.locals.transporter;

		// Store OTP in PostgreSQL (UPSERT if email exists)
		const query = `
      INSERT INTO otps (email, otp, expires_at)
      VALUES ($1, $2, $3)
      ON CONFLICT (email) DO UPDATE 
      SET otp = EXCLUDED.otp, expires_at = EXCLUDED.expires_at
    `;
		await db.query(query, [email, otp, expirationTime]);

		const mailOptions = {
			from: "anjali.official7061@gmail.com",
			to: email,
			subject: "Your OTP for registration",
			text: `Your OTP is: ${otp}. This OTP will expire in 5 minutes.`,
		};

		await transporter.sendMail(mailOptions);
		res.json({ message: "OTP sent successfully" });
	} catch (error) {
		console.error("Error sending OTP:", error);
		res
			.status(500)
			.json({ message: "Error sending OTP", error: error.message });
	}
};
