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

  try {
    // OTP is valid, now check if the user exists in the database
    const queryFindUser = "SELECT * FROM users WHERE email = $1";
    const userResult = await req.app.locals.db.query(queryFindUser, [email]);

    let user = userResult.rows[0];

    if (!user) {
      // If user does not exist, create a new user
      const randomPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(randomPassword, 10);
      
      // Generate username from email
      const username = email.split('@')[0]; // Use part before @ as username

      const queryCreateUser = `
        INSERT INTO users (email, password, username) 
        VALUES ($1, $2, $3) 
        RETURNING id, email, username`;

      const result = await req.app.locals.db.query(queryCreateUser, [email, hashedPassword, username]);
      user = result.rows[0];
    }

    // OTP is verified, return user information
    otpStore.delete(email); // Clean up OTP
    res.json({
      message: "OTP verified successfully",
      userId: user.id,
      username: user.username,
      email: user.email
    });
  } catch (error) {
    return res.status(500).json({ message: "Error processing request" });
  }
};

// Export otpStore to be used in other controllers
exports.otpStore = otpStore;