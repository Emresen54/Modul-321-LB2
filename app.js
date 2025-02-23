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
      const user = await executeSQL("SELECT * FROM users WHERE benutzername = ? AND passwort = ?", [benutzername, passwort]);

      if (user.length > 0) {
          await executeSQL("UPDATE users SET online = 1 WHERE benutzername = ?", [benutzername]);
          console.log(`✅ ${benutzername} giriş yaptı!`);
          res.json({ success: true });
      } else {
          res.status(401).json({ success: false, message: "❌ Kullanıcı adı veya şifre yanlış!" });
      }
  } catch (error) {
      console.error("❌ Giriş işlemi sırasında hata:", error);
      res.status(500).json({ success: false, message: "Sunucu hatası!" });
  }
});


app.post("/api/login", async (req, res) => {
  try {
      const { benutzername, passwort } = req.body;
      const result = await executeSQL("SELECT * FROM users WHERE benutzername = ? AND passwort = ?;", [benutzername, passwort]);

      if (result.length === 0) {
          return res.status(400).json({ error: "Falsche Anmeldedaten" });
      }

      // Benutzer angemeldet, Online-Status auf 1 setzen
      await executeSQL("UPDATE users SET online = 1 WHERE benutzername = ?;", [benutzername]);

      res.json({ success: true, userId: result[0].id, benutzername: result[0].benutzername });
  } catch (error) {
      console.error("Fehler beim Login:", error);
      res.status(500).json({ error: "Fehler beim Login" });
  }
});


app.post("/check-user", async (req, res) => {
  const { benutzername, passwort } = req.body;

  //Überprüfen, ob Benutzername und Passwort vorhanden sind
  const result = await executeSQL(
      "SELECT * FROM users WHERE benutzername = ? OR passwort = ?;",
      [benutzername, passwort]
  );

  if (result.length > 0) {
      return res.json({ exists: true });
  } else {
      return res.json({ exists: false });
  }
});

app.post("/update-username", async (req, res) => {
  const { userId, benutzername } = req.body;

  // Prüfe, ob der Benutzername bereits existiert
  const checkUser = await executeSQL("SELECT * FROM users WHERE benutzername = ?;", [benutzername]);

  if (checkUser.length > 0) {
      return res.status(400).json({ success: false, error: "Dieser Benutzername ist bereits vergeben." });
  }

  // Falls nicht vergeben, Benutzername aktualisieren
  const update = await executeSQL("UPDATE users SET benutzername = ? WHERE id = ?;", [benutzername, userId]);

  if (update.affectedRows > 0) {
      res.json({ success: true });
  } else {
      res.status(500).json({ success: false, error: "Fehler beim Aktualisieren des Benutzernamens." });
  }
});


app.get("/get-users", async (req, res) => {
  try {
      console.log("Wir ziehen Benutzer aus der Datenbank ...");
      const users = await executeSQL("SELECT benutzername, online FROM users;");
      console.log("✅ Benutzer erfolgreich zurückgezogen:", users);
      res.json(users);
  } catch (error) {
      console.error("❌ Beim Abrufen der Benutzer ist ein Fehler aufgetreten:", error);
      res.status(500).json({ error: "Serverfehler" });
  }
});


app.post("/api/logout", async (req, res) => {
  try {
      const { benutzername } = req.body;
      if (!benutzername) return res.status(400).json({ error: "Benutzername erforderlich" });

      // Online-Wert zurücksetzen, wenn sich der Benutzer abmeldet
      await executeSQL("UPDATE users SET online = 0 WHERE benutzername = ?;", [benutzername]);

      res.json({ success: true });
  } catch (error) {
      console.error("Fehler beim Logout:", error);  
      res.status(500).json({ error: "Fehler beim Logout" });
  }
});

app.post("/logout", async (req, res) => {
  try {
      const { benutzername } = req.body;
      await executeSQL("UPDATE users SET online = 0 WHERE benutzername = ?", [benutzername]);
      console.log(`🔴 ${benutzername} beendet!`);
      res.json({ success: true });
  } catch (error) {
      console.error("Fehler beim Logout-Vorgang:", error);
      res.status(500).json({ success: false });
  }
});



