const crypto = require("crypto");

// In-memory storage for WebSocket connections
const activeConnections = new Map();

// Generate Token and Save Location in Database
exports.generateToken = async (req, res) => {
  const { userid, location } = req.body;

  if (!userid || !location) {
    return res
      .status(400)
      .json({ message: "User ID and location are required." });
  }

  // Generate a random token
  const token = crypto.randomBytes(16).toString("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // Token expires in 24 hours

  // Save token in the tokens table
  const tokenQuery = `
    INSERT INTO tokens (token, userid, expires_at)
    VALUES (?, ?, ?)
  `;
  req.app.locals.db.query(tokenQuery, [token, userid, expiresAt], (err) => {
    if (err) {
      console.error("Error generating token:", err);
      return res.status(500).json({ message: "Error generating token." });
    }

    // Save location in the userslocation table
    const locationQuery = `
      INSERT INTO userslocation (userid, latitude, longitude, updated_at)
      VALUES (?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        latitude = VALUES(latitude),
        longitude = VALUES(longitude),
        updated_at = NOW()
    `;
    req.app.locals.db.query(
      locationQuery,
      [userid, location.latitude, location.longitude],
      (err) => {
        if (err) {
          console.error("Error saving location:", err);
          return res.status(500).json({ message: "Error saving location." });
        }

        // Respond with the generated token
        res.json({ token, expiresAt });
      }
    );
  });
};

// Update User1's Location
exports.updateUserLocation = async (req, res) => {
  const { userid, latitude, longitude } = req.body;

  if (!userid || latitude === undefined || longitude === undefined) {
    return res
      .status(400)
      .json({ message: "User ID, latitude, and longitude are required." });
  }

  // Update the user's location in the database
  const locationQuery = `
    INSERT INTO userslocation (userid, latitude, longitude, updated_at)
    VALUES (?, ?, ?, NOW())
    ON DUPLICATE KEY UPDATE
      latitude = VALUES(latitude),
      longitude = VALUES(longitude),
      updated_at = NOW()
  `;
  req.app.locals.db.query(
    locationQuery,
    [userid, latitude, longitude],
    (err) => {
      if (err) {
        console.error("Error updating location:", err);
        return res.status(500).json({ message: "Error updating location." });
      }

      res.json({ message: "Location updated successfully." });
    }
  );
};

// Fetch current location using token (for User2)
exports.getLocationByToken = (req, res) => {
  const { token } = req.params;

  if (!token) {
    return res.status(400).json({ message: "Token is required." });
  }

  // Validate token and fetch associated user ID
  const tokenQuery = `
    SELECT userid FROM tokens WHERE token = ? AND expires_at > NOW()
  `;
  req.app.locals.db.query(tokenQuery, [token], (err, result) => {
    if (err) {
      console.error("Error validating token:", err);
      return res.status(500).json({ message: "Error validating token." });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: "Token is invalid or expired." });
    }

    const userid = result[0].userid;

    // Fetch the latest location of User1 from the userslocation table
    const locationQuery = `
      SELECT latitude, longitude FROM userslocation WHERE userid = ?
      ORDER BY updated_at DESC LIMIT 1
    `;
    req.app.locals.db.query(locationQuery, [userid], (err, locationResult) => {
      if (err) {
        console.error("Error fetching location:", err);
        return res.status(500).json({ message: "Error fetching location." });
      }

      if (locationResult.length === 0) {
        return res
          .status(404)
          .json({ message: "No location found for the user." });
      }

      // Return the latest location
      res.json(locationResult[0]);
    });
  });
};

// WebSocket handler to notify clients of location updates
exports.initializeWebSocket = (wss, db) => {
  wss.on("connection", (ws) => {
    console.log("WebSocket client connected");

    ws.on("message", (message) => {
      try {
        const data = JSON.parse(message);

        if (data.type === "subscribe" && data.token) {
          const tokenQuery = `
            SELECT userid FROM tokens
            WHERE token = ? AND expires_at > NOW()
          `;

          db.query(tokenQuery, [data.token], (err, result) => {
            if (err) {
              console.error("Error validating token:", err);
              ws.send(
                JSON.stringify({ type: "error", message: "Invalid token." })
              );
              return;
            }

            if (result.length === 0) {
              ws.send(
                JSON.stringify({
                  type: "error",
                  message: "Token expired or invalid.",
                })
              );
              return;
            }

            const userid = result[0].userid;
            activeConnections.set(userid, ws);

            ws.send(JSON.stringify({ type: "subscribed", userid }));
          });
        }
      } catch (err) {
        console.error("WebSocket message error:", err);
        ws.send(
          JSON.stringify({ type: "error", message: "Invalid message format." })
        );
      }
    });

    ws.on("close", () => {
      for (const [userid, connection] of activeConnections) {
        if (connection === ws) {
          activeConnections.delete(userid);
          break;
        }
      }
      console.log("WebSocket client disconnected");
    });
  });
};
