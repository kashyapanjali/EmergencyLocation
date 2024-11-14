const otpStore = new Map();
const bcrypt = require("bcrypt"); // Import bcrypt

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

  // OTP is valid, now check if the user exists in the database
  const queryFindUser = "SELECT * FROM users WHERE email = ?";
  req.app.locals.db.query(queryFindUser, [email], async (err, results) => {
    if (err) {
      console.error("Error finding user:", err);
      return res.status(500).json({ message: "Error checking user existence" });
    }

    let user = results[0];

    if (!user) {
      // If user does not exist, create a new user
      try {
        const randomPassword = Math.random().toString(36).slice(-8); // Generate a random password
        const hashedPassword = await bcrypt.hash(randomPassword, 10); // Hash the password

        const queryCreateUser =
          "INSERT INTO users (email, password, username) VALUES (?, ?, NULL)";

        // Use a promise to handle the query
        const result = await new Promise((resolve, reject) => {
          req.app.locals.db.query(
            queryCreateUser,
            [email, hashedPassword],
            (err, result) => {
              if (err) {
                console.error("Error saving user:", err);
                return reject(err); // Reject the promise on error
              }
              resolve(result); // Resolve the promise with the result
            }
          );
        });

        user = { id: result.insertId, email }; // Create a user object to return
      } catch (error) {
        console.error("Error hashing password:", error);
        return res.status(500).json({ message: "Error saving user" });
      }
    }

    // OTP is verified, return user information
    otpStore.delete(email); // Clean up OTP
    res.json({ message: "OTP verified successfully", userId: user.id });
  });
};

// Export otpStore to be used in other controllers
exports.otpStore = otpStore;
