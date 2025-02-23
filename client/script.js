const socket = new WebSocket("ws://localhost:3000");

// Listen for WebSocket open event
socket.addEventListener("open", (event) => {
  console.log("WebSocket connected.");
});

// Listen for messages from server
socket.addEventListener("message", (event) => {
  try {
      const data = JSON.parse(event.data);
      console.log("WebSocket-Aktualisierung:", data);

      if (data.type === "users") {
          if (!data.users || !Array.isArray(data.users)) {
              console.error("WebSocket-Benutzerdaten sind ungültig!");
              return;
          }

          updateUserList(data.users);
      }
  } catch (error) {
      console.error("WebSocket-Nachrichtenfehler:", error);
  }
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


// Anmeldung eines Benutzers
async function loginUser() {
  const benutzername = document.getElementById("username").value;
  const passwort = document.getElementById("passwort").value;

  if (!benutzername || !passwort) {
      alert("Bitte Benutzername und Passwort eingeben.");
      return;
  }

  console.log("🔑 `/login` API'ye istek gönderiliyor...");
  
  const response = await fetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ benutzername, passwort }),
  });

  const result = await response.json();
  console.log("API-Antwort:", result);

  if (result.success) {
      localStorage.setItem("benutzername", benutzername);
      window.location.href = "/main.html";
  } else {
      alert("Giriş başarısız: " + result.error);
  }
}

async function registerUser() {
  const benutzername = document.getElementById("username").value;
  const passwort = document.getElementById("passwort").value;

  if (!benutzername || !passwort) {
      alert("Bitte geben Sie einen Benutzernamen und ein Passwort ein.");
      return;
  }

  const response = await fetch("/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ benutzername, passwort }),
  });

  const result = await response.json();
  console.log("API-Antwort:", result);

  if (result.success) {
      alert("Registrierung erfolgreich!");
      window.location.href = "/main.html";
  } else {
      alert("Fehler bei der Registrierung: " + result.error);
  }
}

async function logoutUser() {
  console.log("Benutzer meldet sich ab...");
  
  const benutzername = localStorage.getItem("benutzername");
  if (!benutzername) return;

  await fetch("/api/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ benutzername })
  });

  localStorage.clear(); 
  window.location.href = "/login.html"; 
}


document.addEventListener("DOMContentLoaded", () => {
  const chatbotButton = document.getElementById("chatbot-button");
  const chatbotBox = document.getElementById("chatbot-box");
  const commandButton = document.getElementById("command-button");
  const commandBox = document.getElementById("command-box");
  const chatbotMessages = document.getElementById("chatbot-messages");
  const chatbotInput = document.getElementById("chatbot-input");
  const chatbotSend = document.getElementById("chatbot-send");


  chatbotButton.addEventListener("click", () => {
      chatbotBox.classList.toggle("hidden");
  });


  commandButton.addEventListener("click", () => {
      commandBox.classList.toggle("hidden");
  });


  chatbotSend.addEventListener("click", () => {
      const userMessage = chatbotInput.value.trim();
      if (userMessage === "") return;

      appendChatbotMessage("👤 Du: " + userMessage);
      chatbotInput.value = "";

      const botReply = processChatbotMessage(userMessage);
      setTimeout(() => appendChatbotMessage("🤖 Buzzbot: " + botReply), 500);
  });

 
  chatbotInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
          chatbotSend.click();
      }
  });


  function appendChatbotMessage(message) {
      const messageElement = document.createElement("p");
      messageElement.classList.add("text-gray-700");
      messageElement.innerText = message;
      chatbotMessages.appendChild(messageElement);
      chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
  }


  function processChatbotMessage(message) {
      message = message.toLowerCase();

      // Matematik İşlemleri
      if (/^\d+[\+\-\*\/]\d+$/.test(message)) {
          try {
              return "Das Ergebnis ist: " + eval(message);
          } catch (error) {
              return "Entschuldigung, ich kann das nicht berechnen.";
          }
      }


      const responses = {
          "hallo": "Hallo! Wie kann ich helfen?",
          "wie geht es dir?": "Mir geht es gut, danke!",
          "was ist die hauptstadt von deutschland?": "Die Hauptstadt von Deutschland ist Berlin.",
          "welches datum ist heute?": new Date().toLocaleDateString("de-DE"),
      };

      return responses[message] || "Entschuldigung, das verstehe ich nicht.";
  }
});



