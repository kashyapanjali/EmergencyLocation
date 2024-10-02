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
  console.log("abc");
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
