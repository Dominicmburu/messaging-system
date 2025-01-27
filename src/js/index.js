const loginForm = document.getElementById("loginForm");
const alertDiv = document.getElementById("alert");
const forgotLink = document.getElementById("forgotLink");

const resetModal = document.getElementById("resetModal");
const closeModalBtn = document.getElementById("closeModal");
const resetEmailInput = document.getElementById("resetEmail");
const resetBtn = document.getElementById("resetBtn");

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
  resetModal.style.display = "block";
});

closeModalBtn.addEventListener("click", () => {
  resetModal.style.display = "none";
});

window.addEventListener("click", (e) => {
  if (e.target === resetModal) {
    resetModal.style.display = "none";
  }
});

resetBtn.addEventListener("click", async () => {
  alertDiv.innerHTML = "";
  const email = resetEmailInput.value;
  if (!email) {
    alertDiv.innerHTML = `<div class="alert error">Please enter an email address.</div>`;
    return;
  }

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
    resetModal.style.display = "none";
    resetEmailInput.value = "";
  } catch (err) {
    alertDiv.innerHTML = `<div class="alert error">${err.message}</div>`;
  }
});