// WebSocket-Verbindung herstellen
socket.addEventListener("open", () => {
  console.log("WebSocket verbunden.");
  socket.send(JSON.stringify({ type: "user", user: localStorage.getItem("benutzername") }));
});

socket.addEventListener("message", (event) => {
  try {
      const data = JSON.parse(event.data);
      if (data.type === "users") {
          updateUserList(data.users);
      } else if (data.type === "message") {
          displayMessage(data);
      }
  } catch (error) {
      console.error("Fehler beim Empfangen der WebSocket-Nachricht:", error);
  }
});


document.addEventListener("DOMContentLoaded", async () => {
  await loadUsers();
  setInterval(() => {
      loadUsers();
  }, 5000);

});

async function loadUsers() {
  try {
      const response = await fetch("/get-users");
      if (!response.ok) {
          throw new Error("Fehler beim Abrufen der Benutzerliste: " + response.statusText);
      }
      const users = await response.json();
      updateUserList(users);
  } catch (error) {
      console.error("Fehler beim Abrufen der Benutzerliste:", error);
  }
}

function updateUserList(users) {
  const userContainer = document.getElementById("user-container");
  userContainer.innerHTML = "";
  users.forEach(user => {
      const userItem = document.createElement("div");
      userItem.className = "user-item";
      userItem.innerHTML = `${user.benutzername} <span class="status-dot" style="background-color: ${user.online ? 'green' : 'red'}"></span>`;
      userItem.addEventListener("click", () => openChat(user.benutzername));
      userContainer.appendChild(userItem);
  });
}


// Aktualisieren Sie die Benutzerliste alle 3 Sekunden
setInterval(loadUsers, 3000);


function updateUserList(users) {
  console.log("Benutzerliste wird aktualisiert:", users);

  const loggedInUser = localStorage.getItem("benutzername"); 
  const contactsList = document.getElementById("contact-list");
  if (!contactsList) {
      console.error("❌ 'contact-list' elementi bulunamadı!");
      return;
  }


  users.sort((a, b) => {
      if (a.benutzername === loggedInUser) return -1; 
      if (b.benutzername === loggedInUser) return 1;
      return a.benutzername.localeCompare(b.benutzername); 
  });

  contactsList.innerHTML = "";
  users.forEach(user => {
      if (!user.benutzername) return;

      const userItem = document.createElement("div");
      userItem.className = "p-2 bg-white shadow-md rounded-md flex justify-between items-center cursor-pointer";
      userItem.innerHTML = `
          <span>${user.benutzername}</span>
          <span class="status-dot" style="background-color: ${user.online == 1 ? 'green' : 'red'}; width: 10px; height: 10px; border-radius: 50%;"></span>
      `;
      userItem.addEventListener("click", () => openChat(user.benutzername));
      contactsList.appendChild(userItem);
  });
}




function openChat(benutzername) {
  if (!benutzername) {
      console.error("FEHLER: Der ausgewählte Benutzer ist ungültig!");
      return;
  }

  console.log("Eröffnungschat:", benutzername);

  document.getElementById("chat-header").textContent = `Chat mit ${benutzername}`;
  document.getElementById("chat-box").innerHTML = "";

  localStorage.setItem("currentChat", benutzername); 
  loadChatHistory(benutzername);
}


async function loadChatHistory() {
  const sender = localStorage.getItem("benutzername");
  const recipient = localStorage.getItem("currentChat");

  if (!sender || !recipient) {
      console.warn("⚠ `loadChatHistory()` wurde aufgerufen, aber „Absender“ oder „Empfänger“ fehlt.");
      return;
  }

  console.log(`Nachrichtenverlauf abrufen: ${sender} ↔ ${recipient}`);

  try {
      const response = await fetch("/get-messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sender, recipient }),
      });

      const result = await response.json();
      if (result.success) {
          document.getElementById("chat-box").innerHTML = "";
          result.messages.forEach(msg => {
              displayMessage(msg.sender, msg.message);
          });
      }
  } catch (error) {
      console.error("Fehler beim Laden des Nachrichtenverlaufs:", error);
  }
}


