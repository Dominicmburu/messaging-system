const loginForm = document.getElementById("loginForm");
const alertDiv = document.getElementById("alert");
const forgotLink = document.getElementById("forgotLink");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  alertDiv.innerHTML = "";
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const res = await fetch(`${BASE_URL}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Login failed");
    }

    localStorage.setItem("userEmail", data.email);
    localStorage.setItem("userRole", data.role);

    if (data.role === "Admin" || data.role === "Manager") {
      window.location.href = "employees.html";
    } else {
      window.location.href = "messages.html";
    }
  } catch (err) {
    alertDiv.innerHTML = `<div class="alert error">${err.message}</div>`;
  }
});

forgotLink.addEventListener("click", async (e) => {
  e.preventDefault();
  const email = prompt("Enter your email to reset password:");
  if (!email) return;

  try {
    const res = await fetch(`${BASE_URL}/api/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Failed to send reset email");
    }

    alertDiv.innerHTML = `<div class="alert success">${data.message}</div>`;
  } catch (err) {
    alertDiv.innerHTML = `<div class="alert error">${err.message}</div>`;
  }
});


