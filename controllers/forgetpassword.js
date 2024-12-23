const crypto = require("crypto");

exports.forgetPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  // Check if the email exists in the database
  const query = "SELECT * FROM users WHERE email = ?";
  req.app.locals.db.query(query, [email], async (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Error checking email" });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Email not found" });
    }

    const user = results[0];
    const token = crypto.randomBytes(20).toString("hex"); // Generate a token
    const expirationTime = Date.now() + 3600000; // 1 hour from now

    // Store the token and expiration in the database
    const updateQuery =
      "UPDATE users SET resetPasswordToken = ?, resetPasswordExpires = ? WHERE email = ?";
    req.app.locals.db.query(
      updateQuery,
      [token, expirationTime, email],
      async (err) => {
        if (err) {
          return res.status(500).json({ message: "Error saving token" });
        }

        // Create the reset link
        const resetLink = `http://localhost:3000/reset-password?token=${token}&email=${email}`; // Adjust the domain as needed

        // Send email with the reset link
        const mailOptions = {
          from: "your-email@gmail.com",
          to: email,
          subject: "Password Reset",
          text: `You requested a password reset. Click the link to reset your password: ${resetLink}`,
        };

        try {
          await req.app.locals.transporter.sendMail(mailOptions);
          res.json({ message: "Password reset link sent successfully" });
        } catch (error) {
          console.error("Error sending email:", error);
          res.status(500).json({ message: "Error sending reset link" });
        }
      }
    );
  });
};
