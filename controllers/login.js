const bcrypt = require("bcrypt");

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    // Execute query with PostgreSQL placeholder syntax
    const result = await req.app.locals.db.query("SELECT * FROM users WHERE email = $1", [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }


    res.json({
      message: "Login successful",
      userId: user.userid,  // Add this line to include the userid from the database
      username: user.username,
    });
  } catch (err) {
    console.error("Error logging in:", err);
    return res.status(500).json({ message: "Error logging in" });
  }
};