function displayMessage(sender, message) {
  const chatBox = document.getElementById("chat-box");
  if (!chatBox) {
      console.error("'chat-box' Element nicht gefunden!");
      return;
  }

  const currentUser = localStorage.getItem("benutzername");

  const messageElement = document.createElement("div");

  if (sender === currentUser) {
      messageElement.className = "p-4 text-lg bg-blue-700 text-white rounded-lg mb-2 self-end max-w-[70%]";
  } else {
      messageElement.className = "p-4 text-lg bg-blue-400 text-white rounded-lg mb-2 self-start max-w-[70%]";
  }

  messageElement.textContent = `${sender}: ${message}`;
  chatBox.appendChild(messageElement);

  // Nachricht automatisch anzeigen
  chatBox.scrollTop = chatBox.scrollHeight;
}


async function sendMessage() {
  const messageInput = document.getElementById("message-input");
  const message = messageInput.value.trim();
  if (!message) return;

  const sender = localStorage.getItem("benutzername");
  const recipient = localStorage.getItem("currentChat");

  if (!recipient) {
      alert("⚠ Sie müssen einen Benutzer auswählen, um eine Nachricht zu senden!");
      return;
  }

  if (sender === recipient) {
      alert("Sie können sich selbst keine Nachrichten senden!");
      return;
  }

  console.log(`Nachricht senden: ${sender} → ${recipient}: ${message}`);

  try {
      const response = await fetch("/send-message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sender, recipient, message }),
      });

      const result = await response.json();
      if (result.success) {
          console.log("✅ Mesaj başarıyla gönderildi!");
          displayMessage(sender, message); 
          messageInput.value = "";
      } else {
          console.error("Nachricht konnte nicht gesendet werden:", result.error);
          alert("Nachricht konnte nicht gesendet werden.");
      }
  } catch (error) {
      console.error("Beim Senden der Nachricht ist ein Fehler aufgetreten:", error);
      alert("Beim Senden der Nachricht ist ein Fehler aufgetreten:!");
  }

  
}


// Benutzer suchen
document.getElementById("search-user")?.addEventListener("input", async (event) => {
  const searchValue = event.target.value.toLowerCase();
  try {
      const response = await fetch(`/search-user?query=${searchValue}`);
      const users = await response.json();
      updateUserList(users.filter(user => user.benutzername && user.benutzername !== "undefined"));
  } catch (error) {
      console.error("Fehler bei der Benutzersuche:", error);
  }
});

// Nachricht anzeigen
function displayMessage(sender, message) {
  const chatBox = document.getElementById("chat-box");
  if (!chatBox) {
      console.error("❌ 'chat-box' Element nicht gefunden!");
      return;
  }

  const currentUser = localStorage.getItem("benutzername");


  const messageElement = document.createElement("div");


  if (sender === currentUser) {
      messageElement.className = "p-4 text-lg bg-blue-700 text-white rounded-lg mb-2 self-end max-w-[70%]";
  } else {
      messageElement.className = "p-4 text-lg bg-blue-400 text-white rounded-lg mb-2 self-start max-w-[70%]";
  }

  messageElement.textContent = `${sender}: ${message}`;


  chatBox.appendChild(messageElement);

  chatBox.scrollTop = chatBox.scrollHeight;
}



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

            // Überprüfung, ob Benutzername und Passwort bereits existieren
            const checkResponse = await fetch("/check-user", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ benutzername, passwort })
            });
            
            const checkResult = await checkResponse.json();
            if (checkResult.exists) {
                alert("Dieser Benutzername und/oder dieses Passwort sind bereits vergeben. Bitte wählen Sie andere Zugangsdaten.");
                return;
            }

            // Falls der Benutzername und das Passwort nicht existieren, Registrierung durchführen
            const response = await fetch("/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ benutzername, passwort })
            });

            const result = await response.json();
            if (result.success) {
                alert("Registrierung erfolgreich!");
                window.location.href = "/login.html";
            } else {
                alert(result.error);
            }
        });
    }
  

  // Weiterleitung zu den Einstellungen beim Klick auf das Profilbild
  if (profilePic) {
      profilePic.addEventListener("click", () => {
          window.location.href = "/settings.html";
      });
  }


