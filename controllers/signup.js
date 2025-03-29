const bcrypt = require("bcrypt");

exports.signup = async (req, res) => {
	const { username, email, password } = req.body;

	if (!username || !email || !password) {
		return res
			.status(400)
			.json({ message: "Username, email, and password are required" });
	}

	try {
		const hashedPassword = await bcrypt.hash(password, 10);
		const query =
			"INSERT INTO users (username, email, password) VALUES ($1, $2, $3)";

		req.app.locals.db.query(
			query,
			[username, email, hashedPassword],
			(err, result) => {
				if (err) {
					if (err.code === "23505") {
						// PostgreSQL duplicate entry error code
						return res
							.status(409)
							.json({ message: "Email or username already exists" });
					}
					console.error("Error registering user:", err);
					return res.status(500).json({ message: "Error registering user" });
				}
				res.status(201).json({ message: "User registered successfully" });
			}
		);
	} catch (error) {
		console.error("Error hashing password:", error);
		res.status(500).json({ message: "Error registering user" });
	}
};
