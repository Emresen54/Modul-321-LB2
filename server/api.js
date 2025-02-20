const { executeSQL } = require("./database");

/**
 * Initialisiert die API-Endpunkte.
 * @param {Object} app - Express-App
 */
const initializeAPI = (app) => {
  app.post("/api/register", registerUser);
  app.post("/api/login", loginUser);
};

/**
 * Benutzer registrieren.
 */
const registerUser = async (req, res) => {
  try {
    const { benutzername, passwort } = req.body;
    if (!benutzername || !passwort) {
      return res.status(400).json({ error: "Benutzername und Passwort erforderlich" });
    }

    await executeSQL("INSERT INTO users (benutzername, passwort) VALUES (?, ?);", [benutzername, passwort]);
    
    res.json({ success: true, message: "Registrierung erfolgreich" });
  } catch (error) {
    res.status(500).json({ error: "Fehler bei der Registrierung" });
  }
};

/**
 * Benutzer einloggen.
 */
const loginUser = async (req, res) => {
  try {
    const { benutzername, passwort } = req.body;
    const result = await executeSQL("SELECT * FROM users WHERE benutzername = ? AND passwort = ?;", [benutzername, passwort]);

    if (result.length === 0) {
      return res.status(400).json({ error: "Falsche Anmeldedaten" });
    }

    res.json({ success: true, message: "Login erfolgreich", userId: result[0].id });
  } catch (error) {
    res.status(500).json({ error: "Fehler beim Login" });
  }
};

module.exports = { initializeAPI };
