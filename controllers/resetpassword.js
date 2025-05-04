const bcrypt = require("bcrypt");

exports.resetPassword = (req, res) => {
  const { token } = req.params; // Extract token from URL
  const { newPassword } = req.body; // Extract new password from request body

  if (!newPassword || newPassword.length < 6) {
    return res
      .status(400)
      .json({ message: "Password must be at least 6 characters long." });
  }

  const db = req.app.locals.db; // Access database connection

  // Verify the token
  const query = `SELECT userid FROM users WHERE reset_token = $1 AND reset_token_expires_at > NOW()`;
  db.query(query, [token], (err, results) => {
    if (err) {
      console.error("Error verifying token:", err);
      return res.status(500).json({ message: "Internal server error." });
    }

    if (results.rows.length === 0) {
      return res.status(400).json({ message: "Invalid or expired token." });
    }

    // Hash the new password asynchronously
    bcrypt.hash(newPassword, 10, (err, hashedPassword) => {
      if (err) {
        console.error("Error hashing password:", err);
        return res.status(500).json({ message: "Error hashing password." });
      }

      // Update the password in the database
      const updateQuery = `
        UPDATE users
        SET password = $1, reset_token = NULL, reset_token_expires_at = NULL
        WHERE reset_token = $2
      `;
      db.query(updateQuery, [hashedPassword, token], (err, result) => {
        if (err) {
          console.error("Error updating password:", err);
          return res.status(500).json({ message: "Error updating password." });
        }

        res.json({ message: "Password reset successful." });
      });
    });
  });
};
