const bcrypt = require("bcrypt");

exports.login = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const query = "SELECT * FROM users WHERE email = ?";

  req.app.locals.db.query(query, [email], async (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Error logging in" });
    }

    if (results.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const user = results[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    res.json({
      message: "Login successful",
      userId: user.id,
    });
  });
};
