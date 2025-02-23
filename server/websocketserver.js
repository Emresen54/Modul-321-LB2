const WebSocket = require("ws");

const clients = [];

/**
 * Initializes the websocket server.
 * @example
 * initializeWebsocketServer(server);
 * @param {Object} server - The http server object.
 * @returns {void}
 */
const initializeWebsocketServer = (server) => {
  const websocketServer = new WebSocket.Server({ server });
  websocketServer.on("connection", onConnection);
};

/**
 * Handles a new websocket connection.
 * @example
 * onConnection(ws);
 * @param {Object} ws - The websocket object.
 * @returns {void}
 */
const onConnection = (ws) => {
  console.log("Neue WebSocket-Verbindung empfangen.");
  
  ws.on("message", (message) => onMessage(ws, message));

  // An alle Clients senden, wenn die Benutzerliste aktualisiert wird
  ws.on("close", () => {
      console.log("Der Benutzer hat die Verbindung geschlossen.");
      onDisconnect(ws);
  });

  sendUserList();
};

const sendUserList = () => {
  const usersMessage = {
      type: "users",
      users: clients
          .filter(client => client.user && client.user.benutzername)
          .map(client => ({
              benutzername: client.user.benutzername,
              online: client.user.online || 0
          }))
  };
  
  clients.forEach(client => {
      client.ws.send(JSON.stringify(usersMessage));
  });

  console.log("Liste der über WebSocket gesendeten Benutzer:", usersMessage);
};


// If a new message is received, the onMessage function is called
/**
 * Handles a new message from a websocket connection.
 * @example
 * onMessage(ws, messageBuffer);
 * @param {Object} ws - The websocket object.
 * @param {Buffer} messageBuffer - The message buffer. IMPORTANT: Needs to be converted to a string or JSON object first.
 */
const onMessage = (ws, messageBuffer) => {
  const messageString = messageBuffer.toString();
  const message = JSON.parse(messageString);
  console.log("Empfangene WebSocket-Nachricht:", message);

  switch (message.type) {
      case "user":
          if (!message.user || !message.user.benutzername) {
              console.error("Fehler: Benutzername fehlt!");
              return;
          }

          clients.push({ ws, user: message.user });
          sendUserList();
          break;

      case "message":
          clients.forEach(client => {
              client.ws.send(messageString);
          });
          break;

      default:
          console.log("⚠ Unbekannter Nachrichtentyp:", message.type);
  }
};


/**
 * Handles a websocket disconnect. All other clients are notified about the disconnect.
 * @example
 * onDisconnect(ws);
 * @param {Object} ws - The websocket object.
 * @returns {void}
 */
const onDisconnect = (ws) => {
  const index = clients.findIndex((client) => client.ws === ws);
  clients.splice(index, 1);
  const usersMessage = {
    type: "users",
    users: clients.map((client) => client.user),
  };
  clients.forEach((client) => {
    client.ws.send(JSON.stringify(usersMessage));
  });
};

module.exports = { initializeWebsocketServer };
