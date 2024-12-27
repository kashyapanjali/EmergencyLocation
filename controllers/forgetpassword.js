const crypto = require("crypto");

exports.forgetPassword = (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  const db = req.app.locals.db;
  const transporter = req.app.locals.transporter;

  // Generate a secure token
  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetTokenExpiresAt = new Date(Date.now() + 3600000); // 1 hour

  // Update the user's reset token in the database
  const query = `
    UPDATE users
    SET reset_token = ?, reset_token_expires_at = ?
    WHERE email = ?
  `;

  db.query(query, [resetToken, resetTokenExpiresAt, email], (err, result) => {
    if (err) {
      console.error("Error updating reset token:", err);
      return res.status(500).json({ message: "Error processing request" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // Corrected reset link pointing to frontend
    const resetLink = `http://localhost:3000/reset-password/${resetToken}`;
    const mailOptions = {
      from: "niteshalexa@gmail.com",
      to: email,
      subject: "Password Reset Request",
      text: `You requested a password reset. Click the link to reset your password: ${resetLink}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
        return res.status(500).json({ message: "Error sending email" });
      }

      res.status(200).json({ message: "Reset link sent to your email" });
    });
  });
};
