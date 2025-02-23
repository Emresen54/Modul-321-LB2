const { executeSQL } = require("./database");

const initializeAPI = (app) => {
  app.post("/api/register", registerUser);
  app.post("/api/login", loginUser);
  app.post("/api/update-profile-pic", updateProfilePicture);
};

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

const updateProfilePicture = async (req, res) => {
  try {
    const { userId, profilePicture } = req.body;
    if (!userId || !profilePicture) {
      return res.status(400).json({ error: "Benutzer-ID und Profilbild erforderlich" });
    }
    await executeSQL("UPDATE users SET profile_picture = ? WHERE id = ?;", [profilePicture, userId]);
    res.json({ success: true, message: "Profilbild erfolgreich aktualisiert" });
  } catch (error) {
    res.status(500).json({ error: "Fehler beim Aktualisieren des Profilbildes" });
  }
};

module.exports = { initializeAPI };