document.addEventListener("DOMContentLoaded", () => {
  const loggedInUser = localStorage.getItem("benutzername");
  if (!loggedInUser) {
      console.warn("⚠ Es wurde ein nicht angemeldeter Benutzer erkannt, der zur Anmeldeseite umgeleitet wird …");
      window.location.href = "/login.html";
  }
});
});

function openSettings() {
  console.log("Weiterleitung zur Einstellungsseite ...");
  window.location.href = "/settings.html";
}

document.addEventListener("DOMContentLoaded", () => {
  const loginButton = document.getElementById("login-button");
  if (loginButton) {
      loginButton.addEventListener("click", loginUser);
  } else {
      console.error("❌ Hata: 'login-button' Schaltfläche nicht gefunden!");
  }

  const registerButton = document.getElementById("register-button");
  if (registerButton) {
      registerButton.addEventListener("click", registerUser);
  } else {
      console.error("❌ Hata: 'register-button' Schaltfläche nicht gefunden!");
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const messageInput = document.getElementById("message-input");
  const sendButton = document.getElementById("send-button");
  if (sendButton) {
      sendButton.addEventListener("click", async () => {
          console.log("Die Schaltfläche zum Senden der Nachricht wurde angeklickt.");
          sendMessage(); 
      });
  } else {
      console.error("❌ 'send-button' Element nicht gefunden!");
  }
  messageInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault(); 
        sendButton.click(); 
    }
});
});


document.addEventListener("DOMContentLoaded", () => {
  const changeUsernameButton = document.getElementById("change-username-button");
  const newUsernameInput = document.getElementById("new-username");

  if (changeUsernameButton) {
      changeUsernameButton.addEventListener("click", async () => {
          const newUsername = newUsernameInput.value.trim();
          if (!newUsername) {
              alert("⚠ Bitte geben Sie einen neuen Benutzernamen ein.");
              return;
          }

          const oldUsername = localStorage.getItem("benutzername"); // Eski kullanıcı adı
          if (!oldUsername) {
              alert("❌ Sie müssen angemeldet sein, um den Benutzernamen zu ändern.");
              return;
          }

          try {
              console.log(`🔄 API'ye istek gönderiliyor: ${oldUsername} → ${newUsername}`);
              const response = await fetch("/change-username", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ oldUsername, newUsername }),
              });

              const result = await response.json();
              console.log("API-Antwort:", result);

              if (result.success) {
                  alert("✅ Benutzername wurde erfolgreich geändert!");
                  localStorage.setItem("benutzername", newUsername); // Yeni kullanıcı adını kaydet
                  window.location.href = "/main.html"; // Ana sayfaya yönlendir
              } else {
                  alert("❌ Fehler: " + result.message);
              }
          } catch (error) {
              console.error("❌ Fehler beim Ändern des Benutzernamens:", error);
              alert("⚠ Beim Ändern des Benutzernamens ist ein Fehler aufgetreten.");
          }
      });
  } else {
      console.error("❌ 'change-username-button' Schaltfläche nicht gefunden!");
  }
});



async function changeUsername() {
  const newUsername = document.getElementById("new-username").value.trim();
  const currentUsername = localStorage.getItem("benutzername");

  if (!newUsername) {
      alert("⚠ Bitte geben Sie einen neuen Benutzernamen ein!");
      return;
  }

  try {
      console.log("Anfrage an API wird gesendet …");
      const response = await fetch("/change-username", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currentUsername, newUsername })
      });

      const result = await response.json();
      console.log("API-Antwort:", result);

      if (result.success) {
          alert("Benutzername erfolgreich geändert!");
          localStorage.setItem("benutzername", newUsername);
          window.location.href = "/main.html";
      } else {
          alert("Benutzername konnte nicht geändert werden: " + result.message);
      }
  } catch (error) {
      console.error("Fehler:", error);
      alert("⚠ Ein Fehler ist aufgetreten. Bitte erneut versuchen.");
  }
}