app.post("/get-messages", async (req, res) => {
  try {
      const { sender, recipient } = req.body;
      if (!sender || !recipient) {
          return res.status(400).json({ success: false, error: "Fehlende Parameter" });
      }

      const messages = await executeSQL(
          "SELECT sender, message, timestamp FROM messages WHERE (sender = ? AND recipient = ?) OR (sender = ? AND recipient = ?) ORDER BY timestamp ASC;",
          [sender, recipient, recipient, sender]
      );

      res.json({ success: true, messages });
  } catch (error) {
      console.error("Beim Abrufen der Nachrichten ist ein Fehler aufgetreten:", error);
      res.status(500).json({ success: false, error: "Serverfehler" });
  }
});


app.post("/send-message", async (req, res) => {
  try {
      const { sender, recipient, message } = req.body;

      if (!sender || !recipient || !message) {
          return res.status(400).json({ error: "Fehlende Nachrichtendaten" });
      }

      console.log(`Nachricht wird gespeichert: ${sender} → ${recipient}: ${message}`);

      await executeSQL(
          "INSERT INTO messages (sender, recipient, message) VALUES (?, ?, ?);",
          [sender, recipient, message]
      );

      res.json({ success: true });
  } catch (error) {
      console.error("Beim Speichern der Nachricht ist ein Fehler aufgetreten:", error);
      res.status(500).json({ error: "Serverfehler" });
  }
});

app.post("/change-username", async (req, res) => {
  const { oldUsername, newUsername } = req.body;

  if (!oldUsername || !newUsername) {
      return res.status(400).json({ success: false, message: "❌ Fehlende Daten." });
  }

  try {
      // Existiert der neue Benutzername schon?
      const existingUser = await executeSQL("SELECT * FROM users WHERE benutzername = ?", [newUsername]);

      if (existingUser.length > 0) {
          return res.status(400).json({ success: false, message: "❌ Dieser Benutzername ist bereits vergeben." });
      }

      // Benutzernamen aktualisieren
      const update = await executeSQL("UPDATE users SET benutzername = ? WHERE benutzername = ?", [newUsername, oldUsername]);

      if (update.affectedRows > 0) {
          res.json({ success: true });
      } else {
          res.status(500).json({ success: false, message: "❌ Fehler beim Aktualisieren des Benutzernamens." });
      }
  } catch (error) {
      console.error("❌ Fehler beim Ändern des Benutzernamens:", error);
      res.status(500).json({ success: false, message: "❌ Interner Serverfehler." });
  }
});


app.post("/create-group", async (req, res) => {
  const { group_name } = req.body;
  try {
      await db.query("INSERT INTO groups (group_name) VALUES (?)", [group_name]);
      res.json({ success: true });
  } catch (error) {
      res.json({ success: false, error: error.message });
  }
});

app.post("/add-to-group", async (req, res) => {
  const { group_name, username } = req.body;
  try {
      let [group] = await db.query("SELECT id FROM groups WHERE group_name = ?", [group_name]);
      let [user] = await db.query("SELECT id FROM users WHERE benutzername = ?", [username]);

      if (!group.length || !user.length) {
          return res.json({ success: false, error: "Grup veya kullanıcı bulunamadı." });
      }

      await db.query("INSERT INTO group_users (group_id, user_id) VALUES (?, ?)", [group[0].id, user[0].id]);
      res.json({ success: true });
  } catch (error) {
      res.json({ success: false, error: error.message });
  }
});


app.post("/send-group-message", async (req, res) => {
  const { sender, group, message } = req.body;

  if (!sender || !group || !message) {
      return res.status(400).json({ success: false, message: "Fehlende Daten." });
  }

  try {
      await executeSQL("INSERT INTO group_messages (group_id, sender, message) VALUES (?, ?, ?)", [group, sender, message]);
      res.json({ success: true });
  } catch (error) {
      console.error("❌ Fehler beim Speichern der Nachricht:", error);
      res.status(500).json({ success: false, message: "Interner Serverfehler." });
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
