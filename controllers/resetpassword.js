const bcrypt = require("bcrypt");

exports.resetPassword = async (req, res) => {
  const { email, password, token } = req.body;

  if (!email || !password || !token) {
    return res
      .status(400)
      .json({ message: "Email, new password, and token are required" });
  }

  // Verify the token and find the user
  const query =
    "SELECT * FROM users WHERE email = ? AND resetPasswordToken = ? AND resetPasswordExpires > ?";
  req.app.locals.db.query(
    query,
    [email, token, Date.now()],
    async (err, results) => {
      if (err) {
        return res.status(500).json({ message: "Error finding user" });
      }

      if (results.length === 0) {
        return res.status(400).json({ message: "Invalid or expired token" });
      }

      const user = results[0];

      // Hash the new password
      try {
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update the user's password and clear the reset token
        const updateQuery =
          "UPDATE users SET password = ?, resetPasswordToken = NULL, resetPasswordExpires = NULL WHERE id = ?";
        req.app.locals.db.query(
          updateQuery,
          [hashedPassword, user.id],
          (err) => {
            if (err) {
              return res
                .status(500)
                .json({ message: "Error updating password" });
            }

            res.json({ message: "Password has been successfully reset!" });
          }
        );
      } catch (error) {
        console.error("Error hashing password:", error);
        res.status(500).json({ message: "Error resetting password" });
      }
    }
  );
};
