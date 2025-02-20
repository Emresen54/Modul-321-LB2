const socket = new WebSocket("ws://localhost:3000");

// Listen for WebSocket open event
socket.addEventListener("open", (event) => {
  console.log("WebSocket connected.");
});

// Listen for messages from server
socket.addEventListener("message", (event) => {
  console.log(`Received message: ${event.data}`);
  createMessage(event.data);
});

// Listen for WebSocket close event
socket.addEventListener("close", (event) => {
  console.log("WebSocket closed.");
});

// Listen for WebSocket errors
socket.addEventListener("error", (event) => {
  console.error("WebSocket error:", event);
});

const createMessage = (message) => {
  const p = document.createElement("p");
  p.textContent = message;
  document.getElementById("messages").appendChild(p);
};

// Registrierung eines neuen Benutzers
async function registerUser() {
  const username = document.getElementById("username").value;
  const passwort = document.getElementById("passwort").value;

  const response = await fetch("/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: username, passwort: passwort }),
  });

  const result = await response.json();
  if (result.success) {
    alert("Registrierung erfolgreich!");
    window.location.href = "/client/Register.html"; // Weiterleitung zur Hauptseite
  } else {
    alert(result.error);
  }
}

// Anmeldung eines Benutzers
async function loginUser() {
  const username = document.getElementById("username").value;
  const passwort = document.getElementById("passwort").value;

  const response = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: username, passwort: passwort }),
  });

  const result = await response.json();
  if (result.success) {
    alert("Login erfolgreich!");
    localStorage.setItem("userId", result.userId); // Speichert Benutzer-ID
    window.location.href = "/client/Register.html"; // Weiterleitung zur Hauptseite
  } else {
    alert(result.error);
  }
}

// Nachricht senden
document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");
  const profilePic = document.getElementById("profile-pic");

  // Anmeldung
  if (loginForm) {
      loginForm.addEventListener("submit", async function(event) {
          event.preventDefault();
          const benutzername = document.getElementById("username").value;
          const passwort = document.getElementById("password").value;

          if (!benutzername || !passwort) {
              alert("Bitte geben Sie Ihren Benutzernamen und Ihr Passwort ein.");
              return;
          }

          try {
              const response = await fetch("/login", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ benutzername, passwort })
              });

              const result = await response.json();
              if (response.ok) {
                  alert("Anmeldung erfolgreich!");
                  localStorage.setItem("userId", result.userId);
                  localStorage.setItem("benutzername", benutzername);
                  window.location.href = "/main.html";
              } else {
                  alert(result.error);
              }
          } catch (error) {
              console.error("Fehler beim Login:", error);
              alert("Es gab ein Problem bei der Anmeldung. Bitte versuchen Sie es erneut.");
          }
      });
  }

  // Registrierung
  if (registerForm) {
      registerForm.addEventListener("submit", async function(event) {
          event.preventDefault();
          const benutzername = document.getElementById("username").value;
          const passwort = document.getElementById("password").value;

          if (!benutzername || !passwort) {
              alert("Bitte geben Sie einen Benutzernamen und ein Passwort ein.");
              return;
          }

          try {
              const response = await fetch("/register", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ benutzername, passwort })
              });

              const result = await response.json();
              if (response.ok) {
                  alert("Registrierung erfolgreich!");
                  window.location.href = "/login.html";
              } else {
                  alert(result.error);
              }
          } catch (error) {
              console.error("Fehler bei der Registrierung:", error);
              alert("Es gab ein Problem bei der Registrierung. Bitte versuchen Sie es erneut.");
          }
      });
  }

  // Weiterleitung zu den Einstellungen beim Klick auf das Profilbild
  if (profilePic) {
      profilePic.addEventListener("click", () => {
          window.location.href = "/settings.html";
      });
  }
});

// Weiterleitung zu den Einstellungen beim Klicken auf das Profilbild
if (profileButton) {
  profileButton.addEventListener("click", () => {
      window.location.href = "/settings.html";
  });
}

