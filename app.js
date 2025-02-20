const express = require("express");
const http = require("http");
const livereload = require("livereload");
const connectLiveReload = require("connect-livereload");
const path = require("path");
const bodyParser = require("express").json;
const { initializeWebsocketServer } = require("./server/websocketserver");
const { initializeAPI } = require("./server/api");
const { initializeMariaDB, initializeDBSchema, executeSQL } = require("./server/database");

const app = express();
const server = http.createServer(app);

// Middleware zum Parsen von JSON-Daten
app.use(bodyParser());

// Livereload für Entwicklung aktivieren
const env = process.env.NODE_ENV || "development";
if (env !== "production") {
  const liveReloadServer = livereload.createServer();
  liveReloadServer.server.once("connection", () => {
    setTimeout(() => liveReloadServer.refresh("/"), 100);
  });
  app.use(connectLiveReload());
}

// Statische Dateien ausliefern
app.use(express.static("client"));

// Standardroute: Registrierung (index.html)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "client", "index.html"));
});

// Hauptseite nach Registrierung oder Anmeldung (main.html)
app.get("/main", (req, res) => {
  res.sendFile(path.join(__dirname, "client", "main.html"));
});

// Registrierung eines Benutzers
app.post("/register", async (req, res) => {
  try {
    const { benutzername, passwort } = req.body;
    if (!benutzername || !passwort) {
      return res.status(400).json({ error: "Benutzername und Passwort erforderlich" });
    }
    await executeSQL("INSERT INTO users (benutzername, passwort) VALUES (?, ?);", [benutzername, passwort]);
    res.json({ success: true, message: "Registrierung erfolgreich", redirect: "/main" });
  } catch (error) {
    res.status(500).json({ error: "Fehler bei der Registrierung" });
  }
});

app.post("/login", async (req, res) => {
  try {
      const { benutzername, passwort } = req.body;
      console.log("Login-Versuch mit:", benutzername, passwort); // Debugging

      const result = await executeSQL("SELECT * FROM users WHERE benutzername = ? AND passwort = ?;", [benutzername, passwort]);

      if (result.length === 0) {
          console.log("Benutzer nicht gefunden oder falsches Passwort.");
          return res.status(400).json({ error: "Falsche Anmeldedaten" });
      }

      console.log("Login erfolgreich:", result[0]);
      res.json({ success: true, userId: result[0].id, benutzername: result[0].benutzername, redirect: "/main.html" });
  } catch (error) {
      console.error("Fehler beim Login:", error);
      res.status(500).json({ error: "Es gab ein Problem mit der Anmeldung." });
  }
});


// WebSocket- und API-Server initialisieren
initializeWebsocketServer(server);
initializeAPI(app);

// Datenbank initialisieren und Server starten
(async () => {
  initializeMariaDB();
  await initializeDBSchema();

  const serverPort = process.env.PORT || 3000;
  server.listen(serverPort, () => {
    console.log(`Server läuft auf Port ${serverPort} im '${env}' Modus.`);
  });
})();
