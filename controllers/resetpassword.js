const bcrypt = require("bcrypt");

exports.resetPassword = (req, res) => {
  const { token } = req.params; // Extract token from URL
  const { newPassword } = req.body; // Extract new password from request body

  if (!newPassword) {
    return res.status(400).json({ message: "New password is required." });
  }

  const db = req.app.locals.db; // Access database connection

  // Verify the token
  const query = `SELECT id FROM users WHERE reset_token = ? AND reset_token_expires_at > NOW()`;
  db.query(query, [token], (err, results) => {
    if (err) {
      console.error("Error verifying token:", err);
      return res.status(500).json({ message: "Internal server error." });
    }

    if (results.length === 0) {
      return res.status(400).json({ message: "Invalid or expired token." });
    }

    // Hash the new password
    const hashedPassword = bcrypt.hashSync(newPassword, 10);

    // Update the password in the database
    const updateQuery = `
      UPDATE users
      SET password = ?, reset_token = NULL, reset_token_expires_at = NULL
      WHERE reset_token = ?
    `;
    db.query(updateQuery, [hashedPassword, token], (err, result) => {
      if (err) {
        console.error("Error updating password:", err);
        return res.status(500).json({ message: "Error updating password." });
      }

      res.json({ message: "Password reset successful." });
    });
  });
};
