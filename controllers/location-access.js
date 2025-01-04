const crypto = require("crypto");

// In-memory storage for WebSocket connections
const activeConnections = new Map();

// Utility function to execute database queries
const executeQuery = (db, query, params) => {
  return new Promise((resolve, reject) => {
    db.query(query, params, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

// Generate Token and Save Location
exports.generateToken = async (req, res) => {
  const { userid, location } = req.body;

  if (!userid || !location?.latitude || !location?.longitude) {
    return res
      .status(400)
      .json({ message: "User ID and location are required." });
  }

  try {
    const embeddedData = `${userid}:${location.latitude}:${location.longitude}`;
    const token = crypto
      .createHmac("sha256", "your_secret_key")
      .update(embeddedData)
      .digest("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // Token valid for 1 day

    // Save the token in the database
    const tokenQuery = `
      INSERT INTO tokens (token, userid, expires_at)
      VALUES (?, ?, ?)
    `;
    await executeQuery(req.app.locals.db, tokenQuery, [
      token,
      userid,
      expiresAt,
    ]);

    // Save the user's location in the database
    const locationQuery = `
      INSERT INTO userslocation (userid, latitude, longitude, updated_at)
      VALUES (?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        latitude = VALUES(latitude),
        longitude = VALUES(longitude),
        updated_at = NOW()
    `;
    await executeQuery(req.app.locals.db, locationQuery, [
      userid,
      location.latitude,
      location.longitude,
    ]);

    res.json({ token, expiresAt });
  } catch (err) {
    console.error("Error generating token or saving location:", err);
    res
      .status(500)
      .json({ message: "An error occurred while generating the token." });
  }
};

// Update User's Location
exports.updateUserLocation = async (req, res) => {
  const { userid, latitude, longitude } = req.body;

  if (!userid || latitude === undefined || longitude === undefined) {
    return res
      .status(400)
      .json({ message: "User ID, latitude, and longitude are required." });
  }

  try {
    const locationQuery = `
      INSERT INTO userslocation (userid, latitude, longitude, updated_at)
      VALUES (?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        latitude = VALUES(latitude),
        longitude = VALUES(longitude),
        updated_at = NOW()
    `;
    await executeQuery(req.app.locals.db, locationQuery, [
      userid,
      latitude,
      longitude,
    ]);

    // Notify connected clients about the location update
    notifyClients(userid, { latitude, longitude });
    res.json({ message: "Location updated successfully." });
  } catch (err) {
    console.error("Error updating location:", err);
    res.status(500).json({ message: "Error updating location." });
  }
};

// Notify WebSocket Clients
const notifyClients = (userid, location) => {
  for (const [activeUserId, connection] of activeConnections) {
    if (activeUserId === userid) {
      connection.send(JSON.stringify({ type: "locationUpdate", location }));
    }
  }
};

// Fetch Location by Token
exports.getLocationByToken = async (req, res) => {
  const { token } = req.params;

  if (!token) {
    return res.status(400).json({ message: "Token is required." });
  }

  try {
    const tokenQuery = `
      SELECT userid FROM tokens WHERE token = ? AND expires_at > NOW()
    `;
    const result = await executeQuery(req.app.locals.db, tokenQuery, [token]);

    if (result.length === 0) {
      return res.status(404).json({ message: "Token is invalid or expired." });
    }

    const userid = result[0].userid;
    const locationQuery = `
      SELECT latitude, longitude FROM userslocation WHERE userid = ? ORDER BY updated_at DESC LIMIT 1
    `;
    const locationResult = await executeQuery(
      req.app.locals.db,
      locationQuery,
      [userid]
    );

    if (locationResult.length === 0) {
      return res
        .status(404)
        .json({ message: "No location found for the user." });
    }

    res.json(locationResult[0]);
  } catch (err) {
    console.error("Error fetching location:", err);
    res.status(500).json({ message: "Error fetching location." });
  }
};

// Initialize WebSocket
exports.initializeWebSocket = (wss, db) => {
  wss.on("connection", (ws) => {
    ws.on("message", async (message) => {
      try {
        const data = JSON.parse(message);

        if (data.type === "subscribe" && data.token) {
          const tokenQuery = `
            SELECT userid FROM tokens
            WHERE token = ? AND expires_at > NOW()
          `;
          const result = await executeQuery(db, tokenQuery, [data.token]);

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
    });
  });
};