document.getElementById("change-username").addEventListener("click", changeUsername);

document.getElementById("logout-button").addEventListener("click", async () => {
  const benutzername = localStorage.getItem("benutzername");
  if (!benutzername) return;

  console.log(`🔴 ${benutzername} Beenden...`);

  await fetch("/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ benutzername }),
  });

  localStorage.removeItem("benutzername");
  window.location.href = "/login.html";
});

window.addEventListener("beforeunload", async () => {
  const benutzername = localStorage.getItem("benutzername");
  if (!benutzername) return;

  await fetch("/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ benutzername }),
  });
});

window.addEventListener("beforeunload", async () => {
  const benutzername = localStorage.getItem("benutzername");
  if (!benutzername) return;

  await fetch("/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ benutzername }),
  });
});

document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll(".options-btn").forEach(button => {
      button.addEventListener("click", function () {
          let menu = this.nextElementSibling;
          menu.classList.toggle("hidden");
      });
  });

  document.querySelectorAll(".create-group-btn").forEach(button => {
      button.addEventListener("click", function () {
          let groupName = prompt("Neuen Gruppennamen eingeben:");
          if (groupName) {
              fetch("/create-group", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ group_name: groupName })
              }).then(response => response.json()).then(data => {
                  if (data.success) {
                      alert("Gruppe erstellt!");
                  } else {
                      alert("Fehler: " + data.error);
                  }
              });
          }
      });
  });

  document.querySelectorAll(".add-to-group-btn").forEach(button => {
      button.addEventListener("click", function () {
          let username = this.closest(".user-item").querySelector("span").textContent;
          let groupName = prompt("Geben Sie den Namen der Gruppe ein, die Sie hinzufügen möchten:");
          if (groupName) {
              fetch("/add-to-group", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ group_name: groupName, username: username })
              }).then(response => response.json()).then(data => {
                  if (data.success) {
                      alert(Benutzername + " wurde erfolgreich zur Gruppe " + Gruppenname + " hinzugefügt!");
                  } else {
                      alert("Fehler: " + data.error);
                  }
              });
          }
      });
  });
});

document.addEventListener("DOMContentLoaded", () => {

  document.getElementById("chatbot-button").addEventListener("click", toggleChatbot);
  document.getElementById("chatbot-send").addEventListener("click", sendChatbotMessage);
  document.getElementById("chatbot-input").addEventListener("keypress", function (e) {
      if (e.key === "Enter") sendChatbotMessage();
  });
});

function toggleChatbot() {
  const chatbotBox = document.getElementById("chatbot-box");
  chatbotBox.classList.toggle("hidden");
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("📡 Sayfa yüklendi, chatbot butonu aktif!");
  
  // Chatbot butonunu aç/kapat
  const chatbotButton = document.getElementById("chatbot-button");
  const chatbotBox = document.getElementById("chatbot-box");
  const chatbotSend = document.getElementById("chatbot-send");
  const chatbotInput = document.getElementById("chatbot-input");

  if (chatbotButton) {
      chatbotButton.style.zIndex = "50"; 
      chatbotButton.addEventListener("click", toggleChatbot);
  } else {
      console.error("❌ Chatbot butonu bulunamadı!");
  }

  if (chatbotSend) {
      chatbotSend.addEventListener("click", sendChatbotMessage);
  }

  if (chatbotInput) {
      chatbotInput.addEventListener("keypress", function (e) {
          if (e.key === "Enter") sendChatbotMessage();
      });
  }
});


function toggleChatbot() {
  const chatbotBox = document.getElementById("chatbot-box");
  if (chatbotBox) {
      chatbotBox.classList.toggle("hidden");
      chatbotBox.style.zIndex = "50"; 
  }
}


