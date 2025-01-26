const logoutLink = document.getElementById("logout");
const alertDiv = document.getElementById("alert");
const messagesContainer = document.getElementById("messagesContainer");
const messageForm = document.getElementById("messageForm");
const userEmail = localStorage.getItem("userEmail");

if (!userEmail) {
  alert("Please log in first");
  window.location.href = "index.html";
}

logoutLink.addEventListener("click", () => {
  localStorage.clear();
  window.location.href = "index.html";
});

async function loadMessages() {
  try {
    const res = await fetch(`${BASE_URL}/api/messages?userEmail=${userEmail}`);
    const data = await res.json();
    messagesContainer.innerHTML = "";

    data.forEach((msg) => {
      const msgDiv = document.createElement("div");
      msgDiv.style.border = "1px solid #ddd";
      msgDiv.style.margin = "5px";
      msgDiv.style.padding = "5px";
      msgDiv.innerHTML = `
            <p><strong>From:</strong> ${msg.from}</p>
            <p><strong>To:</strong> ${msg.to}</p>
            <p>${msg.message}</p>
            <small>${new Date(msg.timestamp).toLocaleString()}</small>
          `;
      messagesContainer.appendChild(msgDiv);
    });
  } catch (err) {
    messagesContainer.innerHTML = `<div class="alert error">Error loading messages</div>`;
  }
}

messageForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const to = document.getElementById("toEmail").value;
  const messageBody = document.getElementById("msgBody").value;

  try {
    const res = await fetch(`${BASE_URL}/api/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        from: userEmail,
        to,
        message: messageBody,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "Failed to send message");
    }
    alertDiv.innerHTML = `<div class="alert success">Message sent</div>`;
    document.getElementById("toEmail").value = "";
    document.getElementById("msgBody").value = "";
    loadMessages();
  } catch (err) {
    alertDiv.innerHTML = `<div class="alert error">${err.message}</div>`;
  }
});

loadMessages();
setInterval(loadMessages, 5000);
