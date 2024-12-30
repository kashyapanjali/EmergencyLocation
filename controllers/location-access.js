const WebSocket = require("ws");

let wss;

exports.initialize = (webSocketServer) => {
  wss = webSocketServer;

  wss.on("connection", (ws) => {
    console.log("A user connected");

    ws.on("close", () => {
      console.log("User disconnected");
    });
  });
};

exports.sendLocationUpdate = () => {
  if (wss) {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(
          JSON.stringify({
            type: "callFunction",
            functionName: "updateLocation",
            // data: { latitude, longitude },
          })
        );
      }
    });
  }
};

// New function to handle location updates
exports.handleLocationUpdate = (req, res) => {
  const { latitude, longitude, userid } = req.body;

  if (!latitude || !longitude || !userid) {
    return res
      .status(400)
      .json({ message: "Latitude, longitude, and user ID are required." });
  }

  // Use INSERT ... ON DUPLICATE KEY UPDATE to insert or update location
  const query = `
    INSERT INTO userslocation (userid, latitude, longitude)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE
      latitude = VALUES(latitude),
      longitude = VALUES(longitude),
      updated_at = CURRENT_TIMESTAMP
  `;

  req.app.locals.db.query(
    query,
    [userid, latitude, longitude],
    (err, result) => {
      if (err) {
        console.error("Error saving location:", err);
        return res.status(500).json({ message: "Error saving location" });
      }
      res.json({ message: "Location saved or updated successfully" });
    }
  );
};
